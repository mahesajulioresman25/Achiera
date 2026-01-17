'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toggleWishlistAction } from '@/lib/actions/commerce/wishlist';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProductWishlistButtonProps {
    productId: string;
    productName: string;
    brandId?: string;
    className?: string;
}

export default function ProductWishlistButton({
    productId,
    productName,
    brandId = "clp...", // rasa-ibu default if not provided, but better to pass it
    className = ""
}: ProductWishlistButtonProps) {
    const { data: session } = useSession();
    const [isFav, setIsFav] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setMounted(true);
        const favs = JSON.parse(localStorage.getItem('rasa_ibu_fav_menu') || '[]');
        setIsFav(favs.includes(productId));
    }, [productId]);

    const toggleFav = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSyncing) return;

        // If logged in, sync with server
        if (session?.user) {
            setIsSyncing(true);
            const res = await toggleWishlistAction(productId, brandId);
            setIsSyncing(false);

            if (res.success) {
                setIsFav(res.active || false);
                toast.success(res.message, { icon: res.active ? '❤️' : '🗑️' });
            } else {
                toast.error(res.error);
                return;
            }
        } else {
            // Guest mode: LocalStorage only
            const favs = JSON.parse(localStorage.getItem('rasa_ibu_fav_menu') || '[]');
            let newFavStatus = !isFav;

            if (newFavStatus) {
                if (!favs.includes(productId)) favs.push(productId);
                toast.success(`${productName} ditambahkan ke Menu Favorit Bunda!`, {
                    icon: '❤️'
                });
            } else {
                const index = favs.indexOf(productId);
                if (index > -1) favs.splice(index, 1);
                toast.info('Dihapus dari Menu Favorit.');
            }

            setIsFav(newFavStatus);
            localStorage.setItem('rasa_ibu_fav_menu', JSON.stringify(favs));
        }

        // Dispatch custom event for Header update
        window.dispatchEvent(new Event('wishlist-updated'));
    };

    if (!mounted) {
        return (
            <div className={`p-3 rounded-full bg-white/50 backdrop-blur-sm border border-white/20 ${className}`}>
                <Heart className="w-5 h-5 text-gray-300" />
            </div>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFav}
            className={`p-3 rounded-full transition-all group flex items-center justify-center gap-2 ${isFav
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                : 'bg-white/80 backdrop-blur-md text-gray-400 border border-gray-100 hover:text-rose-500 hover:bg-white shadow-sm'
                } ${className}`}
            title={isFav ? "Hapus dari Favorit" : "Simpan Menu Favorit"}
        >
            <motion.div
                key={isFav ? 'active' : 'inactive'}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
                <Heart
                    className={`w-5 h-5 transition-all duration-300 ${isFav ? 'fill-current' : ''}`}
                />
            </motion.div>

            <AnimatePresence>
                {isFav && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-[10px] font-black uppercase tracking-widest hidden md:inline overflow-hidden whitespace-nowrap"
                    >
                        Favorit Bunda
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
