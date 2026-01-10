'use client';

import { useState, useEffect } from 'react';
import { Timer, Zap, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FlashSaleBannerProps {
    activeFlashSale: any;
}

export default function FlashSaleBanner({ activeFlashSale }: FlashSaleBannerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!activeFlashSale) return;

        const isUpcoming = activeFlashSale.status === 'UPCOMING';
        const timeToTarget = isUpcoming ? activeFlashSale.startTime : activeFlashSale.endTime;

        if (!timeToTarget) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();

            if (timeToTarget) {
                const [hours, minutes] = timeToTarget.split(':').map(Number);
                target.setHours(hours, minutes, 0, 0);
            } else {
                target.setHours(23, 59, 59, 999);
            }

            const diff = target.getTime() - now.getTime();
            if (diff <= 0) return "00:00:00";

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [activeFlashSale]);

    if (!activeFlashSale || !isVisible) return null;

    const isUpcoming = activeFlashSale.status === 'UPCOMING';
    const bgColor = isUpcoming
        ? 'bg-gradient-to-r from-[#8B7E66] to-[#A39171]'
        : 'bg-gradient-to-r from-[#BD302D] via-[#D32F2F] to-[#E53935]';

    const mainText = activeFlashSale.name ? activeFlashSale.name.toUpperCase() : (isUpcoming ? 'FLASH SALE SEGERA HADIR!' : 'FLASH SALE SEDANG BERLANGSUNG!');
    const timeLabel = isUpcoming ? 'MULAI DALAM' : 'BERAKHIR DALAM';

    return (
        <div
            className={`
                relative w-full z-[60] 
                ${bgColor} text-white 
                overflow-hidden shadow-lg 
                transition-all duration-700 ease-in-out
                animate-in slide-in-from-top
            `}
        >
            {/* Elegant Background Texture & Shine Effect */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/food.png')] pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[shine_5s_infinite]"></div>

            <div className="container mx-auto max-w-7xl px-4 py-2 relative flex items-center justify-between">
                {/* Left: Branding & Status */}
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => {
                        const el = document.getElementById('menu') || document.getElementById('flash-sale-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    <div className={`p-1.5 rounded-full ${isUpcoming ? 'bg-white/20' : 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'} animate-pulse`}>
                        <Zap className={`w-3 h-3 md:w-4 md:h-4 ${isUpcoming ? 'text-white' : 'text-red-700 fill-current'}`} />
                    </div>
                    <div>
                        <h3 className="text-[10px] md:text-sm font-black tracking-tighter uppercase leading-none drop-shadow-md">
                            {mainText}
                            <span className="hidden sm:inline ml-2 text-yellow-300 font-black">
                                HEMAT {activeFlashSale.discountPercentage}%
                            </span>
                        </h3>
                        <p className="text-[8px] md:text-[10px] font-bold opacity-80 mt-1 tracking-[0.2em] drop-shadow-sm">
                            {activeFlashSale.targetType === 'SPECIFIC' ? 'MENU PILIHAN IBU' : 'SELURUH VARIAN MENU'}
                        </p>
                    </div>
                </div>

                {/* Right: Timer & Close */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 md:px-5 py-1.5 rounded-full border border-white/10 shadow-inner">
                        <span className="text-[8px] md:text-[10px] font-black opacity-60 hidden xs:inline tracking-widest">{timeLabel}</span>
                        <div className="flex items-center gap-1 font-black font-mono text-xs md:text-lg tabular-nums">
                            <Timer className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                            <span className="text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.5)]">{timeLeft}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <X className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 150%; }
                    100% { left: 150%; }
                }
            `}</style>
        </div>
    );
}
