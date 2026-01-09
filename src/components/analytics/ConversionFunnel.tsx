'use client';

import { TrendingDown } from 'lucide-react';

interface FunnelStep {
    name: string;
    value: number;
    color: string;
}

interface ConversionFunnelProps {
    steps: FunnelStep[];
}

export default function ConversionFunnel({ steps }: ConversionFunnelProps) {
    if (!steps || steps.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-stone-500">No funnel data available</p>
            </div>
        );
    }

    const maxValue = Math.max(...steps.map(s => s.value));

    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
                const dropOff = index > 0
                    ? ((steps[index - 1].value - step.value) / steps[index - 1].value) * 100
                    : 0;

                return (
                    <div key={step.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-stone-900">{step.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-stone-600">{step.value.toLocaleString()}</span>
                                {index > 0 && dropOff > 0 && (
                                    <span className="flex items-center gap-1 text-red-600 text-xs">
                                        <TrendingDown className="w-3 h-3" />
                                        {dropOff.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="relative h-12 bg-stone-100 rounded-lg overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 flex items-center justify-center text-white font-medium text-sm transition-all duration-500"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: step.color,
                                    minWidth: step.value > 0 ? '60px' : '0',
                                }}
                            >
                                {percentage > 15 && `${percentage.toFixed(0)}%`}
                            </div>
                            {percentage <= 15 && percentage > 0 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 text-sm font-medium">
                                    {percentage.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
