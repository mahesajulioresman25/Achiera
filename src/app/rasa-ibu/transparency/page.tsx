import React from 'react';

/**
 * RASA IBU Transparency Page
 * Communicates the brand's commitment to quality, honesty, and motherly care.
 */
export default function RasaIbuTransparencyPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[#2D3A2D] opacity-90"></div>
                {/* Placeholder for warm, motherly kitchen image */}
                <div className="relative z-10 text-center space-y-6 max-w-3xl px-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#B2BCA2]">Janji Rasa Ibu</span>
                    <h1 className="text-5xl md:text-7xl font-black text-[#FDFBF7] tracking-tight leading-tight">Kejujuran yang <br /> Bisa Dirasakan.</h1>
                    <p className="text-lg text-[#B2BCA2] font-medium leading-relaxed">
                        Kami percaya bahwa makanan bukan sekadar pengganjal lapar, melainkan bentuk kasih sayang yang paling murni dari seorang Ibu.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto py-24 px-6 space-y-24">
                {/* Zero Preservatives */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Tanpa Pengawet, <br /> Selamanya.</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Di RASA IBU, kami tidak pernah menggunakan pengawet buatan, pewarna sintetik, atau penyedap rasa berlebihan. Kami mengandalkan rempah-rempah segar dan teknik memasak tradisional untuk mempertahankan rasa aslinya.
                        </p>
                    </div>
                    <div className="bg-[#E5E1D8] aspect-square rounded-[3rem] shadow-inner flex items-center justify-center p-12">
                        <div className="text-center space-y-2">
                            <span className="text-4xl font-black text-[#2D3A2D]">0%</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Bahan Sintetik</p>
                        </div>
                    </div>
                </div>

                {/* Cold Chain Integrity */}
                <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                    <div className="bg-[#2D3A2D] aspect-square rounded-[3rem] shadow-2xl flex items-center justify-center p-12 md:order-2">
                        <div className="text-center space-y-2 text-[#FDFBF7]">
                            <span className="text-4xl font-black">-18°C</span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#B2BCA2]">Suhu Terjaga</p>
                        </div>
                    </div>
                    <div className="space-y-6 md:order-1">
                        <h2 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Rantai Dingin <br /> yang Tak Terputus.</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Kualitas Rasa Ibu dijaga oleh suhu dingin yang konstan. Dari dapur kami hingga ke pintu rumah Anda, kami memastikan setiap produk tetap dalam kondisi terbaiknya untuk menjaga nutrisi dan kelezatannya.
                        </p>
                    </div>
                </div>

                {/* Transparency Commitment */}
                <div className="bg-white border border-[#E5E1D8] p-12 rounded-[3rem] text-center space-y-8">
                    <h2 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Transparansi Operasional</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <p className="text-xs font-black text-[#8B7E66] uppercase">Bahan Baku</p>
                            <p className="text-sm font-medium text-slate-500">100% Lokal & Segar</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-black text-[#8B7E66] uppercase">Dapur</p>
                            <p className="text-sm font-medium text-slate-500">Sesuai Standar Higiene</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-black text-[#8B7E66] uppercase">Harga</p>
                            <p className="text-sm font-medium text-slate-500">Jujur & Adil</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Call to Action */}
            <div className="bg-[#E5E1D8] py-24 text-center">
                <div className="max-w-2xl mx-auto px-6 space-y-8">
                    <h3 className="text-2xl font-black text-[#2D3A2D]">Siap Menghidangkan Kehangatan?</h3>
                    <button className="bg-[#2D3A2D] text-[#FDFBF7] px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                        Pesan Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
}
