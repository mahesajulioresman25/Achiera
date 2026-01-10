'use client';

import React from 'react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-12">
            <div className="container mx-auto px-4 md:px-6">

                {/* Hero Skeleton */}
                <div className="w-full h-[60vh] bg-stone-100 rounded-[2.5rem] animate-pulse mb-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 shimmer"></div>
                </div>

                {/* Section Title Skeleton */}
                <div className="flex flex-col items-center gap-4 mb-12">
                    <div className="w-32 h-4 bg-stone-200 rounded-full animate-pulse"></div>
                    <div className="w-64 h-8 bg-stone-200 rounded-full animate-pulse"></div>
                </div>

                {/* Grid Skeleton (Products) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[4/5] bg-stone-100 rounded-[2rem] animate-pulse relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-stone-200/50"></div>
                        </div>
                    ))}
                </div>

                {/* Philosophy Section Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
                    <div className="space-y-6">
                        <div className="w-24 h-4 bg-stone-200 rounded-full animate-pulse"></div>
                        <div className="w-full max-w-md h-10 bg-stone-200 rounded-2xl animate-pulse"></div>
                        <div className="space-y-2">
                            <div className="w-full h-4 bg-stone-100 rounded-full animate-pulse"></div>
                            <div className="w-full h-4 bg-stone-100 rounded-full animate-pulse"></div>
                            <div className="w-3/4 h-4 bg-stone-100 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="aspect-square bg-stone-100 rounded-[2.5rem] animate-pulse"></div>
                </div>

            </div>

            <style jsx>{`
                .shimmer {
                    animation: shimmer 2s infinite linear;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
