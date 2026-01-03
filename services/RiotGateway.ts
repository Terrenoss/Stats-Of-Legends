
export type Priority = 'INTERACTIVE' | 'BACKGROUND';

interface QueueItem {
    request: () => Promise<any>;
    priority: Priority;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

class RiotGatewayService {
    private queue: QueueItem[] = [];
    private processing = false;

    // Rate Limit Config (Example: 100 requests per 2 minutes)
    // We reserve 30% for Interactive
    private readonly LIMIT_WINDOW = 120 * 1000; // 2 minutes
    private readonly MAX_REQUESTS = 100;
    private readonly INTERACTIVE_RESERVE = 30;

    private requestTimestamps: number[] = [];

    async execute<T>(fn: () => Promise<T>, priority: Priority = 'BACKGROUND'): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request: fn, priority, resolve, reject });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                // Sort: Interactive first
                this.queue.sort((a, b) => {
                    if (a.priority === b.priority) return 0;
                    return a.priority === 'INTERACTIVE' ? -1 : 1;
                });

                const nextItem = this.queue[0]; // Peek
                const canProceed = this.checkRateLimit(nextItem.priority);

                if (canProceed) {
                    const item = this.queue.shift()!;
                    this.requestTimestamps.push(Date.now());

                    // Execute without awaiting to allow concurrency if needed?
                    // No, we want to control rate, so we await (or at least start it).
                    // But if we await, we block the queue. 
                    // RiotService.mapWithConcurrency handles concurrency.
                    // This Gateway controls the *start* of requests.

                    item.request()
                        .then(item.resolve)
                        .catch(item.reject);

                    // Small delay to spread requests?
                    // await new Promise(r => setTimeout(r, 50)); 
                } else {
                    // Wait before retrying
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        } finally {
            this.processing = false;
        }
    }

    private checkRateLimit(priority: Priority): boolean {
        const now = Date.now();
        // Clean old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(t => t > now - this.LIMIT_WINDOW);

        const used = this.requestTimestamps.length;
        const available = this.MAX_REQUESTS - used;

        if (available <= 0) return false;

        if (priority === 'BACKGROUND') {
            // Background can only use if we have more than the reserve
            return available > this.INTERACTIVE_RESERVE;
        }

        // Interactive can use anything available
        return true;
    }
}

export const RiotGateway = new RiotGatewayService();
