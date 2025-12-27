export const getDurationBucket = (duration: number): string => {
    if (duration < 1200) return "0-20";
    if (duration < 1800) return "20-30";
    return "30+";
};

export const normalizeWardType = (item: any) => {
    if (!item) return null;
    const name = (typeof item.name === 'string') ? item.name.toLowerCase() : '';
    if (/control/i.test(name)) return 'Control';
    if (/oracle|lens/i.test(name)) return 'Oracle';
    if (/farsight/i.test(name)) return 'Farsight';
    if (/stealth/i.test(name) || /sight/i.test(name)) return 'Stealth';
    if (item.tags && Array.isArray(item.tags) && item.tags.includes('Ward')) return 'Sight';
    if (/ward/i.test(name)) return 'Sight';
    return null;
};

export const isWardItem = (item: any) => {
    const t = normalizeWardType(item);
    return t === 'Stealth' || t === 'Sight' || t === 'Farsight' || t === 'Oracle';
};

export const calculateWeightedDeaths = (events: any[]) => {
    const participantWeightedDeaths: Record<number, number> = {};
    const deathEvents = events.filter((e: any) => e.type === 'CHAMPION_KILL');
    deathEvents.forEach((e: any) => {
        const victimId = e.victimId;
        const timestamp = e.timestamp;
        const minutes = timestamp / 60000;

        let weight = 1.0;
        if (minutes < 15) weight = 0.8;
        else if (minutes < 30) weight = 1.0;
        else weight = 1.5;

        if (!participantWeightedDeaths[victimId]) participantWeightedDeaths[victimId] = 0;
        participantWeightedDeaths[victimId] += weight;
    });
    return participantWeightedDeaths;
};

export const calculateLaneStats = (frames: any[], participants: any[]) => {
    const participantLaneStats: Record<number, { csd15: number; gd15: number; xpd15: number }> = {};
    const frame15 = frames.find((f: any) => f.timestamp >= 900000 && f.timestamp < 960000) || frames[frames.length - 1];

    if (frame15) {
        participants.forEach((p: any) => {
            const opponent = participants.find((opp: any) => opp.teamPosition === p.teamPosition && opp.teamId !== p.teamId);
            if (opponent) {
                const myFrame = frame15.participantFrames?.[p.participantId];
                const oppFrame = frame15.participantFrames?.[opponent.participantId];
                if (myFrame && oppFrame) {
                    participantLaneStats[p.participantId] = {
                        gd15: (myFrame.totalGold || 0) - (oppFrame.totalGold || 0),
                        xpd15: (myFrame.xp || 0) - (oppFrame.xp || 0),
                        csd15: ((myFrame.minionsKilled || 0) + (myFrame.jungleMinionsKilled || 0)) - ((oppFrame.minionsKilled || 0) + (oppFrame.jungleMinionsKilled || 0))
                    };
                }
            }
        });
    }
    return participantLaneStats;
};

export const generateGraphPoints = (frames: any[]) => {
    const points: { timestamp: string; blueScore: number; redScore: number }[] = [];
    for (const frame of frames) {
        const tsMs = frame.timestamp ?? 0;
        const minutes = Math.round(tsMs / 60000);
        let blueGold = 0;
        let redGold = 0;
        const participantsFrames = frame.participantFrames || {};
        for (const key of Object.keys(participantsFrames)) {
            const pf = participantsFrames[key];
            const getTeamId = (pFrame: any) => {
                if (pFrame.teamId) return Number(pFrame.teamId);
                if (pFrame.participantId) return pFrame.participantId <= 5 ? 100 : 200;
                return 100; // Fallback
            };
            const teamId = getTeamId(pf);
            const totalGold = Number(pf.totalGold ?? pf.gold ?? 0);
            if (teamId === 100) blueGold += totalGold;
            else if (teamId === 200) redGold += totalGold;
        }
        if (minutes >= 0 && (blueGold > 0 || redGold > 0)) {
            points.push({
                timestamp: `${minutes}m`,
                blueScore: blueGold,
                redScore: redGold,
            });
        }
    }
    return points;
};

export const processItemBuild = (events: any[], me: any, version: string, getItemIconUrl: (id: number, v: string) => string) => {
    const itemBuild: any[] = [];
    const myEvents = events.filter(
        (e: any) =>
            ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type) &&
            e.participantId === me.participantId,
    );
    myEvents.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

    const cleanEvents: any[] = [];
    for (const ev of myEvents) {
        if (ev.type === 'ITEM_PURCHASED' || ev.type === 'ITEM_SOLD') {
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

    for (const ev of cleanEvents) {
        const itemId = ev.itemId || ev.itemIdPurchased || ev.itemIdSold || ev.itemIdAdded || null;
        if (!itemId) continue;
        const ts = Math.floor((ev.timestamp || 0) / 1000);
        const mm = Math.floor(ts / 60);
        const ss = ts % 60;
        const timestamp = `${mm}m ${ss}s`;
        const action = ev.type || 'ITEM_PURCHASED';

        itemBuild.push({
            timestamp,
            action,
            item: {
                id: itemId,
                imageUrl: getItemIconUrl(itemId, version),
                name: `Item ${itemId}`,
                tags: [],
            },
        });
    }
    return itemBuild;
};
