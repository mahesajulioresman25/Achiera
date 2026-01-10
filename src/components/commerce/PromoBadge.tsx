'use client';

import React from 'react';

interface PromoBadgeProps {
    type: 'FLASH_SALE' | 'PROMO' | 'NEW' | 'BEST_SELLER';
    text?: string;
    className?: string;
}

const PromoBadge: React.FC<PromoBadgeProps> = ({ type, text, className = '' }) => {
    let bgColor = 'bg-amber-500';
    let textColor = 'text-white';
    let defaultText = '';

    switch (type) {
        case 'FLASH_SALE':
            bgColor = 'bg-red-600';
            defaultText = 'KEJUTAN IBU';
            break;
        case 'PROMO':
            bgColor = 'bg-amber-500';
            defaultText = 'SAYANG IBU';
            break;
        case 'NEW':
            bgColor = 'bg-emerald-600';
            defaultText = 'TERBARU';
            break;
        case 'BEST_SELLER':
            bgColor = 'bg-[#8B7E66]';
            defaultText = 'FAVORIT';
            break;
    }

    return (
        <div className={`
            absolute top-4 left-4 z-10 
            px-4 py-2 
            ${bgColor} ${textColor} 
            text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]
            rounded-2xl shadow-xl backdrop-blur-md bg-opacity-90
            flex items-center gap-2
            border border-white/20
            animate-in fade-in zoom-in duration-500
            ${className}
        `}>
            {type === 'FLASH_SALE' && (
                <div className="bg-white/20 p-1 rounded-full">
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-300 fill-current animate-pulse" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                    </svg>
                </div>
            )}
            <span className="drop-shadow-sm">{text || defaultText}</span>
        </div>
    );
};

export default PromoBadge;
