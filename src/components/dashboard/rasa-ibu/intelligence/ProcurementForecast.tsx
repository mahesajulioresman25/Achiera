'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { ShoppingCart, Calendar, ArrowRight, Zap } from 'lucide-react';

interface ProcurementForecastProps {
    data: any[];
}

export default function ProcurementForecast({ data }: ProcurementForecastProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#1A241A] p-12 rounded-[3rem] text-white shadow-2xl space-y-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                <div className="p-4 bg-white/5 rounded-full border border-white/10 relative z-10">
                    <ShoppingCart className="w-10 h-10 text-indigo-400 opacity-40" />
                </div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">Prediksi Stok 7 Hari Ke Depan</h3>
                    <p className="text-xs text-white/40 font-medium italic max-w-md mx-auto">AI sedang mengumpulkan data penggunaan bahan baku Bunda. Prediksi akan muncul setelah sistem mendeteksi pola penggunaan stok dalam beberapa hari terakhir. 🛒</p>
                </div>
            </div>
        );
    }

    const chartData = data.slice(0, 6).map(p => ({
        name: p.material,
        Need: Math.ceil(p.predicted7DayNeed),
        unit: p.unit,
        confidence: p.confidence
    }));

    return (
        <div className="bg-[#1A241A] p-10 rounded-[3rem] text-white shadow-2xl space-y-10 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <ShoppingCart className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">Prediksi Stok 7 Hari Ke Depan</h3>
                    </div>
                    <p className="text-xs text-white/60 font-medium">Berdasarkan rata-rata penggunaan 14 hari terakhir + buffer 10%.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <p className="text-xs font-black uppercase tracking-widest">Periode: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1A241A', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ color: '#818CF8' }}
                            />
                            <Bar dataKey="Need" name="Prediksi Butuh" fill="#6366F1" radius={[12, 12, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fillOpacity={entry.confidence === 'HIGH' ? 1 : 0.6} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Daftar Belanja Rekomendasi AI</h4>
                    <div className="space-y-3">
                        {data.slice(0, 4).map((p, i) => (
                            <div key={i} className="group p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                            <Zap className={`w-4 h-4 ${p.confidence === 'HIGH' ? 'text-indigo-400' : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{p.material}</p>
                                            <p className="text-[9px] font-bold text-white/40 uppercase">Rerata {p.avgDailyUsage.toFixed(1)} {p.unit} / hari</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-indigo-400">{Math.ceil(p.predicted7DayNeed)} {p.unit}</p>
                                        <ArrowRight className="w-3 h-3 text-white/20 ml-auto mt-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40">
                        Buat Draft Purchase Order
                    </button>
                </div>
            </div>
        </div>
    );
}
