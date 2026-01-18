'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
    productName: string;
    productUrl: string;
    className?: string;
}

export default function ShareButton({ productName, productUrl, className = '' }: ShareButtonProps) {
    const handleShare = async () => {
        const shareData = {
            title: `${productName} - Rasa Ibu`,
            text: `Lihat menu lezat dari Rasa Ibu: ${productName}`,
            url: productUrl
        };

        try {
            // Check if Web Share API is supported
            if (navigator.share) {
                await navigator.share(shareData);
                toast.success('Berhasil dibagikan! 🎉');
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(productUrl);
                toast.success('Link berhasil disalin ke clipboard! 📋');
            }
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name !== 'AbortError') {
                // Fallback: Copy to clipboard
                try {
                    await navigator.clipboard.writeText(productUrl);
                    toast.success('Link berhasil disalin ke clipboard! 📋');
                } catch (clipboardError) {
                    toast.error('Gagal membagikan produk.');
                }
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-3 py-5 rounded-2xl bg-white border-2 border-[#E5E1D8] text-[#2D3A2D] text-xs font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all ${className}`}
        >
            <Share2 className="w-5 h-5" />
            Bagikan
        </button>
    );
}
