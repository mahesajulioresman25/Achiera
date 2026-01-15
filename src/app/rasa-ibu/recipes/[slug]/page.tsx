import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ChefHat, Flame, ArrowLeft, Plus, Gift, ShieldCheck } from 'lucide-react';
import RecipeLikeButton from '@/components/content/RecipeLikeButton';
import RecipeBookmarkButton from '@/components/content/RecipeBookmarkButton';
import RecipeComments from '@/components/content/RecipeComments';
import SocialShare from '@/components/content/SocialShare';
import AnimatedSection from '@/components/commerce/AnimatedSection';

import { prisma } from '@/lib/prisma';
import { getRecipeBySlug, getRelatedRecipes } from '@/lib/actions/rasa-ibu/recipes';
import PrintRecipeButton from '@/components/content/PrintRecipeButton';

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

    if (!brand) return <div className="py-24 text-center font-black">Brand not found</div>;

    // Fetch recipe
    const rawRecipe = await getRecipeBySlug(brand.id, slug);

    if (!rawRecipe) {
        return notFound();
    }

    // Fetch related recipes
    const rawRelatedRecipes = await getRelatedRecipes(brand.id, rawRecipe.category, rawRecipe.id);

    // Sanitize data for Client Components
    const recipe = JSON.parse(JSON.stringify(rawRecipe));
    const relatedRecipes = JSON.parse(JSON.stringify(rawRelatedRecipes));

    // Canonical URL for sharing
    const currentUrl = `https://rasaibu.id/recipes/${recipe.slug}`;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-32">
            {/* Header / Hero Image */}
            <div className="relative h-[70vh] md:h-[80vh] bg-gray-900 overflow-hidden">
                <img
                    src={recipe.image || '/placeholder-recipe.jpg'}
                    alt={recipe.title}
                    className="w-full h-full object-cover opacity-80 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A241A] via-[#1A241A]/20 to-transparent" />

                <div className="absolute top-8 left-8 z-40">
                    <AnimatedSection direction="right">
                        <Link
                            href="/rasa-ibu/recipes"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest border border-white/20 shadow-2xl group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Kembali Ke Galeri
                        </Link>
                    </AnimatedSection>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-20 z-20 max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="flex-1">
                            <AnimatedSection direction="up" delay={0.1}>
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="bg-[#B2BCA2] px-5 py-2 rounded-2xl text-[10px] font-black text-[#2D3A2D] uppercase tracking-[0.3em] shadow-xl">
                                        {recipe.category}
                                    </span>
                                    <div className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                        <Clock className="w-4 h-4 text-amber-500" /> {recipe.duration} Menit Persiapan
                                    </div>
                                </div>

                                <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-white mb-10 tracking-tighter leading-none font-serif">
                                    {recipe.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-8 text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md shadow-2xl">
                                            <ChefHat className="w-8 h-8 text-[#B2BCA2]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Inspirasi Oleh</span>
                                            <span className="font-black text-2xl tracking-tight">{recipe.authorName}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <RecipeLikeButton
                                            brandId={brand.id}
                                            recipeId={recipe.id}
                                            initialLikes={recipe.likesCount}
                                            className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/20 hover:bg-white/20 transition-all shadow-2xl"
                                            iconClassName="w-6 h-6"
                                        />
                                        <RecipeBookmarkButton
                                            recipeId={recipe.id}
                                            className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 hover:bg-white/20 transition-all shadow-2xl flex items-center justify-center"
                                        />
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>

                        <AnimatedSection direction="left" delay={0.3} className="flex flex-col gap-6 lg:items-end">
                            <SocialShare title={recipe.title} url={currentUrl} />
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest lg:text-right opacity-80">Bagikan inspirasi masakan hari ini</p>
                        </AnimatedSection>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-30 -mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Description */}
                        <AnimatedSection delay={0.4}>
                            <div className="bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl border border-[#E5E1D8] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#B2BCA2]"></div>
                                <p className="text-2xl text-[#2D3A2D] leading-relaxed italic font-black opacity-80">
                                    "{recipe.description}"
                                </p>
                            </div>
                        </AnimatedSection>

                        {/* Ingredients */}
                        <AnimatedSection delay={0.5}>
                            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-[#E5E1D8]">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-12">
                                    <h2 className="text-4xl font-black text-[#1A241A] tracking-tighter flex items-center gap-4">
                                        <span className="w-12 h-12 rounded-3xl bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] border border-[#E5E1D8]">📝</span>
                                        Bahan-bahan Spesial
                                    </h2>
                                    <PrintRecipeButton />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Array.isArray(recipe.ingredients) && recipe.ingredients.map((item: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-5 p-6 bg-[#F9F7F2]/50 hover:bg-[#F9F7F2] rounded-[2rem] transition-all border border-transparent hover:border-[#E5E1D8] group">
                                            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#B2BCA2] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                                <div className="w-3 h-3 rounded-full bg-[#B2BCA2]" />
                                            </div>
                                            <span className="text-[#1A241A] font-black opacity-80 text-lg tracking-tight">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                {recipe.servings && (
                                    <div className="mt-12 pt-8 border-t border-[#F3F1ED] text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Untuk {recipe.servings} Porsi Keluarga
                                        </div>
                                        <p className="opacity-60 italic text-right">* Estimasi porsi cukup untuk dinikmati bersama Bunda & Keluarga</p>
                                    </div>
                                )}
                            </div>
                        </AnimatedSection>

                        {/* Steps */}
                        <AnimatedSection delay={0.6}>
                            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-[#E5E1D8]">
                                <h2 className="text-4xl font-black text-[#1A241A] mb-12 tracking-tighter flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-3xl bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] border border-[#E5E1D8]">🍳</span>
                                    Langkah Memasak Bunda
                                </h2>
                                <div className="space-y-16">
                                    {Array.isArray(recipe.steps) && recipe.steps.map((step: string, idx: number) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-8 group">
                                            <div className="w-16 h-16 rounded-[2rem] bg-[#2D3A2D] text-[#FDFBF7] flex items-center justify-center font-black text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-2xl shadow-green-900/20 border-4 border-white">
                                                {idx + 1}
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <p className="text-[#1A241A] leading-relaxed font-black opacity-80 text-xl lg:text-2xl tracking-tight">{step}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Tips */}
                        {recipe.tips && (
                            <AnimatedSection delay={0.7}>
                                <div className="bg-[#2D3A2D] rounded-[3rem] p-12 text-[#FDFBF7] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10">
                                        <span className="text-4xl">💡</span> Rahasia Dapur {recipe.authorName}
                                    </h3>
                                    <p className="text-xl leading-relaxed relative z-10 font-black opacity-90 italic">
                                        "{recipe.tips}"
                                    </p>
                                </div>
                            </AnimatedSection>
                        )}

                        {/* Comments Section */}
                        <AnimatedSection delay={0.8}>
                            <RecipeComments recipeId={recipe.id} initialComments={recipe.comments || []} />
                        </AnimatedSection>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-12 print:hidden">
                        {/* Chef Profile */}
                        <AnimatedSection delay={0.3} direction="left">
                            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#E5E1D8] text-center group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#B2BCA2]"></div>
                                <div className="relative w-28 h-28 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-[#B2BCA2] rounded-[2.5rem] animate-pulse-slow opacity-20"></div>
                                    <div className="relative w-full h-full rounded-[2.5rem] bg-stone-50 flex items-center justify-center text-5xl border-4 border-white shadow-xl">
                                        👩‍🍳
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-[#1A241A] mb-2">{recipe.authorName}</h3>
                                <p className="text-sm text-[#8B7E66] mb-8 font-black italic opacity-60">"Masakan Bunda adalah rasa yang paling dirindu"</p>
                                <Link href={`/rasa-ibu/recipes?author=${encodeURIComponent(recipe.authorName)}`} className="block w-full">
                                    <button className="w-full py-5 bg-[#2D3A2D] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#8B7E66] transition-all shadow-xl hover:-translate-y-1 active:scale-95">
                                        Cari Resep Bunda Lainnya
                                    </button>
                                </Link>
                            </div>
                        </AnimatedSection>

                        {/* Call to Action - Product */}
                        <AnimatedSection delay={0.5} direction="left">
                            <div className="bg-emerald-900 rounded-[3rem] p-10 shadow-2xl text-center text-white relative overflow-hidden group border-4 border-[#B2BCA2]/20">
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black mb-4 tracking-tighter">Bunda Mau Re-cook?</h3>
                                    <p className="text-base text-white/70 mb-10 font-black opacity-80 leading-tight">Kami antarkan bahan segar pilihan Bunda sampai depan rumah!</p>
                                    <Link
                                        href={(recipe as any).relatedProductSlug ? `/rasa-ibu/products/${(recipe as any).relatedProductSlug}` : '/rasa-ibu/products'}
                                        className="inline-block w-full py-5 bg-[#B2BCA2] text-[#2D3A2D] font-black rounded-2xl hover:bg-white hover:scale-[1.05] transition-all shadow-2xl font-sans text-xs uppercase tracking-widest border-2 border-transparent hover:border-emerald-600"
                                    >
                                        {(recipe as any).relatedProductSlug ? '🛒 BELANJA BAHANNYA SEKARANG' : '📂 LIHAT SEMUA BAHAN'}
                                    </Link>
                                </div>
                                {/* Decorative */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
                            </div>
                        </AnimatedSection>

                        {/* Community Appreciation Program */}
                        <AnimatedSection delay={0.6} direction="left">
                            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#E5E1D8] relative overflow-hidden group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                                        <Gift className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-[#2D3A2D] tracking-tight">Program Apresiasi Bunda</h3>
                                </div>
                                <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                                    Resep ini berkesempatan terpilih menjadi <span className="text-[#2D3A2D] font-black italic">Menu Resmi Rasa Ibu</span>. Penulis akan mendapatkan reward spesial!
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                        <ShieldCheck className="w-5 h-5 text-[#B2BCA2]" />
                                        <span className="text-[10px] font-black text-[#2D3A2D] uppercase tracking-wider">50.000 Poin Loyalty</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                        <ChefHat className="w-5 h-5 text-[#B2BCA2]" />
                                        <span className="text-[10px] font-black text-[#2D3A2D] uppercase tracking-wider">Nama Bunda di Label Menu</span>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* Related Recipes */}
                        {relatedRecipes.length > 0 && (
                            <AnimatedSection delay={0.7} direction="left" className="space-y-6">
                                <h3 className="font-black text-[#1A241A] px-4 text-xs uppercase tracking-[0.25em] border-l-4 border-[#B2BCA2]">Inspirasi Terkait</h3>
                                <div className="space-y-6">
                                    {relatedRecipes.map((related: any) => (
                                        <Link
                                            key={related.id}
                                            href={`/rasa-ibu/recipes/${related.slug}`}
                                            className="group bg-white rounded-3xl p-4 shadow-xl border border-[#E5E1D8] flex gap-5 hover:border-[#B2BCA2] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all"
                                        >
                                            <div className="w-24 h-24 rounded-2xl bg-[#F9F7F2] shrink-0 overflow-hidden border border-[#E5E1D8]">
                                                <img src={related.image || '/placeholder-recipe.jpg'} alt={related.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="pt-2">
                                                <h4 className="font-black text-[#1A241A] text-base leading-tight mb-3 line-clamp-2 group-hover:text-[#8B7E66] transition-colors">
                                                    {related.title}
                                                </h4>
                                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#B2BCA2]" /> {related.duration}m</span>
                                                    <span className="flex items-center gap-1 text-pink-500"><Flame className="w-4 h-4 fill-current" /> {related.likesCount}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </AnimatedSection>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
