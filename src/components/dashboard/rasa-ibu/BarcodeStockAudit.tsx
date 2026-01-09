'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scan, Search, X, Package, ArrowUpRight, ArrowDownRight, RefreshCcw, Check } from 'lucide-react';
import { getStockAction, adjustStock } from '@/lib/actions/rasa-ibu/stock';
import { toast } from 'sonner';

interface BarcodeStockAuditProps {
    brandId: string;
    onClose: () => void;
}

export default function BarcodeStockAudit({ brandId, onClose }: BarcodeStockAuditProps) {
    const [variants, setVariants] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [adjustment, setAdjustment] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadStock = async () => {
            setIsLoading(true);
            const res = await getStockAction(brandId);
            if (res.success) setVariants(res.data);
            setIsLoading(false);
        };
        loadStock();
    }, [brandId]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const found = variants.find(v => v.sku.toLowerCase() === searchQuery.toLowerCase() || v.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (found) {
            setSelectedVariant(found);
            setAdjustment(0);
            setSearchQuery('');
        } else {
            toast.error("Produk tidak ditemukan!");
        }
    };

    const handleAdjust = async () => {
        if (!selectedVariant || adjustment === 0) return;

        setIsSubmitting(true);
        const res = await adjustStock({
            variantId: selectedVariant.id,
            adjustment: adjustment,
            reason: 'Audit Barcode Gudang',
            type: adjustment > 0 ? 'IN' : 'OUT',
            operatorId: 'GUDANG_OP' // Placeholder
        });

        if (res.success) {
            toast.success(`Stok ${selectedVariant.product.name} berhasil diupdate!`);
            // Update local state
            setVariants(prev => prev.map(v => v.id === selectedVariant.id ? { ...v, stockOnHand: v.stockOnHand + adjustment } : v));
            setSelectedVariant(null);
            setAdjustment(0);
            if (inputRef.current) inputRef.current.focus();
        } else {
            toast.error("Gagal update stok: " + res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">

                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-[#E5E1D8] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-50 rounded-2xl">
                            <Scan className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Inventory Audit</span>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Scan Gudang Cepat</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-10 space-y-8">
                    {/* Search / Scan Input */}
                    {!selectedVariant ? (
                        <form onSubmit={handleSearch} className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] text-center">Silakan Scan Barcode atau Ketik Nama Produk</p>
                            <div className="relative group">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SCAN SKU / NAMA PRODUK..."
                                    className="w-full bg-[#F5F2EA] border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[2rem] px-12 py-6 text-center text-xl font-black uppercase tracking-tighter text-[#2D3A2D] transition-all outline-none placeholder:text-slate-300"
                                />
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-300">
                            {/* Selected Product Card */}
                            <div className="p-8 bg-white rounded-[2.5rem] border border-[#E5E1D8] shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                        <Package className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU: {selectedVariant.sku}</p>
                                        <h3 className="text-xl font-black text-[#2D3A2D] uppercase">{selectedVariant.product.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">Stok Saat Ini:</span>
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-[#2D3A2D]">{selectedVariant.stockOnHand} Unit</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedVariant(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                    <RefreshCcw className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Adjustment Controls */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest text-center">Update Stok</p>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setAdjustment(prev => prev - 1)}
                                            className="w-12 h-12 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <span className="text-2xl font-black">-</span>
                                        </button>
                                        <input
                                            type="number"
                                            value={adjustment}
                                            onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                                            className="flex-1 bg-white border-2 border-slate-200 rounded-xl py-3 text-center font-black text-xl outline-none focus:border-blue-500 transition-all"
                                        />
                                        <button
                                            onClick={() => setAdjustment(prev => prev + 1)}
                                            className="w-12 h-12 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <span className="text-2xl font-black">+</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={handleAdjust}
                                        disabled={adjustment === 0 || isSubmitting}
                                        className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50 ${adjustment > 0 ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' :
                                                adjustment < 0 ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' :
                                                    'bg-slate-200 text-slate-400'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <RefreshCcw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                {adjustment > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className="px-10 py-6 bg-[#FDFBF7] border-t border-[#E5E1D8]">
                    <p className="text-[10px] text-[#8B7E66] italic text-center font-medium">
                        *Tips: Fokuskan kursor ke kotak input, lalu scan barcode barang. Sistem akan otomatis mendeteksi produknya.
                    </p>
                </div>
            </div>
        </div>
    );
}
