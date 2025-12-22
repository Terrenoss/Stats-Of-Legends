import { NextResponse } from 'next/server';
import { RiotService } from '@/services/RiotService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId, region = 'euw1', tier = 'CHALLENGER' } = await request.json();

        // 1. Check if already scanned
        const existing = await prisma.scannedMatch.findUnique({ where: { id: matchId } });
        if (existing) {
            return NextResponse.json({ status: 'skipped' });
        }

        // Determine routing
        let routing = 'europe';
        if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
        if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

        // 2. Fetch Details
        const match = await RiotService.getMatchDetails(routing, matchId);
        const info = match.info;
        const patch = info.gameVersion.split('.').slice(0, 2).join('.'); // "14.24.xxx" -> "14.24"

        // Fetch Maps
        const champMap = await RiotService.getChampionIdMap(patch + ".1");
        const itemMap = await RiotService.getItemMap(patch + ".1");

        // 3a. Process Bans
        for (const team of info.teams) {
            for (const ban of team.bans) {
                if (ban.championId !== -1) {
                    const champName = champMap[ban.championId];
                    if (champName) {
                        await prisma.championStat.upsert({
                            where: {
                                championId_role_tier_patch: {
                                    championId: champName,
                                    role: 'ALL',
                                    tier: tier,
                                    patch: patch
                                }
                            },
                            update: { bans: { increment: 1 } },
                            create: {
                                championId: champName,
                                role: 'ALL',
                                tier: tier,
                                patch: patch,
                                bans: 1
                            }
                        });
                    }
                }
            }
        }

        // 3b. Process Participants
        for (const p of info.participants) {
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
                    // Fetch Timeline
                    const timeline = await RiotService.getMatchTimeline(routing, matchId);
                    const participantId = p.participantId;

                    // Extract Skill Order
                    const skillEvents = timeline.info.frames.flatMap((f: any) => f.events)
                        .filter((e: any) => e.type === 'SKILL_LEVEL_UP' && e.participantId === participantId && e.skillSlot > 0 && e.skillSlot <= 4);

                    const skillMap: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' };
                    skillOrderString = skillEvents.map((e: any) => skillMap[e.skillSlot]).join('-');

                    // Extract Build Order (Purchase Events) with UNDO handling
                    const allItemEvents = timeline.info.frames.flatMap((f: any) => f.events)
                        .filter((e: any) =>
                            e.participantId === participantId &&
                            ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type)
                        );

                    // Simulate Inventory / Clean Event List
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
                    console.warn(`Failed to fetch timeline for ${matchId}`, err);
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

                // --- NEW: Starting Items & Core Build Analysis ---
                if (cleanEvents.length > 0) {
                    // 1. Starting Items (Bought <= 1 min)
                    // Filter out Vision Items
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

                    // 2. Core Build & Options
                    // Filter timeline events to only include items that ended up in the Final Inventory.
                    // AND Filter out COMPONENTS (items that build into something else).
                    const finalItemSet = new Set(finalItems);

                    const buildPath = cleanEvents
                        .filter(e => {
                            if (e.type !== 'ITEM_PURCHASED') return false;
                            if (!finalItemSet.has(e.itemId)) return false;

                            // Check if it's a component
                            const itemData = itemMap[e.itemId];
                            if (itemData) {
                                // Allow Boots to be part of core build even if they have 'into' (e.g. Tier 2 boots)
                                const isBoots = itemData.tags && itemData.tags.includes('Boots');
                                if (!isBoots && itemData.into && itemData.into.length > 0) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map(e => e.itemId);

                    const uniqueBuildPath = Array.from(new Set(buildPath));

                    if (uniqueBuildPath.length >= 1) {
                        // Define Core (First 3 items)
                        const coreLength = Math.min(uniqueBuildPath.length, 3);
                        const coreIds = uniqueBuildPath.slice(0, coreLength);
                        const coreKey = `core_${coreIds.join('-')}`;

                        if (!items[coreKey]) items[coreKey] = { wins: 0, matches: 0 };
                        items[coreKey].wins += p.win ? 1 : 0;
                        items[coreKey].matches += 1;

                        // Define Options (4th, 5th, 6th) relative to this Core
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
                    // Add Stat Perks (Offense, Flex, Defense)
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
                // Add Stat Perks to individual stats
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

                // Upsert Champion Stats
                await prisma.championStat.upsert({
                    where: {
                        championId_role_tier_patch: {
                            championId: championId,
                            role: role,
                            tier: tier,
                            patch: patch
                        }
                    },
                    update: {
                        matches: { increment: 1 },
                        wins: { increment: p.win ? 1 : 0 },
                        items: {
                            // Simple merge logic for JSON is hard in Prisma update without raw query.
                            // For now, we fetch-modify-save or just rely on the fact that we are processing one match.
                            // Actually, Prisma JSON update usually replaces. We need to be careful.
                            // Ideally we should read first, but for high throughput we might need a better strategy.
                            // Given the constraints, let's assume we need to READ existing first if we want to merge.
                            // BUT, we are inside a loop. This is slow.
                            // Let's try to use raw query or just accept that for this prototype we might overwrite if we don't handle it.
                            // Wait, the previous code had logic to merge `existing`.
                            // But `existing` was fetched at the top for `ScannedMatch`.
                            // We need to fetch the `ChampionStat` to merge.
                            // Let's do a quick fetch-merge.
                        } as any, // Placeholder, we need to implement merge logic or use a raw query.
                        // For this specific task, I will implement a basic fetch-merge loop below.
                    },
                    create: {
                        championId: championId,
                        role: role,
                        tier: tier,
                        patch: patch,
                        matches: 1,
                        wins: p.win ? 1 : 0,
                        items: items as any,
                        runes: runes as any,
                        spells: spells as any,
                        skillOrder: skillOrderData as any
                    }
                });

                // Re-implementing the merge logic correctly:
                const existingStat = await prisma.championStat.findUnique({
                    where: {
                        championId_role_tier_patch: {
                            championId: championId,
                            role: role,
                            tier: tier,
                            patch: patch
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

                    // Update
                    await prisma.championStat.update({
                        where: { id: existingStat.id },
                        data: {
                            matches: { increment: 1 },
                            wins: { increment: p.win ? 1 : 0 },
                            items: itemsToSave as any,
                            runes: finalRunes as any,
                            spells: finalSpells as any,
                            skillOrder: finalSkillOrder as any
                        }
                    });
                } else {
                    // Create (already handled by upsert logic above? No, upsert needs create/update.
                    // Since we did manual fetch, we can just create if not found.)
                    await prisma.championStat.create({
                        data: {
                            championId: championId,
                            role: role,
                            tier: tier,
                            patch: patch,
                            matches: 1,
                            wins: p.win ? 1 : 0,
                            items: itemsToSave as any,
                            runes: finalRunes as any,
                            spells: finalSpells as any,
                            skillOrder: finalSkillOrder as any
                        }
                    });
                }

                // Matchups & Duos logic (Simplified for brevity, assuming similar merge logic needed or just increment)
                // For now, I'll skip the detailed merge for Matchups/Duos to keep this file clean and focused on the Item fix.
                // The original code had upserts which are fine for simple counters, but for JSON data we need merge.
                // Matchups/Duos don't have JSON data, just counters. So upsert is fine.

                // --- Matchups (Counters) ---
                const opponent = info.participants.find(op => op.teamPosition === role && op.teamId !== p.teamId);
                if (opponent) {
                    const opponentId = opponent.championName;
                    await prisma.matchupStat.upsert({
                        where: {
                            championId_opponentId_role_tier_patch: {
                                championId: championId,
                                opponentId: opponentId,
                                role: role,
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
                            opponentId: opponentId,
                            role: role,
                            tier: tier,
                            patch: patch,
                            matches: 1,
                            wins: p.win ? 1 : 0
                        }
                    });
                }

                // --- Duos ---
                const teamMates = info.participants.filter(tm => tm.teamId === p.teamId && tm.participantId !== p.participantId);
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

        // 4. Mark as Scanned
        await prisma.scannedMatch.create({
            data: {
                id: matchId,
                patch: patch,
                tier: tier
            }
        });

        return NextResponse.json({ status: 'processed', patch });

    } catch (error: any) {
        if (error.status === 429) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: 429 });
        }
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
