'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, Cpu, Code2 } from 'lucide-react';
import Button from './Button';

interface CaseStudyLayoutProps {
    title: string;
    subtitle: string;
    meta: {
        industry: string;
        scope: string;
        duration: string;
    };
    context: string;
    challenges: string[];
    solution: {
        overview: string;
        features: string[];
    };
    results: string[];
    techStack: string[];
    cta?: {
        text: string;
        link: string;
    };
}

export default function CaseStudyLayout({
    title,
    subtitle,
    meta,
    context,
    challenges,
    solution,
    results,
    techStack,
    cta = { text: "Start Your Transformation", link: "/contact" }
}: CaseStudyLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/it-solutions" className="flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to IT Solutions
                    </Link>
                    <div className="text-white font-bold tracking-tight">ACHIERA <span className="text-sky-500">IT</span></div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-20 border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider mb-6">
                            Case Study
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                            {title}
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
                            {subtitle}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/10 pt-8">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Industry</div>
                                <div className="text-white font-medium">{meta.industry}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scope</div>
                                <div className="text-white font-medium">{meta.scope}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Duration</div>
                                <div className="text-white font-medium">{meta.duration}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-20">

                        {/* Context & Challenges */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">The Challenge</h2>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8">
                                {context}
                            </p>
                            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Key Pain Points</h3>
                                <ul className="space-y-4">
                                    {challenges.map((challenge, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mr-4 shrink-0 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            </span>
                                            <span className="text-slate-300">{challenge}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Solution */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">The Solution</h2>
                            <p className="text-slate-300 text-lg leading-relaxed mb-8">
                                {solution.overview}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {solution.features.map((feature, idx) => (
                                    <div key={idx} className="p-6 rounded-xl bg-slate-900/30 border border-white/5 hover:border-sky-500/30 transition-colors group">
                                        <Layers className="w-6 h-6 text-sky-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <h3 className="text-white font-semibold mb-2">{feature.split(':')[0]}</h3>
                                        <p className="text-slate-400 text-sm">{feature.split(':')[1] || feature}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Results */}
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-8">Impact & Results</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {results.map((result, idx) => (
                                    <div key={idx} className="flex items-start p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mr-4 shrink-0" />
                                        <span className="text-slate-200 font-medium">{result}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-10">

                        {/* Tech Stack */}
                        <div className="p-8 rounded-2xl bg-slate-900/50 border border-white/10 sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                                <Code2 className="w-5 h-5 mr-2 text-sky-400" /> Technology Stack
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {techStack.map((tech, idx) => (
                                    <span key={idx} className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-sm border border-white/5">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">Ready to build?</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    Let's discuss how we can implement similar solutions for your business.
                                </p>
                                <Link href={cta.link} className="block">
                                    <Button variant="primary" className="w-full justify-center">
                                        {cta.text}
                                    </Button>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Footer CTA */}
            <section className="py-20 border-t border-white/5 bg-slate-900/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Start Your Transformation</h2>
                    <Link href="/contact">
                        <Button variant="outline" size="lg" className="px-8">
                            Contact Our Team <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
