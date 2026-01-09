'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { AlertTriangle, Droplets, Info } from 'lucide-react';

interface WasteAnalysisProps {
    data: any[];
}

export default function WasteAnalysis({ data }: WasteAnalysisProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm text-center">
                <p className="text-xs font-medium text-[#8B7E66] italic">Belum ada data kebocoran (waste) yang terdeteksi bulan ini. ✨</p>
            </div>
        );
    }

    const chartData = data.map(w => ({
        name: w.name,
        Waste: Math.round(w.waste),
        'Actual Usage': w.actual,
        'Expected Usage': w.expected,
        percentage: w.wastePercentage
    }));

    return (
        <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#2D3A2D]">Analisis Kebocoran (Waste)</h3>
                    </div>
                    <p className="text-xs text-[#8B7E66] font-medium">Deteksi selisih antara stok keluar vs kebutuhan resep asli.</p>
                </div>
                <div className="px-6 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase">Perhatian Khusus</p>
                    <p className="text-sm font-black text-[#2D3A2D]">{data[0].name} ({Math.round(data[0].wastePercentage)}% Waste)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F0EFEA" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#2D3A2D' }}
                                width={120}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="Waste" radius={[0, 10, 10, 0]} barSize={20}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.percentage > 10 ? '#F43F5E' : '#FB923C'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Detail Kebocoran</h4>
                    <div className="space-y-3">
                        {data.slice(0, 5).map((w, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-black text-[#2D3A2D]">{w.name}</p>
                                    <p className="text-[10px] font-black text-rose-500">+{Math.round(w.wastePercentage)}%</p>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-[#8B7E66] uppercase">
                                    <span>Resep: {w.expected.toFixed(1)} {w.unit}</span>
                                    <span>Asli: {w.actual.toFixed(1)} {w.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                            Tips AI: Waste di atas 5% biasanya disebabkan oleh porsi yang tidak standar atau bahan yang rusak sebelum dimasak.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
