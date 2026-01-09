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
            px-3 py-1.5 
            ${bgColor} ${textColor} 
            text-[10px] font-black uppercase tracking-widest 
            rounded-lg shadow-lg 
            flex items-center gap-1.5
            animate-in fade-in zoom-in duration-300
            ${className}
        `}>
            {type === 'FLASH_SALE' && (
                <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                </svg>
            )}
            {text || defaultText}
        </div>
    );
};

export default PromoBadge;
