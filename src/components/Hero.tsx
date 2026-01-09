import React from 'react';
import Link from 'next/link';

interface HeroProps {
    heading: string;
    subheading: string;
    tagline?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    align?: 'left' | 'center';
}

export default function Hero({
    heading,
    subheading,
    tagline,
    primaryCtaText,
    primaryCtaLink,
    align = 'center'
}: HeroProps) {
    return (
        <section className="bg-amber-50/70 py-20 sm:py-24 md:py-28">
            <div className={`mx-auto max-w-5xl px-4 md:px-6 ${align === 'center' ? 'text-center' : 'text-left'}`}>
                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight tracking-tight">
                    {heading}
                </h1>

                {/* Subheadline */}
                <p className={`mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-3xl leading-relaxed ${align === 'center' ? 'mx-auto' : ''}`}>
                    {subheading}
                </p>

                {/* Optional Tagline */}
                {tagline && (
                    <p className="mt-4 text-xs sm:text-sm uppercase tracking-[0.2em] text-amber-700 font-medium">
                        {tagline}
                    </p>
                )}

                {/* Primary CTA */}
                {primaryCtaText && primaryCtaLink && (
                    <div className={`mt-8 sm:mt-10 flex ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        <Link href={primaryCtaLink}>
                            <button
                                type="button"
                                className="rounded-full bg-amber-600 px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-amber-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                {primaryCtaText}
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
