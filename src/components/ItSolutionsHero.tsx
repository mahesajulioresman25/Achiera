'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ItSolutionsHero() {
    const heroRef = useRef<HTMLElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (!heroRef.current) return;

        const rect = heroRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <section
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[var(--background)] pt-20"
            style={{
                '--mouse-x': `${position.x}px`,
                '--mouse-y': `${position.y}px`,
                '--spotlight-opacity': opacity,
            } as React.CSSProperties}
        >
            {/* Cursor Spotlight Effect */}
            <div
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
                style={{
                    opacity: 'var(--spotlight-opacity)',
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(56,189,248,0.15), transparent 40%)`,
                }}
            />

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--accent)]/50 px-3 py-1 text-sm text-[var(--muted-foreground)] mb-8 backdrop-blur-sm animate-fade-in-up">
                    <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] mr-2"></span>
                    Next-Gen Technology Partner
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--foreground)] mb-6 leading-[1.1] max-w-4xl mx-auto animate-fade-in-up delay-100">
                    Smart IT Solutions for <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)]">
                        Growing Businesses
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                    We design, build, and maintain systems that help your business work faster, smarter, and more efficiently—from custom software and automation to IoT and integration.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
                    <Link href="/contact">
                        <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-[var(--primary)] px-8 font-medium text-white transition-all duration-300 hover:bg-[var(--primary-hover)] hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 hover:ring-offset-[var(--background)]">
                            <span className="mr-2">Consult Your Needs</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </Link>

                    <Link href="#services">
                        <button className="group inline-flex h-12 items-center justify-center rounded-md px-8 font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
                            View IT Services
                        </button>
                    </Link>
                </div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
        </section>
    );
}
