'use client';

import React, { useEffect, useState } from 'react';
import HeroSlider from '@/components/HeroSlider';
import DevelopmentLifecycle from '@/components/DevelopmentLifecycle';
import AnimatedServices from '@/components/AnimatedServices';
import AnimatedPortfolio from '@/components/AnimatedPortfolio';
import Button from '@/components/Button';
import Link from 'next/link';
import { Code, Cpu, Database, Network, Settings, ShieldCheck } from 'lucide-react';
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

export default function ITSolutionsPage() {
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [isLoadingSlides, setIsLoadingSlides] = useState(true);

    // Fetch hero slides
    useEffect(() => {
        const fetchHeroSlides = async () => {
            try {
                const res = await fetch('/api/public/it-solutions/hero-slides');
                const data = await res.json();
                setHeroSlides(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch hero slides:', error);
                setHeroSlides([]);
            } finally {
                setIsLoadingSlides(false);
            }
        };

        fetchHeroSlides();
    }, []);

    // Track page view
    useEffect(() => {
        analytics.trackPageView('it-solutions', '/it-solutions');
    }, []);

    const services = [
        { name: "Custom Software Development", icon: <Code size={24} /> },
        { name: "IoT & Automation Solutions", icon: <Cpu size={24} /> },
        { name: "ERP & Odoo Implementation", icon: <Database size={24} /> },
        { name: "System Integration", icon: <Settings size={24} /> },
        { name: "Infrastructure & Networking", icon: <Network size={24} /> },
        { name: "Support & Maintenance", icon: <ShieldCheck size={24} /> },
    ];

    return (
        <div className="flex flex-col gap-32 pb-32 bg-[var(--background)]">
            {/* Loading State - Minimal to prevent flash */}
            {isLoadingSlides && (
                <div className="min-h-[85vh] flex items-center justify-center bg-[var(--background)]">
                    <div className="animate-pulse text-[var(--muted-foreground)]">Loading...</div>
                </div>
            )}

            {/* Hero Slider - Dynamic Content from CMS */}
            {!isLoadingSlides && heroSlides.length > 0 && (
                <HeroSlider brandSlug="it-solutions" slides={heroSlides} />
            )}

            {/* Fallback if no slides */}
            {!isLoadingSlides && heroSlides.length === 0 && (
                <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[var(--background)] pt-20">
                    {/* Subtle Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--accent)]/50 px-3 py-1 text-sm text-[var(--muted-foreground)] mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-[var(--primary)] mr-2"></span>
                            Next-Gen Technology Partner
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--foreground)] mb-6 leading-[1.1] max-w-4xl mx-auto">
                            Smart IT Solutions for <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)]">
                                Growing Businesses
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
                            We engineer scalable, future-proof technology solutions that transform your business operations and drive sustainable growth.
                        </p>
                    </div>
                </section>
            )}

            {/* Services - Animated Cards */}
            <AnimatedServices services={services} />

            {/* Workflow - Interactive Development Lifecycle */}
            <DevelopmentLifecycle />

            {/* Portfolio - Animated Grid */}
            <AnimatedPortfolio />

            {/* CTA - Minimal */}
            <section className="container mx-auto px-4 md:px-6 py-20 border-t border-[var(--border)]">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] mb-6 tracking-tight animate-fade-in-up">
                        Ready to modernize your infrastructure?
                    </h2>
                    <p className="text-[var(--muted-foreground)] text-lg mb-10 animate-fade-in-up delay-100">
                        Let's discuss how we can engineer the perfect solution for your business needs.
                    </p>
                    <Link href="/contact">
                        <Button variant="primary" size="lg" className="px-10 h-14 text-lg shadow-lg shadow-[var(--primary)]/20 hover:shadow-2xl hover:shadow-[var(--primary)]/30 hover:scale-105 transition-all duration-300 animate-fade-in-up delay-200">
                            Start Your Transformation
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
