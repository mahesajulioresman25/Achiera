'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layout, Info, ListOrdered, Home, Smartphone, CheckCircle2 } from 'lucide-react';

interface CMSLivePreviewProps {
    data: any;
}

export default function CMSLivePreview({ data }: CMSLivePreviewProps) {
    const [view, setView] = useState<'HOME' | 'ABOUT' | 'HOW_TO_ORDER'>('HOME');

    const renderHome = () => (
        <div className="space-y-0 text-[#2D3A2D] bg-white rounded-3xl overflow-hidden border border-[#E5E1D8] shadow-inner h-[800px] overflow-y-auto custom-scrollbar">
            {/* 1. Hero Section */}
            <section className="relative h-[500px] flex items-center overflow-hidden bg-[#FDFBF7]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gray-200">
                    {data.heroImage ? (
                        <img src={data.heroImage} alt="Hero" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[#E5E1D8] flex items-center justify-center italic text-gray-400 text-[10px]">
                            [Hero Image Space]
                        </div>
                    )}
                </div>
                <div className="relative z-20 px-8 w-full">
                    <div className="max-w-md space-y-4">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{data.heroTagline}</span>
                        <h1 className="text-3xl font-black leading-tight tracking-tight text-[#1A241A] whitespace-pre-line">
                            {data.publicTitle}
                        </h1>
                        <p className="text-sm font-medium text-[#4A5D4A] leading-relaxed whitespace-pre-line">
                            {data.publicSubtitle}
                        </p>
                        <div className="flex gap-3 pt-2">
                            <div className="bg-[#2D3A2D] text-white px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest text-center shadow-lg shadow-slate-900/10">
                                {data.heroCtaPrimary}
                            </div>
                            <div className="bg-white border border-[#E5E1D8] text-[#2D3A2D] px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest text-center">
                                {data.heroCtaSecondary}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Trust Badges */}
            <section className="py-12 border-y border-[#E5E1D8] bg-white">
                <div className="px-8 grid grid-cols-2 gap-8">
                    {(data.trustBadges || []).map((badge: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-2">
                            <div className="h-10 w-10 bg-[#F9F7F2] rounded-full flex items-center justify-center text-[#8B7E66]">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h4 className="text-[7px] font-black uppercase tracking-widest">{badge.title}</h4>
                            <p className="text-[8px] text-gray-500 font-medium leading-tight">{badge.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Featured Section */}
            <section className="py-16 px-8">
                <div className="space-y-2 mb-8 text-center">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{data.featuredTagline}</span>
                    <h2 className="text-2xl font-black tracking-tight">{data.featuredSectionTitle}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F9F7F2] aspect-[4/5] rounded-2xl flex items-center justify-center italic text-gray-300 text-[8px]">[Product 1]</div>
                    <div className="bg-[#F9F7F2] aspect-[4/5] rounded-2xl flex items-center justify-center italic text-gray-300 text-[8px]">[Product 2]</div>
                </div>
            </section>

            {/* 4. Philosophy Section */}
            <section className="py-16 bg-[#2D3A2D] text-[#FDFBF7] px-8">
                <div className="space-y-6">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{data.philosophyTagline}</span>
                    <h2 className="text-3xl font-black tracking-tight leading-tight whitespace-pre-line">
                        {data.philosophyTitle}
                    </h2>
                    <div className="space-y-4 text-[#A0A8A0] text-xs font-medium leading-relaxed whitespace-pre-line">
                        {data.philosophyContent}
                    </div>
                </div>
            </section>

            {/* 5. Platform Section */}
            <section className="py-12 bg-[#FDFBF7]/50 border-y border-[#E5E1D8] px-8 text-center space-y-8">
                <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{data.platformTagline}</span>
                    <h2 className="text-xl font-black tracking-tight">{data.platformSectionTitle}</h2>
                </div>
                <div className="flex justify-center gap-4 opacity-50 grayscale scale-75">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Shopee_Logo.svg" className="h-6" alt="" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/Grab_logo.svg" className="h-6" alt="" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Gojek_logo_2019.svg" className="h-6" alt="" />
                </div>
            </section>

            {/* 6. CTA Section */}
            <section className="py-20 text-center px-8 space-y-6">
                <h2 className="text-2xl font-black tracking-tight">{data.ctaSectionTitle}</h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{data.ctaSectionSubtitle}</p>
                <div className="inline-block px-10 py-5 bg-[#25D366] text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl shadow-green-900/20">
                    {data.ctaButtonText}
                </div>
            </section>
        </div>
    );

    const renderAbout = () => (
        <div className="space-y-0 text-[#2D3A2D] bg-white rounded-3xl overflow-hidden border border-[#E5E1D8] shadow-inner h-[800px] overflow-y-auto custom-scrollbar">
            {/* Intro */}
            <section className="p-12 space-y-6">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{data.aboutHeroSubtitle}</span>
                <h1 className="text-4xl font-black tracking-tight text-[#1A241A] leading-tight">
                    {data.aboutHeroTitle}
                </h1>
            </section>

            {/* Story */}
            <section className="bg-[#1A241A] text-[#FDFBF7] py-16 px-12 space-y-8">
                <h2 className="text-2xl font-black tracking-tight">{data.aboutStoryTitle}</h2>
                <div className="space-y-4 text-[#A0A8A0] text-xs font-medium leading-relaxed">
                    {(data.aboutStoryContent || []).map((p: string, i: number) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>

            {/* Pillars */}
            <section className="p-12 space-y-12">
                <h2 className="text-2xl font-black tracking-tight text-center">{data.aboutValuesTitle}</h2>
                <div className="space-y-8">
                    {(data.aboutValuesList || []).map((v: any, i: number) => (
                        <div key={i} className="space-y-3">
                            <span className="text-2xl font-serif italic text-[#8B7E66]">0{i + 1}.</span>
                            <h3 className="text-sm font-black uppercase tracking-widest">{v.title}</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-8 mb-12 bg-[#F9F7F2] rounded-[2rem] p-10 text-center space-y-6">
                <h2 className="text-xl font-black tracking-tight">{data.aboutCtaTitle}</h2>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{data.aboutCtaContent}</p>
                <div className="flex flex-col gap-3">
                    <div className="text-[8px] font-black uppercase tracking-widest border-b-2 border-[#1A241A] pb-1 inline-block mx-auto">{data.aboutCtaPrimary}</div>
                </div>
            </section>
        </div>
    );

    const renderHowToOrder = () => (
        <div className="space-y-0 text-[#2D3A2D] bg-white rounded-3xl overflow-hidden border border-[#E5E1D8] shadow-inner h-[800px] overflow-y-auto custom-scrollbar">
            <section className="p-12 space-y-4 text-center">
                <h1 className="text-3xl font-black tracking-tight">{data.howToOrderHeroTitle}</h1>
                <p className="text-sm text-gray-500 font-medium">{data.howToOrderHeroSubtitle}</p>
            </section>

            <section className="px-12 pb-16 space-y-8">
                {(data.howToOrderSteps || []).map((step: any, i: number) => (
                    <div key={i} className="flex gap-6 items-start">
                        <span className="text-2xl font-black text-[#E5E1D8]">{step.step}</span>
                        <div className="space-y-1">
                            <h3 className="text-sm font-black uppercase tracking-widest">{step.title}</h3>
                            <p className="text-xs text-gray-500 font-medium">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </section>

            <section className="mx-8 bg-[#2D3A2D] rounded-[2rem] p-10 text-[#FDFBF7] space-y-6">
                <h3 className="text-lg font-black tracking-tight">{data.howToOrderInfoTitle}</h3>
                <ul className="space-y-3">
                    {(data.howToOrderInfoList || []).map((info: string, i: number) => (
                        <li key={i} className="flex gap-3 text-xs opacity-80 leading-relaxed">
                            <div className="w-1.5 h-1.5 bg-[#8B7E66] rounded-full mt-1.5 shrink-0" />
                            {info}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );

    return (
        <div className="sticky top-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66]">Live Preview</span>
                </div>
                <div className="flex bg-[#F9F7F2] p-1 rounded-xl gap-1">
                    <button onClick={() => setView('HOME')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'HOME' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}>Home</button>
                    <button onClick={() => setView('ABOUT')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'ABOUT' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}>About</button>
                    <button onClick={() => setView('HOW_TO_ORDER')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'HOW_TO_ORDER' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}>Order</button>
                </div>
            </div>

            {view === 'HOME' && renderHome()}
            {view === 'ABOUT' && renderAbout()}
            {view === 'HOW_TO_ORDER' && renderHowToOrder()}

            <p className="text-[9px] text-slate-400 font-bold italic text-center uppercase tracking-widest opacity-60">
                Tampilan di atas adalah simulasi live sesuai data Bunda.
            </p>
        </div>
    );
}
