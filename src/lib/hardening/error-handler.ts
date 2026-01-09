// ACHIERA Platform - Central Error Handler
// Converts errors to safe user responses and detailed internal logs

import { NextResponse } from 'next/server';
import { BusinessError, SystemError, SecurityError } from './errors';
import { createLogger } from './logger';
import type { CorrelationContext } from './correlation';

/**
 * Handle error and return appropriate response
 */
export function handleError(
    error: Error,
    context: CorrelationContext
): NextResponse {
    const logger = createLogger({
        ...context,
        action: 'ERROR_HANDLER'
    });

    // Business error (expected)
    if (error instanceof BusinessError) {
        logger.warn(error.message, {
            code: error.code,
            statusCode: error.statusCode
        });

        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                correlationId: context.correlationId
            },
            { status: error.statusCode }
        );
    }

    // Security error (critical)
    if (error instanceof SecurityError) {
        logger.critical(error.message, error, {
            code: error.code,
            userId: error.userId
        });

        return NextResponse.json(
            {
                error: 'Security violation',
                correlationId: context.correlationId
            },
            { status: 403 }
        );
    }

    // System error (unexpected)
    if (error instanceof SystemError) {
        logger.error(error.message, error.originalError || error, {
            code: error.code
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                correlationId: context.correlationId
            },
            { status: 500 }
        );
    }

    // Unknown error
    logger.error('Unhandled error', error);

    return NextResponse.json(
        {
            error: 'Internal server error',
            correlationId: context.correlationId
        },
        { status: 500 }
    );
}

/**
 * Safe error message for user
 */
export function getSafeErrorMessage(error: Error): string {
    if (error instanceof BusinessError) {
        return error.message;
    }

    return 'An error occurred. Please try again or contact support.';
}
