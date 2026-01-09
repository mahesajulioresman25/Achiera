'use client';

import React, { useEffect, useState } from 'react';
import { getProductionPlanAction } from '@/lib/actions/rasa-ibu/intelligence';
import { ChefHat, ClipboardList, Clock, AlertCircle, Loader2, MessageSquare, CheckCircle2, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';

interface ProductionPlanProps {
    brandId: string;
}

export default function ProductionPlan({ brandId }: ProductionPlanProps) {
    const [plan, setPlan] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'COOK' | 'GROCERY'>('COOK');

    useEffect(() => {
        async function load() {
            const res = await getProductionPlanAction(brandId);
            if (res.success) {
                setPlan(res.data);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    if (isLoading) {
        return (
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#E5E1D8] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Menyusun Rencana Produksi Dapur...</p>
            </div>
        );
    }

    if (!plan || (plan.cookList.length === 0 && plan.groceryList.length === 0)) {
        return (
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#E5E1D8] text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-black text-[#2D3A2D]">Semua Pesanan Selesai!</h3>
                <p className="text-xs text-slate-400 font-medium italic">Tidak ada antrean masak aktif saat ini.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Aggregated Lists */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[3.5rem] border border-[#E5E1D8] overflow-hidden shadow-xl">
                    <div className="p-10 border-b border-slate-50 bg-indigo-600 text-white flex flex-col gap-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/20 rounded-[1.5rem] backdrop-blur-md">
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Intelligence Hub Dapur</h3>
                                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Sistem Produksi & Inventaris Otomatis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (activeTab === 'COOK') {
                                            const exportData = plan.cookList.map((item: any) => ({
                                                'Menu': item.name,
                                                'Quantity': item.quantity,
                                                'Tiket Pesanan': item.orders,
                                                'Catatan Khusus': item.notes.join('; ') || '-'
                                            }));
                                            exportToCSV(exportData, 'Daftar_Masak_Hari_Ini');
                                        } else {
                                            const exportData = plan.groceryList.map((ing: any) => ({
                                                'Bahan': ing.name,
                                                'Total': ing.total,
                                                'Satuan': ing.unit
                                            }));
                                            exportToCSV(exportData, 'Daftar_Belanja_Hari_Ini');
                                        }
                                    }}
                                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export CSV
                                </button>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Pesanan</p>
                                    <p className="text-3xl font-black">{plan.totalActiveOrders}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-black/10 p-1.5 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('COOK')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COOK' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <ChefHat className="w-3.5 h-3.5" />
                                    Daftar Masak
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('GROCERY')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GROCERY' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    Daftar Belanja
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="p-10 space-y-6">
                        {activeTab === 'COOK' ? (
                            plan.cookList.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                            {item.quantity}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-[#2D3A2D]">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <ClipboardList className="w-3 h-3" />
                                                {item.orders} Tiket Pesanan
                                            </div>
                                        </div>
                                    </div>

                                    {item.notes.length > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 animate-pulse">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="text-[9px] font-black text-amber-700 uppercase">Ada Pesan Khusus</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="space-y-4">
                                {plan.groceryList.length > 0 ? (
                                    plan.groceryList.map((ing: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-6 border border-slate-100 rounded-3xl bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-tight">{ing.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-indigo-600">{ing.total % 1 === 0 ? ing.total : ing.total.toFixed(2)}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ing.unit}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 px-10 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Resep Belum Lengkap</h4>
                                        <p className="text-xs text-slate-400 mt-2 italic">Pastikan "Ingredients" pada produk Bunda sudah diisi dengan format:<br />Nama (Jumlah Satuan), contoh: Ayam (0.25 ekor)</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Notes & Instructions */}
            <div className="space-y-8">
                <div className="bg-[#2D3A2D] p-10 rounded-[3rem] text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Pesan Khusus Pelanggan</h3>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {plan.cookList.flatMap((item: any) => item.notes).length > 0 ? (
                            plan.cookList.flatMap((item: any) => item.notes).map((note: string, idx: number) => (
                                <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/10 italic text-xs leading-relaxed text-slate-300">
                                    "{note}"
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 font-medium text-center py-10">Belum ada catatan khusus dari pelanggan.</p>
                        )}
                    </div>
                </div>

                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4 text-indigo-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Auto-Refresh Active</span>
                    </div>
                    <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                        Data ini disinkronkan secara real-time dengan status pesanan. Setiap pesanan baru akan langsung menambah kuantitas masak di layar ini.
                    </p>
                </div>
            </div>
        </div>
    );
}
