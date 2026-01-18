'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, Sparkles, X } from 'lucide-react';

export default function GlobalBirthdayBanner() {
    const [user, setUser] = useState<any>(null);
    const [isBirthMonth, setIsBirthMonth] = useState(false);
    const [isBirthDay, setIsBirthDay] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Fetch user data from API
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data?.birthday) {
                        setUser(data.data);

                        const today = new Date();
                        const birthday = new Date(data.data.birthday);
                        const isMonth = birthday.getMonth() === today.getMonth();
                        const isDay = isMonth && birthday.getDate() === today.getDate();

                        setIsBirthMonth(isMonth);
                        setIsBirthDay(isDay);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };

        fetchUser();

        // Check if banner was dismissed today
        const dismissedDate = localStorage.getItem('birthday_banner_dismissed');
        if (dismissedDate === new Date().toDateString()) {
            setIsDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('birthday_banner_dismissed', new Date().toDateString());
    };

    if (!mounted || !isBirthMonth || isDismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-b-2 border-amber-300 shadow-xl"
            >
                <div className="max-w-7xl mx-auto px-4 py-4 relative">
                    {/* Dismiss Button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full transition-all shadow-sm"
                        aria-label="Tutup banner"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4 pr-12">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-black text-amber-900 mb-1 flex items-center gap-2">
                                🎉 {isBirthDay ? 'Selamat Ulang Tahun, Bunda' : 'Bulan Kelahiran Bunda!'}
                            </h3>
                            <p className="text-xs md:text-sm text-amber-800 font-medium">
                                {isBirthDay
                                    ? 'Semoga harinya hangat dan penuh kebaikan. Sebagai hadiah kecil dari kami, poin akan bertambah dua kali lipat sepanjang bulan ini.'
                                    : 'Dapatkan 2x Poin Loyalty di setiap transaksi selama bulan kelahiran Bunda! 🎁'
                                }
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Link
                            href="/rasa-ibu/loyalty"
                            className="hidden md:flex flex-shrink-0 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            Lihat Poin Saya
                        </Link>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
