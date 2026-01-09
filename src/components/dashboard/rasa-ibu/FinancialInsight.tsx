'use client';

import React from 'react';
import type { FinancialPulse } from '@/lib/intelligence/financeEngine';
import { DollarSign, PieChart, ShieldCheck, ArrowRight, Info } from 'lucide-react';

interface FinancialInsightProps {
    pulse?: FinancialPulse;
    onOpenLedger: () => void;
    onOpenReports: () => void;
    onOpenReconciliation: () => void;
    onOpenAccountManager: () => void;
}

export default function FinancialInsight({ pulse, onOpenLedger, onOpenReports, onOpenReconciliation, onOpenAccountManager }: FinancialInsightProps) {
    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    if (!pulse) {
        return (
            <div className="p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] shadow-xl animate-pulse">
                <div className="h-20 bg-gray-50 rounded-2xl mb-8"></div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-50 rounded-[2.5rem]"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-[#2D3A2D] to-[#1A241A] p-8 rounded-[2.5rem] text-[#FDFBF7] shadow-2xl group hover:scale-[1.02] transition-all relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B2BCA2] mb-2 opacity-80">Omzet Hari Ini</p>
                    <h3 className="text-3xl font-black tracking-tight">{currency.format(pulse.dailyRevenue || 0)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Pulse
                    </div>
                </div>

                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66] mb-2">Total Omzet (Bruto)</p>
                    <h3 className="text-3xl font-black tracking-tight text-[#1A241A]">{currency.format(pulse.monthlyRevenue || 0)}</h3>
                </div>

                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-2">Total HPP (Modal)</p>
                    <h3 className="text-3xl font-black tracking-tight text-[#1A241A]">{currency.format(pulse.monthlyCOGS || 0)}</h3>
                </div>

                <div className="bg-[#2D3A2D] p-8 rounded-[2.5rem] shadow-2xl group hover:scale-[1.02] transition-all relative overflow-hidden border-2 border-emerald-500/30">
                    <div className="absolute top-0 right-0 p-4">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-50" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Laba Bersih (Estimasi)</p>
                    <h3 className="text-3xl font-black tracking-tight text-white">{currency.format(pulse.monthlyNetProfit || 0)}</h3>
                    <div className="mt-2 text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full inline-block">
                        Margin: {(pulse.monthlyRevenue || 0) > 0 ? Math.round(((pulse.monthlyNetProfit || 0) / pulse.monthlyRevenue) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* 2. Channel Split & Payment Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Channel Breakdown */}
                <div className="bg-white border border-[#E5E1D8] p-12 rounded-[3.5rem] shadow-xl flex flex-col justify-between group">
                    <div>
                        <div className="flex justify-between items-center mb-12">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66]">Marketplace Distribution</h4>
                            <div className="h-px flex-1 mx-8 bg-[#F9F7F2]"></div>
                        </div>
                        <div className="space-y-8">
                            {(pulse.channelBreakdown || []).map((item: any, idx: number) => (
                                <div key={item.channel} className="space-y-3 group/item">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[#1A241A]">{item.channel}</span>
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{item.percentage}%</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-[#1A241A]">{currency.format(item.grossAmount)}</p>
                                            <p className="text-[9px] font-bold text-[#8B7E66]">Net: {currency.format(item.netAmount)}</p>
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-full bg-[#F9F7F2] rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#2D3A2D] to-stone-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${item.percentage}%`, transitionDelay: `${idx * 150}ms` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-[#F9F7F2]">
                        <button
                            onClick={onOpenReports}
                            className="w-full group flex justify-between items-center p-8 bg-[#FDFBF7] border border-[#E5E1D8] rounded-[2rem] hover:bg-[#2D3A2D] hover:text-[#FDFBF7] transition-all duration-500 shadow-sm"
                        >
                            <span className="text-xs font-black uppercase tracking-widest">Executive Dashboard & Reports</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Realized vs Pending */}
                <div className="bg-white border border-[#E5E1D8] p-12 rounded-[3.5rem] shadow-xl flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>
                    <div>
                        <div className="flex justify-between items-center mb-12 relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B7E66]">Cash Health Indicator</h4>
                            <div className="h-px flex-1 mx-8 bg-[#F9F7F2]"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-5">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-full inline-block border border-emerald-100">Realized Cash</span>
                                <p className="text-4xl font-black text-[#2D3A2D] tracking-tight">{currency.format(pulse.paymentHealth?.realized || 0)}</p>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-widest">Dana Terverifikasi</p>
                            </div>
                            <div className="space-y-5">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-4 py-2 rounded-full inline-block border border-amber-100">Pending / Due</span>
                                <p className="text-4xl font-black text-[#2D3A2D] tracking-tight">{currency.format(pulse.paymentHealth?.pending || 0)}</p>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-widest">Menunggu Konfirmasi</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-[#F9F7F2] space-y-5 relative z-10">
                        <button
                            onClick={onOpenReconciliation}
                            className="w-full group flex justify-between items-center p-8 bg-emerald-600 text-white rounded-[2rem] hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Payment Reconciliation</span>
                            </div>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                        </button>

                        <button
                            onClick={onOpenLedger}
                            className="w-full group flex justify-between items-center p-8 bg-[#F9F7F2] border border-[#E5E1D8] text-[#2D3A2D] rounded-[2rem] hover:bg-[#2D3A2D] hover:text-white transition-all duration-500 shadow-sm"
                        >
                            <span className="text-xs font-black uppercase tracking-widest">Buku Besar Dapur (Ledger)</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                        </button>

                        <button
                            onClick={onOpenAccountManager}
                            className="w-full group flex justify-between items-center p-8 bg-white border border-indigo-100 text-indigo-600 rounded-[2rem] hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-sm"
                        >
                            <span className="text-xs font-black uppercase tracking-widest text-inherit">Atur Chart of Accounts</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
