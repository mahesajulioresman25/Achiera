import React from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import { ShoppingBag, Utensils, Star, Package } from 'lucide-react';
import PromoBadge from '@/components/commerce/PromoBadge';
import CategoryFilter from '@/components/filters/CategoryFilter';
import ProductWishlistButton from '@/components/commerce/ProductWishlistButton';
import BestForYou from '@/components/commerce/BestForYou';
import AnimatedSection from '@/components/commerce/AnimatedSection';
import AddBundleToCartButton from '@/components/commerce/AddBundleToCartButton';

import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { FlashSaleService } from '@/lib/services/FlashSaleService';
import ProductSearch from '@/components/filters/ProductSearch';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductListPage({
    searchParams
}: {
    searchParams: Promise<{ category?: string, q?: string }>
}) {
    try {
        const params = await searchParams;
        const selectedCategory = params.category;
        const searchQuery = params.q;

        // Fetch Brand RASA IBU
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: { brandConfig: true }
        });

        if (!brand) return <div className="py-24 text-center">Brand not found</div>;

        const brandId = brand.id;

        // Fetch categories, products, and bundles in parallel
        const [categories, products, activeFlashSale, activeBundles] = await Promise.all([
            prisma.frozenCategory.findMany({
                where: { brandId, isActive: true },
                orderBy: { name: 'asc' }
            }),
            prisma.frozenProduct.findMany({
                where: {
                    brandId,
                    category: {
                        ...(selectedCategory ? { slug: selectedCategory } : {})
                    },
                    OR: searchQuery ? [
                        { name: { contains: searchQuery, mode: 'insensitive' } },
                        { description: { contains: searchQuery, mode: 'insensitive' } }
                    ] : undefined,
                    inventoryType: 'FINISHED_GOOD'
                },
                include: {
                    category: true,
                    variants: true
                },
                orderBy: { name: 'asc' }
            }),
            FlashSaleService.getActiveFlashSale(brandId),
            prisma.productBundle.findMany({
                where: {
                    campaign: { brandId, isActive: true },
                    isActive: true
                },
                include: { items: true }
            })
        ]);

        // Map Products
        const mappedProducts = products.map((p: any) => {
            const firstVariant = p.variants[0];
            const totalStock = p.variants.reduce((sum: number, v: any) => sum + v.stockOnHand, 0);
            return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                categoryId: p.categoryId, // Needed for filtering
                category: p.category?.name || 'Menu',
                price: Number(firstVariant?.price || 0),
                shortDesc: p.description || '',
                inStock: totalStock > 0,
                image: p.image || undefined,
                variantId: firstVariant?.id,
                variantName: firstVariant?.name || 'Porsi Keluarga',
                rating: 4.8 + (Math.random() * 0.2)
            };
        });

        // Helper to calculate product price with flash sale
        const getProductPrice = (product: any) => {
            const basePrice = product.price;
            if (!activeFlashSale || activeFlashSale.status !== 'ACTIVE') return { base: basePrice, discount: 0, final: basePrice };

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

        const config = brand.brandConfig as any;

        // Custom Component for Product Card to avoid repetition
        const ProductCard = ({ product }: { product: any }) => (
            <div className="group bg-white rounded-[2rem] overflow-hidden border border-[#E5E1D8] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-500 flex flex-col h-full relative">

                {/* Wishlist Button Overlay */}
                <div className="absolute top-4 left-4 z-20">
                    <ProductWishlistButton
                        productId={product.id}
                        productName={product.name}
                        className="p-2 w-10 h-10 shadow-md bg-white/90 backdrop-blur-sm"
                    />
                </div>

                <Link href={`/rasa-ibu/products/${product.slug}`} className="block relative h-64 overflow-hidden shrink-0">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#F9F7F2] flex items-center justify-center text-[#E5E1D8] italic">
                            No Image
                        </div>
                    )}

                    {!product.inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <span className="px-3 py-1 bg-white/90 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Habis
                            </span>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 text-amber-500 fill-current" /> {product.rating.toFixed(1)}
                    </div>

                    {getProductPrice(product).discount > 0 && (
                        <PromoBadge type="FLASH_SALE" className="absolute top-4 left-4" />
                    )}
                </Link>

                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-[#F9F7F2] px-3 py-1 rounded-[10px] text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.1em]">
                            {product.category}
                        </div>
                        <div className="text-right">
                            {getProductPrice(product).discount > 0 ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 line-through">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-black">
                                            -{getProductPrice(product).discount}%
                                        </span>
                                        <span className="text-sm font-black text-amber-600">
                                            Rp {getProductPrice(product).final.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-sm font-black text-[#2D3A2D] bg-[#F0EEE9] px-2 py-1 rounded-[10px]">
                                    Rp {product.price.toLocaleString('id-ID')}
                                </span>
                            )}
                        </div>
                    </div>

                    <Link href={`/rasa-ibu/products/${product.slug}`} className="group-hover:text-[#B2BCA2] transition-colors">
                        <h3 className="text-xl font-black text-[#1A241A] mb-2 leading-tight line-clamp-2">
                            {product.name}
                        </h3>
                    </Link>

                    <p className="text-xs font-medium text-[#8B7E66] line-clamp-2 mb-6 h-8 leading-relaxed">
                        {product.shortDesc || "Menu spesial keluarga yang praktis dan lezat."}
                    </p>

                    <div className="mt-auto pt-4 border-t border-[#F3F1ED]">
                        <AddToCartButton
                            product={product}
                            className="w-full bg-[#2D3A2D] hover:bg-[#1A241A] text-[#FDFBF7] py-3 rounded-xl font-black shadow-md transition-all flex items-center justify-center gap-2"
                            label={product.inStock ? 'Pesan Sekarang' : 'Habis'}
                        />
                    </div>
                </div>
            </div>
        );

        const BundleCard = ({ bundle }: { bundle: any }) => (
            <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] overflow-hidden border border-amber-100/50 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 flex flex-col h-full relative">
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-5 py-2 rounded-bl-[1.5rem] text-[10px] font-black uppercase tracking-widest z-10 transition-all group-hover:px-7">
                    Paket Hemat
                </div>

                <div className="p-8 flex flex-col flex-grow">
                    <div className="mb-6 flex justify-center">
                        <div className="bg-white p-5 rounded-[1.5rem] shadow-lg shadow-amber-200/20 group-hover:scale-110 transition-transform duration-500">
                            <Package className="w-10 h-10 text-amber-600" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-[#1A241A] mb-2 text-center">
                        {bundle.name}
                    </h3>
                    <p className="text-xs font-medium text-[#8B7E66] text-center mb-8 line-clamp-2 italic">
                        {bundle.description || "Paket spesial untuk keluarga tercinta."}
                    </p>

                    <div className="space-y-4 mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-amber-100/50 shadow-inner">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-[#8B7E66]">Hemat Bunda</span>
                            <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                Rp {(Number(bundle.basePrice) - Number(bundle.price)).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="h-px bg-amber-100" />
                        <div className="flex justify-between items-end">
                            <span className="text-[#1A241A] text-xs font-black uppercase tracking-widest pb-1">Total</span>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-400 line-through mb-0.5">
                                    Rp {Number(bundle.basePrice).toLocaleString('id-ID')}
                                </div>
                                <div className="text-2xl font-black text-[#1A241A] tracking-tighter">
                                    Rp {Number(bundle.price).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <AddBundleToCartButton bundle={bundle} className="shadow-xl shadow-slate-900/10" />
                        <p className="text-[9px] text-center text-amber-700/60 mt-4 font-black uppercase tracking-[0.2em] opacity-40">
                            Detail paket di dalam
                        </p>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="min-h-screen bg-[#FDFBF7] pb-20">
                {/* Header Section (Recipe Style) */}
                <div className="relative min-h-[450px] md:h-[60vh] bg-[#2D3A2D] overflow-hidden">
                    <div className="absolute inset-0 bg-black/30 z-10" />
                    <img
                        src={config?.productListHeroImage || config?.heroImage || "https://images.unsplash.com/photo-1543362906-ac1b452601e0?w=1600&q=80"}
                        alt="Dining Table"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pt-16 md:pt-0">
                        <AnimatedSection direction="down" className="max-w-3xl">
                            <span className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FDFBF7] text-[10px] md:text-xs font-black tracking-[0.3em] mb-6 uppercase">
                                {config?.productListHeroTagline || config?.heroTagline || "Dapur Rasa Ibu"}
                            </span>
                            <h1 className="text-4xl md:text-7xl font-black text-[#FDFBF7] mb-8 leading-tight tracking-tight px-2 drop-shadow-2xl">
                                {config?.productListHeroTitle || config?.publicTitle || "Hidangan Rumah"}
                            </h1>
                            <p className="text-[#E5E1D8] text-sm md:text-xl mb-8 max-w-2xl mx-auto font-medium leading-relaxed opacity-90">
                                {config?.productListHeroSubtitle || "Tanpa pengawet, bumbu alami, dan porsi pas untuk keluarga. Praktis tinggal hangatkan."}
                            </p>
                        </AnimatedSection>
                    </div>

                    {/* Bottom Curve Decor */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FDFBF7] to-transparent z-20" />
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-30">
                    <AnimatedSection delay={0.2}>
                        <BestForYou brandId={brandId} />
                    </AnimatedSection>

                    {/* Filter / Search Bar */}
                    <AnimatedSection delay={0.3}>
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-2xl shadow-slate-200 border border-white mb-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
                            <CategoryFilter
                                categories={categories.map((c: any) => ({ name: c.name, slug: c.slug }))}
                                initialCategory={selectedCategory ? categories.find((c: any) => c.slug === selectedCategory)?.name || 'Semua' : 'Semua'}
                            />
                            <ProductSearch defaultValue={searchQuery} />
                        </div>

                        {searchQuery && (
                            <div className="mb-10 px-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h2 className="text-xl font-medium text-[#8B7E66]">
                                    Menampilkan hasil untuk <span className="text-[#2D3A2D] font-black underline decoration-amber-400 decoration-4 underline-offset-8">"{searchQuery}"</span>
                                    <span className="ml-3 text-sm text-stone-400 font-bold uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-full">
                                        {mappedProducts.length} Menu ditemukan
                                    </span>
                                </h2>
                            </div>
                        )}
                    </AnimatedSection>

                    {/* If Specific Category Selected -> Show Standard Grid */}
                    {selectedCategory ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {mappedProducts.map((product: any, idx: number) => (
                                <AnimatedSection key={product.id} delay={idx * 0.05}>
                                    <ProductCard product={product} />
                                </AnimatedSection>
                            ))}
                        </div>
                    ) : (
                        /* If "Semua" -> Show Grouped Sections */
                        <div className="space-y-32">

                            {/* 1. Bundles / Paket Hemat Section */}
                            {activeBundles.length > 0 && (
                                <section>
                                    <AnimatedSection className="flex items-center gap-5 mb-10">
                                        <div className="w-14 h-14 bg-amber-500 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-amber-200">
                                            <Package className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-[#1A241A] tracking-tight">Paket Hemat Bunda</h2>
                                            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Pilihan cerdas untuk stok mingguan.</p>
                                        </div>
                                    </AnimatedSection>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        {activeBundles.map((bundle: any, idx: number) => (
                                            <AnimatedSection key={bundle.id} delay={idx * 0.1}>
                                                <BundleCard bundle={bundle} />
                                            </AnimatedSection>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 2. Category Groups */}
                            {categories.map((category: any) => {
                                const categoryProducts = mappedProducts.filter((p: any) => p.categoryId === category.id);
                                if (categoryProducts.length === 0) return null;

                                return (
                                    <section key={category.id}>
                                        <AnimatedSection className="flex items-center gap-6 mb-12">
                                            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-[#E5E1D8]"></div>
                                            <h2 className="text-2xl font-black text-[#1A241A] uppercase tracking-widest px-8 py-3 rounded-[1.25rem] bg-white border border-[#E5E1D8] shadow-sm">
                                                {category.name}
                                            </h2>
                                            <div className="h-px flex-grow bg-gradient-to-l from-transparent to-[#E5E1D8]"></div>
                                        </AnimatedSection>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                            {categoryProducts.map((product: any, idx: number) => (
                                                <AnimatedSection key={product.id} delay={idx * 0.05}>
                                                    <ProductCard product={product} />
                                                </AnimatedSection>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {mappedProducts.length === 0 && (
                                <AnimatedSection className="py-32 text-center">
                                    <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShoppingBag className="w-8 h-8 text-[#B2BCA2]" />
                                    </div>
                                    <p className="text-[#8B7E66] font-bold uppercase tracking-[0.2em]">Belum ada menu di kategori ini, Bunda.</p>
                                </AnimatedSection>
                            )}
                        </div>
                    )}
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
