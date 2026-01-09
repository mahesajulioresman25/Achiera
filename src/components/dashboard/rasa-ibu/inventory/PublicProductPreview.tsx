'use client';

import React from 'react';
import { ShoppingCart, Heart, Share2, Info } from 'lucide-react';

interface PublicProductPreviewProps {
    data: {
        name: string;
        description: string;
        price: string;
        weight: string;
        ingredients: string;
        nutritionCalories: string;
        nutritionProtein: string;
        nutritionCarbs: string;
        nutritionFat: string;
        storageType: string;
        unit: string;
    };
    imagePreview: string;
}

export default function PublicProductPreview({ data, imagePreview }: PublicProductPreviewProps) {
    const price = parseFloat(data.price) || 0;
    const weight = data.weight || '0';

    return (
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-[#E5E1D8] shadow-sm sticky top-0 scale-95 origin-top transition-all duration-300">
            {/* Aspect ratio container mimicking the public detail page */}
            <div className="aspect-[4/5] bg-[#F9F7F2] relative overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                        <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl font-black">?</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest italic">Belum Ada Gambar</p>
                    </div>
                )}

                {/* Floating Indicators */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                    <span className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-[#2D3A2D] shadow-sm">
                        {data.storageType || 'FROZEN'}
                    </span>
                    <div className="flex flex-col gap-2">
                        <div className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                            <Heart className="w-3 h-3 text-[#8B7E66]" />
                        </div>
                        <div className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                            <Share2 className="w-3 h-3 text-[#8B7E66]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-[#1A241A] tracking-tight leading-none h-14 overflow-hidden">
                            {data.name || 'Nama Masakan Bunda'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-black text-[#8B7E66]">
                            Rp {price.toLocaleString('id-ID')}
                        </span>
                        <span className="h-4 w-px bg-gray-200"></span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {weight}g / {data.unit || 'pcs'}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-[#4A5D4A] leading-relaxed font-medium line-clamp-3 italic">
                    {data.description || 'Ceritakan kelezatan masakan Bunda di sini agar pelanggan semakin tergoda untuk mencicipi.'}
                </p>

                {/* Simulated ATC Button */}
                <div className="flex gap-2">
                    <button className="flex-1 bg-[#2D3A2D] text-[#FDFBF7] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-none opacity-80 flex items-center justify-center gap-2">
                        <ShoppingCart className="w-3 h-3" /> Siapkan Untuk Keluarga
                    </button>
                    <button className="w-12 h-12 border border-[#E5E1D8] rounded-xl flex items-center justify-center text-[#2D3A2D] pointer-events-none opacity-50">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.809.891 2.796.891 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.778zm-1.785 2.158c.119-.265.234-.271.341-.271.096 0 .19 0 .285.006.113.007.262.038.397.33.143.309.489 1.155.53 1.239.041.084.07.181.011.3s-.089.26-.172.356c-.095.107-.2.18-.328.326-.067.078-.142.164-.06.31.082.148.363.593.778.963.535.477.986.626 1.125.685.14.058.22.046.302-.047.083-.093.357-.417.452-.56.096-.143.191-.119.321-.071.131.048.833.393.976.465.143.072.238.107.274.167.036.06.036.345-.131.81-.167.464-.976.845-1.345.881-.357.042-.714.053-2.03-.464-1.637-.643-2.673-2.316-2.756-2.429-.084-.113-1.042-1.387-1.042-2.643 0-1.316.685-1.965.929-2.228.16-.173.35-.22.56-.22zm6.658 3.596c0 2.69-2.19 4.88-4.88 4.88a4.86 4.86 0 0 1-2.436-.65l-2.872.753.766-2.798a4.85 4.85 0 0 1-.77-2.185c0-2.693 2.19-4.882 4.882-4.882 2.69 0 4.88 2.19 4.88 4.882z" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-[#F9F7F2]">
                    <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Komposisi</span>
                        <p className="text-[10px] text-gray-600 font-medium line-clamp-2">
                            {data.ingredients || 'Informasi bahan belum tersedia.'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Informasi Gizi</span>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                                <span className="text-[7px] font-bold text-gray-400">Prtn</span>
                                <p className="text-[9px] font-black text-[#1A241A]">{data.nutritionProtein || '0'}g</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[7px] font-bold text-gray-400">Enrgy</span>
                                <p className="text-[9px] font-black text-[#1A241A]">{data.nutritionCalories || '0'}k</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-600">
                    <Info className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Live Preview Mode</span>
                </div>
            </div>
        </div>
    );
}
