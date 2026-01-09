import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuAboutPage() {
    // Fetch Brand RASA IBU
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    const config = brand?.brandConfig as any;

    // Mapping CMS fields
    const heroTitle = config?.aboutHeroTitle || "Berawal dari Kejujuran Dapur.";
    const heroSubtitle = config?.aboutHeroSubtitle || "Tentang Rasa Ibu";
    const storyTitle = config?.aboutStoryTitle || "Kisah Kami";
    const storyContent = Array.isArray(config?.aboutStoryContent) ? config.aboutStoryContent : [
        "Dimulai dari tahun 2022, saat sang pendiri menyadari betapa sulitnya menemukan makanan siap saji yang tidak mengandalkan pengawet dan penyedap rasa berlebih.",
        "Kami percaya bahwa makanan adalah bahasa cinta paling universal. Namun, rasa sayang itu akan hilang jika makanan yang kita sajikan untuk keluarga mengandung bahan-bahan kimia yang tidak kita pahami.",
        "Itulah mengapa di Rasa Ibu, kami menerapkan prinsip \"Clean Label\". Jika bahan tersebut tidak ada di dapur ibu Anda, maka tidak akan ada di dapur kami."
    ];
    const storyImage = config?.aboutStoryImage || null;

    // Pillars
    const valuesTitle = config?.aboutValuesTitle || "Tiga Pilar Kami";
    const valuesList = config?.aboutValuesList || [
        { title: 'Kualitas Bahan', desc: 'Kami bekerja sama dengan peternak dan petani lokal untuk memastikan setiap potongan daging dan sayur adalah yang terbaik.' },
        { title: 'Higienitas', desc: 'Dapur kami melewati audit kebersihan ketat setiap minggunya. Keamanan pangan adalah prioritas kami.' },
        { title: 'Ketulusan', desc: 'Setiap kemasan Rasa Ibu dibuat dengan doa dan harapan agar meja makan Anda selalu dipenuhi kehangatan.' },
    ];

    // CTA
    const ctaTitle = config?.aboutCtaTitle || "Ingin Kenal Lebih Dekat?";
    const ctaContent = config?.aboutCtaContent || "Kami sangat terbuka untuk mendengar saran, kritik, atau sekadar cerita tentang momen makan malam Anda.";
    const ctaPrimary = config?.aboutCtaPrimary || "Hubungi Kami";
    const ctaPrimaryLink = config?.aboutCtaPrimaryLink || "/rasa-ibu/contact";
    const ctaSecondary = config?.aboutCtaSecondary || "Lihat Menu";
    const ctaSecondaryLink = config?.aboutCtaSecondaryLink || "/rasa-ibu/products";

    return (
        <div className="py-16 md:py-24 space-y-24 md:space-y-32">
            {/* 1. Intro Section */}
            <section className="max-w-7xl mx-auto px-6">
                <div className="max-w-3xl space-y-6 md:space-y-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{heroSubtitle}</span>
                    <h1 className="text-3xl md:text-6xl font-black tracking-tight text-[#1A241A] leading-tight whitespace-pre-line">
                        {heroTitle}
                    </h1>
                </div>
            </section>

            {/* 2. Story Grid */}
            <section className="bg-[#1A241A] text-[#FDFBF7] py-20 md:py-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                    <div className="aspect-[4/5] bg-white/5 rounded-[2rem] md:rounded-[3rem] overflow-hidden">
                        {storyImage ? (
                            <img src={storyImage} alt="Kisah Kami" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center italic text-white/10 p-12 text-center text-sm">
                                [Pilih gambar di Dashboard &gt; Website Content &gt; About Page]
                            </div>
                        )}
                    </div>
                    <div className="space-y-8 md:space-y-10">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{storyTitle}</h2>
                        <div className="space-y-4 md:space-y-6 text-[#A0A8A0] font-medium leading-relaxed">
                            {storyContent.map((para: string, idx: number) => (
                                <p key={idx} className={idx === storyContent.length - 1 ? "text-[#FDFBF7]" : ""}>
                                    {para}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. The Pillars */}
            <section className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-16 md:mb-24 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">{valuesTitle}</h2>
                    <div className="h-1 w-20 bg-[#8B7E66] mx-auto"></div>
                </div>

                <div className="flex flex-col md:flex-row flex-wrap justify-center items-center md:items-start gap-12 md:gap-24 lg:gap-32">
                    {valuesList.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-4 md:space-y-6 max-w-sm w-full md:w-[25%] flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-3xl md:text-4xl font-serif italic text-[#8B7E66]">0{idx + 1}.</span>
                            <div className="space-y-2">
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-widest">{item.title}</h3>
                                <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed whitespace-pre-line">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Contact Hook */}
            <section className="max-w-7xl mx-auto px-6 pb-24 md:pb-40">
                <div className="bg-[#F9F7F2] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center space-y-8 md:space-y-10">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">{ctaTitle}</h2>
                    <p className="text-xs md:text-sm text-gray-500 font-medium max-w-xl mx-auto leading-relaxed whitespace-pre-line">
                        {ctaContent}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-4">
                        <Link href={ctaPrimaryLink} className="text-xs font-black uppercase tracking-widest border-b-2 border-[#1A241A] pb-1 hover:text-[#8B7E66] hover:border-[#8B7E66] transition-colors">
                            {ctaPrimary}
                        </Link>
                        <Link href={ctaSecondaryLink} className="text-xs font-black uppercase tracking-widest border-b-2 border-[#1A241A] pb-1 hover:text-[#8B7E66] hover:border-[#8B7E66] transition-colors">
                            {ctaSecondary}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
