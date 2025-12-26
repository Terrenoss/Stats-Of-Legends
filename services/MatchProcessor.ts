import { prisma } from '@/lib/prisma';
import { RiotService } from './RiotService';
import { getDurationBucket } from '../utils/matchUtils';

export class MatchProcessor {
    /**
     * Processes a match to update global Tier List statistics (ChampionStat, MatchupStat, DuoStat).
     * @param matchId The ID of the match (e.g., EUW1_123456)
     * @param region The region for Riot API calls (e.g., euw1) - Optional if jsonData is provided
     * @param tier The tier of the match (e.g., CHALLENGER)
     * @param jsonData Optional: The full match JSON data if already available (avoids re-fetch)
     */
    static async processMatch(matchId: string, region: string, tier: string = 'CHALLENGER', jsonData?: any) {
        try {
            // 1. Check if already scanned
            const existing = await prisma.scannedMatch.findUnique({ where: { id: matchId } });
            if (existing) {
                return { status: 'skipped', reason: 'Already scanned' };
            }

            let info: any;
            let patch: string;

            if (jsonData) {
                // Use provided JSON
                info = jsonData.info;
                patch = info.gameVersion.split('.').slice(0, 2).join('.');
            } else {
                // Fetch from Riot API
                let routing = 'europe';
                if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
                if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

                const match = await RiotService.getMatchDetails(routing, matchId);
                info = match.info;
                patch = info.gameVersion.split('.').slice(0, 2).join('.');
            }

            // Fetch Maps (cached by RiotService usually)
            const champMap = await RiotService.getChampionIdMap(patch + ".1");
            const itemMap = await RiotService.getItemMap(patch + ".1");

            // V2: Duration Bucket
            const duration = info.gameDuration || 0;
            const durationBucket = getDurationBucket(duration);

            // V2: Calculate Team Totals for Shares
            const teamStats: Record<number, { damage: number; gold: number }> = { 100: { damage: 0, gold: 0 }, 200: { damage: 0, gold: 0 } };
            for (const p of info.participants) {
                const tid = p.teamId;
                if (teamStats[tid]) {
                    teamStats[tid].damage += p.totalDamageDealtToChampions || 0;
                    teamStats[tid].gold += p.goldEarned || 0;
                }
            }

            // 2a. Process Bans
            // 2a. Process Bans
            await this.processBans(info, champMap, tier, patch, durationBucket);

            // 2b. Process Participants
            for (const p of info.participants) {
                await this.processSingleParticipant(p, info, matchId, region, tier, patch, durationBucket, champMap, itemMap, teamStats);
            }

            // 3. Mark as Scanned
            await prisma.scannedMatch.create({
                data: {
                    id: matchId,
                    patch: patch,
                    tier: tier
                }
            });

            return { status: 'processed', patch };

        } catch (error: any) {
            console.error('MatchProcessor Error:', error);
            throw error;
        }
    }

    private static async processBans(info: any, champMap: any, tier: string, patch: string, durationBucket: string) {
        for (const team of info.teams) {
            for (const ban of team.bans) {
                if (ban.championId !== -1) {
                    const champName = champMap[ban.championId];
                    if (champName) {
                        await prisma.championStat.upsert({
                            where: {
                                championId_role_tier_patch_durationBucket: {
                                    championId: champName,
                                    role: 'ALL',
                                    tier: tier,
                                    patch: patch,
                                    durationBucket: durationBucket
                                }
                            },
                            update: { bans: { increment: 1 } },
                            create: {
                                championId: champName,
                                role: 'ALL',
                                tier: tier,
                                patch: patch,
                                durationBucket: durationBucket,
                                bans: 1
                            }
                        });
                    }
                }
            }
        }
    }

    private static async processSingleParticipant(p: any, info: any, matchId: string, region: string, tier: string, patch: string, durationBucket: string, champMap: any, itemMap: any, teamStats: any) {
        let role = p.teamPosition; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY

        // Normalize Roles
        if (role === 'MIDDLE') role = 'MID';
        else if (role === 'BOTTOM') role = 'ADC';
        else if (role === 'UTILITY') role = 'SUPPORT';
        const championId = p.championName;

        if (role && role !== 'Invalid') {
            let skillOrderString = '';
            let cleanEvents: any[] = [];

            try {
                let routing = 'europe';
                if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
                if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

                const timeline = await RiotService.getMatchTimeline(routing, matchId);
                const participantId = p.participantId;

                // Extract Skill Order
                const skillEvents = timeline.info.frames.flatMap((f: any) => f.events)
                    .filter((e: any) => e.type === 'SKILL_LEVEL_UP' && e.participantId === participantId && e.skillSlot > 0 && e.skillSlot <= 4);

                const skillMap: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' };
                skillOrderString = skillEvents.map((e: any) => skillMap[e.skillSlot]).join('-');

                // Extract Build Order
                const allItemEvents = timeline.info.frames.flatMap((f: any) => f.events)
                    .filter((e: any) =>
                        e.participantId === participantId &&
                        ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type)
                    );

                // Simulate Inventory
                for (const ev of allItemEvents) {
                    if (ev.type === 'ITEM_PURCHASED') {
                        cleanEvents.push(ev);
                    } else if (ev.type === 'ITEM_SOLD') {
                        cleanEvents.push(ev);
                    } else if (ev.type === 'ITEM_UNDO') {
                        const lastIdx = cleanEvents.length - 1;
                        if (lastIdx >= 0) {
                            const lastEv = cleanEvents[lastIdx];
                            if (lastEv.type === 'ITEM_PURCHASED' && lastEv.itemId === ev.beforeId) {
                                cleanEvents.pop();
                            } else if (lastEv.type === 'ITEM_SOLD' && lastEv.itemId === ev.afterId) {
                                cleanEvents.pop();
                            }
                        }
                    }
                }

            } catch (err) {
                // console.warn(`Failed to fetch timeline for ${matchId}`, err);
            }

            // Extract Items (Final Inventory)
            const IGNORED_ITEMS = new Set([
                3340, 3363, 3364, 3330, // Trinkets
                2003, 2055, 2140, 2138, 2139, // Consumables
                1054, 1055, 1056, 1082, 1083, 1101, 1102, 1103 // Starters
            ]);

            const finalItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5]
                .filter(id => id && id !== 0 && !IGNORED_ITEMS.has(id));

            const finalBuildKey = finalItems.sort().join('-');
            const items: Record<string, any> = {};
            if (finalBuildKey) {
                items[finalBuildKey] = { wins: p.win ? 1 : 0, matches: 1, build: finalItems };
            }

            // Add individual items
            for (const id of finalItems) {
                if (!items[id]) items[id] = { wins: 0, matches: 0 };
                items[id].wins += p.win ? 1 : 0;
                items[id].matches += 1;
            }

            // Starting Items & Core Build
            if (cleanEvents.length > 0) {
                const VISION_ITEMS = new Set([3340, 3363, 3364, 3330, 2055, 2049, 2045, 2044]);
                const startingEvents = cleanEvents.filter(e =>
                    e.type === 'ITEM_PURCHASED' &&
                    e.timestamp <= 60000 &&
                    !VISION_ITEMS.has(e.itemId)
                );

                if (startingEvents.length > 0) {
                    const startIds = startingEvents.map(e => e.itemId).sort().join('-');
                    const key = `start_${startIds}`;
                    if (!items[key]) items[key] = { wins: 0, matches: 0 };
                    items[key].wins += p.win ? 1 : 0;
                    items[key].matches += 1;
                }

                const finalItemSet = new Set(finalItems);
                const buildPath = cleanEvents
                    .filter(e => {
                        if (e.type !== 'ITEM_PURCHASED') return false;
                        if (!finalItemSet.has(e.itemId)) return false;
                        const itemData = itemMap[e.itemId];
                        if (itemData) {
                            const isBoots = itemData.tags && itemData.tags.includes('Boots');
                            if (!isBoots && itemData.into && itemData.into.length > 0) return false;
                        }
                        return true;
                    })
                    .map(e => e.itemId);

                const uniqueBuildPath = Array.from(new Set(buildPath));
                if (uniqueBuildPath.length >= 1) {
                    const coreLength = Math.min(uniqueBuildPath.length, 3);
                    const coreIds = uniqueBuildPath.slice(0, coreLength);
                    const coreKey = `core_${coreIds.join('-')}`;
                    if (!items[coreKey]) items[coreKey] = { wins: 0, matches: 0 };
                    items[coreKey].wins += p.win ? 1 : 0;
                    items[coreKey].matches += 1;

                    if (uniqueBuildPath.length >= 4) {
                        const item4 = uniqueBuildPath[3];
                        const key4 = `${coreKey}_slot4_${item4}`;
                        if (!items[key4]) items[key4] = { wins: 0, matches: 0 };
                        items[key4].wins += p.win ? 1 : 0;
                        items[key4].matches += 1;
                    }
                    if (uniqueBuildPath.length >= 5) {
                        const item5 = uniqueBuildPath[4];
                        const key5 = `${coreKey}_slot5_${item5}`;
                        if (!items[key5]) items[key5] = { wins: 0, matches: 0 };
                        items[key5].wins += p.win ? 1 : 0;
                        items[key5].matches += 1;
                    }
                    if (uniqueBuildPath.length >= 6) {
                        const item6 = uniqueBuildPath[5];
                        const key6 = `${coreKey}_slot6_${item6}`;
                        if (!items[key6]) items[key6] = { wins: 0, matches: 0 };
                        items[key6].wins += p.win ? 1 : 0;
                        items[key6].matches += 1;
                    }
                }
            }

            // Extract Runes
            const perks = p.perks?.styles || [];
            const statPerks = p.perks?.statPerks || {};
            const primaryStyle = perks.find((s: any) => s.description === 'primaryStyle');
            const subStyle = perks.find((s: any) => s.description === 'subStyle');

            let runePageKey = '';
            if (primaryStyle && subStyle) {
                const pIds = primaryStyle.selections.map((s: any) => s.perk).join('-');
                const sIds = subStyle.selections.map((s: any) => s.perk).join('-');
                const statIds = [statPerks.offense, statPerks.flex, statPerks.defense].filter(Boolean).join('-');
                runePageKey = `${primaryStyle.style}-${subStyle.style}-${pIds}-${sIds}-${statIds}`;
            }

            const runes: Record<string, any> = {};
            if (runePageKey) {
                runes[`page_${runePageKey}`] = { wins: p.win ? 1 : 0, matches: 1 };
            }
            for (const style of perks) {
                for (const selection of style.selections) {
                    if (!runes[selection.perk]) runes[selection.perk] = { wins: 0, matches: 0 };
                    runes[selection.perk].wins += p.win ? 1 : 0;
                    runes[selection.perk].matches += 1;
                }
            }
            [statPerks.offense, statPerks.flex, statPerks.defense].forEach(id => {
                if (id) {
                    if (!runes[id]) runes[id] = { wins: 0, matches: 0 };
                    runes[id].wins += p.win ? 1 : 0;
                    runes[id].matches += 1;
                }
            });

            // Extract Spells
            const spells: Record<string, any> = {};
            if (p.summoner1Id) spells[p.summoner1Id] = { wins: p.win ? 1 : 0, matches: 1 };
            if (p.summoner2Id) {
                if (!spells[p.summoner2Id]) spells[p.summoner2Id] = { wins: 0, matches: 0 };
                spells[p.summoner2Id].wins += p.win ? 1 : 0;
                spells[p.summoner2Id].matches += 1;
            }

            // Skill Order
            const skillOrderData: Record<string, any> = {};
            if (skillOrderString) {
                skillOrderData[skillOrderString] = { wins: p.win ? 1 : 0, matches: 1 };
            }

            // V2: Calculate Shares
            const myTeamStats = teamStats[p.teamId] || { damage: 1, gold: 1 };
            const damageShare = (p.totalDamageDealtToChampions || 0) / Math.max(1, myTeamStats.damage);
            const goldShare = (p.goldEarned || 0) / Math.max(1, myTeamStats.gold);
            const visionPerMin = (p.visionScore || 0) / Math.max(1, (info.gameDuration || 1) / 60);
            // Objective participation: use challenges if available, else 0 for now
            const objPart = p.challenges?.teamObjectives ? (p.challenges.teamObjectives) : 0; // Placeholder if not available

            // Upsert Champion Stats (Merge Logic)
            const existingStat = await prisma.championStat.findUnique({
                where: {
                    championId_role_tier_patch_durationBucket: {
                        championId: championId,
                        role: role,
                        tier: tier,
                        patch: patch,
                        durationBucket: durationBucket
                    }
                }
            });

            let itemsToSave = items;
            let finalRunes = runes;
            let finalSpells = spells;
            let finalSkillOrder = skillOrderData;

            if (existingStat) {
                // Merge Items
                const currentItems = (existingStat.items as Record<string, any>) || {};
                Object.keys(items).forEach(k => {
                    if (currentItems[k]) {
                        currentItems[k].wins += items[k].wins;
                        currentItems[k].matches += items[k].matches;
                    } else {
                        currentItems[k] = items[k];
                    }
                });
                itemsToSave = currentItems;

                // Merge Runes
                const currentRunes = (existingStat.runes as Record<string, any>) || {};
                Object.keys(runes).forEach(k => {
                    if (currentRunes[k]) {
                        currentRunes[k].wins += runes[k].wins;
                        currentRunes[k].matches += runes[k].matches;
                    } else {
                        currentRunes[k] = runes[k];
                    }
                });
                finalRunes = currentRunes;

                // Merge Spells
                const currentSpells = (existingStat.spells as Record<string, any>) || {};
                Object.keys(spells).forEach(k => {
                    if (currentSpells[k]) {
                        currentSpells[k].wins += spells[k].wins;
                        currentSpells[k].matches += spells[k].matches;
                    } else {
                        currentSpells[k] = spells[k];
                    }
                });
                finalSpells = currentSpells;

                // Merge Skill Order
                const currentSkillOrder = (existingStat.skillOrder as Record<string, any>) || {};
                Object.keys(skillOrderData).forEach(k => {
                    if (currentSkillOrder[k]) {
                        currentSkillOrder[k].wins += skillOrderData[k].wins;
                        currentSkillOrder[k].matches += skillOrderData[k].matches;
                    } else {
                        currentSkillOrder[k] = skillOrderData[k];
                    }
                });
                finalSkillOrder = currentSkillOrder;

                await prisma.championStat.update({
                    where: { id: existingStat.id },
                    data: {
                        matches: { increment: 1 },
                        wins: { increment: p.win ? 1 : 0 },
                        totalKills: { increment: p.kills },
                        totalDeaths: { increment: p.deaths },
                        totalAssists: { increment: p.assists },
                        totalDamage: { increment: p.totalDamageDealtToChampions },
                        totalGold: { increment: p.goldEarned },
                        totalCs: { increment: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0) },
                        totalVision: { increment: p.visionScore },
                        totalDuration: { increment: info.gameDuration },
                        totalDamageShare: { increment: damageShare },
                        totalGoldShare: { increment: goldShare },
                        totalVisionScorePerMin: { increment: visionPerMin },
                        totalObjectiveParticipation: { increment: objPart },
                        // V4.5: Variance
                        totalDamageShareSq: { increment: Math.pow(damageShare, 2) },
                        items: itemsToSave as any,
                        runes: finalRunes as any,
                        spells: finalSpells as any,
                        skillOrder: finalSkillOrder as any
                    }
                });
            } else {
                await prisma.championStat.create({
                    data: {
                        championId: championId,
                        role: role,
                        tier: tier,
                        patch: patch,
                        matches: 1,
                        wins: p.win ? 1 : 0,
                        totalKills: p.kills,
                        totalDeaths: p.deaths,
                        totalAssists: p.assists,
                        totalDamage: p.totalDamageDealtToChampions,
                        totalGold: p.goldEarned,
                        totalCs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
                        totalVision: p.visionScore,
                        totalDuration: info.gameDuration,
                        durationBucket: durationBucket,
                        totalDamageShare: damageShare,
                        totalGoldShare: goldShare,
                        totalVisionScorePerMin: visionPerMin,
                        totalObjectiveParticipation: objPart,
                        // V4.5: Variance
                        totalGd15Sq: 0, // Need lane stats for this, but MatchProcessor usually runs on full match.
                        // TODO: We need to extract lane stats here too if we want to store them.
                        // For now, initializing to 0. Real implementation requires calculating CSD@15 here.
                        totalCsd15Sq: 0,
                        totalXpd15Sq: 0,
                        totalDamageShareSq: Math.pow(damageShare, 2),
                        items: itemsToSave as any,
                        runes: finalRunes as any,
                        spells: finalSpells as any,
                        skillOrder: finalSkillOrder as any
                    }
                });
            }

            // Matchups
            const opponent = info.participants.find((op: any) => op.teamPosition === role && op.teamId !== p.teamId);
            if (opponent) {
                const opponentId = opponent.championName;
                await prisma.matchupStat.upsert({
                    where: {
                        championId_opponentId_role_tier_patch_durationBucket: {
                            championId: championId,
                            opponentId: opponentId,
                            role: role,
                            tier: tier,
                            patch: patch,
                            durationBucket: durationBucket
                        }
                    },
                    update: {
                        matches: { increment: 1 },
                        wins: { increment: p.win ? 1 : 0 },
                        totalKills: { increment: p.kills },
                        totalDeaths: { increment: p.deaths },
                        totalAssists: { increment: p.assists },
                        totalDamage: { increment: p.totalDamageDealtToChampions },
                        totalGold: { increment: p.goldEarned },
                        totalCs: { increment: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0) },
                        totalVision: { increment: p.visionScore },
                        totalDuration: { increment: info.gameDuration },
                        totalDamageShare: { increment: damageShare },
                        totalGoldShare: { increment: goldShare },
                        totalVisionScorePerMin: { increment: visionPerMin },
                        totalObjectiveParticipation: { increment: objPart },
                        totalDamageShareSq: { increment: Math.pow(damageShare, 2) }
                    },
                    create: {
                        championId: championId,
                        opponentId: opponentId,
                        role: role,
                        tier: tier,
                        patch: patch,
                        matches: 1,
                        wins: p.win ? 1 : 0,
                        totalKills: p.kills,
                        totalDeaths: p.deaths,
                        totalAssists: p.assists,
                        totalDamage: p.totalDamageDealtToChampions,
                        totalGold: p.goldEarned,
                        totalCs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
                        totalVision: p.visionScore,
                        totalDuration: info.gameDuration,
                        durationBucket: durationBucket,
                        totalDamageShare: damageShare,
                        totalGoldShare: goldShare,
                        totalVisionScorePerMin: visionPerMin,
                        totalObjectiveParticipation: objPart,
                        totalDamageShareSq: Math.pow(damageShare, 2),
                        totalGd15Sq: 0,
                        totalCsd15Sq: 0,
                        totalXpd15Sq: 0
                    }
                });
            }

            // Duos
            const teamMates = info.participants.filter((tm: any) => tm.teamId === p.teamId && tm.participantId !== p.participantId);
            for (const mate of teamMates) {
                let mateRole = mate.teamPosition;
                if (mateRole === 'MIDDLE') mateRole = 'MID';
                else if (mateRole === 'BOTTOM') mateRole = 'ADC';
                else if (mateRole === 'UTILITY') mateRole = 'SUPPORT';
                const mateId = mate.championName;

                const validDuos = [['MID', 'JUNGLE'], ['ADC', 'SUPPORT'], ['TOP', 'JUNGLE']];
                const isDuo = validDuos.some(pair => (pair[0] === role && pair[1] === mateRole) || (pair[1] === role && pair[0] === mateRole));

                if (isDuo) {
                    await prisma.duoStat.upsert({
                        where: {
                            championId_partnerId_role_partnerRole_tier_patch: {
                                championId: championId,
                                partnerId: mateId,
                                role: role,
                                partnerRole: mateRole,
                                tier: tier,
                                patch: patch
                            }
                        },
                        update: {
                            matches: { increment: 1 },
                            wins: { increment: p.win ? 1 : 0 }
                        },
                        create: {
                            championId: championId,
                            partnerId: mateId,
                            role: role,
                            partnerRole: mateRole,
                            tier: tier,
                            patch: patch,
                            matches: 1,
                            wins: p.win ? 1 : 0
                        }
                    });
                }
            }
        }
    }
}
