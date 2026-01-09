'use client';

import React, { useState } from 'react';
import { processIngestion, executeIngestion } from '@/lib/actions/rasa-ibu/ingestion';
import { toast } from 'sonner';

export default function SmartIngestionPanel({ brandId, onClose }: { brandId: string; onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [assignedMappings, setAssignedMappings] = useState<Record<number, string>>({});
    const [isExecuting, setIsExecuting] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const res = await processIngestion(selectedFile.name, content);

            if (res.success && res.data) {
                setResult(res.data);

                // Auto-assign high confidence mappings
                if (res.data.inference?.mappings) {
                    const initial: Record<number, string> = {};
                    res.data.inference.mappings.forEach((m: any) => {
                        if (m.canonicalField && m.confidence > 0.7) {
                            initial[m.sourceColumnIndex] = m.canonicalField;
                        }
                    });
                    setAssignedMappings(initial);
                }
            } else {
                toast.error(res.error || 'Gagal menganalisis file CSV');
                setResult(null);
            }
            setIsProcessing(false);
        };
        reader.readAsText(selectedFile);
    };

    const handleExecute = async () => {
        if (!result) return;
        setIsExecuting(true);
        const csvRows = result.sampleRows; // In a real app, you'd send the full content or stream it
        const res = await executeIngestion(brandId, result.headers, csvRows, assignedMappings as any);
        if (res.success) {
            toast.success(`Berhasil mengimpor ${res.count} pesanan.`);
            onClose();
        } else {
            toast.error(`Gagal: ${res.error}`);
        }
        setIsExecuting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-sm p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Kecerdasan Achiera</span>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Impor Buku Pesanan Cerdas</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                    {!result ? (
                        <div className="border-2 border-dashed border-[#E5E1D8] rounded-3xl p-16 text-center space-y-6 bg-white/50">
                            <div className="w-16 h-16 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <span className="text-2xl">📄</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-[#2D3A2D]">Tarik file CSV (Shopee/Tokopedia) ke sini</p>
                                <p className="text-xs text-slate-400 font-medium italic">Achiera akan menebak kolom secara otomatis.</p>
                            </div>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="inline-block px-8 py-3 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-lg"
                            >
                                {isProcessing ? 'Menganalisis...' : 'Pilih File CSV'}
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Inference Results */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#8B7E66]">Hasil Analisis Achiera</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.headers?.map((header: string, idx: number) => {
                                        const mapping = result.inference?.mappings?.find((m: any) => m.sourceColumnIndex === idx);
                                        const isMapped = !!assignedMappings[idx];
                                        return (
                                            <div key={idx} className={`p-4 rounded-2xl border transition-all ${isMapped ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-mono text-slate-400">Kolom {idx + 1}</span>
                                                    {mapping?.confidence > 0.8 && (
                                                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-md">Yakin ✨</span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-black text-[#2D3A2D] mb-3">{header}</p>
                                                <select
                                                    value={assignedMappings[idx] || ''}
                                                    onChange={(e) => setAssignedMappings({ ...assignedMappings, [idx]: e.target.value })}
                                                    className="w-full text-[10px] font-bold p-2 bg-transparent border-b border-slate-200 focus:outline-none"
                                                >
                                                    <option value="">Abaikan</option>
                                                    <option value="order_id">ID Pesanan (No. Invoice)</option>
                                                    <option value="customer_name">Nama Pelanggan</option>
                                                    <option value="transaction_date">Tanggal</option>
                                                    <option value="total_amount">Total Harga</option>
                                                    <option value="product_name">Nama Produk</option>
                                                    <option value="quantity">Jumlah</option>
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Blocking Issues / Warnings */}
                            {result.inference?.blockingIssues?.length > 0 && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">⚠️ Hal yang Perlu Diperhatikan</p>
                                    <ul className="text-xs text-amber-600 italic space-y-1">
                                        {result.inference.blockingIssues.map((issue: string, i: number) => (
                                            <li key={i}>— {issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-10 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-between items-center">
                    <button onClick={() => setResult(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                        Batal
                    </button>
                    <button
                        disabled={!result || isExecuting}
                        onClick={handleExecute}
                        className={`px-10 py-4 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${(!result || isExecuting) ? 'opacity-30' : 'hover:scale-105 active:scale-95'}`}
                    >
                        {isExecuting ? 'Memproses...' : 'Eksekusi Impor'}
                    </button>
                </div>
            </div>
        </div>
    );
}
