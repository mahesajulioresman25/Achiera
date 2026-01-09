// ACHIERA Platform - Analytics Event Writer
// Append-only event ingestion with silent failure

import { prisma } from '@/lib/prisma';
import { getCurrentCorrelationId } from '@/lib/hardening/correlation';

export type AnalyticsEventType =
    // Sales events
    | 'sales.order_created'
    | 'sales.order_fulfilled'
    | 'sales.order_refunded'
    | 'sales.product_sold'
    | 'sales.customer_acquired'

    // Ads events
    | 'ads.campaign_started'
    | 'ads.campaign_ended'
    | 'ads.daily_metrics'
    | 'ads.conversion_tracked'

    // Inventory events
    | 'inventory.stock_low'
    | 'inventory.stock_out'
    | 'inventory.restock'

    // Customer events
    | 'customer.first_purchase'
    | 'customer.repeat_purchase'
    | 'customer.churned'

    // Recommendation events
    | 'recommendation.generated'
    | 'recommendation.viewed'
    | 'recommendation.acted_upon'
    | 'recommendation.dismissed';

export type EventSource = 'system' | 'import' | 'api' | 'manual';

interface WriteEventParams {
    brandId: string;
    eventType: AnalyticsEventType;
    eventTimestamp?: Date;
    payload: Record<string, any>;
    source?: EventSource;
    sourceId?: string;
    createdBy?: string;
    correlationId?: string;
}

/**
 * Write analytics event (append-only, never fails)
 */
export async function writeAnalyticsEvent(params: WriteEventParams): Promise<void> {
    try {
        const correlationId = params.correlationId || getCurrentCorrelationId();

        await prisma.analyticsEvent.create({
            data: {
                brandId: params.brandId,
                eventType: params.eventType,
                eventTimestamp: params.eventTimestamp || new Date(),
                correlationId,
                payload: params.payload,
                source: params.source || 'system',
                sourceId: params.sourceId,
                createdBy: params.createdBy
            }
        });
    } catch (error) {
        // Silent fail - never block business operations
        console.error('[Analytics] Failed to write event:', error);
    }
}

/**
 * Write multiple events in batch
 */
export async function writeAnalyticsEventsBatch(events: WriteEventParams[]): Promise<void> {
    try {
        const data = events.map(event => ({
            brandId: event.brandId,
            eventType: event.eventType,
            eventTimestamp: event.eventTimestamp || new Date(),
            correlationId: event.correlationId || getCurrentCorrelationId(),
            payload: event.payload,
            source: event.source || 'system',
            sourceId: event.sourceId,
            createdBy: event.createdBy
        }));

        await prisma.analyticsEvent.createMany({
            data,
            skipDuplicates: true
        });
    } catch (error) {
        console.error('[Analytics] Failed to write batch events:', error);
    }
}

/**
 * Helper: Track order created
 */
export async function trackOrderCreated(
    brandId: string,
    orderId: string,
    orderData: {
        total: number;
        itemCount: number;
        customerId?: string;
        channel?: string;
    }
): Promise<void> {
    await writeAnalyticsEvent({
        brandId,
        eventType: 'sales.order_created',
        payload: {
            orderId,
            ...orderData
        }
    });
}

/**
 * Helper: Track product sold
 */
export async function trackProductSold(
    brandId: string,
    productData: {
        productId: string;
        variantId: string;
        quantity: number;
        revenue: number;
        orderId: string;
        channel?: string;
        platform?: string;
    }
): Promise<void> {
    await writeAnalyticsEvent({
        brandId,
        eventType: 'sales.product_sold',
        payload: productData
    });
}

/**
 * Helper: Track customer acquisition
 */
export async function trackCustomerAcquisition(
    brandId: string,
    customerId: string,
    acquisitionData: {
        source?: string;
        campaign?: string;
        firstOrderValue: number;
    }
): Promise<void> {
    await writeAnalyticsEvent({
        brandId,
        eventType: 'customer.first_purchase',
        payload: {
            customerId,
            ...acquisitionData
        }
    });
}

/**
 * Helper: Track ads daily metrics
 */
export async function trackAdsDailyMetrics(
    brandId: string,
    adsData: {
        platform: string;
        campaignId?: string;
        campaignName: string;
        date: Date;
        impressions: number;
        clicks: number;
        spend: number;
        conversions?: number;
        revenue?: number;
    },
    sourceId?: string
): Promise<void> {
    await writeAnalyticsEvent({
        brandId,
        eventType: 'ads.daily_metrics',
        eventTimestamp: adsData.date,
        payload: adsData,
        source: 'import',
        sourceId
    });
}

/**
 * Helper: Track recommendation interaction
 */
export async function trackRecommendationInteraction(
    brandId: string,
    recommendationId: string,
    action: 'viewed' | 'acted_upon' | 'dismissed',
    userId: string,
    metadata?: Record<string, any>
): Promise<void> {
    const eventTypeMap = {
        viewed: 'recommendation.viewed' as AnalyticsEventType,
        acted_upon: 'recommendation.acted_upon' as AnalyticsEventType,
        dismissed: 'recommendation.dismissed' as AnalyticsEventType
    };

    await writeAnalyticsEvent({
        brandId,
        eventType: eventTypeMap[action],
        payload: {
            recommendationId,
            userId,
            ...metadata
        }
    });
}
