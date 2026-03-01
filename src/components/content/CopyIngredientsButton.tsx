'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyIngredientsButtonProps {
    ingredients: string[];
    className?: string;
}

export default function CopyIngredientsButton({ ingredients, className }: CopyIngredientsButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!ingredients || ingredients.length === 0) return;

        const text = ingredients.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Bahan-bahan berhasil disalin!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy ingredients:', err);
            toast.error('Gagal menyalin bahan');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 bg-[#F9F7F2] text-[#8B7E66] rounded-xl border border-[#E5E1D8] hover:bg-[#B2BCA2] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm group ${className}`}
            title="Salin semua bahan"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-emerald-500 group-hover:text-white" />
                    Tersalin!
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    Salin Bahan
                </>
            )}
        </button>
    );
}
