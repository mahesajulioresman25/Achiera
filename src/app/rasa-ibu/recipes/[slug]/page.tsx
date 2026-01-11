
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ChefHat, Flame, Share2, Plus, ArrowLeft } from 'lucide-react';
import RecipeLikeButton from '@/components/content/RecipeLikeButton';
import AddToCartButton from '@/components/commerce/AddToCartButton';

import { prisma } from '@/lib/prisma';
import { getRecipeBySlug, getRelatedRecipes } from '@/lib/actions/rasa-ibu/recipes';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (!brand) return { title: 'Resep Tidak Ditemukan' };

    const recipe = await getRecipeBySlug(brand.id, slug);
    if (!recipe) return { title: 'Resep Tidak Ditemukan' };

    return {
        title: `${recipe.title} - Resep Rasa Ibu`,
        description: recipe.description,
        openGraph: {
            images: [recipe.image || '']
        }
    };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    // Fetch brand
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    // Fetch recipe
    const recipe = await getRecipeBySlug(brand.id, slug);

    if (!recipe) {
        return notFound();
    }

    // Fetch related recipes
    const relatedRecipes = await getRelatedRecipes(brand.id, recipe.category, recipe.id);

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header / Hero Image */}
            <div className="relative h-[50vh] md:h-[60vh] bg-gray-900">
                <img
                    src={recipe.image || '/placeholder-recipe.jpg'}
                    alt={recipe.title}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-6 left-6 z-20">
                    <Link
                        href="/rasa-ibu/recipes"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all text-sm font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Resep
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 max-w-7xl mx-auto">
                    <div className="bg-[#2D3A2D] inline-block px-3 py-1 rounded-lg text-xs font-bold text-[#FDFBF7] uppercase tracking-wider mb-4">
                        {recipe.category}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 font-serif leading-tight">
                        {recipe.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-white/90">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <ChefHat className="w-4 h-4" />
                            </div>
                            <span className="font-bold">{recipe.authorName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Clock className="w-4 h-4" /> {recipe.duration} Menit
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <RecipeLikeButton
                                recipeId={recipe.id}
                                initialLikes={recipe.likes}
                                className="text-white hover:text-pink-200"
                                iconClassName="w-4 h-4"
                            /> Suka
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                            Level: {recipe.difficulty}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-30 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#E5E1D8]">
                            <p className="text-lg text-gray-700 leading-relaxed italic border-l-4 border-[#B2BCA2] pl-6 py-2">
                                "{recipe.description}"
                            </p>
                        </div>

                        {/* Ingredients */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#E5E1D8]">
                            <h2 className="text-2xl font-black text-[#2D3A2D] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] text-lg">📝</span>
                                Bahan-bahan
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(recipe.ingredients) && recipe.ingredients.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 p-3 hover:bg-[#F9F7F2] rounded-xl transition-colors border-b border-gray-50 last:border-0">
                                        <div className="w-6 h-6 rounded-full border-2 border-[#B2BCA2] flex items-center justify-center mt-0.5 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#B2BCA2]" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            {recipe.servings && (
                                <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500 font-bold flex items-center gap-2">
                                    <div className="px-3 py-1 bg-gray-100 rounded-full">
                                        Untuk {recipe.servings} Porsi
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Steps */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#E5E1D8]">
                            <h2 className="text-2xl font-black text-[#2D3A2D] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] text-lg">🍳</span>
                                Cara Membuat
                            </h2>
                            <div className="space-y-8">
                                {Array.isArray(recipe.steps) && recipe.steps.map((step: string, idx: number) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-[#2D3A2D] text-[#FDFBF7] flex items-center justify-center font-black text-lg shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#2D3A2D]/20">
                                            {idx + 1}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-gray-700 leading-relaxed font-medium text-lg">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        {recipe.tips && (
                            <div className="bg-amber-50 rounded-2xl p-6 md:p-8 border border-amber-100">
                                <h3 className="text-amber-800 font-black mb-3 flex items-center gap-2">
                                    💡 Tips dari {recipe.authorName}
                                </h3>
                                <p className="text-amber-900/80 leading-relaxed">
                                    {recipe.tips}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Chef Profile (Simple) */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#E5E1D8] text-center">
                            <div className="w-20 h-20 rounded-full bg-[#E5E1D8] mx-auto mb-4 flex items-center justify-center text-3xl">
                                👩‍🍳
                            </div>
                            <h3 className="text-xl font-black text-[#2D3A2D] mb-1">{recipe.authorName}</h3>
                            <p className="text-sm text-gray-500 mb-6">Pecinta masakan rumahan</p>
                            <Link href={`/rasa-ibu/recipes?author=${encodeURIComponent(recipe.authorName)}`} className="block w-full">
                                <button className="w-full py-3 bg-[#F9F7F2] text-[#8B7E66] font-bold rounded-xl hover:bg-[#F0EEE9] transition-colors">
                                    Lihat Resep Lainnya
                                </button>
                            </Link>
                        </div>

                        {/* Call to Action - Product */}
                        <div className="bg-[#2D3A2D] rounded-2xl p-6 shadow-xl text-center text-[#FDFBF7] relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-2">Mau Masak Ini?</h3>
                                <p className="text-sm text-white/80 mb-6">Kami siapkan bahannya, Bunda tinggal masak!</p>
                                <Link
                                    href="/rasa-ibu/products"
                                    className="inline-block w-full py-3 bg-[#B2BCA2] text-[#2D3A2D] font-bold rounded-xl hover:bg-[#A3AD94] transition-colors shadow-lg"
                                >
                                    Belanja Bahannya
                                </Link>
                            </div>
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -ml-10 -mb-10"></div>
                        </div>

                        {/* Related Recipes */}
                        {relatedRecipes.length > 0 && (
                            <div>
                                <h3 className="font-black text-[#2D3A2D] mb-4 text-lg">Resep Terkait</h3>
                                <div className="space-y-4">
                                    {relatedRecipes.map((related: any) => (
                                        <Link
                                            key={related.id}
                                            href={`/rasa-ibu/recipes/${related.slug}`}
                                            className="group bg-white rounded-xl p-3 shadow-sm border border-[#E5E1D8] flex gap-3 hover:shadow-md transition-all"
                                        >
                                            <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                                <img src={related.image || '/placeholder-recipe.jpg'} alt={related.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#2D3A2D] text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[#B2BCA2] transition-colors">
                                                    {related.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" /> {related.duration}m
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
