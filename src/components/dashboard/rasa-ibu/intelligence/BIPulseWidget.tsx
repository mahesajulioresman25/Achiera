'use client';

import React, { useEffect, useState } from 'react';
import {
    Zap,
    AlertTriangle,
    TrendingUp,
    Star,
    ChevronRight,
    BrainCircuit,
    Activity,
    Target,
    ShieldCheck
} from 'lucide-react';
import { getBIPulse } from '@/lib/actions/rasa-ibu/biPulse';

interface BIPulseWidgetProps {
    brandId: string;
    onOpenForecast: () => void;
    onOpenPricing: () => void;
    onOpenLoyalty: () => void;
}

export default function BIPulseWidget({ brandId, onOpenForecast, onOpenPricing, onOpenLoyalty }: BIPulseWidgetProps) {
    const [pulse, setPulse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPulse = async () => {
            const res = await getBIPulse(brandId);
            if (res.success) setPulse(res.data);
            setIsLoading(false);
        };
        loadPulse();

        // Refresh every 5 minutes
        const interval = setInterval(loadPulse, 300000);
        return () => clearInterval(interval);
    }, [brandId]);

    if (isLoading && !pulse) return (
        <div className="animate-pulse bg-white/40 h-20 rounded-[2rem] border border-white/20 backdrop-blur-sm"></div>
    );

    if (!pulse) return null;

    const hasUrgentIssues = (pulse.alerts?.critical || 0) > 0 || (pulse.pricing?.recommendationsCount || 0) > 0;

    return (
        <div className={`p-4 md:p-6 rounded-[2.5rem] border transition-all duration-700 backdrop-blur-md ${hasUrgentIssues
            ? 'bg-gradient-to-r from-red-50/80 via-white to-orange-50/80 border-orange-200 shadow-xl shadow-orange-500/5'
            : 'bg-white/80 border-gray-100 shadow-lg shadow-gray-200/50'
            }`}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* AI Brain Status */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={`p-3.5 rounded-2xl relative ${hasUrgentIssues ? 'bg-orange-500 animate-pulse' : 'bg-[#2D3A2D]'}`}>
                        <BrainCircuit className="w-6 h-6 text-white" />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 border-[3px] border-white rounded-full"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-[#1A241A] tracking-tight">Achiera AI</h3>
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        </div>
                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">System Health: Optimal</p>
                    </div>
                </div>

                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 px-8 py-2 md:py-0 border-y md:border-y-0 md:border-x border-gray-100/60 w-full lg:w-auto">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Stock Alerts</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black ${(pulse.alerts?.critical || 0) > 0 ? 'text-red-500' : 'text-[#2D3A2D]'}`}>
                                {pulse.alerts?.total || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">active</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Price Opps</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#2D3A2D]">{pulse.pricing?.recommendationsCount || 0}</span>
                            <span className="text-[10px] font-bold text-amber-500">units</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Engagement</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#2D3A2D]">{pulse.loyalty?.activeRatio || 0}%</span>
                            <Target className="w-3 h-3 text-indigo-400" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">AI Accuracy</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-green-600">{pulse.accuracy || 0}%</span>
                            <ShieldCheck className="w-3 h-3 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions Integration */}
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 min-w-[280px]">
                    <button
                        onClick={onOpenForecast}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black transition-all ${(pulse.alerts?.critical || 0) > 0
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200'
                            : 'bg-[#F9F7F2] text-[#2D3A2D] hover:bg-white border border-[#E5E1D8]'
                            }`}
                    >
                        <AlertTriangle className={`w-3.5 h-3.5 ${(pulse.alerts?.critical || 0) > 0 ? 'animate-bounce' : ''}`} />
                        FORECASTS
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>

                    <button
                        onClick={onOpenPricing}
                        className="group flex items-center gap-2 px-4 py-2 bg-[#F9F7F2] text-[#2D3A2D] border border-[#E5E1D8] rounded-2xl text-[11px] font-black hover:bg-white hover:shadow-md transition-all"
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                        OPTIMIZE
                    </button>

                    <button
                        onClick={onOpenLoyalty}
                        className="group flex items-center gap-2 px-4 py-2 bg-[#2D3A2D] text-white rounded-2xl text-[11px] font-black hover:bg-black hover:shadow-lg transition-all"
                    >
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        LOYALTY
                    </button>
                </div>
            </div>
        </div>
    );
}
