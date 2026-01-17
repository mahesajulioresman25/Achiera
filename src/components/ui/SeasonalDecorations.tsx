'use client';

import React from 'react';
import { getCurrentSeason } from '@/lib/services/SeasonalService';
import { Heart } from 'lucide-react';
import ParticleEffect from '@/components/ui/ParticleEffect';
import { motion } from 'framer-motion';

export default function SeasonalDecorations() {
    const season = getCurrentSeason();

    if (season.iconTheme === 'NONE') return null;

    const renderDecorations = () => {
        switch (season.iconTheme) {
            case 'LANTERN': // Imlek
                return (
                    <>
                        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-yellow-500 to-red-700 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-6 right-10 z-[60] opacity-40"
                            animate={{
                                y: [0, -10, 0],
                                rotate: [-2, 2, -2]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-16 h-20 bg-gradient-to-b from-red-600 to-red-800 rounded-full relative shadow-2xl">
                                <div className="absolute inset-2 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full opacity-50 blur-sm" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-6 bg-yellow-500 rounded-b-full" />
                            </div>
                        </motion.div>
                        <ParticleEffect type="COIN" count={15} />
                    </>
                );
            case 'KETUPAT': // Ramadan/Lebaran
                return (
                    <>
                        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-green-700 via-yellow-500 to-green-700 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-8 right-12 z-[60] opacity-30"
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                        >
                            <div className="w-12 h-12 text-yellow-300 text-4xl">🌙</div>
                        </motion.div>
                        <ParticleEffect type="STAR" count={12} />
                    </>
                );
            case 'FLAG': // Independence Day
                return (
                    <>
                        <div className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-[60]" />
                        <motion.div
                            className="fixed top-4 right-8 z-[60] opacity-50"
                            animate={{
                                rotate: [-5, 5, -5],
                                x: [0, 5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-20 h-14 relative">
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-600 rounded-t-lg" />
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white rounded-b-lg border border-gray-200" />
                            </div>
                        </motion.div>
                        <ParticleEffect type="CONFETTI" count={20} />
                    </>
                );
            case 'BELL': // Christmas
                return (
                    <>
                        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-700 via-red-600 to-green-700 z-[60]" />
                        <motion.div
                            className="fixed -top-4 left-10 z-[60]"
                            animate={{
                                rotate: [-10, 10, -10],
                                y: [0, 5, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg"></div>
                        </motion.div>
                        <ParticleEffect type="SNOWFLAKE" count={18} />
                    </>
                );
            case 'HEART': // Hari Ibu
                return (
                    <>
                        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-10 right-10 z-[60] opacity-30"
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [-5, 5, -5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Heart className="w-16 h-16 text-rose-300 fill-current drop-shadow-lg" />
                        </motion.div>
                        <ParticleEffect type="HEART" count={10} />
                        <ParticleEffect type="PETAL" count={15} />
                    </>
                );
            case 'LOTUS': // Waisak
                return (
                    <>
                        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-8 right-10 z-[60] opacity-40"
                            animate={{
                                scale: [1, 1.15, 1],
                                rotate: [0, 360]
                            }}
                            transition={{
                                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                rotate: { duration: 30, repeat: Infinity, ease: "linear" }
                            }}
                        >
                            <div className="w-14 h-14 text-orange-400 text-5xl">🪷</div>
                        </motion.div>
                        <ParticleEffect type="PETAL" count={20} />
                    </>
                );
            case 'OGOH': // Nyepi
                return (
                    <>
                        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-purple-700 via-yellow-500 to-purple-700 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-6 right-8 z-[60] opacity-35"
                            animate={{
                                scale: [1, 1.1, 1],
                                y: [0, -8, 0]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 shadow-2xl flex items-center justify-center border-2 border-yellow-500">
                                <div className="text-yellow-400 text-2xl font-bold">👹</div>
                            </div>
                        </motion.div>
                        <ParticleEffect type="STAR" count={15} />
                    </>
                );
            case 'KEBAYA': // Kartini
                return (
                    <>
                        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-red-600 via-white to-red-600 z-[60] shadow-sm" />
                        <motion.div
                            className="fixed top-8 right-12 z-[60] opacity-40"
                            animate={{
                                rotate: [-3, 3, -3],
                                scale: [1, 1.08, 1]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-xl flex items-center justify-center border-2 border-white">
                                <div className="text-white text-xl">🌺</div>
                            </div>
                        </motion.div>
                        <ParticleEffect type="PETAL" count={18} />
                    </>
                );
            default:
                return null;
        }
    };

    return renderDecorations();
}
