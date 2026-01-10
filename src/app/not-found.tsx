
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 relative">
                    {/* Placeholder for a cute food illustration */}
                    <div className="w-48 h-48 bg-[#F9F7F2] rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner border-4 border-[#E5E1D8]">
                        🥣
                    </div>
                    <div className="absolute top-0 right-1/4 animate-bounce text-4xl">
                        ?
                    </div>
                </div>

                <h1 className="text-6xl font-black text-[#2D3A2D] mb-4 font-serif italic">404</h1>
                <h2 className="text-2xl font-bold text-[#2D3A2D] mb-4">Yah, Halamannya Gosong!</h2>
                <p className="text-[#8B7E66] mb-8 leading-relaxed">
                    Sepertinya resep yang Anda cari tidak ada di dapur kami.
                    Mungkin sudah dimakan kucing atau belum pernah dibuat.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/rasa-ibu"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-[#2D3A2D] text-[#FDFBF7] rounded-xl font-bold hover:bg-[#3d4d3d] transition-all shadow-lg hover:shadow-xl"
                    >
                        <Home className="w-5 h-5" />
                        Kembali ke Beranda
                    </Link>

                    <Link
                        href="/rasa-ibu/products"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-[#E5E1D8] text-[#8B7E66] rounded-xl font-bold hover:bg-[#F9F7F2] transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Lihat Menu Lainnya
                    </Link>
                </div>
            </div>
        </div>
    );
}
