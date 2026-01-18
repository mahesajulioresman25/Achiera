'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    disabled?: boolean;
}

export default function AddToCartButton({ product, className, label = 'Sajikan Untuk Keluarga', disabled = false }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        if (disabled) return;
        addToCart({
            productId: product.id,
            variantId: product.variantId || 'default',
            name: product.name,
            variantName: product.variantName || 'Porsi Keluarga',
            quantity: 1,
            price: product.price,
            image: product.image || ''
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={disabled}
            className={`relative flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl overflow-hidden
                ${disabled
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                    : isAdded
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : `${className || 'bg-[#2D3A2D] text-[#FDFBF7] shadow-slate-900/10'} hover:scale-105`
                }`}
        >
            <AnimatePresence mode="wait">
                {isAdded ? (
                    <motion.div
                        key="check"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        <span>Selesai Kita Sajikan</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="label"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{label}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
