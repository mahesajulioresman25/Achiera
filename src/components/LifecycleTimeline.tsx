'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function LifecycleTimeline() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const steps = [
        { title: "Discovery", desc: "Requirements gathering & technical feasibility analysis." },
        { title: "Architecture", desc: "System design, stack selection & roadmap planning." },
        { title: "Development", desc: "Agile implementation with rigorous code quality standards." },
        { title: "Deployment", desc: "CI/CD pipelines, monitoring setup & handover." }
    ];

    return (
        <section ref={sectionRef} className="container mx-auto px-4 md:px-6">
            <div className="border-t border-[var(--border)] pt-24">
                <h2
                    className={`text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-20 text-center tracking-tight transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    The Development Lifecycle
                </h2>

                <div className="relative">
                    {/* Background Line */}
                    <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-[var(--border)] rounded-full" />

                    {/* Animated Progress Line */}
                    <div
                        className="hidden md:block absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-[2000ms] ease-out"
                        style={{ width: isVisible ? '100%' : '0%' }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative pt-8 md:text-center group">
                                {/* Dot Container */}
                                <div className="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 z-10">
                                    {/* Outer Ring (Pulse) */}
                                    <div
                                        className={`absolute inset-0 rounded-full bg-[var(--primary)]/20 transition-all duration-500 ${isVisible ? 'scale-150 opacity-100' : 'scale-0 opacity-0'
                                            }`}
                                        style={{ transitionDelay: `${idx * 400 + 500}ms` }}
                                    />

                                    {/* Main Dot */}
                                    <div
                                        className={`w-4 h-4 rounded-full bg-[var(--background)] border-2 transition-all duration-500 ${isVisible
                                                ? 'border-[var(--primary)] scale-100'
                                                : 'border-[var(--muted-foreground)] scale-0'
                                            }`}
                                        style={{ transitionDelay: `${idx * 400}ms` }}
                                    />
                                </div>

                                {/* Content */}
                                <div
                                    className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                        }`}
                                    style={{ transitionDelay: `${idx * 400 + 200}ms` }}
                                >
                                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 mt-4 group-hover:text-[var(--primary)] transition-colors duration-300">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
