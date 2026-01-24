import React from 'react';
import { prisma } from '@/lib/prisma';
import BundleCard from '@/components/commerce/BundleCard';
import ProductCard from '@/components/ProductCard';
import { Megaphone, Star, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;


    // Note: Since this is a server component in (public), we can fetch directly.
    return (
        <CampaignContent slug={slug} />
    );
}

// Separate component for easier structure
async function CampaignContent({ slug }: { slug: string }) {
    const campaign = await prisma.campaign.findFirst({
        where: { slug },
        include: {
            bundles: {
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!campaign) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-black text-stone-300 mb-4">404</h1>
                <p className="text-stone-500 font-medium">Kampanye tidak ditemukan.</p>
                <Link href="/" className="mt-8 text-amber-600 font-bold underline">Kembali Beranda</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Header */}
            <div className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-[#2D3A2D]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-12 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Ke Toko</span>
                    </Link>

                    <div className="inline-flex items-center gap-2 bg-amber-500/20 px-6 py-2 rounded-full border border-amber-500/30 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Campaign Terpilih</span>
                    </div>

                    <h1 className="text-3xl md:text-8xl font-black text-white leading-tight tracking-tighter mb-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {campaign.title}
                    </h1>

                    <p className="text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed italic animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        "{campaign.description || 'Spesial untuk pelanggan setia Rasa Ibu.'}"
                    </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FDFBF7] to-transparent"></div>
            </div>

            {/* Bundles Section */}
            <section className="py-24 -mt-32 relative z-20">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-[#2D3A2D] mb-4">Pilih Paket Hemat Bunda</h2>
                        <div className="w-24 h-1.5 bg-amber-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {campaign.bundles?.map((bundle: any) => (
                            <BundleCard
                                key={bundle.id}
                                bundle={bundle}
                                onAddToCart={(b) => {
                                    // Logic for add to cart bundle
                                }}
                            />
                        ))}
                    </div>

                    {campaign.bundles?.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-stone-200">
                            <p className="text-stone-400 font-bold">Belum ada paket bundling yang tersedia untuk saat ini.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Trust Footer */}
            <section className="py-24 bg-white border-t border-stone-100">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 text-amber-500 fill-current" />)}
                    </div>
                    <p className="text-3xl font-black text-[#2D3A2D] max-w-3xl mx-auto leading-tight mb-8">
                        "Terima kasih sudah membersamai perjalanan masak-memasak kami."
                    </p>
                    <p className="font-bold text-amber-600 uppercase tracking-widest text-sm">— Ibu Achie</p>
                </div>
            </section>
        </main>
    );
}
