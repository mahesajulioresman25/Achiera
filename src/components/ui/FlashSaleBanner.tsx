'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Clock } from 'lucide-react';
import { checkFlashSaleAction } from '@/lib/actions/commerce/flashSale';

export default function FlashSaleBanner() {
    const [activeSale, setActiveSale] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchSale = async () => {
            try {
                const sale = await checkFlashSaleAction('rasa-ibu');
                if (sale) {
                    setActiveSale(sale);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('Failed to fetch flash sale', error);
            }
        };
        fetchSale();

        // Check every 5 minutes
        const interval = setInterval(fetchSale, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (!activeSale || !isVisible) return null;

    return (
        <div
            className={`fixed top-0 inset-x-0 z-[60] bg-[#BD302D] text-white overflow-hidden shadow-lg transition-transform duration-500 ease-in-out`}
        >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>

            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-full animate-pulse">
                        <Zap className="w-5 h-5 text-yellow-300 fill-current" />
                    </div>
                    <div>
                        <p className="font-bold text-sm md:text-base leading-tight">
                            {activeSale.name} <span className="text-yellow-300 font-black text-lg">DISKON {activeSale.discount}%</span>
                        </p>
                        <p className="text-xs text-white/80">
                            Berlaku untuk Menu Pilihan!
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg">
                        <Clock className="w-4 h-4 text-white/70" />
                        <span className="font-mono font-bold text-yellow-300">
                            Hingga {activeSale.endTime}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors"
                    >
                        <span className="sr-only">Tutup</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
