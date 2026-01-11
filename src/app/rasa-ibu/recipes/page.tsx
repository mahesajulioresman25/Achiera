import React from 'react';
import Link from 'next/link';
import { Utensils, ChefHat, Clock, Flame, Plus } from 'lucide-react';
import CategoryFilter from '@/components/filters/CategoryFilter';

import { prisma } from '@/lib/prisma';
import { getPublishedRecipes, getRecipeCategories } from '@/lib/actions/rasa-ibu/recipes';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecipesPage({
    searchParams
}: {
    searchParams: Promise<{ category?: string; author?: string }>
}) {
    const params = await searchParams;
    const selectedCategory = params.category;
    const selectedAuthor = params.author;

    // Fetch brand
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    // Fetch recipes and categories
    const [recipes, categories] = await Promise.all([
        getPublishedRecipes(brand.id, selectedCategory, selectedAuthor),
        getRecipeCategories(brand.id)
    ]);

    // Fallback to mock data if no recipes in database
    const displayRecipes = recipes.length > 0 ? recipes : [
        {
            id: '1',
            title: 'Sarden Rasa Ibu Tumis Pete',
            authorName: 'Bunda Ani',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
            duration: 15,
            difficulty: 'Mudah',
            description: 'Cara asik menikmati sarden kaleng agar lebih wangi dan menggugah selera keluarga.',
            likes: 124,
            slug: 'sarden-tumis-pete'
        },
        {
            id: '2',
            title: 'Rendang Suwir Crispy',
            authorName: 'Kak Sari',
            image: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=800&q=80',
            duration: 20,
            difficulty: 'Sedang',
            description: 'Kreasi rendang sisa lebaran yang digoreng kering, cocok buat lauk tahan lama.',
            likes: 89,
            slug: 'rendang-suwir-crispy'
        },
        {
            id: '3',
            title: 'Nasi Goreng Sarden Pedas',
            authorName: 'Chef Juna (KW)',
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
            duration: 10,
            difficulty: 'Mudah',
            description: 'Sarapan praktis cuma modal nasi kemarin dan sarden Rasa Ibu.',
            likes: 215,
            slug: 'nasi-goreng-sarden'
        }
    ];

    // Fallback categories if none in database
    const displayCategories = categories.length > 0 ? categories : [
        { name: 'Sarapan', count: 3 },
        { name: 'Makan Siang', count: 5 },
        { name: 'Camilan', count: 2 },
        { name: 'Bekal Anak', count: 4 }
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header Section */}
            <div className="relative min-h-[350px] md:h-[50vh] bg-[#2D3A2D] overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1495521821758-ee18ece60918?w=1600&q=80"
                    alt="Cooking Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pt-16 md:pt-0">
                    <div className="max-w-3xl animate-fade-in-up">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FDFBF7] text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 uppercase">
                            Komunitas Rasa Ibu
                        </span>

                        {selectedAuthor ? (
                            <>
                                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-[#FDFBF7] mb-4 md:mb-6 leading-tight font-serif px-2">
                                    Resep Spesial <br className="hidden sm:block" /> <span className="text-[#B2BCA2] italic">{selectedAuthor}</span>
                                </h1>
                                <p className="text-[#E5E1D8] text-sm sm:text-base md:text-lg mb-6 md:mb-8 max-w-xl mx-auto font-light leading-relaxed px-4">
                                    Koleksi masakan rumahan autentik yang dibuat dengan cinta oleh {selectedAuthor}.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                                    <Link href="/rasa-ibu/recipes" className="px-6 md:px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 text-sm md:text-base border border-white/20">
                                        Lihat Semua Resep
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-[#FDFBF7] mb-4 md:mb-6 leading-tight font-serif px-2">
                                    Kreasi Rasa <br className="hidden sm:block" /> <span className="text-[#B2BCA2] italic">Dapur Bunda</span>
                                </h1>
                                <p className="text-[#E5E1D8] text-sm sm:text-base md:text-lg mb-6 md:mb-8 max-w-xl mx-auto font-light leading-relaxed px-4">
                                    Temukan inspirasi masakan lezat dari ribuan Ibu hebat lainnya. Punya resep rahasia? Bagikan dan jadilah inspirasi!
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                                    <button className="px-6 md:px-8 py-3 bg-[#B2BCA2] hover:bg-[#A3AD94] text-[#2D3A2D] rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm md:text-base">
                                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                        Bagikan Resep Saya
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 md:-mt-10 relative z-30">
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-[#E5E1D8] mb-12 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <CategoryFilter
                        categories={displayCategories}
                        initialCategory={selectedCategory || 'Semua'}
                    />
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Cari resep sarden..."
                            className="w-full pl-5 pr-12 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                        />
                        <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2BCA2] w-5 h-5" />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                    {displayRecipes.map((recipe: any) => (
                        <div
                            key={recipe.id}
                            className="group bg-white rounded-2xl overflow-hidden border border-[#E5E1D8] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-300 animate-fade-in flex flex-col h-full"
                        >
                            <div className="relative h-56 md:h-64 overflow-hidden shrink-0">
                                <img
                                    src={recipe.image || '/placeholder-recipe.jpg'}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                    <Clock className="w-3 h-3" /> {recipe.duration} Menit
                                </div>
                            </div>

                            <div className="p-4 md:p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-[#F9F7F2] px-3 py-1 rounded-lg text-xs font-bold text-[#8B7E66] uppercase tracking-wider">
                                        {recipe.difficulty}
                                    </div>
                                    <button className="text-pink-500 hover:text-pink-600 flex items-center gap-1 text-xs font-medium">
                                        <Flame className="w-4 h-4 fill-current" /> {recipe.likes}
                                    </button>
                                </div>

                                <h3 className="text-lg md:text-xl font-bold text-[#2D3A2D] mb-2 font-serif group-hover:text-[#B2BCA2] transition-colors line-clamp-2">
                                    {recipe.title}
                                </h3>

                                <p className="text-xs md:text-sm text-[#8B7E66] line-clamp-2 mb-4 min-h-[2.5rem] flex-grow">
                                    "{recipe.description || 'Resep lezat dari dapur Rasa Ibu'}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-[#F3F1ED] mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#E5E1D8] flex items-center justify-center text-[#8B7E66]">
                                            <ChefHat className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-[#2D3A2D] truncate max-w-[100px] sm:max-w-[120px]">
                                            {recipe.authorName}
                                        </span>
                                    </div>

                                    <Link
                                        href={`/rasa-ibu/recipes/${recipe.slug}`}
                                        className="text-xs font-bold text-[#2D3A2D] underline decoration-[#B2BCA2] decoration-2 underline-offset-4 hover:text-[#B2BCA2] transition-colors whitespace-nowrap"
                                    >
                                        Lihat Resep →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {displayRecipes.length === 0 && (
                    <div className="text-center py-20 text-slate-400 italic">
                        Belum ada resep yang dipublikasikan.
                    </div>
                )}
            </div>
        </div>
    );
}
