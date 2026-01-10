'use client';

import React, { useEffect, useRef, useState } from 'react';
import HeroSlider from '@/components/HeroSlider';
import Button from '@/components/Button';
import MerchandiseWorkflow from '@/components/MerchandiseWorkflow';

import Link from 'next/link';
import { Shirt, Coffee, PenTool, ShoppingBag, Gift, Package, ArrowRight } from 'lucide-react';
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

interface Collection {
    id: string;
    slug: string;
    name: string;
    heroTitle: string;
    heroSubtitle: string;
    highlights: string[];
    coverImage: string | null;
}

interface MerchSettings {
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    heroCtaLabel: string;
    heroCtaLink: string;
    highlightLine: string;
    mockupTitle: string;
    mockupSubtitle: string;
    mockupTagline: string;
    mockupEnabled: boolean;
}

export default function MerchandisePage() {
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [settings, setSettings] = useState<MerchSettings | null>(null);
    const [isLoadingSlides, setIsLoadingSlides] = useState(true);
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    // Fetch hero slides
    useEffect(() => {
        const fetchHeroSlides = async () => {
            try {
                const res = await fetch('/api/public/merch/hero-slides');
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

    // Fetch collections
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await fetch('/api/public/merch/collections');
                const data = await res.json();
                setCollections(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch collections:', error);
                setCollections([]);
            } finally {
            }
        };

        fetchCollections();
    }, []);

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/public/merch/settings');
                const data = await res.json();
                setSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
            }
        };

        fetchSettings();
    }, []);

    // Track page view
    useEffect(() => {
        analytics.trackPageView('merch', '/merchandise');
    }, []);


    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        Object.keys(sectionRefs.current).forEach((key) => {
            const element = sectionRefs.current[key];
            if (element) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                setVisibleSections((prev) => new Set(prev).add(key));
                            }
                        });
                    },
                    { threshold: 0.1 }
                );
                observer.observe(element);
                observers.push(observer);
            }
        });

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, []);

    const isVisible = (key: string) => visibleSections.has(key);

    // Icon mapping for collections
    const iconMap: Record<string, React.ReactNode> = {
        'Apparel': <Shirt size={32} />,
        'Drinkware': <Coffee size={32} />,
        'Office': <PenTool size={32} />,
        'Bags': <ShoppingBag size={32} />,
        'Hampers': <Gift size={32} />,
        'Gift': <Gift size={32} />
    };

    // Fallback categories if no collections from CMS
    const fallbackCategories = [
        { name: "Apparel", items: "T-shirts, Hoodies, Jackets", icon: <Shirt size={32} />, link: "/merchandise/collections/apparel" },
        { name: "Drinkware", items: "Tumblers, Bottles", icon: <Coffee size={32} />, link: "/merchandise/collections/drinkware" },
        { name: "Office & Stationery Kits", items: "Notebooks, Pens, Desk Organizers", icon: <PenTool size={32} />, link: "/merchandise/collections/office-kits" },
        { name: "Bags", items: "Totebags, Drawstring Bags", icon: <ShoppingBag size={32} />, link: "/merchandise/collections/bags" },
        { name: "Corporate & Event Hampers", items: "Custom Gift Sets", icon: <Gift size={32} />, link: "/merchandise/collections/hampers" },
    ];

    // Use collections from CMS if available, otherwise use fallback
    const displayCategories = collections.length > 0
        ? collections.map(col => ({
            name: col.name,
            items: col.heroSubtitle,
            icon: iconMap[col.name] || <Package size={32} />,
            image: col.coverImage,
            link: `/merchandise/collections/${col.slug}`
        }))
        : fallbackCategories;

    const packages = [
        { title: "Employee Onboarding Kit", desc: "Welcome new hires with a premium kit." },
        { title: "Event & Seminar Pack", desc: "Essentials for your next corporate event." },
        { title: "Premium Corporate Gifts", desc: "High-end gifts for VIP clients." },
    ];

    return (
        <div className="flex flex-col gap-24 pb-20">
            {/* Hero Slider - Dynamic Content from CMS */}
            {!isLoadingSlides && heroSlides.length > 0 && (
                <HeroSlider brandSlug="merch" slides={heroSlides} />
            )}

            {/* Fallback if no slides */}
            {!isLoadingSlides && heroSlides.length === 0 && (
                <section className="bg-amber-50/70 py-20 sm:py-24 md:py-28">
                    <div className="mx-auto max-w-5xl px-4 md:px-6 text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight tracking-tight">
                            {settings?.heroTitle || 'Modern Brands Deserve Thoughtful Merchandise'}
                        </h1>
                        <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-3xl leading-relaxed mx-auto">
                            {settings?.heroSubtitle || 'ACHIERA Merchandise helps companies create lasting impressions with high-quality products.'}
                        </p>
                        {settings?.heroTagline && (
                            <p className="mt-4 text-sm text-amber-700 font-medium">
                                {settings.heroTagline}
                            </p>
                        )}
                        {settings?.highlightLine && (
                            <div className="mt-8">
                                <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm font-medium">
                                    {settings.highlightLine}
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            )}



            {/* Categories - Editorial Style - DYNAMIC FROM CMS */}
            <section
                ref={(el) => { sectionRefs.current['categories'] = el; }}
                className="container mx-auto px-4 md:px-6"
            >
                <h2 className={`text-3xl md:text-5xl font-serif italic text-[var(--foreground)] mb-12 text-center transition-all duration-700 transform ${isVisible('categories') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    Curated Collections
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayCategories.map((cat, idx) => (
                        <Link
                            href={cat.link}
                            key={idx}
                            className={`group relative overflow-hidden rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 transform ${isVisible('categories') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                            style={{ transitionDelay: `${idx * 100 + 200}ms` }}
                        >
                            <div className="aspect-[4/3] bg-[var(--muted)]/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 relative">
                                {(cat as any).image ? (
                                    <img
                                        src={(cat as any).image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-[var(--primary)] opacity-50 group-hover:opacity-100 transition-opacity duration-500">{cat.icon}</div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">{cat.name}</h3>
                                <p className="text-[var(--muted-foreground)] mb-4">{cat.items}</p>
                                <div className="flex items-center text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    View Collection <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Packages - Clean & Minimal */}
            <section
                ref={(el) => { sectionRefs.current['packages'] = el; }}
                className="container mx-auto px-4 md:px-6"
            >
                <div className="bg-[var(--muted)]/20 rounded-3xl p-10 md:p-16 border border-[var(--border)]">
                    <h2 className={`text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-12 text-center transition-all duration-700 transform ${isVisible('packages') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        Ready-to-Go Packages
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg, idx) => (
                            <div
                                key={idx}
                                className={`bg-[var(--background)] p-8 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:-translate-y-1 transition-all duration-500 shadow-sm hover:shadow-lg transform ${isVisible('packages') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                    }`}
                                style={{ transitionDelay: `${idx * 150 + 300}ms` }}
                            >
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Package size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">{pkg.title}</h3>
                                <p className="text-[var(--muted-foreground)]">{pkg.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow - Interactive Process */}
            <MerchandiseWorkflow />

            {/* CTA */}
            <section
                ref={(el) => { sectionRefs.current['cta'] = el; }}
                className="container mx-auto px-4 md:px-6 text-center"
            >
                <div className={`transition-all duration-700 transform ${isVisible('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-8">Ready to elevate your brand merchandise?</h2>
                    <Link href="/contact">
                        <Button variant="primary" size="lg" className="shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">Request Catalogue</Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
