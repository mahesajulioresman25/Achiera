'use client';

import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface SmartAdvisoryProps {
    intelligence: any;
}

export default function SmartAdvisory({ intelligence }: SmartAdvisoryProps) {
    const { rhythm, anticipations } = intelligence || {};
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Derived insights
    const criticalStock = anticipations?.underBufferCount || 0;
    const peakTime = rhythm?.peakHour || 'N/A';

    // Dynamic Time Greeting
    const hour = mounted ? new Date().getHours() : 12; // Default to neutral 12 during SSR
    let timeGreeting = "pagi ini";
    if (hour >= 11 && hour < 15) timeGreeting = "siang ini";
    else if (hour >= 15 && hour < 19) timeGreeting = "sore ini";
    else if (hour >= 19 || hour < 4) timeGreeting = "malam ini";

    return (
        <div suppressHydrationWarning className="bg-gradient-to-br from-[#2D3A2D] to-[#1A241A] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-1000"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                {/* Advisor Persona */}
                <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-amber-400 rounded-3xl flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform shadow-xl">
                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                </div>

                {/* Insight Content */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400/80">Proactive Operational Pulse</span>
                        <h2 className="text-2xl font-black text-white italic tracking-tight">
                            "Dapur sedang dalam ritme <span className="text-emerald-400">Optimal</span> {timeGreeting}."
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase">Stock Risk</p>
                                <p className="text-sm font-black text-white">{criticalStock} Produk Tipis</p>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <RefreshCw className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase">Fulfillment Rhythm</p>
                                <p className="text-sm font-black text-white">Peak @ {peakTime}:00</p>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase">Order Velocity</p>
                                <p className="text-sm font-black text-white">Stabil (+4%)</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <button
                                onClick={() => (window as any).openIntel?.()}
                                className="w-full h-full border-2 border-dashed border-white/20 hover:border-emerald-400 hover:bg-emerald-400/10 rounded-2xl p-4 transition-all group/btn"
                            >
                                <p className="text-[10px] font-black text-white/80 uppercase group-hover/btn:text-emerald-400">Dapatkan Rekomendasi</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
