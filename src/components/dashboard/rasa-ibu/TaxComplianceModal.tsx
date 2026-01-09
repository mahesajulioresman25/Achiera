'use client';

import React, { useState, useEffect } from 'react';
import {
    X, ShieldCheck, Download, Printer, Calendar,
    FileText, Percent, Info, TrendingUp, AlertCircle,
    ArrowRightCircle, CheckCircle2
} from 'lucide-react';
import { getFinancialReportsAction } from '@/lib/actions/rasa-ibu/finance';
import { toast } from 'sonner';

interface TaxComplianceModalProps {
    brandId: string;
    onClose: () => void;
}

const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
});

export default function TaxComplianceModal({ brandId, onClose }: TaxComplianceModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        setIsLoading(true);
        const res = await getFinancialReportsAction(
            brandId,
            'TAX',
            new Date(dateRange.start),
            new Date(dateRange.end)
        );

        if (res.success) {
            setData(res.data);
        } else {
            toast.error('Gagal mengambil data pajak');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId, dateRange]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">

                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Tax Compliance & Reporting</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Kepatuhan Pajak UMKM</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-[#F9F7F2] p-2 rounded-2xl border border-[#E5E1D8]">
                            <Calendar className="w-4 h-4 text-[#8B7E66] ml-2" />
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span className="text-[#8B7E66]">-</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold text-[#2D3A2D] outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                        <button onClick={handlePrint} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                            <Printer className="w-6 h-6 text-slate-400" />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white/50">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Menghitung Kewajiban Pajak...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-12">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[2rem] border border-[#E5E1D8] shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <TrendingUp size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase truncate">Objek Pajak (Bruto)</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-[#2D3A2D]">{currency.format(data.grossRevenue)}</p>
                                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase mt-1">Total Omset Periode Ini</p>
                                    </div>
                                </div>

                                <div className="bg-[#1A241A] p-8 rounded-[2rem] shadow-xl space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="p-3 bg-white/10 text-indigo-400 rounded-2xl">
                                            <Percent size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-400 bg-white/5 px-3 py-1 rounded-full uppercase">PPh Final 0.5%</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-3xl font-black text-white">{currency.format(data.totalTaxDue || 0)}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Pajak Terutang</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2rem] border border-[#E5E1D8] shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">Status Lapor</span>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-[#2D3A2D]">Siap Dilaporkan</p>
                                        <p className="text-[10px] font-bold text-[#8B7E66] uppercase mt-1">SPT Masa PPh 4 ayat 2</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-[#F9F7F2] pb-4">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2D3A2D]">Rincian Perhitungan Pajak</h3>
                                </div>

                                <div className="bg-white border border-[#E5E1D8] rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#F9F7F2]">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8B7E66]">Jenis Pajak</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8B7E66]">Dasar Pengenaan (DPP)</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8B7E66] text-center">Tarif</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8B7E66] text-right">Jumlah Pajak</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F9F7F2]">
                                            {data.liabilities?.map((tax: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="font-black text-[#2D3A2D] text-sm uppercase">{tax.type}</div>
                                                        <div className="text-[9px] font-bold text-[#8B7E66] mt-0.5 uppercase tracking-tighter">{tax.description}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-[#2D3A2D]">{currency.format(tax.base)}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{tax.rate}%</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-indigo-600">{currency.format(tax.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Compliance Roadmap */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-900">
                                        <Info size={14} />
                                        Informasi Regulasi UMKM
                                    </h4>
                                    <div className="space-y-4">
                                        <p className="text-xs text-indigo-900/70 leading-relaxed italic">
                                            "Berdasarkan PP No. 55 Tahun 2022, UMKM dengan omzet di bawah Rp 500 Juta per tahun (Wajib Pajak Orang Pribadi) tidak dikenai pajak. Namun untuk badan usaha, tarif 0.5% berlaku dari omset pertama."
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600">
                                            <ArrowRightCircle size={14} />
                                            PELAJARI ATURAN TERBALU
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-900">
                                        <AlertCircle size={14} />
                                        Batas Waktu Penyetoran
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-rose-100">
                                            <div>
                                                <p className="text-[10px] font-black text-rose-900 uppercase">Penyetoran PPh 4(2)</p>
                                                <p className="text-xs font-bold text-[#8B7E66]">Maks. Tanggal 15 bulan berikutnya</p>
                                            </div>
                                            <div className="text-rose-600 font-black">H-12</div>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-rose-100">
                                            <div>
                                                <p className="text-[10px] font-black text-rose-900 uppercase">Pelaporan SPT Masa</p>
                                                <p className="text-xs font-bold text-[#8B7E66]">Maks. Tanggal 20 bulan berikutnya</p>
                                            </div>
                                            <div className="text-rose-600 font-black">H-17</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 grayscale opacity-40">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">Tidak ada data untuk periode ini</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-between items-center print:hidden">
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-colors">
                        Tutup Panel
                    </button>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-white border border-[#E5E1D8] text-[#2D3A2D] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                            <Download className="w-4 h-4" />
                            Ekspor CSV
                        </button>
                        <button className="px-10 py-4 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/20">
                            <Download className="w-4 h-4 text-indigo-400" />
                            Download Bukti Potong
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
