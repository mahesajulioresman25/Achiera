'use client';

import React, { useState } from 'react';
import { adjustStock } from '@/lib/actions/rasa-ibu/stock';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function StockAuditHub({ products, onClose }: { products: any[]; onClose: () => void }) {
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [adjustment, setAdjustment] = useState(0);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const variants = products.flatMap(p => (p.variants || []).map((v: any) => ({
        ...v,
        productName: p.name
    })));

    const selectedVariant = variants.find(v => v.id === selectedVariantId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVariantId || adjustment === 0) return;

        setIsSubmitting(true);
        const res = await adjustStock({
            variantId: selectedVariantId,
            adjustment,
            reason: reason || 'Audit Rutin Dapur',
            type: adjustment > 0 ? 'IN' : 'ADJUSTMENT',
            operatorId: 'SYSTEM_AUDIT'
        });

        if (res.success) {
            onClose();
        } else {
            toast.error(`Error: ${res.error}`);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-sm p-6">
            <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Pantry Audit</span>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Audit Stok Dapur</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Varian Produk</label>
                        <select
                            required
                            value={selectedVariantId}
                            onChange={(e) => setSelectedVariantId(e.target.value)}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none"
                        >
                            <option value="">Pilih...</option>
                            {variants.map(v => (
                                <option key={v.id} value={v.id}>{v.productName} - {v.name} (Sisa: {v.stockOnHand})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penyesuaian (+/-)</label>
                            <input
                                type="number"
                                required
                                value={adjustment}
                                onChange={(e) => setAdjustment(parseInt(e.target.value))}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm"
                                placeholder="E.g. -5 atau 10"
                            />
                        </div>
                        <div className="flex items-end pb-3">
                            {selectedVariant && (
                                <div className="text-right w-full">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Stok Baru</p>
                                    <p className="text-lg font-black text-[#2D3A2D]">{selectedVariant.stockOnHand + adjustment}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alasan Perubahan</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm h-24 focus:outline-none"
                            placeholder="Contoh: Diterima dari supplier atau Rusak saat pengiriman"
                        />
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                        <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Batal
                        </button>
                        <button
                            disabled={isSubmitting || adjustment === 0 || !selectedVariantId}
                            type="submit"
                            className={`px-10 py-4 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${isSubmitting || adjustment === 0 || !selectedVariantId ? 'opacity-30' : 'hover:scale-105 active:scale-95'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Update Stok'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
