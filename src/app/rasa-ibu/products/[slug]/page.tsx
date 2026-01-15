import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import ProductRecommendations from '@/components/commerce/ProductRecommendations';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';
import ProductReviews from '@/components/commerce/ProductReviews';
import RecentlyViewedTracker from '@/components/commerce/RecentlyViewedTracker';
import AnimatedSection from '@/components/commerce/AnimatedSection';
import { Metadata } from 'next';
import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { getRecommendedProducts, incrementProductView } from '@/lib/actions/rasa-ibu/public-products';
import { getProductReviewsAction } from '@/lib/actions/commerce/reviews';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    // Fetch brand first for isolation using unisolated client to avoid context errors in metadata
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

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductDetailPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    try {
        const { slug } = await params;

        // 1. Fetch Brand first to get ID
        const brand = await unisolatedPrisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            select: { id: true, paymentSettings: true, brandConfig: true }
        });

        if (!brand) return <div className="py-24 text-center">Brand not found</div>;
        const brandId = brand.id;

        // 2. Fetch Product using Brand ID for isolation compliance
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

        // Fetch recommendations and reviews with brandId
        const [recommendations, reviewsRes] = await Promise.all([
            getRecommendedProducts(brandId, product.id, 4),
            getProductReviewsAction(brandId, product.name)
        ]);

        const initialReviews = reviewsRes.success ? reviewsRes.data : [];

        // Formatting for UI
        const primaryVariant = product.variants[0];
        const price = Number(primaryVariant?.price || 0);
        const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0);

        const waMessage = `Halo Rasa Ibu, saya ingin pesan ${product.name}. Apakah produknya ready stok?`;
        const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`;

        // Integration of Brand Config
        const config = brand.brandConfig as any;
        const buttonColor = config?.primaryColor || "#2D3A2D";

        return (
            <div className="min-h-screen bg-[#FDFBF7]">
                <RecentlyViewedTracker productId={product.id} />

                {/* Hero / Header Section */}
                <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                        {/* Left: Image Gallery */}
                        <div className="space-y-6">
                            <div className="aspect-[4/5] bg-white rounded-[3rem] overflow-hidden border border-[#E5E1D8] shadow-2xl shadow-slate-200 relative group">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200 text-6xl">🍲</div>
                                )}
                                <div className="absolute top-8 left-8">
                                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-white">
                                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                                        <span className="text-sm font-black text-[#2D3A2D]">4.9</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badges Simple */}
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

                        {/* Right: Details */}
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

                            {/* Variant Selection if more than 1 */}
                            {product.variants.length > 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#2D3A2D]">Pilihan Porsi</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.variants.map((v: any) => (
                                            <button
                                                key={v.id}
                                                className={`px-6 py-3 rounded-xl border-2 transition-all font-bold text-sm ${v.id === primaryVariant?.id
                                                    ? 'border-[#2D3A2D] bg-[#2D3A2D] text-white shadow-lg'
                                                    : 'border-[#E5E1D8] bg-white text-[#8B7E66] hover:border-[#8B7E66]'
                                                    }`}
                                            >
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-4 pt-6">
                                <AddToCartButton
                                    product={{
                                        ...product,
                                        price,
                                        variantId: primaryVariant?.id,
                                        variantName: primaryVariant?.name || 'Porsi Keluarga'
                                    }}
                                    label="Simpan di Keranjang Bunda"
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
                                        Tanya Stok
                                    </a>
                                    <button className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white border-2 border-[#E5E1D8] text-[#2D3A2D] text-xs font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all">
                                        <Share2 className="w-5 h-5" />
                                        Bagikan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <section className="bg-white py-24 border-y border-[#E5E1D8]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex items-center justify-between mb-16">
                            <h2 className="text-3xl font-black text-[#1A241A] tracking-tight">Coba Menu Lainnya</h2>
                            <Link href="/rasa-ibu/products" className="text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-colors">Lihat Semua</Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {recommendations.map((item: any) => (
                                <Link key={item.id} href={`/rasa-ibu/products/${item.slug}`} className="group space-y-4">
                                    <div className="aspect-[4/5] bg-[#FDFBF7] rounded-[2.5rem] overflow-hidden border border-[#E5E1D8] transition-all group-hover:shadow-xl">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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

                {/* Reviews */}
                <ProductReviews
                    productName={product.name}
                    brandId={brandId}
                    initialReviews={initialReviews}
                />

                {/* Back Link */}
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
                <Link href="/rasa-ibu" className="text-primary hover:underline">
                    Kembali ke Beranda
                </Link>
            </div>
        );
    }
}
