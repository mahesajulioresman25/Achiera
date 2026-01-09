'use client';

import React, { useEffect, useState } from 'react';
import { getBusinessAnalysis } from '@/lib/actions/rasa-ibu/intelligence';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import { BrainCircuit, LineChart, Target, Zap, ArrowLeft, AlertTriangle } from 'lucide-react';
import BundleAdvisor from './intelligence/BundleAdvisor';
import CustomerSegmentation from './intelligence/CustomerSegmentation';
import PromoPerformance from './intelligence/PromoPerformance';
import WasteAnalysis from './intelligence/WasteAnalysis';
import ProcurementForecast from './intelligence/ProcurementForecast';
import IntelligenceConfig from './intelligence/IntelligenceConfig';
import LTVForecast from './intelligence/LTVForecast';
import ProductionPlan from './intelligence/ProductionPlan';
import WhatsAppBroadcast from './intelligence/WhatsAppBroadcast';
import WhatsAppConnector from './intelligence/WhatsAppConnector';
import LoyaltyProgramDashboard from './intelligence/LoyaltyProgramDashboard';
import MarketplaceTracker from './intelligence/MarketplaceTracker';

interface IntelligenceHubProps {
    brandId: string;
    onClose: () => void;
}

export default function IntelligenceHub({ brandId, onClose }: IntelligenceHubProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getBusinessAnalysis(brandId);
            if (res.success) {
                setAnalysis(res.data);
            } else {
                setError(res.error || 'Terjadi kesalahan saat memuat data.');
            }
        } catch (e: any) {
            setError(e.message || 'Gagal terhubung ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const trendChartData = (analysis?.dailyTrend || []).map((d: any, idx: number) => {
        const date = new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const prev = analysis.comparisonTrend?.[idx]?.amount || 0;
        return {
            date,
            'Bulan Ini': d.amount,
            'Bulan Lalu': prev
        };
    });

    const paretoChartData = (analysis?.pareto || []).map((p: any) => ({
        name: p.name,
        Revenue: p.revenue,
        Margin: p.margin,
        Profit: p.profit,
        Quantity: p.quantity
    }));

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20">
            {/* Header & Control */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Kembali ke OPS</span>
                    </button>
                    <h2 className="text-2xl md:text-4xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                        <span className="text-indigo-600 bg-indigo-100 p-2 rounded-2xl shadow-inner inline-flex items-center justify-center">🧠</span>
                        Intelligence <span className="text-indigo-600">Decision Hub</span>
                    </h2>
                    <p className="text-[#8B7E66] text-xs md:text-sm mt-2 font-medium">Analisis AI & Strategi Pertumbuhan Rasa Ibu</p>
                </div>

                <div className="px-6 py-3 md:py-2.5 bg-white border border-[#E5E1D8] rounded-2xl shadow-sm text-center md:text-left">
                    <p className="text-[8px] font-black text-[#8B7E66] uppercase tracking-[0.2em]">Deep Intelligence Engaged</p>
                    <p className="text-xs md:text-sm font-black text-[#2D3A2D]">v3.0_AI_ADVANCED</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <Zap className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Mensintesa Data Operasional...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="p-6 bg-rose-50 rounded-full">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-slate-600 font-medium italic">{error}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pastikan koneksi stabil & data tersedia di sistem.</p>
                        </div>
                        <button
                            onClick={loadData}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : !analysis ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <p className="text-slate-400 font-medium italic">Gagal memuat data analisis. Pastikan transaksi tersedia.</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* 1. Dashboard Row: Promo & Waste (The Strategic Focus) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            <PromoPerformance data={analysis.promo} />
                            <WasteAnalysis data={analysis.waste} />
                        </div>

                        {/* 2. Predictive Row: Procurement */}
                        <ProcurementForecast data={analysis.procurement} />

                        {/* Phase 12: Production Intelligence (Dapur Hari Ini) */}
                        <ProductionPlan brandId={brandId} />

                        {/* NEW: Smart Bundle Advisor */}
                        <BundleAdvisor brandId={brandId} />

                        {/* Phase 1: Customer Loyalty (Retention) */}
                        <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm">
                            <LoyaltyProgramDashboard brandId={brandId} />
                        </div>

                        {/* NEW: WhatsApp Connector & Automation Bridge */}
                        <WhatsAppConnector />

                        {/* Phase 1: WhatsApp Broadcast (Communication) */}
                        <WhatsAppBroadcast brandId={brandId} />

                        {/* Phase 11: RFM Customer Segmentation */}
                        <CustomerSegmentation brandId={brandId} />

                        {/* Phase 11 & Marketplace: Program Performance */}
                        <MarketplaceTracker brandId={brandId} />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* 1. Insights & Predictions */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-white p-10 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-emerald-50 rounded-xl">
                                            <Target className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Temuan Utama</h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Produk Primadona</p>
                                            <p className="text-lg font-black text-[#2D3A2D]">{analysis.pareto?.[0]?.name || '-'}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">Menyumbang revenue tertinggi bulan ini.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-emerald-500">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Volume Pesanan</p>
                                            <p className="text-lg font-black text-[#2D3A2D]">{analysis.totalOrders || 0} Pesanan</p>
                                            <p className="text-[10px] text-slate-400 mt-2">Iterasi dapur berjalan stabil.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Heatmap Peak Hours */}
                                {analysis.heatmap && (
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm overflow-hidden">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-6 flex items-center gap-2">
                                            <Zap size={14} className="text-amber-500" />
                                            Peak Interaction Heatmap
                                        </h3>
                                        <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                                            {analysis.heatmap.map((dayRow: number[], dIdx: number) => (
                                                dayRow.map((count: number, hIdx: number) => {
                                                    const intensity = Math.min(count * 25, 100);
                                                    return (
                                                        <div
                                                            key={`${dIdx}-${hIdx}`}
                                                            className="aspect-square rounded-[1px] transition-all hover:scale-150 hover:z-10 cursor-pointer"
                                                            style={{ backgroundColor: count > 0 ? `rgba(79, 70, 229, ${intensity / 100})` : '#F9F7F2' }}
                                                            title={`Hari ${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dIdx]}, Jam ${hIdx}:00: ${count} order`}
                                                        ></div>
                                                    );
                                                })
                                            ))}
                                        </div>
                                        <div className="mt-4 flex justify-between text-[7px] font-black text-[#8B7E66] uppercase tracking-tighter opacity-50">
                                            <span>00:00</span>
                                            <span>Malam</span>
                                            <span>Pagi</span>
                                            <span>Siang</span>
                                            <span>18:00</span>
                                            <span>23:59</span>
                                        </div>
                                        <p className="text-[9px] text-indigo-600 font-bold mt-4 italic">
                                            "Bunda paling sibuk di hari {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][analysis.heatmap.map((d: any[]) => d.reduce((a: any, b: any) => a + b, 0)).indexOf(Math.max(...analysis.heatmap.map((d: any[]) => d.reduce((a: any, b: any) => a + b, 0))))]}."
                                        </p>
                                    </div>
                                )}

                                <div className="bg-[#2D3A2D] p-10 rounded-[2.5rem] text-[#FDFBF7] shadow-xl">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B2BCA2] mb-6">Rekomendasi Strategis</h3>
                                    <p className="text-sm font-medium leading-relaxed opacity-80 italic">
                                        "{analysis.pareto?.[0] ? `Pertahankan stok bumbu untuk ${analysis.pareto[0].name}. Tren menunjukkan peningkatan minat pada akhir pekan.` : 'Gunakan data transaksi untuk melihat pola penjualan produk Anda.'}"
                                    </p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="lg:col-span-8 space-y-12">
                                <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <LineChart className="w-5 h-5 text-[#8B7E66]" />
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Strategi Omzet vs Periode Sebelumnya</h3>
                                        </div>
                                    </div>
                                    <div className="h-[300px]">
                                        <AnalyticsChart
                                            data={trendChartData}
                                            type="area"
                                            dataKeys={[
                                                { key: 'Bulan Ini', name: 'Bulan Ini', color: '#2D3A2D' },
                                                { key: 'Bulan Lalu', name: 'Periode Sebelumnya', color: '#B2BCA2' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Target className="w-4 h-4 text-[#8B7E66]" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Matriks Pareto (Profitabilitas Produk)</h3>
                                        </div>
                                    </div>
                                    <div className="h-[300px]">
                                        <AnalyticsChart
                                            data={paretoChartData}
                                            type="bar"
                                            dataKeys={[
                                                { key: 'Revenue', name: 'Revenue', color: '#B2BCA2' },
                                                { key: 'Profit', name: 'Estimasi Profit', color: '#2D3A2D' }
                                            ]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {analysis.pareto?.slice(0, 4).map((p: any, i: number) => (
                                            <div key={i} className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8]">
                                                <p className="text-[8px] font-black uppercase text-[#8B7E66] truncate">{p.name}</p>
                                                <p className="text-sm font-black text-[#2D3A2D]">{Math.round(p.margin)}% Margin</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Brand Configuration Section */}
                        <IntelligenceConfig brandId={brandId} />
                    </div>
                )}
                <div className="pt-10 border-t border-[#E5E1D8] text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Intelligence Engine v3.0 • Data tersinkronisasi otomatis dengan Buku Besar
                    </p>
                </div>
            </div>
        </div>
    );
}
