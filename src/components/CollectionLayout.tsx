'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Package, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import Button from './Button';
import CollectionGallery from './CollectionGallery';
import UseCasesSection from './UseCasesSection';
import PackagingOptionsSection from './PackagingOptionsSection';
import MiniWorkflowSection from './MiniWorkflowSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';

interface CollectionLayoutProps {
    name: string;
    intro: string;
    heroMeta: string[];
    highlights: string[];
    designOptions: string[];
    qualityPoints: string[];
    useCases: string[];
    faq: { question: string; answer: string }[];
    gallery?: string[]; // Optional gallery images
    cta?: {
        text: string;
        link: string;
    };
}

export default function CollectionLayout({
    name,
    intro,
    heroMeta,
    highlights,
    designOptions,
    qualityPoints,
    useCases,
    faq,
    gallery,
    cta = { text: "Request Catalogue", link: "/contact" }
}: CollectionLayoutProps) {
    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-amber-200">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/merchandise" className="flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collections
                    </Link>
                    <div className="text-stone-900 font-bold tracking-tight">ACHIERA <span className="text-amber-600">MERCH</span></div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-20 bg-amber-50/50 border-b border-amber-100">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6 border border-amber-200">
                            Collection
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif italic text-stone-900 mb-6">
                            {name}
                        </h1>
                        <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed mb-10">
                            {intro}
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-stone-500">
                            {heroMeta.map((meta, idx) => (
                                <span key={idx} className="flex items-center bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
                                    <Sparkles className="w-3 h-3 mr-2 text-amber-500" /> {meta}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Gallery Section - Optional */}
            {gallery && gallery.length > 0 && (
                <CollectionGallery images={gallery} />
            )}

            <main className="container mx-auto px-4 md:px-6 py-20 space-y-24">

                {/* Highlights & Design Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                    <section>
                        <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center">
                            <Package className="w-6 h-6 mr-3 text-amber-600" /> What's Inside
                        </h2>
                        <ul className="space-y-4">
                            {highlights.map((item, idx) => (
                                <li key={idx} className="flex items-start p-4 rounded-xl bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                    <Check className="w-5 h-5 text-green-600 mr-3 shrink-0 mt-0.5" />
                                    <span className="text-stone-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center">
                            <Palette className="w-6 h-6 mr-3 text-amber-600" /> Design Options
                        </h2>
                        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                            <ul className="space-y-4">
                                {designOptions.map((opt, idx) => (
                                    <li key={idx} className="flex items-center text-stone-600">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 mr-3" />
                                        {opt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Quality Section */}
                <section className="bg-stone-900 text-stone-100 rounded-3xl p-10 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-serif italic mb-6">Uncompromising Quality</h2>
                            <p className="text-stone-400 text-lg mb-8">
                                Every item in this collection is selected for durability, aesthetics, and daily utility. We don't do "throwaway" merch.
                            </p>
                            <Button variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white border-transparent">
                                Request Samples
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {qualityPoints.map((point, idx) => (
                                <div key={idx} className="flex items-start">
                                    <ShieldCheck className="w-6 h-6 text-amber-500 mr-3 shrink-0" />
                                    <span className="text-stone-300">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>

            {/* Use Cases Section */}
            <UseCasesSection />

            {/* Packaging Options Section */}
            <PackagingOptionsSection />

            {/* Mini Workflow Section */}
            <MiniWorkflowSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* CTA Section */}
            <CTASection />
        </div>
    );
}
