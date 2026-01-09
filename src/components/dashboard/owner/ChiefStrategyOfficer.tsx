
'use client';

import React from 'react';
import { Newspaper, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ExecutiveBriefing } from '@/lib/services/GlobalStrategyService';

interface Props {
    briefing: ExecutiveBriefing;
}

export const ChiefStrategyOfficer = ({ briefing }: Props) => {

    // Fallback if data is missing or error occurred
    if (!briefing) {
        return (
            <div className="bg-slate-900 rounded-xl border border-indigo-500/30 p-6 text-white text-center">
                <p>AI Strategy Officer is offline.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-xl border border-indigo-500/30 overflow-hidden mb-8">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <Newspaper size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Morning Strategy Brief</h2>
                        <p className="text-indigo-200 text-sm">AI Chief Strategy Officer (CSO) • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                        Confidence: HIGH
                    </span>
                </div>
            </div>

            <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Executive Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h3>
                        <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                            "{briefing.summary}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {briefing.brandSpotlights.map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${item.status === 'GOOD' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                item.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-200">{item.brand}</h4>
                                    {item.status === 'GOOD' ? <CheckCircle2 size={16} className="text-emerald-400" /> :
                                        item.status === 'WARNING' ? <AlertTriangle size={16} className="text-amber-400" /> :
                                            <AlertTriangle size={16} className="text-red-400" />}
                                </div>
                                <p className="text-sm text-slate-400">{item.insight}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Unified Strategic Action */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 h-full text-white relative overflow-hidden group hover:shadow-2xl transition-all">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={20} className="text-amber-300 fill-amber-300 animate-pulse" />
                                    <h3 className="font-black uppercase tracking-widest text-sm text-indigo-100">Action of the Day</h3>
                                </div>
                                <p className="text-2xl font-bold leading-tight">
                                    {briefing.strategicAction}
                                </p>
                            </div>

                            <button className="mt-8 w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                                Execute Strategy
                                <Zap size={16} />
                            </button>
                        </div>

                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    </div>
                </div>

            </div>
            <div className="px-8 pb-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest flex justify-between items-center">
                <span>© 2026 Rasa Ibu - Achiera</span>
                <span>Internal Business Intelligence</span>
            </div>
        </div>
    );
};
