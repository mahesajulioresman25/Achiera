// ACHIERA Platform - Daily Health Check Cron Job
// Run daily at 3 AM to verify system integrity

import { runHealthChecks } from '@/lib/hardening/health-checks';
import { createLogger } from '@/lib/hardening/logger';

const logger = createLogger({
    correlationId: 'CRON_HEALTH_CHECK',
    action: 'DAILY_HEALTH_CHECK'
});

/**
 * Daily health check
 * Schedule: 0 3 * * * (3 AM daily)
 */
export async function dailyHealthCheck() {
    logger.info('Starting daily health check');

    try {
        // Run all health checks
        const result = await runHealthChecks();

        if (result.healthy) {
            logger.info('Health check passed', {
                checks: result.checks
            });
        } else {
            logger.error('Health check failed', undefined, {
                checks: result.checks
            });

            // Send alert to operations team
            await sendHealthCheckAlert(result);
        }

        return result;

    } catch (error) {
        logger.error('Health check error', error as Error);
        throw error;
    }
}

/**
 * Send alert to operations team
 */
async function sendHealthCheckAlert(result: any): Promise<void> {
    // Implement your alerting mechanism here
    // Examples: Slack, Email, PagerDuty, etc.

    if (process.env.SLACK_WEBHOOK_URL) {
        try {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: '🚨 Daily Health Check Failed',
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: '*Daily Health Check Failed*\n\nPlease review system integrity.'
                            }
                        },
                        {
                            type: 'section',
                            fields: [
                                {
                                    type: 'mrkdwn',
                                    text: `*Ledger Balance:*\n${result.checks.ledgerBalance.passed ? '✅ Passed' : '❌ Failed'}`
                                },
                                {
                                    type: 'mrkdwn',
                                    text: `*Stock Consistency:*\n${result.checks.stockConsistency.passed ? '✅ Passed' : '❌ Failed'}`
                                },
                                {
                                    type: 'mrkdwn',
                                    text: `*Orphan Transactions:*\n${result.checks.orphanTransactions.passed ? '✅ Passed' : '❌ Failed'}`
                                }
                            ]
                        }
                    ]
                })
            });
        } catch (error) {
            logger.error('Failed to send Slack alert', error as Error);
        }
    }
}

// For manual execution
if (require.main === module) {
    dailyHealthCheck()
        .then(() => {
            console.log('Health check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Health check failed:', error);
            process.exit(1);
        });
}
