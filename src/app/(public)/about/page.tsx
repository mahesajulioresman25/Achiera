'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hero from '@/components/Hero';
import { Target, Eye, Heart } from 'lucide-react';

export default function AboutPage() {
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

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

    return (
        <div className="flex flex-col gap-24 pb-20">
            <Hero
                heading="About ACHIERA"
                subheading="We believe every challenge has a solution—and our mission is to turn those challenges into opportunities."
                align="center"
            />

            {/* Who We Are */}
            <section
                ref={(el) => { sectionRefs.current['who-we-are'] = el; }}
                className="container mx-auto px-4 md:px-6"
            >
                <div className={`max-w-4xl mx-auto text-center transition-all duration-700 transform ${isVisible('who-we-are') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-8">Who We Are</h2>
                    <p className="text-xl text-[var(--muted-foreground)] leading-relaxed">
                        ACHIERA is a company specializing in brand merchandising and IT solutions. We combine creativity with technology to provide comprehensive solutions that help businesses grow and succeed in a digital world.
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            <section
                ref={(el) => { sectionRefs.current['vision-mission'] = el; }}
                className="container mx-auto px-4 md:px-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Vision */}
                    <div className={`bg-[var(--muted)]/20 p-10 rounded-3xl border border-[var(--border)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 transform ${isVisible('vision-mission') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                        }`}>
                        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mb-8 hover:scale-110 transition-transform duration-300">
                            <Eye size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">Vision</h2>
                        <p className="text-lg text-[var(--muted-foreground)]">
                            To become a strategic partner that transforms business challenges into sustainable opportunities.
                        </p>
                    </div>

                    {/* Mission */}
                    <div className={`bg-[var(--muted)]/20 p-10 rounded-3xl border border-[var(--border)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 transform ${isVisible('vision-mission') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                        }`}
                        style={{ transitionDelay: '200ms' }}
                    >
                        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mb-8 hover:scale-110 transition-transform duration-300">
                            <Target size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">Mission</h2>
                        <ul className="space-y-4 text-lg text-[var(--muted-foreground)]">
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-[var(--primary)] rounded-full mr-4" />
                                Deliver premium merchandise
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-[var(--primary)] rounded-full mr-4" />
                                Develop scalable IT solutions
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-[var(--primary)] rounded-full mr-4" />
                                Maintain transparent relationships
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-[var(--primary)] rounded-full mr-4" />
                                Innovate continuously
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section
                ref={(el) => { sectionRefs.current['values'] = el; }}
                className="container mx-auto px-4 md:px-6 text-center"
            >
                <h2 className={`text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-16 transition-all duration-700 transform ${isVisible('values') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    Our Core Values
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        "Integrity",
                        "Innovation",
                        "Collaboration",
                        "Customer Impact"
                    ].map((value, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col items-center p-6 rounded-xl hover:bg-[var(--muted)]/30 hover:-translate-y-2 transition-all duration-500 transform ${isVisible('values') ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                                }`}
                            style={{ transitionDelay: `${idx * 100 + 200}ms` }}
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-[var(--primary-foreground)] mb-6 shadow-lg shadow-[var(--primary)]/30 hover:scale-110 transition-transform duration-300">
                                <Heart size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)]">{value}</h3>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
