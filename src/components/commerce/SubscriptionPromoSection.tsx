'use client';

import React from 'react';
// import { motion } from 'framer-motion';
import { Calendar, Heart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPromoSectionProps {
    startFromPrice?: number;
    interval?: string;
    tagline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    benefits?: Array<{ title: string; desc: string }>;
    buttonText?: string;
    imageUrl?: string;
}

export default function SubscriptionPromoSection({
    startFromPrice = 150000,
    interval = 'minggu',
    tagline = 'Paket Rantau',
    title = 'Kehangatan Ibu',
    subtitle = 'Dikirim Berkala',
    description = 'Tak perlu lagi pusing memikirkan stok lauk di kost atau apartemen. Langganan paket katering beku Rasa Ibu, otomatis dikirim setiap minggu atau bulan.',
    benefits = [
        { title: "Tanpa Ribet", desc: "Cukup daftar sekali, makanan datang rutin sesuai jadwal." },
        { title: "Prioritas Stok", desc: "Stok Anda diamankan lebih dulu, anti kehabisan." },
        { title: "Bayar Dulu, Baru Kirim", desc: "Sistem invoice otomatis, aman dan teratur." }
    ],
    buttonText = 'Mulai Berlangganan',
    imageUrl = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80'
}: SubscriptionPromoSectionProps) {
    return (
        <section className="py-20 bg-[#2D3A2D] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div
                        className="animate-fade-in-up"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#B2BCA2]/20 border border-[#B2BCA2]/30 text-[#B2BCA2] text-xs font-bold tracking-[0.2em] mb-6 uppercase">
                            {tagline}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#FDFBF7] mb-6 leading-tight font-serif">
                            {title} <br />
                            <span className="text-[#B2BCA2] italic">{subtitle}</span>
                        </h2>
                        <p className="text-[#E5E1D8] text-lg mb-8 leading-relaxed max-w-lg">
                            {description}
                        </p>

                        <div className="space-y-6 mb-10">
                            {benefits.map((item, idx) => {
                                const Icon = idx === 0 ? Calendar : idx === 1 ? ShieldCheck : Heart;
                                return (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#B2BCA2] flex items-center justify-center text-[#2D3A2D] flex-shrink-0">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[#FDFBF7] font-bold text-lg">{item.title}</h4>
                                            <p className="text-[#E5E1D8]/80 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Link href="/rasa-ibu/subscribe">
                            <button className="px-8 py-4 bg-[#B2BCA2] hover:bg-[#A3AD94] text-[#2D3A2D] rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                                {buttonText}
                            </button>
                        </Link>
                    </div>

                    <div
                        className="relative transition-transform hover:scale-105 duration-500"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#B2BCA2]/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <img
                                src={imageUrl}
                                alt="Paket Rantau Box"
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl inline-block">
                                    <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">Mulai Dari</p>
                                    <p className="text-white text-2xl font-black">
                                        Rp {startFromPrice.toLocaleString('id-ID')}
                                        <span className="text-sm font-normal text-white/70">/{interval}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Circle */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#BD302D] rounded-full blur-[100px] opacity-20"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#B2BCA2] rounded-full blur-[100px] opacity-20"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
