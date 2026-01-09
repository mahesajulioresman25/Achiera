'use client';

import React from 'react';
import {
    ShoppingBag,
    Layers,
    Palette,
    Truck,
    Plus,
    BarChart3,
    Clock,
    CheckCircle2,
    LayoutGrid,
    LogOut,
    Package,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ICTracker } from '../ICTracker';
import { BudgetTracker } from '../BudgetTracker';

interface MerchDashboardProps {
    brandName: string;
    brandSlug: string;
    brandId: string;
}

export default function MerchDashboard({ brandName, brandSlug, brandId }: MerchDashboardProps) {
    const categories = [
        { name: 'Apparel', count: 12, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Accessories', count: 8, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Custom Design', count: 5, icon: Palette, color: 'text-pink-600', bg: 'bg-pink-50' },
    ];

    const activeProduction = [
        { id: 'ORD-101', item: 'Achiera Oversized Hoodie', status: 'In Printing', progress: 65 },
        { id: 'ORD-104', item: 'RASA IBU Totebag', status: 'Quality Check', progress: 90 },
        { id: 'ORD-107', item: 'Tech Division Polo', status: 'Procurement', progress: 20 },
    ];

    return (
        <div className="p-8 space-y-8 bg-stone-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">{brandName}</h1>
                    <p className="text-stone-500">Managing production, catalogs, and custom requests.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/dashboard?select=manual"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all shadow-sm"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Ganti Brand
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/products`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-all shadow-sm"
                    >
                        <Package className="w-4 h-4" />
                        Manage Products
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/orders`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 transition-all shadow-sm"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Orders
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/catalogue-requests`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-sm"
                    >
                        <Mail className="w-4 h-4" />
                        Inbound Leads
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/collections/new`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Collection
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <div key={cat.name} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl ${cat.bg} flex items-center justify-center`}>
                            <cat.icon className={`w-7 h-7 ${cat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">{cat.name}</p>
                            <h3 className="text-2xl font-bold text-stone-900">{cat.count} Items</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Production Tracker */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                        <h3 className="font-bold text-stone-900 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-stone-400" />
                            Live Production Tracker
                        </h3>
                        <Link href={`/dashboard/${brandSlug}/production`} className="text-sm font-bold text-amber-600 hover:underline">View All</Link>
                    </div>
                    <div className="p-6 space-y-6">
                        {activeProduction.map((order) => (
                            <div key={order.id} className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-stone-900">{order.item}</span>
                                    <span className="text-stone-500">{order.id} • {order.status}</span>
                                </div>
                                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 transition-all duration-1000"
                                        style={{ width: `${order.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Snapshot */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-bold text-stone-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-stone-400" />
                        Snapshots
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-900">Fulfilled Today</span>
                            </div>
                            <span className="font-bold text-emerald-600">12</span>
                        </div>

                        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <span className="text-sm font-bold text-orange-900">Pending Quotes</span>
                            </div>
                            <span className="font-bold text-orange-600">4</span>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100">
                        <p className="text-xs text-stone-400 font-medium">Top Performing Category</p>
                        <p className="text-lg font-bold text-stone-900 mt-1">Oversized T-Shirts</p>
                    </div>
                </div>
            </div>

            {/* Financial Overview Section */}
            <div>
                <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white p-1.5 rounded-lg"><ShoppingBag size={16} /></span>
                    Financial & Operational Integrity
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Budget Health</h4>
                        {/* Assuming brandId is fetched or we pass exact UUID if available. Since props only have slug, we might not have ID yet. 
                            However, ICTracker and BudgetTracker need ID. 
                            We need to ensure brandId is available. 
                            Wait, MerchDashboard component receives brandName and brandSlug, but NOT ID. 
                            The parent page.tsx in [brandSlug] fetches currentBrand which HAS id. 
                            I need to update [brandSlug]/page.tsx to pass valid brandId to MerchDashboard.
                        */}
                        <div className="text-center p-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                            <p className="text-stone-400">Budget Data Requires Brand ID</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Inter-Company Status</h4>
                        <div className="text-center p-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                            <p className="text-stone-400">IC Data Requires Brand ID</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
