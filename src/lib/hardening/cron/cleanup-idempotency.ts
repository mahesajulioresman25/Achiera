// ACHIERA Platform - Idempotency Cleanup Cron Job
// Run daily at 2 AM to clean expired idempotency keys

import { cleanupExpiredKeys } from '@/lib/hardening/idempotency';
import { createLogger } from '@/lib/hardening/logger';

const logger = createLogger({
    correlationId: 'CRON_CLEANUP',
    action: 'IDEMPOTENCY_CLEANUP'
});

/**
 * Cleanup expired idempotency keys
 * Schedule: 0 2 * * * (2 AM daily)
 */
export async function cleanupIdempotencyKeys() {
    logger.info('Starting idempotency cleanup');

    try {
        const count = await cleanupExpiredKeys();

        logger.info('Idempotency cleanup completed', {
            deletedCount: count
        });

        return { deletedCount: count };

    } catch (error) {
        logger.error('Idempotency cleanup error', error as Error);
        throw error;
    }
}

// For manual execution
if (require.main === module) {
    cleanupIdempotencyKeys()
        .then((result) => {
            console.log(`Cleanup completed: ${result.deletedCount} keys deleted`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Cleanup failed:', error);
            process.exit(1);
        });
}
