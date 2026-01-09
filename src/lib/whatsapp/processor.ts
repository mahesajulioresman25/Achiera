
import { prisma } from '@/lib/prisma';
import { waEngine } from '@/lib/whatsapp/engine';

export class WhatsAppProcessor {
    private static isRunning = false;
    private static intervalId: NodeJS.Timeout | null = null;

    /**
     * Start the background processor.
     * It polls the database every 10 seconds for pending messages.
     */
    static start() {
        if (this.intervalId) return;

        console.log('[WhatsAppProcessor] Background worker started.');
        this.intervalId = setInterval(() => this.processNext(), 10000); // 10s polling
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Fetch the next pending message and send it.
     */
    private static async processNext() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            // Fetch next pending message based on priority and schedule
            const queueItem = await (prisma as any).whatsAppQueue.findFirst({
                where: {
                    status: 'PENDING',
                    scheduledFor: { lte: new Date() }
                },
                orderBy: [
                    { priority: 'asc' },
                    { createdAt: 'asc' }
                ]
            });

            if (!queueItem) {
                this.isRunning = false;
                return;
            }

            // Mark as processing
            await (prisma as any).whatsAppQueue.update({
                where: { id: queueItem.id },
                data: { status: 'PROCESSING' }
            });

            console.log(`[WhatsAppProcessor] Processing message for ${queueItem.phone} (Pri: ${queueItem.priority})`);

            try {
                // Send via engine
                await waEngine.sendMessage(queueItem.phone, queueItem.text, queueItem.priority);

                // Success
                await (prisma as any).whatsAppQueue.update({
                    where: { id: queueItem.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                        attempts: queueItem.attempts + 1
                    }
                });

                console.log(`[WhatsAppProcessor] Successfully sent to ${queueItem.phone}`);

                // HUMAN DELAY: Wait 15-45 seconds before next message to avoid ban
                const delay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
                console.log(`[WhatsAppProcessor] Throttling for ${delay / 1000}s...`);
                setTimeout(() => {
                    this.isRunning = false;
                }, delay);

            } catch (error: any) {
                console.error(`[WhatsAppProcessor] Failed to send to ${queueItem.phone}:`, error.message);

                // Handle Failure & Retries
                const isRetryable = queueItem.attempts < 3;
                await (prisma as any).whatsAppQueue.update({
                    where: { id: queueItem.id },
                    data: {
                        status: isRetryable ? 'PENDING' : 'FAILED',
                        errorMessage: error.message,
                        attempts: queueItem.attempts + 1,
                        scheduledFor: new Date(Date.now() + (queueItem.attempts + 1) * 60000) // Backoff
                    }
                });
                this.isRunning = false;
            }

        } catch (error) {
            console.error('[WhatsAppProcessor] Critical Error:', error);
            this.isRunning = false;
        }
    }
}
