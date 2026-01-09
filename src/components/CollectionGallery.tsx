import React from 'react';
import { Sparkles } from 'lucide-react';

interface CollectionGalleryProps {
    images: string[];
}

export default function CollectionGallery({ images }: CollectionGalleryProps) {
    return (
        <section className="py-16 bg-amber-50/50 border-y border-amber-100">
            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900">
                            Lookbook Showcase
                        </h2>
                        <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-stone-600 max-w-2xl mx-auto">
                        Curated photos showcasing our premium merchandise in real-world settings.
                        Each piece is designed to elevate your brand presence.
                    </p>
                </div>

                {/* Masonry Grid */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                    {images.map((image, idx) => (
                        <div
                            key={idx}
                            className="break-inside-avoid mb-4"
                        >
                            <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 group">
                                <img
                                    src={image}
                                    alt={`Collection showcase ${idx + 1}`}
                                    className="w-full h-auto object-cover transition-all duration-300 group-hover:scale-[1.03]"
                                    loading="lazy"
                                />
                                {/* Subtle overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Optional: Empty State */}
                {images.length === 0 && (
                    <div className="text-center py-16">
                        <Sparkles className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                        <p className="text-stone-500">Gallery coming soon...</p>
                    </div>
                )}
            </div>
        </section>
    );
}
