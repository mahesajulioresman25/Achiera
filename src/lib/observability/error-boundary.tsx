// ACHIERA Platform - Error Boundaries
// React error boundaries with logging and recovery

'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from './logger';

type ErrorBoundaryProps = {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    context?: {
        component?: string;
        userId?: string;
        brandId?: string;
    };
};

type ErrorBoundaryState = {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
};

/**
 * Error boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error
        const log = logger.child({
            component: this.props.context?.component || 'Unknown',
            userId: this.props.context?.userId,
            brandId: this.props.context?.brandId
        });

        log.error('React Error Boundary caught error', error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: this.props.context?.component
        });

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        // Update state
        this.setState({
            error,
            errorInfo
        });
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h2 className="mt-4 text-center text-xl font-semibold text-gray-900">
                            Something went wrong
                        </h2>

                        <p className="mt-2 text-center text-sm text-gray-600">
                            We've been notified and are working on a fix.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
                                <p className="font-semibold text-red-600">{this.state.error.message}</p>
                                <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                                    {this.state.error.stack}
                                </pre>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary {...errorBoundaryProps}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

/**
 * Error boundary for specific sections
 */
export function SectionErrorBoundary({
    children,
    section
}: {
    children: ReactNode;
    section: string;
}) {
    return (
        <ErrorBoundary
            context={{ component: section }}
            fallback={
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                        Failed to load {section}. Please try refreshing the page.
                    </p>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Unhandled Promise Rejection', event.reason, {
                promise: event.promise
            });

            event.preventDefault();
        });

        // Global errors
        window.addEventListener('error', (event) => {
            logger.error('Global Error', event.error, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }
}
