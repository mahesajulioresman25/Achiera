import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * HOW TO ORDER PAGE
 * Purpose: Bridges the gap between digital discovery and manual WhatsApp fulfillment.
 * Constraints: No automated checkout, trust-driven process.
 */
export default async function RasaIbuHowToOrderPage() {
    // Fetch Brand Config
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    const config = brand?.brandConfig || ({} as any);
    const settings = brand?.paymentSettings as any;
    const whatsapp = settings?.whatsappCrm || '628123456789';

    // Parse JSON fields safely
    const steps = (config.howToOrderSteps as any[]) || [
        { step: '01', title: 'Pilih Menu', desc: 'Telusuri katalog produk kami dan pilih menu yang ingin Anda sajikan untuk keluarga.' },
        { step: '02', title: 'Klik Chat WA', desc: 'Klik tombol WhatsApp di halaman produk atau beranda untuk terhubung dengan assistant kami.' },
        { step: '03', title: 'Konfirmasi Stok', desc: 'Assistant kami akan mengonfirmasi ketersediaan stok dan menghitung ongkos kirim tercepat.' },
        { step: '04', title: 'Kirim & Nikmati', desc: 'Setelah pembayaran terverifikasi, pesanan akan dikirim via kurir Instant/Sameday.' }
    ];

    const infoList = (config.howToOrderInfoList as string[]) || [
        'Kualitas masakan kami terjaga karena dikirim dalam keadaan beku (frozen).',
        'Saat ini hanya melayani pengiriman area JABODETABEK via Instant & Sameday untuk menjaga rantai dingin.',
        'Pemesanan di atas jam 15:00 akan dikirim keesokan harinya.'
    ];

    return (
        <div className="py-24 max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="max-w-xl space-y-4 mb-24">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Pemesanan</span>
                <h1 className="text-5xl font-black tracking-tight text-[#1A241A]">{config.howToOrderHeroTitle || "Mudah & Personal."}</h1>
                <p className="text-sm font-medium text-[#4A5D4A] leading-relaxed">
                    {config.howToOrderHeroSubtitle || "Kami memilih untuk melayani Anda secara personal via WhatsApp untuk memastikan setiap detail pengiriman dan kualitas stok terjaga hingga ke tangan Anda."}
                </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-40">
                {steps.map((item: any, idx: number) => (
                    <div key={idx} className="p-10 bg-white border border-[#E5E1D8] rounded-[2.5rem] space-y-6 hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
                        <span className="text-4xl font-serif italic text-[#8B7E66] group-hover:scale-110 transition-transform inline-block">{item.step}</span>
                        <h3 className="text-xl font-black uppercase tracking-widest text-[#1A241A]">{item.title}</h3>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Delivery Logic Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center p-12 bg-[#2D3A2D] rounded-[3rem] text-[#FDFBF7]">
                <div className="space-y-6 px-4">
                    <h2 className="text-3xl font-black tracking-tight">{config.howToOrderInfoTitle || "Penting Untuk Diketahui"}</h2>
                    <ul className="space-y-4">
                        {infoList.map((text: string, idx: number) => (
                            <li key={idx} className="flex gap-4 items-start">
                                <span className="text-[#8B7E66] font-bold">•</span>
                                <p className="text-sm font-medium text-[#A0A8A0]">{text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="aspect-[4/3] bg-white/5 rounded-3xl flex items-center justify-center italic text-white/10 overflow-hidden relative">
                    {config.howToOrderInfoImage ? (
                        <img src={config.howToOrderInfoImage} alt="Info" className="w-full h-full object-cover" />
                    ) : (
                        <span>[Ilustrasi: Kurir mengantar paket beku dengan hati-hati]</span>
                    )}
                </div>
            </div>

            {/* Final CTA Bridge */}
            <div className="mt-40 text-center space-y-12">
                <h2 className="text-4xl font-black tracking-tight">{config.howToOrderCtaTitle || "Mari Hadirkan Kehangatan di Meja Makan Bunda"}</h2>
                <div className="flex justify-center flex-col sm:flex-row gap-6">
                    <Link href={config.howToOrderCtaPrimaryLink || "/rasa-ibu/products"} className="bg-[#1A241A] text-white px-12 py-6 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        {config.howToOrderCtaPrimary || "Lihat Menu Cinta Kami"}
                    </Link>
                    <a
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Rasa Ibu, saya ingin tanya pengiriman ke area saya...")}`}
                        className="border-2 border-[#1A241A] text-[#1A241A] px-12 py-6 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#FDFBF7] transition-all"
                    >
                        {config.howToOrderCtaSecondary || "Tanya Bunda Soal Pengiriman"}
                    </a>
                </div>
            </div>
        </div>
    );
}
