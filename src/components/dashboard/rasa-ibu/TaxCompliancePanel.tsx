'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, PieChart, TrendingUp, DollarSign, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TaxCompliancePanelProps {
    brandId: string;
    onClose: () => void;
}

export default function TaxCompliancePanel({ brandId, onClose }: TaxCompliancePanelProps) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isExporting, setIsExporting] = useState(false);

    // Mock calculations (would normally come from financeEngine)
    const grossRevenue = 125000000;
    const ppnRate = 0.11;
    const ppnAmount = grossRevenue * ppnRate;
    const estimatedPPh = grossRevenue * 0.005; // Final PPh for MSME

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Tanggal,No Nota,Pelanggan,Total,PPN (11%),Net\n"
                + "2026-01-01,INV-001,Bunda Ani,150000,16500,133500\n"
                + "2026-01-02,INV-002,Bunda Budi,200000,22000,178000";

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Laporan_Pajak_RI_${year}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsExporting(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-[#E5E1D8] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <FileText className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Tax Automation</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Kepatuhan Pajak (PPN/PPh)</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-10 space-y-8">

                    {/* Select Period */}
                    <div className="p-6 bg-[#F5F2EA] rounded-[2rem] border border-[#E5E1D8] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-[#8B7E66]" />
                            <span className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">Periode Laporan</span>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-emerald-500"
                            >
                                <option value={1}>Januari</option>
                                <option value={12}>Desember</option>
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-emerald-500"
                            >
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                            </select>
                        </div>
                    </div>

                    {/* Tax Breakdown Cards */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white rounded-[2rem] border border-[#E5E1D8] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <PieChart className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PPN (11%)</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-[#2D3A2D]">Rp {ppnAmount.toLocaleString('id-ID')}</p>
                                <p className="text-[9px] text-[#8B7E66] font-medium italic">Berdasarkan Omzet Kotor</p>
                            </div>
                        </div>
                        <div className="p-6 bg-white rounded-[2rem] border border-[#E5E1D8] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PPh Final (0.5%)</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-[#2D3A2D]">Rp {estimatedPPh.toLocaleString('id-ID')}</p>
                                <p className="text-[9px] text-[#8B7E66] font-medium italic">Estimasi PPh UMKM</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-8 bg-emerald-900 text-[#FDFBF7] rounded-[2.5rem] shadow-xl shadow-emerald-900/10 flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                < DollarSign className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Omzet Periode</span>
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter">Rp {grossRevenue.toLocaleString('id-ID')}</h3>
                        </div>
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 opacity-20" />
                    </div>

                    {/* Export Action */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-6 bg-white border-2 border-emerald-600 text-emerald-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-emerald-600 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        Download Data Laporan Pajak (.csv)
                    </button>

                </div>

                {/* Notice Footer */}
                <div className="px-10 py-6 bg-amber-50 border-t border-amber-100 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[9px] text-amber-700 font-medium leading-relaxed italic">
                        *Laporan ini bersifat membantu rekapitulasi. Pastikan untuk selalu berkonsultasi dengan akuntan atau konsultan pajak Bunda untuk validasi akhir sebelum pelaporan resmi (DJP).
                    </p>
                </div>
            </div>
        </div>
    );
}
