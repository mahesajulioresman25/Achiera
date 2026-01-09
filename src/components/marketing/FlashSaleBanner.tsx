
'use client';

import { useState, useEffect } from 'react';
import { Timer, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FlashSaleBannerProps {
    activeFlashSale: any;
}

export default function FlashSaleBanner({ activeFlashSale }: FlashSaleBannerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const router = useRouter();

    useEffect(() => {
        console.log('[FlashSaleBanner] Active Data:', activeFlashSale);
        if (!activeFlashSale) return;

        const isUpcoming = activeFlashSale.status === 'UPCOMING';
        const timeToTarget = isUpcoming ? activeFlashSale.startTime : activeFlashSale.endTime;

        if (!timeToTarget) return;

        // Parse endTime (assuming HH:mm format for daily flash sale or specific Date)
        // Adjust logic based on your actual data structure in FlashSaleService
        // For now, assuming generic target time or just showing the time string if simple

        // If endTime is full ISO string
        // const target = new Date(activeFlashSale.endDate || new Date().setHours(23, 59, 59));

        // Let's assume for now we just show the static info or simple countdown if possible
        // Ideally we need a real countdown. 

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

        // Initial call
        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [activeFlashSale]);

    if (!activeFlashSale) return null;

    const isUpcoming = activeFlashSale.status === 'UPCOMING';
    const bgColor = isUpcoming ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-orange-600 to-red-600';
    const mainText = isUpcoming ? 'Flash Sale Segera Hadir!' : 'Flash Sale Sedang Berlangsung!';
    const timeLabel = isUpcoming ? 'Dimulai Dalam' : 'Berakhir Dalam';

    return (
        <div
            className={`relative w-full z-[9999] ${bgColor} text-white py-2 px-4 shadow-lg cursor-pointer transition-colors duration-500`}
            onClick={() => {
                // Scroll to Flash Sale section or Product section
                const el = document.getElementById('menu') || document.getElementById('flash-sale-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
        >
            <div className="container mx-auto max-w-7xl flex items-center justify-between text-[10px] md:text-sm font-bold tracking-wider uppercase">
                <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isUpcoming ? 'text-white' : 'fill-yellow-300 text-yellow-300'} animate-pulse`} />
                    <span className="hidden sm:inline">{mainText}</span>
                    <span className="sm:hidden">{isUpcoming ? 'Segera!' : 'Live!'}</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden md:inline bg-white/20 px-2 py-0.5 rounded">
                        Diskon {activeFlashSale.discountPercentage}% {activeFlashSale.targetType === 'SPECIFIC' ? 'Item Pilihan' : 'Semua Menu'}
                    </span>
                    <div className="flex items-center gap-1.5 font-black font-mono bg-black/20 px-3 py-1 rounded-lg">
                        <span className="text-[8px] md:text-[10px] opacity-70 hidden xs:inline">{timeLabel}</span>
                        <Timer className="w-3 h-3" />
                        <span>{timeLeft}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
