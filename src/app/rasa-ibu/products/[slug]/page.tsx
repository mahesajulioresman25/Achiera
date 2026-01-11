import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import PlatformLinks from '@/components/commerce/PlatformLinks';
import ProductRecommendations from '@/components/commerce/ProductRecommendations';
import { prisma } from '@/lib/prisma';
import { getRecommendedProducts, incrementProductView } from '@/lib/actions/rasa-ibu/public-products';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch Brand Config
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { paymentSettings: true }
    });

    // Fetch Product from Database
    const product = await prisma.frozenProduct.findFirst({
        where: {
            slug: slug,
            category: { brand: { slug: 'rasa-ibu' } }
        },
        include: {
            variants: true
        }
    });

    const settings = brand?.paymentSettings as any;
    const whatsapp = settings?.whatsappCrm || '628123456789';

    if (!product) {
        return (
            <div className="py-40 text-center space-y-8">
                <h1 className="text-3xl font-black">Menu Tidak Ditemukan</h1>
                <Link href="/rasa-ibu/products" className="text-sm font-black uppercase text-[#8B7E66] border-b-2 border-[#8B7E66]">Kembali ke Menu</Link>
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

    // Fetch recommended products (similar products from same category)
    const recommendedProducts = await getRecommendedProducts(product.id, 4);

    // Increment view count (fire and forget)
    incrementProductView(product.id).catch(() => {
        // Silently fail if view tracking fails
    });


    return (
        <div className="py-24 max-w-7xl mx-auto px-6">
            <Link href="/rasa-ibu/products" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#8B7E66] transition-colors mb-12">
                ← Kembali ke Semua Menu
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                {/* Left: Image */}
                <div className="aspect-[4/5] bg-[#F9F7F2] rounded-[3rem] overflow-hidden flex items-center justify-center italic text-gray-300 relative group">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${!inStock ? 'grayscale opacity-75' : 'group-hover:scale-105'}`}
                        />
                    ) : (
                        <span>[Foto Detail: {product.name}]</span>
                    )}

                    {/* Out of Stock Overlay */}
                    {!inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-white/90 text-[#2D3A2D] px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm md:text-base shadow-xl border border-white/50">
                                Habis Terjual
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className="space-y-12">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tight text-[#1A241A]">{product.name}</h1>
                        <div className="flex items-center gap-6">
                            <span className="text-2xl font-black text-[#8B7E66]">Rp {price.toLocaleString('id-ID')}</span>
                            <span className="h-4 w-px bg-gray-200"></span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {weight > 0 ? `${weight}g` : 'Per Porsi'}
                            </span>
                            <span className="h-4 w-px bg-gray-200"></span>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                                {product.orderCount > 0 ? `${product.orderCount} Terjual` : 'Menu Baru'}
                            </span>
                        </div>
                    </div>

                    <p className="text-lg text-[#4A5D4A] leading-relaxed font-medium">
                        {product.description || 'Hidangan istimewa dari dapur Rasa Ibu, dibuat dengan bahan pilihan terbaik.'}
                    </p>

                    {/* Action */}
                    <div className="flex gap-4">
                        <AddToCartButton
                            product={{
                                id: product.id,
                                name: product.name,
                                price: price,
                                image: product.image || undefined,
                                variantId: primaryVariant?.id,
                                variantName: primaryVariant?.name || 'Porsi Keluarga'
                            }}
                            className="flex-1 bg-[#2D3A2D] text-[#FDFBF7] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                            label={inStock ? 'Siapkan Untuk Keluarga' : 'Habis Terjual'}
                            disabled={!inStock}
                        />
                        <Link
                            href={waLink}
                            target="_blank"
                            className="px-6 py-4 border border-[#E5E1D8] rounded-xl text-[#2D3A2D] hover:bg-[#F9F7F2] transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.809.891 2.796.891 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.778zm-1.785 2.158c.119-.265.234-.271.341-.271.096 0 .19 0 .285.006.113.007.262.038.397.33.143.309.489 1.155.53 1.239.041.084.07.181.011.3s-.089.26-.172.356c-.095.107-.2.18-.328.326-.067.078-.142.164-.06.31.082.148.363.593.778.963.535.477.986.626 1.125.685.14.058.22.046.302-.047.083-.093.357-.417.452-.56.096-.143.191-.119.321-.071.131.048.833.393.976.465.143.072.238.107.274.167.036.06.036.345-.131.81-.167.464-.976.845-1.345.881-.357.042-.714.053-2.03-.464-1.637-.643-2.673-2.316-2.756-2.429-.084-.113-1.042-1.387-1.042-2.643 0-1.316.685-1.965.929-2.228.16-.173.35-.22.56-.22zm6.658 3.596c0 2.69-2.19 4.88-4.88 4.88a4.86 4.86 0 0 1-2.436-.65l-2.872.753.766-2.798a4.85 4.85 0 0 1-.77-2.185c0-2.693 2.19-4.882 4.882-4.882 2.69 0 4.88 2.19 4.88 4.882z" /></svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#F9F7F2]">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Komposisi (Ingredients)</span>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                {product.ingredients || 'Informasi bahan belum tersedia.'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nilai Gizi (Per Sajian)</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400">Kalori</span>
                                    <p className="font-black text-[#1A241A]">{nutritionConfig.calories}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400">Protein</span>
                                    <p className="font-black text-[#1A241A]">{nutritionConfig.protein}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400">Lemak</span>
                                    <p className="font-black text-[#1A241A]">{nutritionConfig.fat}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400">Karbo</span>
                                    <p className="font-black text-[#1A241A]">{nutritionConfig.carbs}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Saran Penyajian</span>
                        <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-[#8B7E66] pl-4">
                            "{product.storageType === 'FROZEN' ? 'Lakukan Thawing (pencairan) di chiller semalaman sebelum dimasak. ' : ''}
                            Panaskan sesuai selera keluarga Bunda."
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Recommendations */}
            <ProductRecommendations products={recommendedProducts} />

            {/* Platform Links */}
            <div className="mt-24 pt-24 border-t border-[#F9F7F2]">
                <PlatformLinks links={settings?.links} />
            </div>
        </div>
    );
}
