export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { schedulerService } = await import('./lib/notifications/SchedulerService');
        schedulerService.start();
    }
}
