/**
 * Helper for concurrency control
 * Executes a callback for each item in the array, limiting the number of concurrent executions.
 */
export const mapWithConcurrency = async <T, U>(
    array: T[],
    limit: number,
    callback: (item: T) => Promise<U>
): Promise<U[]> => {
    const results: Promise<U>[] = [];
    const executing: Promise<void>[] = [];

    for (const item of array) {
        const p = Promise.resolve().then(() => callback(item));
        results.push(p);

        if (limit <= array.length) {
            const e: Promise<void> = p.then(() => {
                executing.splice(executing.indexOf(e), 1);
            }).catch(() => {
                // Catch rejection here to prevent unhandled rejection in the race
                // The error will still be propagated via Promise.all(results)
                executing.splice(executing.indexOf(e), 1);
            });
            executing.push(e);

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(results);
};
