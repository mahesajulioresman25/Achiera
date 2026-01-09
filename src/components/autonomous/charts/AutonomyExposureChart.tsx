// Autonomy Exposure Chart - Bar chart showing execution by level
// Uses Recharts for visualization

'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProgressBar } from '@/components/autonomous/ui/CoreComponents';

interface AutonomyExposureData {
    daily_exposure: {
        financial: number;
        executions: number;
        limit_financial: number;
        limit_executions: number;
        utilization_percent: number;
    };
    by_level: Array<{
        level: 0 | 1 | 2 | 3;
        executions: number;
        financial: number;
        success_rate: number;
    }>;
}

export function AutonomyExposureChart({ data }: { data: AutonomyExposureData }) {
    if (!data || !data.by_level) {
        return <div className="text-center text-gray-500">No data available</div>;
    }

    const levelNames = {
        0: 'Level 0 (Observe)',
        1: 'Level 1 (Suggest)',
        2: 'Level 2 (Assisted)',
        3: 'Level 3 (Guarded)'
    };

    const chartData = data.by_level.map(item => ({
        name: levelNames[item.level],
        executions: item.executions,
        financial: item.financial / 1000000, // Convert to millions
        successRate: item.success_rate * 100
    }));

    return (
        <div>
            {/* Progress bars for each level */}
            <div className="space-y-4 mb-6">
                {data.by_level.map(item => {
                    const maxExecutions = 10; // Assuming max 10 per level
                    const percentage = (item.executions / maxExecutions) * 100;

                    return (
                        <div key={item.level}>
                            <ProgressBar
                                current={item.executions}
                                max={maxExecutions}
                                label={`${levelNames[item.level]}: ${item.executions}/${maxExecutions} executions`}
                                showPercentage={true}
                                color={percentage >= 90 ? 'red' : percentage >= 70 ? 'yellow' : 'green'}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: 'Executions', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Financial (Rp jt)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="executions" fill="#3b82f6" name="Executions" />
                    <Bar yAxisId="right" dataKey="financial" fill="#10b981" name="Financial (Rp jt)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
