'use client';

import React from 'react';

interface PrintRecipeButtonProps {
    className?: string;
}

export default function PrintRecipeButton({ className }: PrintRecipeButtonProps) {
    return (
        <button
            onClick={() => window.print()}
            className={className || "text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-all px-6 py-3 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8] flex items-center gap-3 print:hidden shadow-sm"}
        >
            🖨️ Cetak Resep Bunda
        </button>
    );
}
