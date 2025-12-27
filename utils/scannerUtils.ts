import { MutableRefObject } from 'react';

export const handleRateLimit = async (
    retryAfter: number,
    scanningRef: MutableRefObject<boolean>,
    addLog: (msg: string) => void
) => {
    const waitSeconds = Math.ceil(retryAfter / 1000);
    addLog(`⚠️ Rate Limit Hit. Waiting ${waitSeconds}s...`);

    for (let i = waitSeconds; i > 0; i--) {
        if (!scanningRef.current) throw new Error("Scan stopped");
        if (i % 10 === 0) addLog(`Rate Limit: Resuming in ${i}s...`);
        await new Promise(r => setTimeout(r, 1000));
    }
    addLog(`▶️ Resuming scan...`);
};

export const fetchWithBackoff = async (
    url: string,
    options: RequestInit | undefined,
    scanningRef: MutableRefObject<boolean>,
    addLog: (msg: string) => void
) => {
    while (true) {
        if (!scanningRef.current) throw new Error("Scan stopped");

        try {
            const res = await fetch(url, options);

            if (res.status === 429) {
                const retryData = await res.json().catch(() => ({}));
                await handleRateLimit(retryData.retryAfter || 5000, scanningRef, addLog);
                continue;
            }

            return res;
        } catch (e: any) {
            if (e.message === "Scan stopped") throw e;
            addLog(`CRITICAL ERROR: ${e.message}`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
};
