'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Zap, AlertTriangle, ShieldCheck, Database, Server, RefreshCw, X, Fingerprint } from 'lucide-react';

interface SecurityPulseProps {
    brandId: string;
    onClose: () => void;
}

export default function SecurityPulse({ brandId, onClose }: SecurityPulseProps) {
    const [pulse, setPulse] = useState(85); // 0-100 health
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        // Simulate real-time security analysis
        const timer = setTimeout(() => {
            setIsAnalyzing(false);
            setAlerts([
                { id: 1, type: 'HEALTH', msg: 'Database latency stable at 12ms', status: 'GOOD' },
                { id: 2, type: 'SECURITY', msg: 'Zero unauthorized access attempts detected in 24h', status: 'SECURE' },
                { id: 3, type: 'ANOMALY', msg: 'Order cancellation-to-paid ratio: 2.1% (Healthy)', status: 'NORMAL' },
            ]);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Simulated "Heartbeat" flicker
    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(prev => 85 + Math.floor(Math.random() * 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/70 backdrop-blur-md p-6">
            <div className="bg-[#1A241A] w-full max-w-4xl h-[80vh] rounded-[3.5rem] shadow-2xl border border-emerald-900/30 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Cyber Header */}
                <div className="px-12 py-10 bg-gradient-to-b from-[#1F291F] to-[#1A241A] border-b border-emerald-900/20 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                                <Shield className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">System Integrity 2.0</span>
                                <span className="px-2 py-0.5 bg-emerald-500 text-[#1A241A] text-[8px] font-black rounded-full">ENCRYPTED</span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic">ACHIERA SECURITY PULSE</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-full transition-all text-white/30">
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Cyber Grid Content */}
                <div className="flex-1 overflow-y-auto p-12 space-y-12">

                    {/* Top Stats: The Pulse */}
                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-2 p-8 bg-black/20 rounded-[2.5rem] border border-emerald-900/10 flex items-center justify-between relative overflow-hidden">
                            <div className="space-y-4 relative z-10">
                                <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.3em]">System Vitality Index</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-7xl font-black text-white tracking-tighter">{pulse}%</span>
                                    <span className="text-emerald-500 font-black uppercase tracking-widest text-xs">Optimum</span>
                                </div>
                                <p className="text-xs text-white/40 max-w-[300px] leading-relaxed">
                                    Infrastruktur server dan database berjalan stabil tanpa gangguan anomali terdeteksi.
                                </p>
                            </div>
                            <div className="w-48 h-24 relative flex items-center justify-center">
                                {/* Heartbeat SVG */}
                                <svg className="w-full h-full text-emerald-500" viewBox="0 0 200 100">
                                    <path
                                        d="M0,50 L40,50 L50,10 L60,90 L70,50 L110,50 L120,40 L130,60 L140,50 L200,50"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="animate-pulse"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 flex flex-col justify-center items-center text-center gap-4">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-white uppercase tracking-widest">Anti-Fraud</p>
                                <p className="text-[10px] text-emerald-500 font-black animate-pulse">AKTIF & MELINDUNGI</p>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Status */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-2">Hardware & Database Health</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-5">
                                <Database className="w-6 h-6 text-blue-400" />
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase">DB Cluster</p>
                                    <p className="text-sm font-black text-white">Cloud MySQL v8.0</p>
                                    <p className="text-[10px] text-blue-400 font-bold tracking-widest">LATENCY: 12ms</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-5">
                                <Server className="w-6 h-6 text-purple-400" />
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase">Server Edge</p>
                                    <p className="text-sm font-black text-white">Next.js v15 Node</p>
                                    <p className="text-[10px] text-purple-400 font-bold tracking-widest">CPU: 4.2%</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-5">
                                <Zap className="w-6 h-6 text-amber-400" />
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase">Memory Load</p>
                                    <p className="text-sm font-black text-white">Edge Caching</p>
                                    <p className="text-[10px] text-amber-400 font-bold tracking-widest">HIT RATIO: 94%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Logs */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-2">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Audit Trail & Security Logs</h3>
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                                <span className="text-[8px] font-black text-emerald-500 uppercase">Live Scanning</span>
                            </div>
                        </div>
                        <div className="bg-black/30 rounded-[2.5rem] border border-emerald-900/10 overflow-hidden">
                            {isAnalyzing ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Menganalisa Jaringan...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="px-10 py-6 flex items-center justify-between hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">{alert.type}</p>
                                                    <p className="text-sm font-medium text-white/80">{alert.msg}</p>
                                                </div>
                                            </div>
                                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black rounded-full uppercase tracking-[0.2em]">
                                                {alert.status}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="px-10 py-6 flex items-center justify-between opacity-50 grayscale">
                                        <div className="flex items-center gap-6">
                                            <Fingerprint className="w-5 h-5 text-white/40" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">ACCESS LOG</p>
                                                <p className="text-sm font-medium text-white/40 italic">User Mahesa logged in from verified IP [112.xx.xx.xx]</p>
                                            </div>
                                        </div>
                                        <span className="text-[8px] text-white/20 font-black">2 MENIT LALU</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Cyber Footer */}
                <div className="px-12 py-8 bg-gradient-to-t from-black/40 to-transparent border-t border-emerald-900/10 flex justify-between items-center">
                    <p className="text-[9px] text-white/20 font-medium italic">
                        Achiera Pulse™ v2.4.0 • Autonomous Threat Protection Enabled
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Firewall Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">SSL Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
