// ACHIERA Platform - Correlation ID Middleware
// Request tracing across distributed services

import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId, extractCorrelationId } from './logger';

/**
 * Correlation ID middleware
 * Ensures every request has a unique correlation ID for tracing
 */
export function correlationMiddleware(request: NextRequest): NextResponse {
    const response = NextResponse.next();

    // Extract or generate correlation ID
    const correlationId = extractCorrelationId(request.headers);

    // Add to response headers
    response.headers.set('X-Correlation-ID', correlationId);

    // Add to request context (for logging)
    (request as any).correlationId = correlationId;

    return response;
}

/**
 * API route wrapper with correlation tracking
 */
export function withCorrelation<T = any>(
    handler: (request: NextRequest, context: { correlationId: string }) => Promise<T>
) {
    return async function (request: NextRequest, ...args: any[]) {
        const correlationId = extractCorrelationId(request.headers);

        try {
            const result = await handler(request, { correlationId });

            // Add correlation ID to response
            if (result instanceof Response) {
                result.headers.set('X-Correlation-ID', correlationId);
                return result;
            }

            const response = NextResponse.json(result);
            response.headers.set('X-Correlation-ID', correlationId);
            return response;

        } catch (error) {
            // Ensure correlation ID is in error response
            const errorResponse = NextResponse.json(
                { error: 'Internal server error', correlationId },
                { status: 500 }
            );
            errorResponse.headers.set('X-Correlation-ID', correlationId);
            throw error;
        }
    };
}

/**
 * Client-side correlation tracking
 */
export class CorrelationClient {
    private correlationId: string | null = null;

    /**
     * Initialize correlation ID from response
     */
    setFromResponse(response: Response): void {
        const id = response.headers.get('X-Correlation-ID');
        if (id) {
            this.correlationId = id;
        }
    }

    /**
     * Get current correlation ID
     */
    get(): string {
        if (!this.correlationId) {
            this.correlationId = generateCorrelationId();
        }
        return this.correlationId;
    }

    /**
     * Add correlation ID to fetch headers
     */
    addToHeaders(headers: HeadersInit = {}): HeadersInit {
        return {
            ...headers,
            'X-Correlation-ID': this.get()
        };
    }

    /**
     * Fetch wrapper with correlation
     */
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const response = await fetch(url, {
            ...options,
            headers: this.addToHeaders(options.headers)
        });

        this.setFromResponse(response);
        return response;
    }
}

// Export singleton
export const correlationClient = new CorrelationClient();
