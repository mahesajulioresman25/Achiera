'use client';

import React, { useEffect, useState } from 'react';
import { getMarketplacePerformanceAction } from '@/lib/actions/rasa-ibu/intelligence';
import { ShoppingBag, TrendingUp, BarChart3, AlertCircle, Loader2, Sparkles, Tag, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';

interface MarketplaceTrackerProps {
    brandId: string;
}

export default function MarketplaceTracker({ brandId }: MarketplaceTrackerProps) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    useEffect(() => {
        async function load() {
            const res = await getMarketplacePerformanceAction(brandId);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    const platformLogos: Record<string, string> = {
        'SHOPEE': '/images/platforms/shopee-ecomerce.png',
        'SHOPEE_FOOD': '/images/platforms/shopee.png',
        'GRAB_FOOD': '/images/platforms/grabfood.png',
        'GO_FOOD': '/images/platforms/gofood.webp',
        'TOKOPEDIA': '/images/platforms/tokopedia.png',
        'TIKTOK_SHOP': '/images/platforms/TikTok.png',
        'TIKTOK': '/images/platforms/TikTok.png',
        'GRAB_MART': '/images/platforms/grabamart.png',
        'WEBSITE': '/globe.svg',
        'MANUAL': '/file.svg',
        'WA': '/images/platforms/whatsapp.png'
    };

    if (isLoading) {
        return (
            <div className="bg-white p-12 rounded-[3.5rem] border border-[#E5E1D8] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Menganalisis Efektivitas Program Marketplace...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-[3.5rem] border border-[#E5E1D8] p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-5 bg-orange-50 rounded-[1.5rem] text-orange-200">
                    <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-[#2D3A2D] tracking-tight">Marketplace & Program Ads</h3>
                    <p className="text-xs text-[#8B7E66] font-medium italic max-w-lg">Belum ada transaksi dari GoFood/GrabFood/Shopee yang terdeteksi. Hubungkan channel marketplace Bunda untuk melihat efektivitas iklan dan promo platform otomatis di sini. 🛍️</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[3.5rem] border border-[#E5E1D8] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-orange-50/30 to-transparent">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-orange-100 rounded-[1.5rem] text-orange-600">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#2D3A2D] tracking-tight">Marketplace & Program Ads</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efektivitas Campaign Platform (30 Hari Terakhir)</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const exportData = data.flatMap((platform: any) =>
                            platform.programs.map((prog: any) => ({
                                'Platform': platform.platform,
                                'Program': prog.tag,
                                'Revenue': prog.revenue,
                                'Orders': prog.orders,
                                'Contribution %': prog.contribution,
                                'Platform Total Revenue': platform.totalRevenue,
                                'Platform Total Orders': platform.totalOrders,
                                'AOV': platform.avgOrderValue
                            }))
                        );
                        exportToCSV(exportData, 'Marketplace_Performance');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center gap-2"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>
            </div>

            <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.map((platform) => (
                        <div key={platform.platform} className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 p-1 flex items-center justify-center shadow-sm">
                                            {platformLogos[platform.platform.toUpperCase()] ? (
                                                <img
                                                    src={platformLogos[platform.platform.toUpperCase()]}
                                                    alt={platform.platform}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <ShoppingBag className="w-5 h-5 text-slate-300" />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#2D3A2D]">{platform.platform}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total Revenue</p>
                                        <p className="text-lg font-black text-[#2D3A2D]">{currency.format(platform.totalRevenue)}</p>
                                    </div>
                                </div>

                                {platform.programs.length > 0 ? (
                                    <div className="space-y-4 mt-8">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" />
                                            Program Terdeteksi
                                        </p>
                                        {platform.programs.map((prog: any) => (
                                            <div key={prog.tag} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:border-orange-100 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-3 h-3 text-orange-500" />
                                                        <span className="text-[11px] font-black text-[#2D3A2D]">{prog.tag}</span>
                                                    </div>
                                                    <span className="text-[9px] font-black text-emerald-600">+{prog.contribution.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                    <span>{prog.orders} Pesanan</span>
                                                    <span>{currency.format(prog.revenue)}</span>
                                                </div>
                                                <div className="mt-3 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${prog.contribution}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-12 p-6 bg-white/50 rounded-3xl border border-dashed border-slate-200 text-center">
                                        <p className="text-[10px] font-bold text-slate-400 italic">Belum ada program Ads/Voucher terdeteksi untuk platform ini.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">{platform.totalOrders} Global Orders</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400">AOV</p>
                                    <p className="text-[11px] font-black text-[#2D3A2D]">{currency.format(platform.avgOrderValue)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-relaxed">Executive Insight</p>
                        <p className="text-xs text-blue-800 font-medium leading-relaxed italic">
                            "Analisis ini mendeteksi program promosi otomatis melalui hashtag di catatan internal pesanan. Gunakan #SHOPEE_ADS, #GRAB_PROMO, atau tag lainnya agar AI dapat memisahkan omzet organik vs program berbayar."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
