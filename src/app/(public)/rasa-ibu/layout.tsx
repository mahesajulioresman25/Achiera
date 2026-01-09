import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PublicNav from '@/components/commerce/PublicNav';
import FloatingCartWrapper from '@/components/commerce/FloatingCartWrapper';
import { FlashSaleService } from '@/lib/services/FlashSaleService';
import FlashSaleBanner from '@/components/marketing/FlashSaleBanner';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * RASA IBU BRAND LAYOUT
 * Purpose: Establishes a warm, mother-centric aesthetic.
 * Strategy: Cream backgrounds, Dark Sage accents, Serif headings.
 * No AI/Governance/Autonomy logic allowed here.
 */
export default async function RasaIbuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch Brand Config (including config JSON)
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    const config = brand?.brandConfig || ({} as any);
    const settings = brand?.paymentSettings as any;
    const whatsapp = settings?.whatsappCrm || '628123456789';
    const instagramHandle = config?.instagramHandle || '@rasaibu';
    const socialLinks = (config?.socialLinks as any) || {
        instagram: 'https://instagram.com/rasaibu'
    };

    // Parse Nav Links
    const navLinks = (config.publicNavLinks as any[]) || [
        { label: 'BERANDA', href: '/rasa-ibu' },
        { label: 'DAPUR KAMI', href: '/rasa-ibu/products' },
        { label: 'HADIAH IBU', href: '/rasa-ibu/loyalty' },
        { label: 'PANDUAN BELANJA', href: '/rasa-ibu/how-to-order' },
        { label: 'TENTANG KAMI', href: '/rasa-ibu/about' }
    ];

    // Fetch Active Flash Sale
    const activeFlashSale = await FlashSaleService.getActiveFlashSale(brand?.id || '');

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2D3A2D] selection:bg-[#E5E1D8]">
            {activeFlashSale && <FlashSaleBanner activeFlashSale={activeFlashSale} />}

            <PublicNav
                navLinks={navLinks}
                whatsapp={whatsapp}
                instagramHandle={instagramHandle}
                socialLinks={socialLinks}
                config={config}
            />

            <FloatingCartWrapper />

            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-[#1A241A] text-[#FDFBF7] py-20">
                <div className="max-w-7xl auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div className="space-y-6">
                        <Link href="/rasa-ibu">
                            <img
                                src="/images/brand/logo.png"
                                alt="Rasa Ibu"
                                className="h-14 w-auto object-contain brightness-0 invert"
                            />
                        </Link>
                        <p className="text-sm text-[#A0A8A0] leading-relaxed max-w-xs font-medium">
                            Masakan rumah siap saji, dibuat dengan penuh cinta dan kejujuran. Tanpa pengawet, untuk keluarga tercinta.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Navigasi</h3>
                        <div className="flex flex-col gap-4">
                            {navLinks.slice(1).map((link: any, idx: number) => (
                                <Link key={idx} href={link.href} className="text-sm font-bold hover:text-white transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Hubungi Kami</h3>
                        <p className="text-sm text-[#A0A8A0] font-medium leading-relaxed">
                            Tanya-tanya stok atau pengiriman? Customer Assistant kami siap membantu setiap hari pukul 08:00 - 17:00.
                        </p>
                        <a
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Rasa Ibu, saya ingin tanya produknya...")}`}
                            className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-green-900/20"
                        >
                            Order via WhatsApp
                        </a>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-bold text-[#4A5D4A] uppercase tracking-widest">© 2026 Rasa Ibu - Achiera — KEJUJURAN DARI DAPUR</p>
                    <div className="flex gap-8">
                        <a href={socialLinks?.instagram || 'https://instagram.com/rasaibu'} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#4A5D4A] uppercase tracking-widest hover:text-[#8B7E66] transition-colors">Instagram</a>
                        <span className="text-[10px] font-bold text-[#4A5D4A] uppercase tracking-widest">Facebook</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
