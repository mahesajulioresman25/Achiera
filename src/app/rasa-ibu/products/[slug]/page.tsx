import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import ProductRecommendations from '@/components/commerce/ProductRecommendations';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';
import ProductReviews from '@/components/commerce/ProductReviews';
import RecentlyViewedTracker from '@/components/commerce/RecentlyViewedTracker';
import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    // Fetch brand first for isolation
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { id: true }
    });

    if (!brand) return { title: 'Rasa Ibu' };

    const product = await prisma.frozenProduct.findFirst({
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
import AnimatedSection from '@/components/commerce/AnimatedSection';
import { prisma } from '@/lib/prisma';
import { getRecommendedProducts, incrementProductView } from '@/lib/actions/rasa-ibu/public-products';
import { getProductReviewsAction } from '@/lib/actions/commerce/reviews';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Brand Config
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;
    const brandId = brand.id;

    // 2. Fetch Product with isolation compliance
    const product = await prisma.frozenProduct.findFirst({
        where: {
            brandId,
            slug: slug
        },
        include: {
            category: true,
            variants: {
                orderBy: { price: 'asc' }
            }
        }
    });

    const settings = brand?.paymentSettings as any;
    const whatsapp = settings?.whatsappCrm || '628123456789';

    if (!product) {
        return (
            <div className="py-24 text-center">
                <h1 className="text-2xl font-bold mb-4">Menu Tidak Ditemukan</h1>
                <Link href="/rasa-ibu/products" className="text-primary hover:underline">
                    Kembali ke Daftar Menu
                </Link>
            </div>
        );
    }

    // Determine derived values
    const primaryVariant = product.variants[0];
    const price = Number(primaryVariant?.price || 0);
    const weight = Number(primaryVariant?.weight || 0);
    const inStock = product.variants.some(v => v.stockOnHand > 0);

    // Parse nutrition if JSON
    let nutritionConfig = {
        calories: '-',
        protein: '-',
        fat: '-',
        carbs: '-'
    };

    if (product.nutrition) {
        const n = product.nutrition as any;
        nutritionConfig = {
            calories: n.calories ? `${n.calories} kcal` : '-',
            protein: n.protein ? `${n.protein}g` : '-',
            fat: n.fat ? `${n.fat}g` : '-',
            carbs: n.carbs ? `${n.carbs}g` : '-'
        };
    }

    const waMessage = `Halo Rasa Ibu, saya ingin pesan ${product.name}. Apakah produknya ready stok?`;
    const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`;

    // Parallel fetching for recommendations and reviews
    const [recommendedProducts, reviewsRes] = await Promise.all([
        getRecommendedProducts(brandId, product.id, 4),
        getProductReviewsAction(brandId, product.name)
    ]);

    const initialReviews = reviewsRes.success ? reviewsRes.data : [];

    // Increment view count (fire and forget)
    incrementProductView(brandId, product.id).catch(() => {
        // Silently fail
    });


    return (
        <div className="py-24 max-w-7xl mx-auto px-6">
            <RecentlyViewedTracker productId={product.id} />
            <AnimatedSection direction="right">
                <Link href="/rasa-ibu/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#8B7E66] transition-colors mb-12 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Semua Menu
                </Link>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                {/* Left: Image */}
                <AnimatedSection direction="none">
                    <div className="aspect-[4/5] bg-[#F9F7F2] rounded-[3.5rem] overflow-hidden flex items-center justify-center italic text-gray-300 relative group shadow-2xl shadow-slate-200">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className={`w-full h-full object-cover transition-all duration-700 ${!inStock ? 'grayscale opacity-75' : 'group-hover:scale-110'}`}
                            />
                        ) : (
                            <span>[Foto Detail: {product.name}]</span>
                        )}

                        {!inStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[4px]">
                                <span className="bg-white text-[#2D3A2D] px-10 py-4 rounded-full font-black uppercase tracking-[0.2em] text-sm md:text-base shadow-2xl border border-white/50">
                                    Habis Terjual
                                </span>
                            </div>
                        )}

                        {/* Decorative Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                </AnimatedSection>

                {/* Right: Content */}
                <div className="space-y-12">
                    <AnimatedSection delay={0.1}>
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#1A241A] leading-none mb-6">{product.name}</h1>
                            <div className="flex flex-wrap items-center gap-6">
                                <span className="text-3xl font-black text-[#8B7E66]">Rp {price.toLocaleString('id-ID')}</span>
                                <span className="h-6 w-px bg-gray-200"></span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-[#F9F7F2] px-3 py-1 rounded-full">
                                    {weight > 0 ? `${weight}g` : 'Per Porsi'}
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                    {product.orderCount > 0 ? `${product.orderCount} Terjual` : 'Menu Baru'}
                                </span>
                            </div>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                        <p className="text-xl text-[#4A5D4A] leading-relaxed font-black opacity-80">
                            {product.description || 'Hidangan istimewa dari dapur Rasa Ibu, dibuat dengan bahan pilihan terbaik.'}
                        </p>
                    </AnimatedSection>

                    {/* Action */}
                    <AnimatedSection delay={0.3} className="flex flex-col sm:flex-row gap-4">
                        <AddToCartButton
                            product={{
                                id: product.id,
                                name: product.name,
                                price: price,
                                image: product.image || undefined,
                                variantId: primaryVariant?.id,
                                variantName: primaryVariant?.name || 'Porsi Keluarga'
                            }}
                            className="flex-1 bg-[#2D3A2D] text-[#FDFBF7] py-5 rounded-2xl font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-[#2D3A2D]/20 transition-all"
                            label={inStock ? 'Siapkan Untuk Keluarga' : 'Habis Terjual'}
                            disabled={!inStock}
                        />
                        <div className="flex gap-4">
                            <Link
                                href={waLink}
                                target="_blank"
                                className="px-8 py-5 border-2 border-[#E5E1D8] rounded-2xl text-[#2D3A2D] hover:bg-[#F9F7F2] hover:border-[#2D3A2D] transition-all flex items-center justify-center group"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.809.891 2.796.891 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.778zm-1.785 2.158c.119-.265.234-.271.341-.271.096 0 .19 0 .285.006.113.007.262.038.397.33.143.309.489 1.155.53 1.239.041.084.07.181.011.3s-.089.26-.172.356c-.095.107-.2.18-.328.326-.067.078-.142.164-.06.31.082.148.363.593.778.963.535.477.986.626 1.125.685.14.058.22.046.302-.047.083-.093.357-.417.452-.56.096-.143.191-.119.321-.071.131.048.833.393.976.465.143.072.238.107.274.167.036.06.036.345-.131.81-.167.464-.976.845-1.345.881-.357.042-.714.053-2.03-.464-1.637-.643-2.673-2.316-2.756-2.429-.084-.113-1.042-1.387-1.042-2.643 0-1.316.685-1.965.929-2.228.16-.173.35-.22.56-.22zm6.658 3.596c0 2.69-2.19 4.88-4.88 4.88a4.86 4.86 0 0 1-2.436-.65l-2.872.753.766-2.798a4.85 4.85 0 0 1-.77-2.185c0-2.693 2.19-4.882 4.882-4.882 2.69 0 4.88 2.19 4.88 4.882z" /></svg>
                            </Link>
                            <ProductWishlistButton
                                productId={product.id}
                                productName={product.name}
                                className="w-16 h-16 flex items-center justify-center border-2 border-[#E5E1D8] rounded-2xl hover:border-rose-500 transition-all"
                            />
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.4} className="grid grid-cols-1 sm:grid-cols-2 gap-12 py-10 border-y border-[#F9F7F2]">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] bg-amber-50 px-3 py-1 rounded-lg">Komposisi Bunda</span>
                            <p className="text-sm text-gray-600 leading-relaxed font-black opacity-70">
                                {product.ingredients || 'Informasi bahan belum tersedia.'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] bg-amber-50 px-3 py-1 rounded-lg">Analisis Gizi</span>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Kalori</span>
                                    <p className="font-black text-[#1A241A] tracking-tighter">{nutritionConfig.calories}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Protein</span>
                                    <p className="font-black text-[#1A241A] tracking-tighter">{nutritionConfig.protein}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lemak</span>
                                    <p className="font-black text-[#1A241A] tracking-tighter">{nutritionConfig.fat}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Karbo</span>
                                    <p className="font-black text-[#1A241A] tracking-tighter">{nutritionConfig.carbs}</p>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.5} className="space-y-4 bg-[#F9F7F2] p-8 rounded-[2rem] border-2 border-dashed border-[#E5E1D8]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Saran Penyajian Praktis</span>
                        <p className="text-base text-[#4A5D4A] leading-relaxed font-bold italic">
                            "{product.storageType === 'FROZEN' ? 'Lakukan Thawing (pencairan) di chiller semalaman sebelum dimasak. ' : ''}
                            Panaskan sesuai selera keluarga Bunda di rumah."
                        </p>
                    </AnimatedSection>
                </div>
            </div>

            {/* Social Proof: Product Reviews */}
            <AnimatedSection delay={0.2}>
                <div className="mt-40 pt-24 border-t border-[#f3f1ee]">
                    <ProductReviews
                        brandId={brand.id}
                        productName={product.name}
                        initialReviews={initialReviews as any}
                    />
                </div>
            </AnimatedSection>

            {/* Product Recommendations */}
            <AnimatedSection delay={0.3}>
                <ProductRecommendations products={recommendedProducts} />
            </AnimatedSection>

            {/* Platform Links */}
            <AnimatedSection delay={0.4}>
                <div className="mt-24 pt-24 border-t border-[#f3f1ee]">
                    <PlatformLinks links={settings?.links} />
                </div>
            </AnimatedSection>
        </div>
    );
}
