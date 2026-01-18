'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddBundleToCartButtonProps {
    bundle: {
        id: string;
        name: string;
        price: number;
        description?: string;
    };
    className?: string;
}

export default function AddBundleToCartButton({ bundle, className }: AddBundleToCartButtonProps) {
    const { addToCart } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        addToCart({
            productId: 'bundle-' + bundle.id,
            productBundleId: bundle.id,
            type: 'BUNDLE',
            name: bundle.name,
            price: Number(bundle.price),
            quantity: 1,
            image: '', // Bundles don't have separate images yet in schema
            variantId: 'default',
            variantName: 'Paket Hemat'
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className={`relative w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 overflow-hidden
                ${isAdded
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : `${className || 'bg-[#1A241A] text-white hover:bg-[#8B7E66] shadow-slate-900/10'}`
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
                        <Check className="w-5 h-5" />
                        <span>Berhasil Ditambah</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="label"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Sajikan Paket Ini</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
