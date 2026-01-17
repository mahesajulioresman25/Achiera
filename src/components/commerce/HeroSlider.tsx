'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    tagline?: string;
    ctaLabel?: string;
    ctaLink?: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaType: 'IMAGE' | 'VIDEO';
}

interface HeroSliderProps {
    slides: HeroSlide[];
    autoPlayInterval?: number;
}

export default function HeroSlider({ slides, autoPlayInterval = 6000 }: HeroSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying || slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, autoPlayInterval);
        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length, autoPlayInterval]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlaying(false);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsAutoPlaying(false);
    };

    if (!slides || slides.length === 0) return null;

    return (
        <div className="relative w-full h-[600px] sm:h-[650px] md:h-[800px] overflow-hidden bg-[#1A241A] rounded-[2rem] sm:rounded-[3rem] md:rounded-[3.5rem] shadow-2xl group/slider">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    {/* Background Media with Cinematic Horizontal Pan */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            initial={{ x: '-2%' }}
                            animate={{ x: '2%' }}
                            transition={{
                                duration: 20,
                                ease: "linear",
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="absolute inset-0 w-[110%] h-full left-[-5%]"
                        >
                            {slides[currentIndex].mediaType === 'IMAGE' ? (
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${slides[currentIndex].imageUrl})` }}
                                />
                            ) : (
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                >
                                    <source src={slides[currentIndex].videoUrl} type="video/mp4" />
                                </video>
                            )}
                        </motion.div>
                    </div>

                    {/* Breathing Light & Gradient Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A241A] via-transparent to-transparent opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1A241A]/90 via-[#1A241A]/40 to-transparent" />

                        {/* Dynamic "Breathing" Glow Overlay */}
                        <motion.div
                            animate={{
                                opacity: [0.1, 0.2, 0.1],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-amber-500/5 mix-blend-overlay"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="relative z-20 h-full container mx-auto px-8 md:px-16 flex items-center">
                        <div className="max-w-3xl">
                            {/* Tagline Animation */}
                            {slides[currentIndex].tagline && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="mb-4 md:mb-6 flex items-center gap-3"
                                >
                                    <span className="w-12 h-px bg-amber-500/50" />
                                    <span className="text-amber-500 text-xs md:text-sm font-black uppercase tracking-[0.4em]">
                                        {slides[currentIndex].tagline}
                                    </span>
                                </motion.div>
                            )}

                            {/* Title with Serif Font - Staggered Reveal */}
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-3xl sm:text-4xl md:text-8xl font-black text-[#FDFBF7] leading-[1.2] md:leading-[1.1] mb-6 md:mb-8 tracking-tight font-serif italic"
                            >
                                {slides[currentIndex].title.split('\\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < slides[currentIndex].title.split('\\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </motion.h1>

                            {/* Subtitle - Staggered Reveal */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                                className="text-[13px] sm:text-lg md:text-2xl text-[#FDFBF7]/80 leading-relaxed font-medium mb-6 md:mb-12 max-w-xl"
                            >
                                {slides[currentIndex].subtitle}
                            </motion.p>

                            {/* CTA with refined style */}
                            {slides[currentIndex].ctaLabel && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.9, duration: 0.5 }}
                                >
                                    <Link
                                        href={slides[currentIndex].ctaLink || '#'}
                                        className="group/cta relative inline-flex items-center gap-4 bg-amber-500 hover:bg-amber-600 text-[#1A241A] px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95"
                                    >
                                        <span>{slides[currentIndex].ctaLabel}</span>
                                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover/cta:translate-x-2" />
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Premium Navigation Controls */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between p-6 pointer-events-none">
                <button
                    onClick={goToPrevious}
                    className="pointer-events-auto p-5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={goToNext}
                    className="pointer-events-auto p-5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Navigation Grid */}
            <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-0 right-0 z-30 flex flex-col items-center gap-4 md:gap-6">
                {/* Dots */}
                <div className="flex gap-4">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className="group/dot relative p-2"
                        >
                            <div className={`h-1.5 transition-all duration-500 rounded-full ${index === currentIndex ? 'w-12 bg-amber-500' : 'w-6 bg-white/30 group-hover/dot:bg-white/50'}`} />
                        </button>
                    ))}
                </div>

                {/* Counter */}
                <div className="flex items-center gap-4 px-6 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
                    <span className="text-[10px] font-black text-amber-500 tracking-[0.2em]">
                        {String(currentIndex + 1).padStart(2, '0')}
                    </span>
                    <div className="w-8 h-px bg-white/20" />
                    <span className="text-[10px] font-black text-white/40 tracking-[0.2em]">
                        {String(slides.length).padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Decorative vignette highlight */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[3.5rem]" />
        </div>
    );
}

