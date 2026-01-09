
'use client';

import React from 'react';
import { Users, TrendingUp, AlertCircle } from 'lucide-react';
import { WorkforceMetric } from '@/lib/services/WorkforceAnalyticsService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    metrics: WorkforceMetric[];
}

export const WorkforceAnalyticsPanel = ({ metrics }: Props) => {

    // Sort by efficiency for chart
    const data = [...metrics].sort((a, b) => b.revenuePerEmployee - a.revenuePerEmployee);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
                    <p className="font-bold text-slate-900">{label}</p>
                    <p className="text-emerald-600 font-semibold">
                        Rp {payload[0].value.toLocaleString('id-ID')} / employee
                    </p>
                    <p className="text-slate-500 mt-1">
                        Team Size: {payload[0].payload.employeeCount} people
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-200">
                            <Users size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Workforce Productivity</h3>
                            <p className="text-xs text-emerald-700 font-medium mt-0.5">Revenue per Employee Analysis</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 flex-1 min-h-[300px]">
                {metrics.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                        <AlertCircle size={24} className="mb-2 opacity-50" />
                        No workforce data available.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="brandName"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                width={100}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                            <Bar dataKey="revenuePerEmployee" radius={[0, 4, 4, 0]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.efficiencyStatus === 'HIGH' ? '#10b981' : entry.efficiencyStatus === 'MEDIUM' ? '#f59e0b' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-center text-slate-500">
                <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> High
                </div>
                <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Medium
                </div>
                <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Low Interest
                </div>
            </div>
        </div>
    );
};
