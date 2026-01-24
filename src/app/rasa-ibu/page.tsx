import Link from 'next/link';
import Image from 'next/image';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import HeroSlider from '@/components/commerce/HeroSlider';
import BestSellersSection from '@/components/commerce/BestSellersSection';
import SubscriptionPromoSection from '@/components/commerce/SubscriptionPromoSection';
import PromoBadge from '@/components/commerce/PromoBadge';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';
import { Star } from 'lucide-react';

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { getFeaturedProducts, getBestSellers } from '@/lib/actions/rasa-ibu/public-products';
import { FlashSaleService } from '@/lib/services/FlashSaleService';
import { getActiveCampaigns } from '@/lib/actions/commerce/campaigns';
import CampaignsSection from '@/components/commerce/CampaignsSection';
import FlashSaleBanner from '@/components/marketing/FlashSaleBanner';

// Enable ISR (Incremental Static Regeneration) for better performance
// Page will be cached and revalidated every 60 seconds
export const revalidate = 60;

/**
 * RASA IBU HOMEPAGE
 * Philosophy: Home/Mother's Cooking, Warmth, Honesty.
 * Copy: Natural Indonesian (not corporate).
 */
export default async function RasaIbuHomePage() {
    // Unified Data Fetching using Promise.all for maximum speed
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    const brandId = brand.id;
    const config = brand.brandConfig;

    // Second stage parallel fetch (once we have brandId)
    const [
        featuredProducts,
        bestSellersRaw,
        heroSlidesRaw,
        cheapestPlan,
        activeFlashSale,
        activeCampaigns,
    ] = await Promise.all([
        getFeaturedProducts(brandId),
        getBestSellers(brandId, 12) as Promise<any[]>,
        prisma.heroSlide.findMany({
            where: { brandId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: 5
        }),
        prisma.subscriptionPlan.findFirst({
            where: { brandId, isActive: true },
            orderBy: { price: 'asc' }
        }),
        FlashSaleService.getActiveFlashSale(brandId),
        getActiveCampaigns(brandId),
    ]);

    // 1. Hero
    const heroTagline = config?.heroTagline || "Hangatnya Meja Makan";
    const heroTitle = config?.publicTitle || "Kapanpun Rindu\nMasakan Ibu.";
    const heroSubtitle = config?.publicSubtitle || "Hidangan hangat penuh kasih, hadir di meja makan Bunda dalam sekejap.";
    const heroImage = config?.heroImage || null;
    const heroCtaPrimary = config?.heroCtaPrimary || "Lihat Menu Kami";
    const heroCtaPrimaryLink = config?.heroCtaPrimaryLink || "/rasa-ibu/products";
    const heroCtaSecondary = config?.heroCtaSecondary || "Cerita Kami";
    const heroCtaSecondaryLink = config?.heroCtaSecondaryLink || "/rasa-ibu/about";

    // 2. Philosophy
    const philosophyTagline = config?.philosophyTagline || "Filosofi Rasa";
    const philosophyTitle = config?.philosophyTitle || "Kenapa Memilih\nRasa Ibu?";
    const philosophyContent = config?.philosophyContent || "Di tengah kesibukan harian, meja makan seringkali menjadi tempat terakhir kita untuk benar-benar terhubung dengan keluarga. Namun, memasak hidangan rumah yang layak membutuhkan waktu yang tidak sedikit.\n\nRasa Ibu hadir for menjembatani itu. Kami mengolah setiap bahan dengan cara yang sama seperti bagaimana seorang ibu memasak di dapurnya: sabar, teliti, dan jujur.\n\n\"Tujuan kami bukan sekadar menjual makanan, tapi membawakan kembali momen kehangatan rumah ke meja Anda, tanpa kompromi pada kesehatan.\"";
    const philosophyLinkText = config?.philosophyLinkText || "Lanjut Baca";
    const philosophyLinkUrl = config?.philosophyLinkUrl || "/rasa-ibu/about";

    // 3. Featured
    const featuredTagline = config?.featuredTagline || "Menu Terlaris";
    const featuredTitle = config?.featuredSectionTitle || "Favorit Keluarga.";

    // 4. Platform
    const platformTagline = config?.platformTagline || "Keluarga RASA IBU";
    const platformTitle = config?.platformSectionTitle || "Tersedia di Platform Kesukaan Bunda.";
    const platformSubtitle = config?.platformSectionSubtitle || "Bisa pesan lewat aplikasi andalan atau langsung di sini.";

    // Merge static and dynamic links
    const paymentSettings = brand?.paymentSettings as any;
    const dynamicLinks = paymentSettings?.links || {};
    const platformLinks = {
        shopeeFood: dynamicLinks.shopeeFood || 'https://shopee.co.id/universal-link/now-food/shop/12345',
        grabFood: dynamicLinks.grabFood || 'https://r.grab.com/g/fb/12345',
        goFood: dynamicLinks.goFood || 'https://gofood.link/a/12345',
        tokopedia: dynamicLinks.tokopedia || 'https://www.tokopedia.com/rasaibu'
    };

    // 5. CTA
    const ctaTagline = config?.ctaTagline || "";
    const ctaTitle = config?.ctaSectionTitle || "Siap Menjamu Keluarga Hari Ini?";
    const ctaSubtitle = config?.ctaSectionSubtitle || "Pesan sekarang via WhatsApp, kami bantu pilihkan kurir tercepat agar masakan ibu sampai tepat waktu untuk makan malam.";
    const ctaButton = config?.ctaButtonText || "Pesan via WhatsApp";

    // WhatsApp number from Intelligence Config (whatsappCrm) or fallback to config.whatsapp
    const whatsapp = paymentSettings?.whatsappCrm || (config as any)?.whatsapp || "628123456789";

    // Trust Badges (Default if empty)
    const defaultBadges = [
        { icon: 'shield', title: 'Higiene Terjamin', desc: 'Dibuat di dapur standar tinggi, setiap langkah dipastikan bersih.' },
        { icon: 'leaf', title: 'Tanpa Pengawet', desc: 'Kami menggunakan teknik pembekuan cepat untuk menjaga kualitas.' },
        { icon: 'chef', title: 'Resep Warisan', desc: 'Bumbu asli nusantara, bukan penyedap rasa buatan berlebih.' },
        { icon: 'clock', title: 'Siap Dalam 10 Menit', desc: 'Cukup dikukus atau digoreng sebentar, langsung bisa dinikmati.' },
    ];
    let trustBadges = defaultBadges;
    let trustSectionTitle = "Komitmen Kami."; // Default title

    // Prioritize "Our Values (Pillars)" from CMS Section 7
    if (config?.aboutValuesList && Array.isArray(config.aboutValuesList) && config.aboutValuesList.length > 0) {
        trustBadges = (config.aboutValuesList as any[]).map((val: any) => ({
            title: val.title,
            desc: val.desc,
            icon: val.title.toLowerCase().includes('bahan') ? 'leaf' :
                val.title.toLowerCase().includes('higien') ? 'shield' :
                    val.title.toLowerCase().includes('tulus') ? 'heart' : 'star'
        }));
        if (config.aboutValuesTitle) {
            trustSectionTitle = config.aboutValuesTitle as string;
        }
    }
    // Fallback to "Trust Badges" from CMS Section 8
    else if (config?.trustBadges && Array.isArray(config.trustBadges) && config.trustBadges.length > 0) {
        trustBadges = config.trustBadges as any[];
    }

    // De-duplicate: Ensure best sellers don't show products already in featured section
    const featuredIds = new Set(featuredProducts.map((p: any) => p.id));
    const bestSellers = bestSellersRaw
        .filter((p: any) => !featuredIds.has(p.id))
        .slice(0, 6);

    // Map to match HeroSlider interface (convert null to undefined)
    const heroSlides = heroSlidesRaw.map((slide: any) => ({
        ...slide,
        ctaLabel: slide.ctaLabel || undefined,
        ctaLink: slide.ctaLink || undefined,
        imageUrl: slide.imageUrl || undefined,
        videoUrl: slide.videoUrl || undefined,
        tagline: (slide as any).tagline || undefined
    }));

    const CheapestPlanComponent = cheapestPlan ? (
        <SubscriptionPromoSection
            startFromPrice={Number(cheapestPlan.price)}
            interval={cheapestPlan.interval === 'WEEKLY' ? 'minggu' : 'bulan'}
            tagline={(config as any)?.subscriptionTagline || 'Paket Rantau'}
            title={(config as any)?.subscriptionTitle || 'Kehangatan Ibu'}
            subtitle={(config as any)?.subscriptionSubtitle || 'Dikirim Berkala'}
            description={(config as any)?.subscriptionDescription || 'Tak perlu lagi pusing memikirkan stok lauk di kost atau apartemen. Langganan paket katering beku Rasa Ibu, otomatis dikirim setiap minggu atau bulan.'}
            benefits={(config as any)?.subscriptionBenefits || undefined}
            buttonText={(config as any)?.subscriptionButtonText || 'Mulai Berlangganan'}
            imageUrl={(config as any)?.subscriptionImage || undefined}
        />
    ) : null;


    // Helper to calculate product price with flash sale
    const getProductPrice = (product: any) => {
        const basePrice = product.price;
        // ONLY apply discount if it is ACTIVE. UPCOMING should just show the banner.
        if (!activeFlashSale || activeFlashSale.status !== 'ACTIVE') return { base: basePrice, discount: 0, final: basePrice };

        // Check if targeted
        let isEligible = activeFlashSale.targetType === 'ALL';
        if (activeFlashSale.targetType === 'SPECIFIC' && activeFlashSale.targetItems) {
            isEligible = activeFlashSale.targetItems.includes(product.id);
        }

        if (isEligible) {
            const discountAmount = basePrice * (activeFlashSale.discountPercentage / 100);
            return {
                base: basePrice,
                discount: activeFlashSale.discountPercentage,
                final: basePrice - discountAmount
            };
        }

        return { base: basePrice, discount: 0, final: basePrice };
    };

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Rasa Ibu",
        "url": "https://rasaibu.com",
        "logo": "https://rasaibu.com/logo.png",
        "description": "Masakan rumah siap saji dengan bumbu alami nusantara.",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": `+${whatsapp}`,
            "contactType": "customer service"
        }
    };

    return (
        <div className="space-y-0 text-[#2D3A2D]">
            {/* SEO: JSON-LD Organization */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* 1. Hero Slider - Dynamic Promotional Slides */}
            <section className="py-12 bg-gradient-to-b from-[#FDFBF7] to-white">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {heroSlides.length > 0 ? (
                        <HeroSlider slides={heroSlides} autoPlayInterval={5000} />
                    ) : (
                        // Fallback to static hero if no slides
                        <div className="relative min-h-[500px] md:h-[600px] flex items-center overflow-hidden bg-gradient-to-br from-[#2D3A2D] via-[#1A241A] to-[#2D3A2D] rounded-[1.5rem] md:rounded-[3rem] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent z-10"></div>
                            {/* Decorative overlay pattern */}
                            <div className="absolute inset-0 opacity-5 z-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                            {heroImage && (
                                <div className="absolute inset-0">
                                    <Image src={heroImage} alt="Hero" fill className="object-cover" priority />
                                </div>
                            )}
                            <div className="relative z-20 max-w-7xl mx-auto px-6 w-full py-12">
                                <div className="max-w-2xl space-y-6 md:space-y-8">
                                    <span className="inline-block text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-amber-400 bg-amber-400/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-amber-400/20">{heroTagline}</span>
                                    <h1 className="text-3xl sm:text-4xl md:text-7xl font-black leading-[1.2] md:leading-[1.1] text-white whitespace-pre-line drop-shadow-2xl">
                                        {heroTitle}
                                    </h1>
                                    <p className="text-sm sm:text-base md:text-xl text-white/90 leading-relaxed font-medium whitespace-pre-line max-w-xl">
                                        {heroSubtitle}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6">
                                        <Link
                                            href={heroCtaPrimaryLink}
                                            className="group inline-block px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] sm:text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center relative overflow-hidden"
                                        >
                                            <span className="relative z-10">{heroCtaPrimary}</span>
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        </Link>
                                        <Link
                                            href={heroCtaSecondaryLink}
                                            className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black text-[10px] sm:text-sm uppercase tracking-widest rounded-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-300 text-center shadow-lg"
                                        >
                                            {heroCtaSecondary}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>


            {/* 2. Trust Badges - Honesty Section */}
            <section className="py-24 border-y border-[#E5E1D8] bg-gradient-to-b from-white to-[#FDFBF7]">
                <div className="max-w-7xl mx-auto px-6">
                    {trustSectionTitle && (
                        <div className="text-center mb-20">
                            <h2 className="text-4xl font-black tracking-tight mb-3">{trustSectionTitle}</h2>
                            <div className="w-20 h-1 bg-[#8B7E66] mx-auto rounded-full"></div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
                        {trustBadges.map((badge, idx) => (
                            <div key={idx} className="group flex flex-col items-center text-center space-y-3 md:space-y-5 p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white hover:shadow-lg transition-all duration-300">
                                <div className="h-14 w-14 md:h-20 md:w-20 bg-gradient-to-br from-[#F9F7F2] to-[#E5E1D8] rounded-2xl flex items-center justify-center text-[#8B7E66] shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#2D3A2D]">{badge.title}</h4>
                                    <p className="text-xs md:text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed hidden sm:block">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Featured Products */}
            <section id="menu" className="py-20 md:py-32 max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div className="space-y-5">
                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">{featuredTagline}</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">{featuredTitle}</h2>
                    </div>
                    <Link href="/rasa-ibu/products" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#2D3A2D] hover:text-[#8B7E66] transition-all hidden md:flex">
                        Lihat Semua Produk
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                    {featuredProducts.map((product: any) => (
                        <div key={product.id} className="group cursor-pointer">
                            <Link href={`/rasa-ibu/products/${product.slug}`} className="aspect-[4/5] bg-gradient-to-br from-[#F9F7F2] to-[#E5E1D8] rounded-3xl mb-6 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all duration-500 block">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center italic text-gray-300 bg-stone-50">[Foto: {product.name}]</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {getProductPrice(product).discount > 0 && (
                                    <PromoBadge type="FLASH_SALE" className="top-4 left-4" />
                                )}

                                {/* Top Right Badges */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
                                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black tracking-widest text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                        <Star className="w-3 h-3 text-amber-500 fill-current" /> {(product.rating || 0).toFixed(1)}
                                    </div>
                                    <ProductWishlistButton productId={product.id} productName={product.name} brandId={brandId} />
                                </div>
                            </Link>
                            <Link href={`/rasa-ibu/products/${product.slug}`}>
                                <h3 className="text-sm md:text-xl font-black mb-2 tracking-tight line-clamp-1 group-hover:text-[#8B7E66] transition-colors">{product.name}</h3>
                            </Link>
                            <p className="text-[10px] md:text-sm text-gray-500 font-medium mb-3 md:mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                            <div className="flex flex-col gap-3">
                                {getProductPrice(product).discount > 0 ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-400 line-through">
                                                Rp {product.price.toLocaleString('id-ID')}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">
                                                -{getProductPrice(product).discount}%
                                            </span>
                                        </div>
                                        <span className="text-sm md:text-lg font-black text-amber-600">
                                            Rp {getProductPrice(product).final.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm md:text-lg font-black text-[#8B7E66]">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </span>
                                )}
                                {product.inStock ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-bold rounded-full">
                                            Tersedia
                                        </span>
                                        {(product.totalStock || 0) > 0 && (product.totalStock || 0) < 15 && (
                                            <span className="text-[9px] md:text-[10px] font-black text-red-600 animate-pulse bg-red-50 px-2 py-0.5 rounded">
                                                Stok Terbatas! ({product.totalStock})
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] md:text-xs font-bold rounded-full">
                                        Habis
                                    </span>
                                )}
                                <AddToCartButton
                                    product={product}
                                    label="Sajikan"
                                    className="px-4 py-2.5 text-[7px] md:text-[9px] w-full shadow-sm hover:shadow-md"
                                />
                            </div>
                        </div>
                    ))}
                    {featuredProducts.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 italic">
                            Belum ada menu yang ditampilkan.
                        </div>
                    )}
                </div>
            </section>

            {/* Best Sellers Section */}
            <BestSellersSection products={bestSellers} activeFlashSale={activeFlashSale} />

            {/* Campaign Bundles Section */}
            <CampaignsSection campaigns={activeCampaigns} />

            {CheapestPlanComponent}

            {/* 4. Philosophy Section */}
            <section className="py-20 md:py-32 bg-gradient-to-br from-[#2D3A2D] via-[#1A241A] to-[#2D3A2D] text-[#FDFBF7] relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B7E66]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center relative z-10">
                    <div className="relative aspect-square bg-white/5 rounded-[3rem] flex items-center justify-center italic text-white/20 overflow-hidden shadow-2xl group">
                        {config?.aboutImage ? (
                            <Image
                                src={config.aboutImage}
                                alt="Philosophy"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="grayscale opacity-50 group-hover:opacity-70 object-cover transition-opacity duration-500"
                            />
                        ) : "[Foto: Ibu dan Anak tertawa di dapur]"}
                    </div>
                    <div className="space-y-10">
                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/10 px-4 py-2 rounded-full border border-[#8B7E66]/20">{philosophyTagline}</span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] whitespace-pre-line">
                            {philosophyTitle}
                        </h2>
                        <div className="space-y-6 text-[#A0A8A0] text-base font-medium leading-relaxed whitespace-pre-line">
                            {philosophyContent}
                        </div>
                        <Link href={philosophyLinkUrl} className="group inline-flex items-center gap-2 border-b-2 border-white/10 hover:border-[#8B7E66] transition-all pb-1 text-xs font-black uppercase tracking-widest">
                            {philosophyLinkText}
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 5. Platform Links Section */}
            <section className="py-24 border-y border-[#E5E1D8] bg-[#FDFBF7]/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-12">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">{platformTagline}</span>
                            <h2 className="text-3xl font-black tracking-tight">{platformTitle}</h2>
                            <p className="text-sm text-gray-500 font-medium">{platformSubtitle}</p>
                        </div>

                        <PlatformLinks links={platformLinks} />
                    </div>
                </div>
            </section >

            {/* 6. Final CTA */}
            <section className="py-24 md:py-40 text-center bg-gradient-to-b from-white to-[#FDFBF7] relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B7E66]/5 rounded-full blur-3xl"></div>

                <div className="max-w-3xl mx-auto px-6 space-y-12 relative z-10">
                    {ctaTagline && <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">{ctaTagline}</span>}
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{ctaTitle}</h2>
                    <p className="text-base md:text-lg text-gray-600 font-medium whitespace-pre-line max-w-2xl mx-auto leading-relaxed">
                        {ctaSubtitle}
                    </p>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Link
                            href="/rasa-ibu/contact"
                            className="group inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-2xl shadow-amber-900/20 hover:shadow-amber-900/30 relative overflow-hidden"
                        >
                            <span className="relative z-10">{ctaButton}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </Link>
                        <a
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo, saya butuh bantuan order.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-400 text-xs font-bold hover:text-amber-600 transition-colors flex items-center gap-1"
                        >
                            Butuh Bantuan ? Chat WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
