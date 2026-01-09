'use client';

import React, { useEffect, useState } from 'react';
import { getLedgerEntriesAction } from '@/lib/actions/rasa-ibu/finance';
import { FileText, X } from 'lucide-react';

interface LedgerModalProps {
    brandId: string;
    onClose: () => void;
}

export default function LedgerModal({ brandId, onClose }: LedgerModalProps) {
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    useEffect(() => {
        const load = async () => {
            const res = await getLedgerEntriesAction(brandId);
            if (res.success) {
                setEntries(res.data);
            }
            setIsLoading(false);
        };
        load();
    }, [brandId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-5xl max-h-[85vh] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-12 py-10 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-50 rounded-2xl">
                            <FileText className="w-8 h-8 text-[#8B7E66]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Executive Transparency</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">Buku Besar RASA IBU</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-amber-200 border-t-[#8B7E66] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menyusun Catatan...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9F7F2] text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] border-b border-[#E5E1D8]">
                                    <th className="px-8 py-5">Tanggal</th>
                                    <th className="px-8 py-5">Keterangan / Transaksi</th>
                                    <th className="px-8 py-5">Akun Ledger</th>
                                    <th className="px-8 py-5 text-right">Debit (+)</th>
                                    <th className="px-8 py-5 text-right">Kredit (-)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F9F7F2]">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-white transition-colors group">
                                        <td className="px-8 py-6 text-[11px] font-medium text-slate-400">
                                            {new Date(entry.transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-[#1A241A]">{entry.transaction.description}</p>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-tighter">REF: {entry.transaction.reference || 'SYSTEM'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-bold text-[#8B7E66] px-3 py-1 bg-amber-50 rounded-lg">
                                                {entry.account.name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-emerald-600 text-xs">
                                            {entry.debit > 0 ? currency.format(entry.debit) : '-'}
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-red-400 text-xs">
                                            {entry.credit > 0 ? currency.format(entry.credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic text-xs">
                                            Belum ada catatan transaksi yang terdaftar di buku besar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-12 py-8 bg-white border-t border-[#E5E1D8] flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Otoritas: Owner Persona</span>
                    <span>Neraca Terakhir: {new Date().toLocaleDateString('id-ID')}</span>
                </div>
            </div>
        </div>
    );
}
