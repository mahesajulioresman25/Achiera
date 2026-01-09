import React from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/commerce/AddToCartButton';

import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuProductListPage() {
    // Fetch Brand RASA IBU
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    // Fetch real products - ONLY from PUBLIC categories
    const products = await prisma.frozenProduct.findMany({
        where: {
            // Filter products that belong to a Public Category (Menu)
            // and ensure that category is Active
            category: {
                brandId: brand.id,
                isActive: true
            }
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
            variantName: firstVariant?.name || 'Porsi Keluarga'
        };
    });

    const settings = brand?.paymentSettings as any;
    const whatsapp = settings?.whatsappCrm || '628123456789';

    return (
        <div className="py-24 max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="max-w-2xl space-y-6 mb-24">
                <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">Menu Dapur Kami</span>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-[#1A241A] leading-tight">Hidangan Rumah <br /> Untuk Meja Makan Anda.</h1>
                <p className="text-base font-medium text-gray-600 leading-relaxed">
                    Setiap menu dibuat dalam porsi keluarga (2-3 orang). Tanpa pengawet, hanya menggunakan bumbu alami.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-8">
                {mappedProducts.map((product) => (
                    <div key={product.id} className="group space-y-6">
                        <Link
                            href={`/rasa-ibu/products/${product.slug}`}
                            className="block"
                        >
                            <div className="relative aspect-[4/5] bg-gradient-to-br from-[#F9F7F2] to-[#E5E1D8] rounded-[2.5rem] overflow-hidden transition-all duration-500 group-hover:scale-[1.02] shadow-sm group-hover:shadow-xl">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center italic text-gray-300 font-medium">
                                        [Foto: {product.name}]
                                    </div>
                                )}

                                {/* Overlay gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {!product.inStock && (
                                    <div className="absolute top-6 right-6 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-lg">
                                        Habis Terjual
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-6 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-[#8B7E66] shadow-lg border border-white/50">
                                    {product.category}
                                </div>
                            </div>

                            <div className="space-y-3 px-2">
                                <div className="flex justify-between items-start gap-4">
                                    <h2 className="text-xl font-black text-[#1A241A] tracking-tight group-hover:text-[#8B7E66] transition-colors leading-tight">{product.name}</h2>
                                    <span className="text-lg font-black text-[#8B7E66] shrink-0">Rp {product.price.toLocaleString('id-ID')}</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2">
                                    {product.shortDesc}
                                </p>
                            </div>
                        </Link>

                        <div className="px-2">
                            <AddToCartButton
                                product={product}
                                className="w-full bg-gradient-to-r from-[#2D3A2D] to-[#1A241A] hover:from-[#3d4d3d] hover:to-[#2D3A2D] text-[#FDFBF7] shadow-md hover:shadow-lg transition-all"
                                label={product.inStock ? 'Siapkan Untuk Keluarga' : 'Dapur Sedang Masak'}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Manual Assistance Footer */}
            <div className="mt-40 p-12 md:p-16 bg-gradient-to-br from-[#F9F7F2] to-[#E5E1D8] rounded-[3rem] text-center space-y-8 shadow-lg relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B7E66]/5 rounded-full blur-3xl"></div>

                <div className="relative z-10 space-y-8">
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight">Butuh Rekomendasi Menu?</h3>
                    <p className="text-base text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
                        Tanya kami menu apa yang cocok untuk acara spesial atau stok mingguan Anda. Kami siap membantu via WhatsApp.
                    </p>
                    <div className="flex justify-center pt-4">
                        <a
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Rasa Ibu, bisa bantu rekomendasi menu untuk anak kos?")}`}
                            className="group inline-flex items-center gap-3 border-2 border-[#1A241A] text-[#1A241A] px-10 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#1A241A] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl"
                        >
                            Hubungi Assistant
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
