'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hero from '@/components/Hero';
import Button from '@/components/Button';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
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
        <div className="flex flex-col gap-20 pb-20">
            <Hero
                heading="Contact ACHIERA"
                subheading="Tell us what you need—our team is ready to help."
                align="center"
            />

            <section
                ref={(el) => { sectionRefs.current['contact'] = el; }}
                className="container mx-auto px-4 md:px-6"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Form */}
                    <div className={`bg-[var(--muted)]/20 p-8 md:p-10 rounded-3xl border border-[var(--border)] transition-all duration-700 transform ${isVisible('contact') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                        }`}>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-8">Send us a message</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-[var(--muted-foreground)]">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-[var(--muted-foreground)]">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="company" className="text-sm font-medium text-[var(--muted-foreground)]">Company</label>
                                <input
                                    type="text"
                                    id="company"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                                    placeholder="Company Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="service" className="text-sm font-medium text-[var(--muted-foreground)]">Service Needed</label>
                                <select
                                    id="service"
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                                >
                                    <option value="">Select a service...</option>
                                    <option value="merchandise">Merchandise Solutions</option>
                                    <option value="it">IT Solutions</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-[var(--muted-foreground)]">Message</label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors resize-none"
                                    placeholder="Tell us about your project..."
                                />
                            </div>

                            <Button variant="primary" size="lg" className="w-full hover:scale-105 transition-transform duration-300">
                                Send Message
                            </Button>
                        </form>
                    </div>

                    {/* Direct Contact Info */}
                    <div className={`flex flex-col justify-center space-y-8 transition-all duration-700 transform ${isVisible('contact') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                        }`}
                        style={{ transitionDelay: '200ms' }}
                    >
                        <div>
                            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-6">Get in Touch</h2>
                            <p className="text-[var(--muted-foreground)] text-lg mb-10">
                                Prefer to talk directly? Reach out to us via email or WhatsApp. We're here to answer any questions you may have.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <a href="mailto:Achiera.id@gmail.com" className="flex items-center p-6 rounded-2xl bg-[var(--muted)]/20 border border-[var(--border)] hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mr-6 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:scale-110 transition-all duration-300">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)] mb-1">Email Us</p>
                                    <p className="text-xl font-bold text-[var(--foreground)]">Achiera.id@gmail.com</p>
                                </div>
                            </a>

                            <a href="https://wa.me/6282215191435" className="flex items-center p-6 rounded-2xl bg-[var(--muted)]/20 border border-[var(--border)] hover:border-[var(--primary)]/50 hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mr-6 group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:scale-110 transition-all duration-300">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)] mb-1">WhatsApp</p>
                                    <p className="text-xl font-bold text-[var(--foreground)]">+62 0822-1519-1435</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
