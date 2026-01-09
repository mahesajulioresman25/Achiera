'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Package, Percent, Target } from 'lucide-react';

interface PromoPerformanceProps {
    data: any;
}

export default function PromoPerformance({ data }: PromoPerformanceProps) {
    if (!data || !data.campaigns || data.campaigns.length === 0) {
        return (
            <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-6 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                    <Target className="w-10 h-10 text-slate-300" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2D3A2D]">Analisis Performa Promo</h3>
                    <p className="text-xs text-[#8B7E66] font-medium italic max-w-xs">Belum ada data promo (dual-metric) yang terdeteksi bulan ini. Promo akan muncul otomatis jika Bunda menggunakan tag promo pada pesanan. 🏷️</p>
                </div>
            </div>
        );
    }

    const chartData = data.campaigns.map((c: any) => ({
        tag: c.tag,
        'Revenue (K)': Math.round(c.revenue / 1000),
        'Qty (Pcs)': c.quantity,
        'Uplift Revenue %': Math.round(c.upliftRevenue),
        'Uplift Qty %': Math.round(c.upliftQty)
    }));

    const currency = (val: number) => `Rp${(val / 1000).toFixed(0)}rb`;

    return (
        <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#2D3A2D]">Analisis Performa Promosi</h3>
                    </div>
                    <p className="text-xs text-[#8B7E66] font-medium">Perbandingan Omzet & Volume (Pcs) saat ada Promo vs Normal</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Baseline Avg AOV</p>
                        <p className="text-sm font-black text-[#2D3A2D]">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.baseline.avgAOV)}</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Baseline Avg Qty</p>
                        <p className="text-sm font-black text-[#2D3A2D]">{data.baseline.avgQty.toFixed(1)} Pcs/Order</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Chart 1: Revenue vs Qty Uplift */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Uplift Performa (%)</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA" />
                                <XAxis
                                    dataKey="tag"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#8B7E66' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#8B7E66' }}
                                    unit="%"
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                <Bar dataKey="Uplift Revenue %" name="Kenaikan Omzet" fill="#4F46E5" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="Uplift Qty %" name="Kenaikan Volume (Pcs)" fill="#10B981" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* List Summary */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Top Campaigns</h4>
                    <div className="space-y-3">
                        {data.campaigns.map((c: any, i: number) => (
                            <div key={i} className="p-5 bg-[#F9F7F2] rounded-3xl border border-[#E5E1D8] flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-[#E5E1D8] flex items-center justify-center text-lg font-black text-indigo-600 shadow-sm">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#2D3A2D]">{c.tag}</p>
                                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase">{c.orders} Berhasil Digunakan</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-emerald-600">
                                        <TrendingUp className="w-3 h-3" />
                                        <p className="text-xs font-black">+{Math.round(c.upliftQty)}% Vol</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-[#8B7E66] uppercase">Revenue: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(c.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
