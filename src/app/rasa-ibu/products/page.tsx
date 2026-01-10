import React from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';
import { ShoppingBag, Utensils, Star } from 'lucide-react';

import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductListPage() {
    // Fetch Brand RASA IBU
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    // Fetch real products - Filter for FINISHED_GOOD (Menu) only, exclude Raw Materials 
    const products = await prisma.frozenProduct.findMany({
        where: {
            // Ensure product belongs to this brand (via category linkage)
            category: {
                brandId: brand.id
            },
            // STRICTLY exclude Raw Materials/Ingredients
            inventoryType: 'FINISHED_GOOD'
        },
        include: {
            category: true,
            variants: true
        },
        orderBy: { name: 'asc' }
    });

    // Map to simple structure for UI
    const mappedProducts = products.map(p => {
        const firstVariant = p.variants[0];
        const totalStock = p.variants.reduce((sum, v) => sum + v.stockOnHand, 0);
        return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category?.name || 'Menu',
            price: Number(firstVariant?.price || 0),
            shortDesc: p.description || '',
            inStock: totalStock > 0,
            image: p.image || undefined,
            variantId: firstVariant?.id,
            variantName: firstVariant?.name || 'Porsi Keluarga',
            rating: 4.8 + (Math.random() * 0.2) // Mock rating for visual consistency
        };
    });

    const config = brand.brandConfig as any;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header Section (Recipe Style) */}
            <div className="relative h-[40vh] bg-[#2D3A2D] overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1543362906-ac1b452601e0?w=1600&q=80"
                    alt="Dining Table"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="max-w-3xl animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FDFBF7] text-xs font-bold tracking-[0.2em] mb-4 uppercase">
                            Dapur Rasa Ibu
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-[#FDFBF7] mb-6 leading-tight font-serif">
                            {config?.publicTitle || "Hidangan Rumah"} <br /> <span className="text-[#B2BCA2] italic">{config?.heroTagline || "Untuk Keluarga"}</span>
                        </h1>
                        <p className="text-[#E5E1D8] text-lg mb-8 max-w-xl mx-auto font-light">
                            Tanpa pengawet, bumbu alami, dan porsi pas untuk keluarga. Praktis tinggal hangatkan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-30">
                {/* Filter / Search Bar Placeholder (Optional) */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#E5E1D8] mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {['Semua Menu', 'Lauk Utama', 'Sayuran', 'Sambal'].map((cat) => (
                            <button
                                key={cat}
                                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${cat === 'Semua Menu'
                                    ? 'bg-[#2D3A2D] text-[#FDFBF7]'
                                    : 'bg-[#F9F7F2] text-[#8B7E66] hover:bg-[#F0EEE9]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Cari menu favorit..."
                            className="w-full pl-5 pr-12 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                        />
                        <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2BCA2] w-5 h-5" />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mappedProducts.map((product) => (
                        <div
                            key={product.id}
                            className="group bg-white rounded-2xl overflow-hidden border border-[#E5E1D8] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-300 animate-fade-in flex flex-col h-full"
                        >
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

                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                    <Star className="w-3 h-3 text-amber-500 fill-current" /> {product.rating.toFixed(1)}
                                </div>
                            </Link>

                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-[#F9F7F2] px-3 py-1 rounded-lg text-xs font-bold text-[#8B7E66] uppercase tracking-wider">
                                        {product.category}
                                    </div>
                                    <span className="text-sm font-black text-[#2D3A2D] bg-[#F0EEE9] px-2 py-1 rounded">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <Link href={`/rasa-ibu/products/${product.slug}`} className="group-hover:text-[#B2BCA2] transition-colors">
                                    <h3 className="text-xl font-bold text-[#2D3A2D] mb-2 font-serif line-clamp-2">
                                        {product.name}
                                    </h3>
                                </Link>

                                <p className="text-sm text-[#8B7E66] line-clamp-2 mb-6 h-10">
                                    {product.shortDesc || "Menu spesial keluarga yang praktis dan lezat."}
                                </p>

                                <div className="mt-auto pt-4 border-t border-[#F3F1ED]">
                                    <AddToCartButton
                                        product={product}
                                        className="w-full bg-[#2D3A2D] hover:bg-[#1A241A] text-[#FDFBF7] py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                        label={product.inStock ? 'Pesan Sekarang' : 'Habis'}
                                        icon={<ShoppingBag className="w-4 h-4" />}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
