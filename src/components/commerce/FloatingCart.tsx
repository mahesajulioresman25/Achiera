'use client';

import React from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function FloatingCart() {
    const { items, cartTotal, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, updateItemNote } = useCart();

    if (!isCartOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Cart Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white z-[9999] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#E5E1D8] bg-[#FDFBF7]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2D3A2D] rounded-2xl flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-[#FDFBF7]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#2D3A2D]">Keranjang Bunda</h2>
                                <p className="text-[10px] text-[#8B7E66] font-bold uppercase tracking-widest">{items.length} Menu Dipilih</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="p-2 hover:bg-white rounded-xl transition-all"
                        >
                            <X className="w-6 h-6 text-[#8B7E66]" />
                        </button>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                            <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-10 h-10 text-[#E5E1D8]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#8B7E66]">Keranjang masih kosong</p>
                                <p className="text-xs text-slate-400 mt-1">Yuk pilih menu favorit Bunda!</p>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-[#FDFBF7] rounded-2xl p-4 space-y-3 border border-[#E5E1D8]">
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-[#E5E1D8]">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#E5E1D8]">
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-[#2D3A2D] truncate">{item.name}</h3>
                                        <p className="text-[10px] text-[#8B7E66] font-medium uppercase tracking-widest">{item.variantName}</p>
                                        <p className="text-sm font-black text-[#2D3A2D] mt-1">
                                            Rp {item.total.toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-all self-start"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Jumlah Porsi</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="w-8 h-8 bg-white border border-[#E5E1D8] rounded-lg flex items-center justify-center hover:bg-[#F9F7F2] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Minus className="w-4 h-4 text-[#8B7E66]" />
                                        </button>
                                        <span className="w-12 text-center font-black text-[#2D3A2D]">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 bg-white border border-[#E5E1D8] rounded-lg flex items-center justify-center hover:bg-[#F9F7F2] transition-all"
                                        >
                                            <Plus className="w-4 h-4 text-[#8B7E66]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Note Input */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66]">Catatan Khusus (Opsional)</label>
                                    <textarea
                                        value={item.note || ''}
                                        onChange={(e) => updateItemNote(item.id, e.target.value)}
                                        placeholder="Contoh: Jangan pakai cabe, Extra pedas, dll..."
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-[#E5E1D8] bg-[#FDFBF7] space-y-4">
                        {/* Total */}
                        <div className="flex justify-between items-baseline">
                            <span className="text-xs font-black uppercase tracking-widest text-[#8B7E66]">Total Belanja</span>
                            <span className="text-2xl font-black text-[#2D3A2D]">Rp {cartTotal.toLocaleString('id-ID')}</span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                href="/rasa-ibu/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="w-full py-4 bg-[#2D3A2D] text-[#FDFBF7] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#1A241A] transition-all shadow-lg shadow-green-900/10 flex items-center justify-center gap-2"
                            >
                                Lanjut ke Checkout
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-full py-4 bg-white border border-[#E5E1D8] text-[#8B7E66] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all"
                            >
                                Lanjut Belanja
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
