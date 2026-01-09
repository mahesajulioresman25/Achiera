'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Service {
    name: string;
    icon: React.ReactNode;
}

interface AnimatedServicesProps {
    services: Service[];
}

export default function AnimatedServices({ services }: AnimatedServicesProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
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

    return (
        <section ref={sectionRef} id="services" className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className={`max-w-2xl transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4 tracking-tight">
                        Engineering Digital Excellence
                    </h2>
                    <p className="text-[var(--muted-foreground)] text-lg">
                        Comprehensive technology solutions tailored to optimize your operations and drive sustainable growth.
                    </p>
                </div>
                <Link
                    href="/contact"
                    className={`text-[var(--primary)] font-medium hover:text-[var(--primary-hover)] flex items-center transition-all duration-700 transform group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                    style={{ transitionDelay: '200ms' }}
                >
                    View All Services
                    <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, idx) => (
                    <div
                        key={idx}
                        className={`group p-8 rounded-xl bg-[var(--accent)]/30 border border-[var(--border)] hover:border-[var(--primary)]/30 hover:-translate-y-2 hover:shadow-xl hover:shadow-[var(--primary)]/10 transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                        style={{ transitionDelay: `${idx * 150 + 300}ms` }}
                    >
                        <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                            {service.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3 group-hover:text-[var(--primary)] transition-colors duration-300">
                            {service.name}
                        </h3>
                        <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                            Scalable, secure, and efficient architectures designed for modern enterprise needs.
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
