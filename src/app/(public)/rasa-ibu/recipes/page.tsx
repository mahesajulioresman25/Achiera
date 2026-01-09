'use client';

import React, { useState } from 'react';
// import { motion } from 'framer-motion';
import { Utensils, ChefHat, Clock, Flame, Share2, Plus } from 'lucide-react';

// Mock Data (will be replaced by real data fetch)
const RECIPES = [
    {
        id: '1',
        title: 'Sarden Rasa Ibu Tumis Pete',
        author: 'Bunda Ani',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        duration: '15 Menit',
        difficulty: 'Mudah',
        description: 'Cara asik menikmati sarden kaleng agar lebih wangi dan menggugah selera keluarga.',
        products: ['Sarden Premium'],
        likes: 124
    },
    {
        id: '2',
        title: 'Rendang Suwir Crispy',
        author: 'Kak Sari',
        image: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=800&q=80',
        duration: '20 Menit',
        difficulty: 'Sedang',
        description: 'Kreasi rendang sisa lebaran yang digoreng kering, cocok buat lauk tahan lama.',
        products: ['Rendang Sapi'],
        likes: 89
    },
    {
        id: '3',
        title: 'Nasi Goreng Sarden Pedas',
        author: 'Chef Juna (KW)',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
        duration: '10 Menit',
        difficulty: 'Mudah',
        description: 'Sarapan praktis cuma modal nasi kemarin dan sarden Rasa Ibu.',
        products: ['Sarden Premium'],
        likes: 215
    }
];

export default function RecipesPage() {
    const [filter, setFilter] = useState('Semua');

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header Section */}
            <div className="relative h-[40vh] bg-[#2D3A2D] overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1495521821758-ee18ece60918?w=1600&q=80"
                    alt="Cooking Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                    <div
                        className="max-w-3xl animate-fade-in-up"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FDFBF7] text-xs font-bold tracking-[0.2em] mb-4 uppercase">
                            Komunitas Rasa Ibu
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-[#FDFBF7] mb-6 leading-tight font-serif">
                            Kreasi Rasa <br /> <span className="text-[#B2BCA2] italic">Dapur Bunda</span>
                        </h1>
                        <p className="text-[#E5E1D8] text-lg mb-8 max-w-xl mx-auto font-light">
                            Temukan inspirasi masakan lezat dari ribuan Ibu hebat lainnya. Punya resep rahasia? Bagikan dan jadilah inspirasi!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="px-8 py-3 bg-[#B2BCA2] hover:bg-[#A3AD94] text-[#2D3A2D] rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" />
                                Bagikan Resep Saya
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-30">
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#E5E1D8] mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {['Semua', 'Sarapan', 'Makan Siang', 'Camilan', 'Bekal Anak'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === cat
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
                            placeholder="Cari resep sarden..."
                            className="w-full pl-5 pr-12 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                        />
                        <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2BCA2] w-5 h-5" />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {RECIPES.map((recipe, idx) => (
                        <div
                            key={recipe.id}
                            className="group bg-white rounded-2xl overflow-hidden border border-[#E5E1D8] hover:shadow-2xl hover:shadow-[#2D3A2D]/10 transition-all duration-300 animate-fade-in"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#2D3A2D] flex items-center gap-1 shadow-sm">
                                    <Clock className="w-3 h-3" /> {recipe.duration}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-[#F9F7F2] px-3 py-1 rounded-lg text-xs font-bold text-[#8B7E66] uppercase tracking-wider">
                                        {recipe.difficulty}
                                    </div>
                                    <button className="text-pink-500 hover:text-pink-600 flex items-center gap-1 text-xs font-medium">
                                        <Flame className="w-4 h-4 fill-current" /> {recipe.likes}
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-[#2D3A2D] mb-2 font-serif group-hover:text-[#B2BCA2] transition-colors line-clamp-2">
                                    {recipe.title}
                                </h3>

                                <p className="text-sm text-[#8B7E66] line-clamp-2 mb-4 h-10">
                                    "{recipe.description}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-[#F3F1ED]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#E5E1D8] flex items-center justify-center text-[#8B7E66]">
                                            <ChefHat className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-[#2D3A2D]">{recipe.author}</span>
                                    </div>

                                    <button className="text-xs font-bold text-[#2D3A2D] underline decoration-[#B2BCA2] decoration-2 underline-offset-4 hover:text-[#B2BCA2] transition-colors">
                                        Lihat Resep &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
