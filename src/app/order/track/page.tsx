'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function OrderTrackingSearchPage() {
    const router = useRouter();
    const [invoice, setInvoice] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice.trim()) return;

        setIsSearching(true);
        setTimeout(() => {
            router.push(`/order/track/${invoice.trim()}`);
        }, 300);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FDFBF7] to-white">
            {/* Custom Header for Tracking */}
            <header className="fixed top-0 inset-x-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-[#E5E1D8]/50 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" className="h-14 w-auto transition-transform hover:scale-105 duration-300" />
                        <div className="h-10 w-px bg-[#E5E1D8] hidden sm:block" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#8B7E66] font-black uppercase tracking-[0.2em]">Pelacakan Pesanan</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B7E66]/5 rounded-full blur-3xl -z-10"></div>

                <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-[#8B7E66]/10 border border-[#E5E1D8] p-10 md:p-12 text-center space-y-8 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#E5E1D8] text-[#8B7E66] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md transform rotate-3 hover:rotate-6 transition-all duration-300">
                        <Search className="w-8 h-8" />
                    </div>

                    <div className="space-y-3">
                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#8B7E66]/5 px-4 py-2 rounded-full">Lacak Kiriman</span>
                        <h1 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Dimana Pesanan Saya?</h1>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">Masukkan nomor invoice (Contoh: ACH-2024...) untuk melihat status terkini hidangan Anda.</p>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="relative group">
                            <input
                                type="text"
                                className="w-full px-6 py-5 bg-[#FDFBF7] border-2 border-[#E5E1D8] rounded-2xl focus:border-[#8B7E66] focus:ring-0 outline-none text-center font-mono text-lg text-[#2D3A2D] font-bold uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 transition-all shadow-inner group-hover:bg-white"
                                placeholder="Nomor Invoice"
                                value={invoice}
                                onChange={(e) => setInvoice(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!invoice || isSearching}
                            className="w-full py-5 bg-gradient-to-r from-[#2D3A2D] to-[#1A241A] hover:from-[#3d4d3d] hover:to-[#2D3A2D] text-[#FDFBF7] rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lacak Sekarang'}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs font-bold text-[#8B7E66] opacity-60 uppercase tracking-widest">Rasa Ibu • Hangatnya Meja Makan</p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
