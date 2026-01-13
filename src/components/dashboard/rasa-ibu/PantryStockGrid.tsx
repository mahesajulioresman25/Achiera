'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface PantryStockGridProps {
    products: any[];
    canAudit?: boolean;
    onOpenAudit: () => void;
    onOpenProduction?: () => void;
}

export default function PantryStockGrid({ products, canAudit, onOpenAudit, onOpenProduction }: PantryStockGridProps) {
    return (
        <div suppressHydrationWarning className="bg-white border border-[#E5E1D8] rounded-[3rem] overflow-hidden shadow-sm shadow-stone-200/50">
            <div className="px-10 py-8 border-b border-[#F9F7F2] bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                        <span className="text-sm">🥘</span>
                    </div>
                    <h3 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">Ketersediaan Stok (The Pantry)</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Buffer Alert</span>
                    </div>
                    {canAudit && (
                        <button
                            onClick={onOpenAudit}
                            className="px-6 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
                        >
                            Audit Hub
                        </button>
                    )}
                    <button
                        className="p-2.5 bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl hover:bg-white transition-all text-[#8B7E66]"
                        title="Download CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5E1D8]/50">
                {products
                    .filter(p => !p.inventoryType || p.inventoryType === 'FINISHED_GOOD' || p.inventoryType === 'SUPPLY')
                    .map((product) => {
                        // Calculate total stock across all variants for this product
                        const variants = product?.variants || [];
                        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockOnHand || 0), 0);
                        const isLow = totalStock <= 10;

                        return (
                            <div key={product.id} className="bg-white p-8 space-y-6 hover:bg-[#FDFBF7] transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-[#1A241A] truncate max-w-[120px]">{product.name}</h4>
                                            {product.inventoryType === 'SUPPLY' && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-[8px] font-black text-blue-600 rounded-md border border-blue-100 uppercase tracking-tighter">Supply</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{product.category?.name || 'Frozen'}</span>
                                    </div>
                                    {isLow && (
                                        <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {variants.map((variant: any) => {
                                        const variantLow = (variant.stockOnHand || 0) <= 5;
                                        return (
                                            <div key={variant.id} className="space-y-1">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{variant.name || 'Default'}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase ${variantLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                            {variant.stockOnHand === 0 ? 'Habis' : variantLow ? 'Menipis' : 'Cukup'}
                                                        </span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-md font-black text-[#1A241A] tracking-tighter">{variant.stockOnHand}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{variant.unit || 'pcs'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isLow && (
                                        <p className="text-[9px] font-bold text-amber-500 italic bg-amber-50 p-2 rounded-md">
                                            Beberapa stok menipis. Cek gudang atau segera order!
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <button
                                        onClick={onOpenProduction}
                                        className="text-[9px] font-black uppercase tracking-widest text-white bg-[#B2BCA2] py-3 rounded-2xl hover:bg-[#2D3A2D] transition-all shadow-md shadow-[#B2BCA2]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!onOpenProduction}
                                    >
                                        📩 Update Dapur
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
