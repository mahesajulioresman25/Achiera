import Link from 'next/link';
import Image from 'next/image';
import { Star, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import ProductRecommendations from '@/components/commerce/ProductRecommendations';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';
import ProductReviews from '@/components/commerce/ProductReviews';
import RecentlyViewedTracker from '@/components/commerce/RecentlyViewedTracker';
import AnimatedSection from '@/components/commerce/AnimatedSection';
import { Metadata } from 'next';
import { unisolatedPrisma } from '@/lib/prisma';
import { getRecommendedProducts } from '@/lib/actions/rasa-ibu/public-products';
import { getProductReviewsAction } from '@/lib/actions/commerce/reviews';
import ProductGallery from '@/components/commerce/ProductGallery';
import ShareButton from '@/components/commerce/ShareButton';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    const brand = await unisolatedPrisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { id: true }
    });

    if (!brand) return { title: 'Rasa Ibu' };

    const product = await unisolatedPrisma.frozenProduct.findFirst({
        where: {
            brandId: brand.id,
            slug: slug
        },
        select: { name: true, description: true }
    });

    return {
        title: product ? `${product.name} | Rasa Ibu - Masakan Rumah Siap Saji` : 'Menu Rasa Ibu',
        description: product?.description || 'Menu lezat dari Rasa Ibu.'
    };
}

export const revalidate = 60;

export default async function RasaIbuProductDetailPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    try {
        const { slug } = await params;

        const brand = await unisolatedPrisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            select: { id: true, paymentSettings: true, brandConfig: true }
        });

        if (!brand) return <div className="py-24 text-center">Brand not found</div>;
        const brandId = brand.id;

        const product = await unisolatedPrisma.frozenProduct.findFirst({
            where: {
                slug,
                brandId
            },
            include: {
                category: true,
                variants: {
                    orderBy: { price: 'asc' }
                }
            }
        });

        if (!product) {
            return (
                <div className="py-32 text-center text-slate-500">
                    Menu tidak ditemukan. <Link href="/rasa-ibu/products" className="text-[#8B7E66] font-bold underline">Kembali ke Menu</Link>
                </div>
            );
        }

        const settings = brand?.paymentSettings as any;
        const whatsapp = settings?.whatsappCrm || '628123456789';

        const [recommendations, reviewsRes] = await Promise.all([
            getRecommendedProducts(brandId, product.id, 4),
            getProductReviewsAction(brandId, product.name)
        ]);

        const initialReviews = reviewsRes.success ? reviewsRes.data : [];
        const primaryVariant = product.variants[0];
        const price = Number(primaryVariant?.price || 0);

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": product.image,
            "description": product.description || `Sajian lezat ${product.name} dari Rasa Ibu.`,
            "brand": {
                "@type": "Brand",
                "name": "Rasa Ibu"
            },
            "offers": {
                "@type": "Offer",
                "price": price,
                "priceCurrency": "IDR",
                "availability": product.variants.some(v => v.stockOnHand > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "url": `https://rasaibu.com/rasa-ibu/products/${product.slug}`
            },
            "aggregateRating": (product as any).rating ? {
                "@type": "AggregateRating",
                "ratingValue": (product as any).rating,
                "reviewCount": initialReviews.length || 1
            } : undefined
        };
        const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0);

        const waMessage = `Halo Rasa Ibu, saya ingin pesan ${product.name}. Apakah produknya ready stok?`;
        const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`;

        let productImages: string[] = [];
        if (product.image) productImages.push(product.image);

        if ((product as any).images) {
            try {
                const gallery = typeof (product as any).images === 'string'
                    ? JSON.parse((product as any).images)
                    : (product as any).images;
                if (Array.isArray(gallery)) {
                    productImages = [...productImages, ...gallery];
                }
            } catch (e) { }
        }
        productImages = Array.from(new Set(productImages));

        return (
            <div className="min-h-screen bg-[#FDFBF7]">
                <RecentlyViewedTracker productId={product.id} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Left: Gallery */}
                        <div className="space-y-6">
                            <ProductGallery images={productImages} productName={product.name} />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] text-center space-y-2">
                                    <div className="text-xl">🛡️</div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#2D3A2D]">Higienis</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] text-center space-y-2">
                                    <div className="text-xl">🌿</div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#2D3A2D]">Alami</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] text-center space-y-2">
                                    <div className="text-xl">⏱️</div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#2D3A2D]">Cepat</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-[#8B7E66]/10 text-[#8B7E66] text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                        {product.category?.name || 'Menu Utama'}
                                    </span>
                                    {totalStock > 0 && totalStock < 10 && (
                                        <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                            Sisa {totalStock} Porsi!
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-[#1A241A] tracking-tight leading-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-3xl font-black text-[#8B7E66]">
                                        Rp {price.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ {primaryVariant?.name || 'Porsi'}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#2D3A2D]">Resep & Cerita</h3>
                                <p className="text-[#8B7E66] leading-relaxed text-lg font-medium italic border-l-4 border-[#E5E1D8] pl-6 py-2">
                                    {product.description || "Menu rahasia ibu yang diolah dengan bumbu pilihan nusantara. Setiap gigitannya membawa kenangan akan rumah."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 py-8 border-y border-[#E5E1D8]">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Komposisi</h4>
                                    <p className="text-sm text-[#2D3A2D] font-medium leading-relaxed">{product.ingredients || "Rempah Nusantara Pilihan"}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Penyimpanan</h4>
                                    <p className="text-sm text-[#2D3A2D] font-medium">
                                        {(() => {
                                            const storageLabels: Record<string, string> = {
                                                'FROZEN': 'Beku (-18°C)',
                                                'CHILLED': 'Dingin (2-8°C)',
                                                'AMBIENT': 'Suhu Ruang',
                                                'READY_TO_EAT': 'Siap Saji'
                                            };
                                            return storageLabels[product.storageType as string] || 'Frozen (-18°C)';
                                        })()}
                                    </p>
                                    {product.storageType !== 'READY_TO_EAT' && product.shelfLife && (
                                        <p className="text-[10px] text-[#8B7E66] font-bold">
                                            Tahan hingga {product.shelfLife} Bulan
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Nutrition Card */}
                            {product.nutrition && typeof product.nutrition === 'object' && (
                                <div className="bg-[#f9f7f2] p-6 rounded-3xl border border-[#E5E1D8] space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2D3A2D] flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                        Informasi Nilai Gizi
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {Object.entries(product.nutrition as Record<string, any>).map(([key, value]) => (
                                            <div key={key} className="text-center">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66] mb-1">{key}</p>
                                                <p className="text-sm font-black text-[#2D3A2D]">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-6">
                                <AddToCartButton
                                    product={{
                                        ...product,
                                        image: product.image || undefined,
                                        price,
                                        variantId: primaryVariant?.id,
                                        variantName: primaryVariant?.name || 'Porsi Keluarga'
                                    }}
                                    label="Sajikan"
                                    className="w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white border-2 border-[#E5E1D8] text-[#2D3A2D] text-xs font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all"
                                    >
                                        <MessageCircle className="w-5 h-5 text-emerald-500" />
                                        Bantuan
                                    </a>
                                    <ShareButton
                                        productName={product.name}
                                        productUrl={`https://achiera.com/rasa-ibu/products/${product.slug}`}
                                    />
                                </div>

                                {settings?.links && (
                                    <div className="pt-8 border-t border-[#E5E1D8]">
                                        <PlatformLinks
                                            links={{
                                                shopeeFood: settings.links.shopeeFood,
                                                grabFood: settings.links.grabFood,
                                                goFood: settings.links.goFood,
                                                shopee: settings.links.shopee,
                                                tokopedia: settings.links.tokopedia,
                                                tiktok: settings.links.tiktok,
                                                grabMart: settings.links.grabMart
                                            }}
                                            compact={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <section className="bg-white py-24 border-y border-[#E5E1D8]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center justify-between mb-16">
                            <h2 className="text-3xl font-black text-[#1A241A] tracking-tight">Coba Menu Lainnya</h2>
                            <Link href="/rasa-ibu/products" className="text-xs font-black uppercase tracking-widest text-[#8B7E66] transition-colors">Lihat Semua</Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {recommendations.map((item: any) => (
                                <Link key={item.id} href={`/rasa-ibu/products/${item.slug}`} className="group space-y-4">
                                    <div className="relative aspect-[4/5] bg-[#FDFBF7] rounded-[2.5rem] overflow-hidden border border-[#E5E1D8] transition-all group-hover:shadow-xl">
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-100 text-3xl">🍲</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-[#1A241A] text-sm group-hover:text-[#8B7E66] transition-colors">{item.name}</h3>
                                        <p className="text-xs font-bold text-amber-600">Rp {item.price.toLocaleString('id-ID')}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <ProductReviews productName={product.name} brandId={brandId} initialReviews={initialReviews} />

                <div className="py-20 text-center">
                    <Link href="/rasa-ibu/products" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-all group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                        Kembali ke Seluruh Menu
                    </Link>
                </div>
            </div>
        );
    } catch (e: any) {
        return (
            <div className="py-24 text-center">
                <h1 className="text-2xl font-bold mb-4">Maaf Bunda, Sedang ada Gangguan</h1>
                <p className="text-red-500 mb-8">{e.message}</p>
                <Link href="/rasa-ibu" className="text-primary hover:underline">Kembali ke Beranda</Link>
            </div>
        );
    }
}
