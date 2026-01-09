// Core UI Components - Metric Cards, Badges, Progress Bars
// Reusable components for dashboard

import React from 'react';

/**
 * Metric Card - Display key metrics with trend
 */
export interface MetricCardProps {
    title: string;
    value: number;
    max?: number;
    trend?: number;
    status?: 'good' | 'warning' | 'danger';
    suffix?: string;
    loading?: boolean;
}

export function MetricCard({
    title,
    value,
    max,
    trend,
    status = 'good',
    suffix = '',
    loading = false
}: MetricCardProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
        );
    }

    const statusColors = {
        good: 'text-green-600',
        warning: 'text-yellow-600',
        danger: 'text-red-600'
    };

    const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-600' : 'text-gray-600';

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
            <div className="flex items-baseline justify-between">
                <div>
                    <span className={`text-3xl font-bold ${statusColors[status]}`}>
                        {value}
                    </span>
                    {max && (
                        <span className="text-xl text-gray-400 ml-1">/ {max}</span>
                    )}
                    {suffix && (
                        <span className="text-xl text-gray-600 ml-1">{suffix}</span>
                    )}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center ${trendColor}`}>
                        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                        <span className="ml-1 text-sm font-medium">
                            {trend > 0 ? '+' : ''}{trend}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Status Badge - Color-coded status indicator
 */
export interface StatusBadgeProps {
    status: 'OK' | 'REVIEW' | 'PAUSE';
    size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const colors = {
        OK: 'bg-green-100 text-green-800',
        REVIEW: 'bg-yellow-100 text-yellow-800',
        PAUSE: 'bg-red-100 text-red-800'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    const icons = {
        OK: '✓',
        REVIEW: '⚠',
        PAUSE: '⏸'
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${colors[status]} ${sizes[size]}`}>
            <span className="mr-1">{icons[status]}</span>
            {status}
        </span>
    );
}

/**
 * Risk Badge - Risk tier indicator
 */
export interface RiskBadgeProps {
    tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ tier, size = 'md' }: RiskBadgeProps) {
    const colors = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${colors[tier]} ${sizes[size]}`}>
            {tier}
        </span>
    );
}

/**
 * Progress Bar - Visual progress indicator
 */
export interface ProgressBarProps {
    current: number;
    max: number;
    label?: string;
    showPercentage?: boolean;
    color?: 'green' | 'yellow' | 'red' | 'blue';
}

export function ProgressBar({
    current,
    max,
    label,
    showPercentage = true,
    color = 'blue'
}: ProgressBarProps) {
    const percentage = Math.min((current / max) * 100, 100);

    const colors = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500'
    };

    // Auto color based on percentage
    let autoColor = color;
    if (color === 'blue') {
        if (percentage >= 90) autoColor = 'red';
        else if (percentage >= 70) autoColor = 'yellow';
        else autoColor = 'green';
    }

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {showPercentage && (
                        <span className="text-sm font-medium text-gray-700">
                            {percentage.toFixed(0)}%
                        </span>
                    )}
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${colors[autoColor]}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

/**
 * Loading Spinner
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className="flex justify-center items-center">
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`}></div>
        </div>
    );
}

/**
 * Empty State
 */
export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            {icon && <div className="mb-4 flex justify-center text-gray-400">{icon}</div>}
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
