import React from 'react';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RecipeSubmissionForm from '@/components/content/RecipeSubmissionForm';
import { prisma } from '@/lib/prisma';

export default async function RecipeSubmitPage() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return null;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-24">
            <div className="relative h-[250px] bg-[#2D3A2D] flex items-center justify-center">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80"
                        className="w-full h-full object-cover opacity-20"
                        alt="bg"
                    />
                </div>

                <div className="relative z-10 text-center px-4">
                    <Link href="/rasa-ibu/recipes" className="inline-flex items-center gap-2 text-[#B2BCA2] font-bold mb-6 hover:text-white transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Jelajah Resep
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-white font-serif tracking-tight">
                        Bagikan Kreasi <span className="text-[#B2BCA2] italic">Bunda</span>
                    </h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20">
                <RecipeSubmissionForm brandId={brand.id} />
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-12 text-center">
                <div className="inline-flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                        ✨
                    </div>
                    <p className="text-xs text-gray-500 font-medium text-left">
                        Resep Bunda akan diperiksa oleh tim Rasa Ibu untuk memastikan <br />
                        kualitas dan kesesuaian bahan sebelum diterbitkan secara publik.
                    </p>
                </div>
            </div>
        </div>
    );
}
