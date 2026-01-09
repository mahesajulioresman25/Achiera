'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentSeason } from '@/lib/services/SeasonalService';
import { Star, Moon } from 'lucide-react';

export default function SeasonalDecorations() {
    const [season, setSeason] = useState<ReturnType<typeof getCurrentSeason> | null>(null);

    useEffect(() => {
        // Detect season on mount
        const current = getCurrentSeason();
        if (current.type !== 'NONE') {
            setSeason(current);
        }
    }, []);

    if (!season || season.type === 'NONE') return null;

    // Helper to render icons
    const renderIcons = () => {
        switch (season.iconTheme) {
            case 'LANTERN': // Imlek
                return (
                    <>
                        {/* CSS-based Lanterns */}
                        <div className="fixed top-0 left-10 w-8 h-24 bg-red-600 rounded-b-xl shadow-lg shadow-red-500/50 animate-bounce cursor-pointer z-[60] origin-top border-t-4 border-yellow-400">
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-yellow-500/50"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-[10px] font-bold writing-vertical">福</div>
                        </div>
                        <div className="fixed top-0 right-10 w-8 h-20 bg-red-600 rounded-b-xl shadow-lg shadow-red-500/50 animate-bounce cursor-pointer z-[60] delay-300 origin-top border-t-4 border-yellow-400">
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-yellow-500/50"></div>
                        </div>
                    </>
                );
            case 'KETUPAT': // Ramadan/Lebaran
                return (
                    <>
                        <div className="fixed top-4 right-4 z-[60] animate-pulse">
                            <Moon className="w-12 h-12 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        </div>
                        {/* Decorative Stars */}
                        <div className="fixed top-20 left-10 z-[60] animate-spin-slow opacity-60">
                            <Star className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="fixed top-10 right-20 z-[60] animate-spin-slow delay-700 opacity-60">
                            <Star className="w-4 h-4 text-emerald-400" />
                        </div>
                    </>
                );
            case 'FLAG': // Independence
                return (
                    <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-red-600 via-white to-red-600 z-[60] shadow-md" />
                );
            case 'BELL': // Christmas
                return (
                    <>
                        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-700 via-red-600 to-green-700 z-[60]" />
                        <div className="fixed -top-4 left-10 z-[60] animate-bounce">
                            <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg"></div>
                        </div>
                    </>
                )
            default:
                return null;
        }
    };

    return (
        <div className="pointer-events-none fixed inset-0 z-[50] overflow-hidden">
            {/* Ambient Gradient Overlay (Subtle) */}
            <div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-current to-transparent opacity-10"
                style={{ color: season.colors.primary }}
            />

            {/* Render Specific Ornaments */}
            {renderIcons()}

            {/* Floating particles (Generic Sparkles) */}
            <div className="absolute top-1/3 left-1/4 animate-ping opacity-20" style={{ color: season.colors.secondary }}>
                <Star className="w-2 h-2" />
            </div>
            <div className="absolute top-1/2 right-1/4 animate-ping delay-1000 opacity-20" style={{ color: season.colors.secondary }}>
                <Star className="w-2 h-2" />
            </div>
        </div>
    );
}
