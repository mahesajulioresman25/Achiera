// ACHIERA Platform - Monitoring & Metrics
// Application performance monitoring and health checks

import { logger } from './logger';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type Metric = {
    name: string;
    type: MetricType;
    value: number;
    labels?: Record<string, string>;
    timestamp: Date;
};

/**
 * Metrics collector
 */
export class MetricsCollector {
    private metrics: Map<string, Metric> = new Map();
    private static instance: MetricsCollector;

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    /**
     * Increment counter
     */
    increment(name: string, labels?: Record<string, string>, value: number = 1): void {
        const key = this.getMetricKey(name, labels);
        const existing = this.metrics.get(key);

        this.metrics.set(key, {
            name,
            type: 'counter',
            value: (existing?.value || 0) + value,
            labels,
            timestamp: new Date()
        });
    }

    /**
     * Set gauge value
     */
    gauge(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getMetricKey(name, labels);

        this.metrics.set(key, {
            name,
            type: 'gauge',
            value,
            labels,
            timestamp: new Date()
        });
    }

    /**
     * Record histogram value
     */
    histogram(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getMetricKey(name, labels);

        this.metrics.set(key, {
            name,
            type: 'histogram',
            value,
            labels,
            timestamp: new Date()
        });
    }

    /**
     * Get all metrics
     */
    getMetrics(): Metric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Clear metrics
     */
    clear(): void {
        this.metrics.clear();
    }

    /**
     * Get metric key
     */
    private getMetricKey(name: string, labels?: Record<string, string>): string {
        if (!labels) return name;

        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');

        return `${name}{${labelStr}}`;
    }
}

/**
 * Health check system
 */
export class HealthCheck {
    private checks: Map<string, () => Promise<boolean>> = new Map();

    /**
     * Register health check
     */
    register(name: string, check: () => Promise<boolean>): void {
        this.checks.set(name, check);
    }

    /**
     * Run all health checks
     */
    async runAll(): Promise<{
        healthy: boolean;
        checks: Record<string, { healthy: boolean; error?: string }>;
    }> {
        const results: Record<string, { healthy: boolean; error?: string }> = {};
        let allHealthy = true;

        for (const [name, check] of this.checks) {
            try {
                const healthy = await check();
                results[name] = { healthy };

                if (!healthy) {
                    allHealthy = false;
                }
            } catch (error) {
                results[name] = {
                    healthy: false,
                    error: (error as Error).message
                };
                allHealthy = false;
            }
        }

        return {
            healthy: allHealthy,
            checks: results
        };
    }
}

/**
 * Application monitoring
 */
export class ApplicationMonitor {
    private metrics = MetricsCollector.getInstance();
    private health = new HealthCheck();

    constructor() {
        this.setupDefaultHealthChecks();
        this.startMetricsCollection();
    }

    /**
     * Setup default health checks
     */
    private setupDefaultHealthChecks(): void {
        // Database health check
        this.health.register('database', async () => {
            try {
                const { prisma } = await import('@/lib/prisma');
                await prisma.$queryRaw`SELECT 1`;
                return true;
            } catch {
                return false;
            }
        });

        // Memory health check
        this.health.register('memory', async () => {
            if (typeof process === 'undefined') return true;

            const usage = process.memoryUsage();
            const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

            return heapUsedPercent < 90; // Alert if > 90% heap used
        });
    }

    /**
     * Start metrics collection
     */
    private startMetricsCollection(): void {
        if (typeof process === 'undefined') return;

        // Collect system metrics every 30 seconds
        setInterval(() => {
            const usage = process.memoryUsage();

            this.metrics.gauge('nodejs_memory_heap_used_bytes', usage.heapUsed);
            this.metrics.gauge('nodejs_memory_heap_total_bytes', usage.heapTotal);
            this.metrics.gauge('nodejs_memory_external_bytes', usage.external);

            if (process.cpuUsage) {
                const cpu = process.cpuUsage();
                this.metrics.gauge('nodejs_cpu_user_microseconds', cpu.user);
                this.metrics.gauge('nodejs_cpu_system_microseconds', cpu.system);
            }
        }, 30000);
    }

    /**
     * Track HTTP request
     */
    trackRequest(
        method: string,
        path: string,
        statusCode: number,
        duration: number
    ): void {
        this.metrics.increment('http_requests_total', {
            method,
            path,
            status: statusCode.toString()
        });

        this.metrics.histogram('http_request_duration_ms', duration, {
            method,
            path
        });
    }

    /**
     * Track database query
     */
    trackQuery(operation: string, duration: number): void {
        this.metrics.increment('db_queries_total', { operation });
        this.metrics.histogram('db_query_duration_ms', duration, { operation });
    }

    /**
     * Track business metric
     */
    trackBusinessMetric(name: string, value: number, labels?: Record<string, string>): void {
        this.metrics.gauge(name, value, labels);
    }

    /**
     * Get health status
     */
    async getHealth(): Promise<any> {
        return this.health.runAll();
    }

    /**
     * Get metrics
     */
    getMetrics(): Metric[] {
        return this.metrics.getMetrics();
    }
}

// Export singleton
export const monitor = new ApplicationMonitor();

/**
 * Request tracking middleware
 */
export function trackRequestMetrics(
    method: string,
    path: string,
    handler: () => Promise<Response>
): Promise<Response> {
    const start = Date.now();

    return handler()
        .then(response => {
            const duration = Date.now() - start;
            monitor.trackRequest(method, path, response.status, duration);
            return response;
        })
        .catch(error => {
            const duration = Date.now() - start;
            monitor.trackRequest(method, path, 500, duration);
            throw error;
        });
}
