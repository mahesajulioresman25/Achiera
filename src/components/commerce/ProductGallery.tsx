'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isHovering) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    if (!images || images.length === 0) {
        return (
            <div className="aspect-[4/5] bg-gray-100 rounded-[3rem] border border-[#E5E1D8] flex items-center justify-center">
                <span className="text-6xl">🍲</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Main Image */}
            <div
                className="aspect-[4/5] bg-white rounded-[3rem] overflow-hidden border border-[#E5E1D8] shadow-2xl shadow-slate-200 relative group cursor-crosshair"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
            >
                <img
                    src={images[activeIndex]}
                    alt={`${productName} - View ${activeIndex + 1}`}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out ${isHovering ? 'scale-150' : 'scale-100'}`}
                    style={isHovering ? {
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                    } : undefined}
                />

                {/* Navigation Arrows (only if multiple images) */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[#2D3A2D] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[#2D3A2D] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Indicator Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex
                                    ? 'bg-[#2D3A2D] w-6'
                                    : 'bg-white/60 hover:bg-white'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${idx === activeIndex
                                ? 'border-[#2D3A2D] ring-2 ring-[#2D3A2D]/20'
                                : 'border-transparent hover:border-[#8B7E66]'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
