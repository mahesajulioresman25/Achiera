'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Utensils } from 'lucide-react';

interface QuantityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (quantity: number) => void;
    title: string;
    description: string;
    defaultValue: number;
    unit?: string;
}

export default function QuantityModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    defaultValue,
    unit = 'pcs'
}: QuantityModalProps) {
    const [quantity, setQuantity] = useState(defaultValue);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuantity(defaultValue);
            setIsSubmitting(false);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onConfirm(quantity);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div
                className="absolute inset-0 bg-[#2D3A2D]/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative bg-[#FDFBF7] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
                <div className="px-10 pt-10 pb-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        <Utensils size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#2D3A2D]">{title}</h3>
                        <p className="text-xs text-[#8B7E66] font-medium leading-relaxed max-w-[240px] mx-auto">
                            {description}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8">
                    <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-3 block text-center">
                            Jumlah Aktual ({unit})
                        </label>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                                className="w-12 h-12 rounded-2xl border border-[#E5E1D8] flex items-center justify-center text-2xl font-black text-[#2D3A2D] hover:bg-white transition-colors"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="w-24 bg-white border border-[#E5E1D8] rounded-2xl px-4 py-4 text-center text-xl font-black text-[#2D3A2D] focus:outline-none focus:border-emerald-600 shadow-inner"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-12 h-12 rounded-2xl border border-[#E5E1D8] flex items-center justify-center text-2xl font-black text-[#2D3A2D] hover:bg-white transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-rose-600 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-8 py-4 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-900/20 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            Konfirmasi Selesai
                        </button>
                    </div>
                </form>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
