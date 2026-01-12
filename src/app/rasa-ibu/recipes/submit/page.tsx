import React from 'react';
import { ChefHat, ArrowLeft, Gift } from 'lucide-react';
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
                <div className="inline-flex flex-col md:flex-row items-center gap-6 p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[#B2BCA2]/20 flex items-center justify-center text-[#2D3A2D] shrink-0">
                        <Gift className="w-8 h-8" />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-lg font-black text-[#2D3A2D] mb-1">Program Apresiasi Resep Bunda</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Resep yang Bunda kirimkan berkesempatan dipilih menjadi <span className="text-[#2D3A2D] font-black italic">Menu Resmi Rasa Ibu</span>.
                            Dapatkan <span className="text-emerald-600 font-black">50.000 Poin Loyalty</span> jika resep Bunda terpilih!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
