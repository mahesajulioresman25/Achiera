'use client';

import React from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface AddToBundleButtonProps {
    bundle: {
        id: string;
        name: string;
        price: number;
        description?: string;
    };
    className?: string;
}

export default function AddToBundleButton({ bundle, className }: AddToBundleButtonProps) {
    const { addToCart } = useCart();

    const handleAdd = () => {
        addToCart({
            productId: 'bundle-' + bundle.id, // Virtual ID, or use first item's ID if needed, but 'bundle-' is safer
            productBundleId: bundle.id,
            type: 'BUNDLE',
            variantId: 'bundle-variant-' + bundle.id,
            name: bundle.name,
            variantName: 'Paket Bundling',
            quantity: 1, // Bundles are added as 1 unit
            price: Number(bundle.price),
            image: '' // Ideally pass a bundle image if available
        });
        toast.success('Paket berhasil ditambahkan ke keranjang!');
    };

    return (
        <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${className || 'bg-[#BD302D] text-white shadow-red-900/20 hover:bg-[#A62626]'}`}
        >
            <ShoppingBag className="w-5 h-5" />
            Ambil Paket Ini
        </button>
    );
}
