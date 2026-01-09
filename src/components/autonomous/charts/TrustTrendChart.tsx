// Trust Trend Chart - Line chart showing trust score over time
// Uses Recharts for visualization

'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrustTrendData {
    trend: Array<{
        date: string;
        trustScore: number;
        ruleAcceptance: number;
        aiAlignment: number;
        stability: number;
        forecastAccuracy: number;
    }>;
}

export function TrustTrendChart({ data }: { data: TrustTrendData }) {
    if (!data || !data.trend || data.trend.length === 0) {
        return <div className="text-center text-gray-500">No trend data available</div>;
    }

    const chartData = data.trend.map(item => ({
        date: new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        'Trust Score': item.trustScore,
        'Rule Acceptance': item.ruleAcceptance,
        'AI Alignment': item.aiAlignment,
        'Stability': item.stability,
        'Forecast Accuracy': item.forecastAccuracy
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="Trust Score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                />
                <Line
                    type="monotone"
                    dataKey="Rule Acceptance"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                />
                <Line
                    type="monotone"
                    dataKey="Stability"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
