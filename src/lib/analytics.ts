// Analytics tracking utility for client-side usage

type AnalyticsEventType =
    | 'PAGE_VIEW'
    | 'COLLECTION_CLICK'
    | 'MOCKUP_OPEN'
    | 'MOCKUP_CONFIRM'
    | 'HERO_CTA_CLICK';

interface TrackEventParams {
    brandSlug: string;
    type: AnalyticsEventType;
    path?: string;
    collectionSlug?: string;
    metadata?: Record<string, any>;
}

// Session management
const SESSION_KEY = 'analytics_session_id';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';

    const stored = localStorage.getItem(SESSION_KEY);
    const now = Date.now();

    if (stored) {
        try {
            const { sessionId, timestamp } = JSON.parse(stored);
            // Check if session is still valid
            if (now - timestamp < SESSION_DURATION) {
                // Update timestamp
                localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, timestamp: now }));
                return sessionId;
            }
        } catch (e) {
            // Invalid stored data, create new session
        }
    }

    // Create new session
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: newSessionId, timestamp: now }));
    return newSessionId;
}

function getReferrer(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    return document.referrer || undefined;
}

// Event batching for performance
let eventQueue: any[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE = 5;
const BATCH_DELAY = 2000; // 2 seconds

async function flushEvents() {
    if (eventQueue.length === 0) return;

    const eventsToSend = [...eventQueue];
    eventQueue = [];

    try {
        await fetch('/api/public/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: eventsToSend }),
        });
    } catch (error) {
        console.error('Analytics batch tracking failed:', error);
        // Re-queue failed events (with limit to prevent infinite growth)
        if (eventQueue.length < 50) {
            eventQueue.unshift(...eventsToSend);
        }
    }
}

function scheduleBatchFlush() {
    if (batchTimeout) {
        clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(flushEvents, BATCH_DELAY);
}

export async function trackEvent(params: TrackEventParams) {
    try {
        const sessionId = getOrCreateSessionId();
        const referrer = getReferrer();

        const event = {
            brandSlug: params.brandSlug,
            eventType: params.type,
            sessionId,
            referrer,
            metadata: {
                path: params.path,
                collectionSlug: params.collectionSlug,
                ...params.metadata,
            },
        };

        // Add to queue
        eventQueue.push(event);

        // Flush immediately if batch size reached, otherwise schedule
        if (eventQueue.length >= BATCH_SIZE) {
            await flushEvents();
        } else {
            scheduleBatchFlush();
        }
    } catch (error) {
        // Silently fail - don't block user experience
        console.error('Analytics tracking failed:', error);
    }
}

// Flush events before page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (eventQueue.length > 0) {
            // Use sendBeacon for reliable delivery on page unload
            const eventsToSend = [...eventQueue];
            eventQueue = [];
            navigator.sendBeacon(
                '/api/public/analytics/track',
                JSON.stringify({ events: eventsToSend })
            );
        }
    });
}

// Convenience functions
export const analytics = {
    trackPageView: (brandSlug: string, path: string, metadata?: Record<string, any>) =>
        trackEvent({ brandSlug, type: 'PAGE_VIEW', path, metadata }),

    trackCollectionClick: (brandSlug: string, collectionSlug: string, metadata?: Record<string, any>) =>
        trackEvent({ brandSlug, type: 'COLLECTION_CLICK', collectionSlug, metadata }),

    trackMockupOpen: (brandSlug: string, metadata?: Record<string, any>) =>
        trackEvent({ brandSlug, type: 'MOCKUP_OPEN', metadata }),

    trackMockupConfirm: (brandSlug: string, metadata?: Record<string, any>) =>
        trackEvent({ brandSlug, type: 'MOCKUP_CONFIRM', metadata }),

    trackHeroCtaClick: (brandSlug: string, path: string, metadata?: Record<string, any>) =>
        trackEvent({ brandSlug, type: 'HERO_CTA_CLICK', path, metadata }),

    // Manual flush for testing or critical events
    flush: flushEvents,
};
