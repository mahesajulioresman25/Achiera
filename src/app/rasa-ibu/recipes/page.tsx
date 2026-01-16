import React from 'react';
import Link from 'next/link';
import { ChefHat, Clock, Plus } from 'lucide-react';
import CategoryFilter from '@/components/filters/CategoryFilter';
import RecipeLikeButton from '@/components/content/RecipeLikeButton';
import RecipeSearch from '@/components/content/RecipeSearch';
import AnimatedSection from '@/components/commerce/AnimatedSection';

import { prisma } from '@/lib/prisma';
import { getPublishedRecipes, getRecipeCategories } from '@/lib/actions/rasa-ibu/recipes';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecipesPage({
    searchParams
}: {
    searchParams: Promise<{ category?: string; author?: string; q?: string }>
}) {
    const params = await searchParams;
    const selectedCategory = params.category;
    const selectedAuthor = params.author;
    const searchQuery = params.q;

    // Fetch brand
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return <div className="py-24 text-center text-stone-400 font-black">Brand not found</div>;

    // Fetch recipes, categories and config
    const [rawRecipes, categories, config] = await Promise.all([
        getPublishedRecipes(brand.id, selectedCategory, selectedAuthor, searchQuery),
        getRecipeCategories(brand.id),
        prisma.brandConfig.findUnique({ where: { brandId: brand.id } })
    ]);

    // Sanitize recipes to POJOs for safe hydration
    const recipes = JSON.parse(JSON.stringify(rawRecipes));

    // CMS Values with fallbacks
    const heroTitle = config?.recipeListHeroTitle || 'Kreasi Rasa Dapur Bunda';
    const heroSubtitle = config?.recipeListHeroSubtitle || 'Temukan inspirasi masakan lezat dari ribuan Ibu hebat lainnya. Punya resep rahasia? Bagikan dan jadilah inspirasi!';
    const heroTagline = config?.recipeListHeroTagline || 'Komunitas Rasa Ibu';
    const heroImage = config?.recipeListHeroImage || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80';

    // Fallback to mock data if no recipes in database
    const displayRecipes = recipes;

    // Fallback categories if none in database
    const displayCategories = categories;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-24">
            {/* Header Section */}
            <div className="relative min-h-[60vh] md:min-h-[75vh] bg-[#2D3A2D] overflow-hidden flex items-center justify-center pt-24 pb-32">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src={heroImage}
                    alt="Cooking Background"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105"
                />

                <div className="relative z-20 w-full max-w-5xl mx-auto text-center px-6">
                    <AnimatedSection direction="up">
                        <span className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[#FDFBF7] text-[10px] md:text-sm font-black tracking-[0.3em] mb-8 uppercase">
                            {heroTagline}
                        </span>

                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-[#FDFBF7] mb-8 leading-none tracking-tighter">
                            {selectedAuthor ? (
                                <>Resep <span className="text-[#B2BCA2] italic">{selectedAuthor}</span></>
                            ) : heroTitle.includes(' ') ? (
                                <>
                                    {heroTitle.split(' ').slice(0, -2).join(' ')} <br className="hidden sm:block" />
                                    <span className="text-[#B2BCA2] italic">{heroTitle.split(' ').slice(-2).join(' ')}</span>
                                </>
                            ) : heroTitle}
                        </h1>

                        <p className="text-[#E5E1D8] text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-black leading-tight opacity-90 balance">
                            {selectedAuthor ? `Koleksi masakan rumahan autentik yang dibuat dengan cinta oleh ${selectedAuthor}.` : heroSubtitle}
                        </p>
                    </AnimatedSection>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-30">
                {/* Search & Filter Bar */}
                <AnimatedSection delay={0.2}>
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-2xl border border-white/50 mb-16 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
                            <div className="overflow-x-auto custom-scrollbar-hide pb-2 md:pb-0">
                                <CategoryFilter
                                    categories={displayCategories}
                                    initialCategory={selectedCategory || 'Semua'}
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                <RecipeSearch />
                                {!selectedAuthor && (
                                    <Link
                                        href="/rasa-ibu/recipes/submit"
                                        className="h-12 px-6 bg-[#2D3A2D] hover:bg-[#8B7E66] text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shrink-0 shadow-lg shadow-green-900/10"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Bagikan Resep
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {displayRecipes.map((recipe: any, idx: number) => (
                        <AnimatedSection key={recipe.id} delay={0.1 * (idx % 3)} direction="up">
                            <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-[#E5E1D8] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-500 flex flex-col h-full">
                                <div className="relative h-64 md:h-72 overflow-hidden shrink-0">
                                    <img
                                        src={recipe.image || '/placeholder-recipe.jpg'}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-black text-[#2D3A2D] flex items-center gap-2 shadow-xl border border-white">
                                        <Clock className="w-4 h-4 text-amber-500" /> {recipe.duration} Menit
                                    </div>
                                    <div className="absolute bottom-6 right-6">
                                        <RecipeLikeButton
                                            brandId={brand.id}
                                            recipeId={recipe.id}
                                            initialLikes={recipe.likesCount || 0}
                                            showCount
                                            className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white group-hover:scale-110 transition-transform"
                                            iconClassName="w-5 h-5"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-grow bg-gradient-to-b from-white to-[#FDFBF7]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {recipe.difficulty}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-[#1A241A] mb-3 leading-tight group-hover:text-[#8B7E66] transition-colors line-clamp-2">
                                        {recipe.title}
                                    </h3>

                                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[2.5rem] flex-grow font-black opacity-60">
                                        "{recipe.description || 'Resep lezat dari dapur Rasa Ibu'}"
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-[#E5E1D8] mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] border border-[#E5E1D8]">
                                                <ChefHat className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Author</span>
                                                <span className="text-xs font-black text-[#1A241A] truncate max-w-[100px]">
                                                    {recipe.authorName}
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/rasa-ibu/recipes/${recipe.slug}`}
                                            className="px-6 py-3 bg-[#2D3A2D] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#8B7E66] transition-all shadow-lg shadow-green-900/10"
                                        >
                                            Lihat Resep →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>

                {displayRecipes.length === 0 && (
                    <AnimatedSection delay={0.5}>
                        <div className="text-center py-32 text-slate-300 font-black italic text-2xl">
                            Belum ada resep yang dipublikasikan.
                        </div>
                    </AnimatedSection>
                )}
            </div>
        </div>
    );
}
