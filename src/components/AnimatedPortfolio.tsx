'use client';

import React, { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { ArrowRight, Layers } from 'lucide-react';

export default function AnimatedPortfolio() {
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

    const projects = [
        {
            title: "Smart Warehouse Automation",
            category: "IoT & Automation",
            desc: "Real-time inventory tracking system with 99.9% accuracy.",
            link: "/it-solutions/case-studies/smart-warehouse-automation"
        },
        {
            title: "Enterprise ERP Migration",
            category: "System Integration",
            desc: "Seamless transition to Odoo for a manufacturing giant.",
            link: "/it-solutions/case-studies/enterprise-erp-migration"
        }
    ];

    return (
        <section ref={sectionRef} className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold text-[var(--foreground)] tracking-tight transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                    }`}>
                    Recent Work
                </h2>
                <Button
                    variant="outline"
                    className={`hidden md:flex transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                        }`}
                >
                    View Full Portfolio
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.map((project, idx) => (
                    <div
                        key={idx}
                        className={`group relative aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--accent)]/20 hover:border-[var(--primary)]/50 hover:shadow-2xl hover:shadow-[var(--primary)]/20 transition-all duration-700 transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            }`}
                        style={{ transitionDelay: `${idx * 200 + 300}ms` }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                            <Layers size={80} className="text-[var(--foreground)] group-hover:scale-110 transition-transform duration-500" />
                        </div>

                        <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-[var(--background)]/90 to-transparent">
                            <span className="text-[var(--primary)] text-xs font-bold tracking-wider uppercase mb-2 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                                {project.category}
                            </span>
                            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                                {project.title}
                            </h3>
                            <p className="text-[var(--muted-foreground)] text-sm max-w-md mb-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                {project.desc}
                            </p>
                            <a href={project.link} className="flex items-center text-[var(--foreground)] text-sm font-medium group-hover:text-[var(--primary)] transition-colors duration-300">
                                View Case Study <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-2" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
            <div className={`mt-8 md:hidden transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '600ms' }}>
                <Button variant="outline" className="w-full">View Full Portfolio</Button>
            </div>
        </section>
    );
}
