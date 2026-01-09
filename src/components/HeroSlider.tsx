'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl: string | null;
    videoUrl: string | null;
    ctaLabel: string | null;
    ctaLink: string | null;
    sortOrder: number;
}

interface HeroSliderProps {
    brandSlug: string;
    slides: HeroSlide[];
    autoPlayInterval?: number; // milliseconds
}

export default function HeroSlider({
    brandSlug,
    slides,
    autoPlayInterval = 5000,
}: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length, autoPlayInterval]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false); // Stop auto-play when user manually navigates
    };

    const goToPrevious = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlaying(false);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAutoPlaying(false);
    };

    const handleCtaClick = (slide: HeroSlide) => {
        if (slide.ctaLabel && slide.ctaLink) {
            analytics.trackHeroCtaClick(brandSlug, slide.ctaLink);
        }
    };

    if (slides.length === 0) {
        return null;
    }

    const slide = slides[currentSlide];
    const mediaUrl = slide.mediaType === 'IMAGE' ? slide.imageUrl : slide.videoUrl;

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Background Media - All slides rendered with opacity transitions */}
            {slides.map((s, index) => {
                const isActive = index === currentSlide;
                const mediaUrl = s.mediaType === 'IMAGE' ? s.imageUrl : s.videoUrl;

                return (
                    <div
                        key={s.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        {s.mediaType === 'IMAGE' ? (
                            <>
                                <img
                                    src={mediaUrl || ''}
                                    alt={s.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40" />
                            </>
                        ) : (
                            <>
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                >
                                    <source src={mediaUrl || ''} type="video/mp4" />
                                </video>
                                <div className="absolute inset-0 bg-black/40" />
                            </>
                        )}
                    </div>
                );
            })}


            {/* Content */}
            <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
                        {slide.title}
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-3xl text-white/90 mb-8 animate-fade-in-delay">
                        {slide.subtitle}
                    </p>
                    {slide.ctaLabel && slide.ctaLink && (
                        <Link
                            href={slide.ctaLink}
                            onClick={() => handleCtaClick(slide)}
                            className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-delay-2"
                        >
                            {slide.ctaLabel}
                        </Link>
                    )}
                </div>
            </div>

            {/* Navigation Arrows (only show if multiple slides) */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            {/* Slide Indicators (only show if multiple slides) */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Video Play Indicator (for video slides) */}
            {slide.mediaType === 'VIDEO' && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-sm">
                    <Play className="w-4 h-4 text-white fill-white" />
                    <span className="text-white text-sm font-medium">Video</span>
                </div>
            )}
        </div>
    );
}
