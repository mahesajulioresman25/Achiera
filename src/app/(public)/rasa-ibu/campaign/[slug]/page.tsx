import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, Sparkles, TrendingDown, Truck, CheckCircle2, Zap } from 'lucide-react';
import AddToBundleButton from '@/components/commerce/AddToBundleButton';

// Force dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignLandingPage({ params }: { params: { slug: string } }) {
    // 1. Fetch Campaign
    const campaign = await prisma.campaign.findFirst({
        where: {
            slug: params.slug,
            isActive: true
        },
        include: {
            bundles: {
                where: { isActive: true },
                include: {
                    items: {
                        include: { variant: { include: { product: true } } }
                    }
                }
            }
        }
    });

    if (!campaign) return notFound();

    // 2. Format Dates
    const startDate = new Date(campaign.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endDate = new Date(campaign.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-[#FDFBF7] min-h-screen text-[#2D3A2D]">
            {/* HERO SECTION */}
            <div className="relative h-[500px] flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#8B0000] to-[#A52A2A] text-white">
                <div className="absolute inset-0 bg-black/30 z-10"></div>
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/diagmonds-light.png")' }}></div>

                <div className="relative z-20 text-center max-w-4xl px-6 space-y-6">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold tracking-[0.2em] uppercase">
                        Campaign Resmi
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black leading-tight drop-shadow-2xl">
                        {campaign.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
                        {campaign.description}
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-4">
                        <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <Calendar className="w-5 h-5 text-yellow-400" />
                            <span>{startDate} - {endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-black text-amber-300 animate-pulse">
                            <Zap className="w-5 h-5" />
                            <span>DOUBLE POINTS AKTIF ⚡</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BUNDLE LIST */}
            <div className="max-w-7xl mx-auto px-6 py-20 -mt-20 relative z-30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {campaign.bundles.map(bundle => {
                        // Calculate total base price to show savings
                        const savings = Number(bundle.basePrice) - Number(bundle.price);

                        // Construct product object for AddToCartButton (using bundle ID logic)
                        // Note: AddToCartButton normally takes a Product/Variant. 
                        // We might need a specialized "AddToBundleCartButton" or adapt the existing one.
                        // For now, let's create a visual representation first.

                        return (
                            <div key={bundle.id} className="bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-[#BD302D]/20 transition-all hover:-translate-y-2 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider">
                                        Hemat Rp {savings.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                Dapatkan {Math.floor(Number(bundle.price) * 0.0002).toLocaleString()} Poin*
                                            </span>
                                        </div>
                                        <p className="text-gray-400 line-through text-xs font-medium">Rp {Number(bundle.basePrice).toLocaleString('id-ID')}</p>
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-xs font-bold text-[#BD302D]">Rp</span>
                                            <p className="text-3xl font-black text-[#BD302D]">{Number(bundle.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black mb-4 group-hover:text-[#BD302D] transition-colors">{bundle.name}</h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">{bundle.description}</p>

                                <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Isi Paket:</p>
                                    {bundle.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                {/* Image fallback logic needed */}
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">IMG</div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{item.variant.product.name}</p>
                                                <p className="text-xs text-gray-500">{item.variant.name} x {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <AddToBundleButton
                                    bundle={{
                                        id: bundle.id,
                                        name: bundle.name,
                                        price: Number(bundle.price),
                                        description: bundle.description || ''
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {campaign.bundles.length === 0 && (
                    <div className="bg-white p-12 rounded-3xl text-center shadow-lg">
                        <p className="text-gray-500 text-lg">Paket bundling belum tersedia saat ini.</p>
                    </div>
                )}
            </div>

            {/* BENEFITS SECTION */}
            <div className="max-w-7xl mx-auto px-6 py-24 border-t border-amber-100">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-[#2D3A2D] mb-4">Kenapa Beli Paket Bundling?</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto italic">Nikmati keuntungan lebih dan kemudahan menyajikan menu gizi keluarga setiap hari.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="bg-white p-10 rounded-[2.5rem] text-center shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 group-hover:text-amber-600 transition-colors">Hemat Signifikan</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Potongan langsung hingga <strong>20% (Hemat Rp 50rb+)</strong> dibandingkan beli satuan. Solusi stok menu keluarga yang lebih ramah di kantong.
                        </p>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] text-center shadow-sm border-2 border-amber-200 hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-200 text-amber-900 text-[9px] font-black px-4 py-1.5 rounded-bl-2xl">REKOMENDASI</div>
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 group-hover:text-red-600 transition-colors">Double Loyalty Points</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Khusus subscriber WA, dapatkan <strong>2x Poin</strong> (Rp 200 = 1 Poin). Kumpulkan poin lebih cepat untuk ditukar dengan menu gratis!
                        </p>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] text-center shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                            <Truck className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 group-hover:text-emerald-600 transition-colors">Layanan Prioritas</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            Pesanan bundling diproses dengan antrian prioritas. Dikemas khusus untuk menjaga cita rasa dan kualitas gizi sampai ke meja makan Bunda.
                        </p>
                    </div>
                </div>
            </div>

            {/* CALL TO ACTION */}
            <div className="text-center pb-24 border-t border-slate-100 pt-16">
                <div className="max-w-2xl mx-auto px-6">
                    <CheckCircle2 className="w-12 h-12 text-[#BD302D] mx-auto mb-6" />
                    <h3 className="text-2xl font-black mb-4">Gizi Keluarga Adalah Prioritas</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Setiap porsi yang Bunda sajikan adalah bentuk kasih sayang. <br />
                        Program ini hadir untuk memudahkan Bunda memberikan yang terbaik setiap harinya.
                    </p>
                    <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">*S&K Berlaku | Poin dihitung setelah pesanan selesai</p>
                </div>
            </div>
        </div>
    );
}
