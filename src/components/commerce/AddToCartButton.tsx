'use client';

import React from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';

interface AddToCartButtonProps {
    product: {
        id: string;
        name: string;
        price: number;
        image?: string;
        variantId?: string;
        variantName?: string;
    };
    className?: string;
    label?: string;
}

export default function AddToCartButton({ product, className, label = 'Siapkan Untuk Keluarga' }: AddToCartButtonProps) {
    const { addToCart } = useCart();

    const handleAdd = () => {
        addToCart({
            productId: product.id,
            variantId: product.variantId || 'default',
            name: product.name,
            variantName: product.variantName || 'Porsi Keluarga',
            quantity: 1,
            price: product.price,
            image: product.image || ''
        });
    };

    return (
        <button
            onClick={handleAdd}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${className || 'bg-[#2D3A2D] text-[#FDFBF7] shadow-slate-900/10'}`}
        >
            <ShoppingBag className="w-4 h-4" />
            {label}
        </button>
    );
}
