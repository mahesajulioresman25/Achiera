
'use client';

import { ShoppingBag, Star, Clock } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';

interface CampaignsSectionProps {
    campaigns: any[];
}

export default function CampaignsSection({ campaigns }: CampaignsSectionProps) {
    const { addToCart } = useCart();
    if (!campaigns || campaigns.length === 0) return null;

    return (
        <section className="py-20 bg-[#F9F7F2] border-y border-[#E5E1D8]">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                <div className="text-center mb-16 space-y-4">
                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-white px-4 py-2 rounded-full border border-[#E5E1D8]">
                        Paket Hemat
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-[#1A241A] tracking-tight">
                        Lebih Hemat, Lebih Nikmat.
                    </h2>
                    <p className="text-[#8B7E66] max-w-2xl mx-auto">
                        Pilihan paket spesial untuk stok di rumah. Solusi praktis tanpa pusing mikir menu harian.
                    </p>
                </div>

                <div className="space-y-20">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="relative">
                            {/* Campaign Header */}
                            {campaigns.length > 1 && (
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="h-px bg-[#E5E1D8] flex-1"></div>
                                    <h3 className="text-xl font-bold text-[#1A241A] uppercase tracking-widest">{campaign.title}</h3>
                                    <div className="h-px bg-[#E5E1D8] flex-1"></div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {campaign.bundles?.map((bundle: any) => (
                                    <div key={bundle.id} className="group bg-white rounded-[2rem] border border-[#E5E1D8] overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col relative">
                                        {/* Badge */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                                Hemat
                                            </span>
                                        </div>

                                        <div className="p-8 pb-0 flex-1 space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black text-[#1A241A] group-hover:text-amber-600 transition-colors">
                                                    {bundle.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">
                                                    {bundle.description || "Paket lengkap untuk kebutuhan keluarga."}
                                                </p>
                                            </div>

                                            {/* Items List */}
                                            <div className="bg-[#FDFBF7] rounded-xl p-4 border border-[#E5E1D8]/50 space-y-3">
                                                <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest mb-2">Isi Paket:</p>
                                                {bundle.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-2 text-sm text-[#1A241A]">
                                                        <span className="text-amber-500 mt-1"><Star className="w-3 h-3 fill-current" /></span>
                                                        <span className="font-medium">
                                                            <span className="font-bold">{item.quantity}x</span> {item.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-8 pt-6 mt-auto border-t border-dashed border-[#E5E1D8]">
                                            <div className="flex items-end justify-between mb-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Harga Paket</p>
                                                    <p className="text-2xl font-black text-[#2D3A2D]">
                                                        Rp {Number(bundle.price).toLocaleString()}
                                                    </p>
                                                </div>
                                                {bundle.quota && (
                                                    <div className="text-right space-y-1">
                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-end gap-1">
                                                            <Clock className="w-3 h-3" /> Terbatas
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-500">Sisa {bundle.quota} Paket</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                className="w-full py-4 bg-[#2D3A2D] hover:bg-[#1A241A] text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-[#2D3A2D]/20 flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    addToCart({
                                                        productId: 'bundle-' + bundle.id,
                                                        productBundleId: bundle.id,
                                                        type: 'BUNDLE',
                                                        name: bundle.name,
                                                        price: Number(bundle.price),
                                                        quantity: 1,
                                                        image: '', // Bundles don't have separate images yet in schema
                                                        variantId: 'default',
                                                        variantName: 'Paket Hemat'
                                                    });
                                                }}
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                Pesan Paket Ini
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
