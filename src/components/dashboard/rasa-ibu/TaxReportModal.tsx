'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Landmark, Receipt, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTaxReportAction } from '@/lib/actions/rasa-ibu/finance';

interface TaxReportModalProps {
    brandId: string;
    onClose: () => void;
}

export default function TaxReportModal({ brandId, onClose }: TaxReportModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await getTaxReportAction(brandId);
                if (res.success) {
                    setReport(res.report);
                } else {
                    console.error(res.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [brandId]);

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-md">
                <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Menghitung Pajak...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                            <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Laporan Fiskal</span>
                            <h2 className="text-xl font-black text-[#2D3A2D]">Estimasi Pajak</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-[#2D3A2D] to-[#1A241A] rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-2">Total Estimasi Setoran</p>
                        <h3 className="text-4xl font-black tracking-tight">{currency.format(report?.totalTaxDue || 0)}</h3>
                        <div className="mt-6 flex items-center gap-2 text-[10px] text-gray-400 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                            <AlertCircle className="w-3 h-3 text-emerald-400" />
                            <span>Wajib disetor maksimal tgl 15 bulan berikutnya.</span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-[#8B7E66]" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Rincian Objek Pajak</h4>
                        </div>

                        <div className="space-y-3">
                            {/* Gross Revenue Base */}
                            <div className="flex justify-between items-center p-4 bg-white border border-[#E5E1D8] rounded-2xl">
                                <div>
                                    <p className="text-xs font-bold text-[#2D3A2D]">Dasar Pengenaan Pajak (DPP)</p>
                                    <p className="text-[10px] text-gray-400">Total Omzet Bulan Ini</p>
                                </div>
                                <span className="font-black text-[#2D3A2D]">{currency.format(report?.grossRevenue || 0)}</span>
                            </div>

                            {/* Tax Breakdown */}
                            {report?.liabilities?.map((tax: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-8 bg-rose-500 rounded-full"></div>
                                        <div>
                                            <p className="text-xs font-bold text-rose-900">{tax.type} ({tax.rate}%)</p>
                                            <p className="text-[10px] text-rose-700/60">{tax.description}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-rose-700">{currency.format(tax.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-end">
                    <button
                        onClick={() => toast.info('Fitur Ekspor PDF/CSV akan tersedia di Phase 9.')}
                        className="px-6 py-3 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm text-[#2D3A2D]"
                    >
                        Ekspor Laporan
                    </button>
                </div>
            </div>
        </div>
    );
}
