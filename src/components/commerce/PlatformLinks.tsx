'use client';

import React from 'react';
import Image from 'next/image';

interface ExternalLinks {
    shopeeFood?: string;
    grabFood?: string;
    goFood?: string;
    tokopedia?: string;
}

export default function PlatformLinks({ links, compact = false }: { links: ExternalLinks, compact?: boolean }) {
    if (!links || Object.keys(links).length === 0) return null;

    const platforms = [
        { key: 'shopeeFood', label: 'Shopee Food', logoSrc: '/images/platforms/shopee.png', color: 'hover:bg-[#EE4D2D]/5 hover:border-[#EE4D2D]/20', textColor: 'text-[#EE4D2D]' },
        { key: 'grabFood', label: 'GrabFood', logoSrc: '/images/platforms/grabfood.png', color: 'hover:bg-[#00B14F]/5 hover:border-[#00B14F]/20', textColor: 'text-[#00B14F]' },
        { key: 'goFood', label: 'GoFood', logoSrc: '/images/platforms/gofood.webp', color: 'hover:bg-[#E21F26]/5 hover:border-[#E21F26]/20', textColor: 'text-[#E21F26]' },
    ];

    return (
        <div className={`space-y-6 ${compact ? '' : 'animate-in fade-in slide-in-from-bottom-2 duration-700'}`}>
            {!compact && (
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Pesan via Platform Lain</span>
                    <div className="h-px flex-1 bg-[#E5E1D8]"></div>
                </div>
            )}

            <div className={`grid gap-4 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {platforms.map((p) => {
                    const link = (links as any)[p.key];
                    if (!link) return null;

                    return (
                        <a
                            key={p.key}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 transition-all duration-300 group shadow-sm hover:shadow-md ${p.color} ${compact
                                ? 'bg-white/50 border border-[#E5E1D8] rounded-xl p-3 justify-center'
                                : 'bg-white border border-[#E5E1D8] rounded-[1.5rem] px-6 py-4'}`}
                        >
                            <div className={`${compact ? 'w-6 h-6' : 'w-12 h-12'} flex items-center justify-center relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                {(p as any).logoSrc ? (
                                    <img
                                        src={(p as any).logoSrc}
                                        alt={p.label}
                                        className="w-full h-full object-contain p-0.5"
                                    />
                                ) : (
                                    <span className={compact ? 'text-sm' : 'text-2xl'}>{(p as any).icon}</span>
                                )}
                            </div>
                            {!compact && (
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.textColor}`}>
                                        {p.label}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400">Pesan Sekarang</span>
                                </div>
                            )}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
