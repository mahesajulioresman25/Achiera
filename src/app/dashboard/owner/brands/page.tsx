import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { OwnerService } from '@/lib/services/OwnerService';
import Link from 'next/link';
import { Building2, Plus, ExternalLink, Settings, Users, Activity, BarChart3, ChevronLeft } from 'lucide-react';

export default async function BrandsManagementPage() {
    const session = await auth();
    if (!session || session.user.globalRole !== 'OWNER') {
        redirect('/login');
    }

    const service = new OwnerService();
    const brands = await service.getBrandComparison();

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link
                        href="/dashboard/owner"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-4 group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Dashboard Holding
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600" />
                        Brand Management Hub
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and monitor all brands in the Achiera ecosystem.</p>
                </div>

                <Link
                    href="/dashboard/owner/brands/new"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                    <Plus size={18} />
                    Add New Brand
                </Link>
            </div>

            {/* Brands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {brands.map((brand) => (
                    <div key={brand.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Building2 size={24} />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${brand.efficiency === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                                        brand.efficiency === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {brand.efficiency} EFFICIENCY
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-1">{brand.name}</h3>
                            <p className="text-slate-400 text-xs font-bold tracking-tighter uppercase mb-4">achiera.com/{brand.slug}</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                                    <p className="text-sm font-black text-slate-900">{currency.format(brand.revenue)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin</p>
                                    <p className={`text-sm font-black ${brand.profitMargin > 15 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {brand.profitMargin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50/50 grid grid-cols-3 gap-2">
                            <Link
                                href={`/dashboard/${brand.slug}`}
                                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all gap-1.5"
                            >
                                <ExternalLink size={18} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Visit</span>
                            </Link>
                            <Link
                                href={`/dashboard/${brand.slug}/settings`}
                                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all gap-1.5"
                            >
                                <Settings size={18} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Staff</span>
                            </Link>
                            <Link
                                href={`/dashboard/${brand.slug}/analytics`}
                                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all gap-1.5"
                            >
                                <BarChart3 size={18} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Stats</span>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Insights */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] -mr-32 -mt-32" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Activity size={32} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">SaaS Platform Health</h2>
                            <p className="text-indigo-200/60 font-medium">Deep insights into your multi-brand ecosystem.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Active Brands</p>
                            <p className="text-2xl font-black">{brands.length}</p>
                        </div>
                        <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Global System Load</p>
                            <p className="text-2xl font-black text-emerald-400">OPTIMAL</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
