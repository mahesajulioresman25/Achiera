'use client';

import React from 'react';
import {
    Cpu,
    Globe,
    Code2,
    MessageSquare,
    Briefcase,
    Zap,
    Activity,
    Plus,
    LayoutGrid,
    LogOut,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ICTracker } from '../ICTracker';
import { BudgetTracker } from '../BudgetTracker';

interface ITDashboardProps {
    brandName: string;
    brandSlug: string;
    brandId: string;
}

export default function ITDashboard({ brandName, brandSlug, brandId }: ITDashboardProps) {
    const activeProjects = [
        { name: 'Smart Billboard Integration', client: 'Billiard Center', status: 'Phase 2: Backend', health: 'Healthy' },
        { name: 'RASA IBU E-Commerce', client: 'Achiera Holding', status: 'Vite Migration', health: 'Critical' },
        { name: 'Merch Live Preview', client: 'Achiera Merch', status: 'Testing', health: 'Healthy' },
    ];

    const stats = [
        { label: 'Active Services', value: '8', icon: Cpu, color: 'text-blue-600' },
        { label: 'Case Studies', value: '12', icon: Briefcase, color: 'text-purple-600' },
        { label: 'Support Tickets', value: '3', icon: MessageSquare, color: 'text-orange-600' },
    ];

    return (
        <div className="p-8 space-y-8 bg-stone-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">{brandName}</h1>
                    <p className="text-stone-500">Managing software lifecycle, IT services, and case studies.</p>
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
                        href={`/dashboard/${brandSlug}/services/new`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Service
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/case-studies/new`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-sm"
                    >
                        <Code2 className="w-4 h-4" />
                        Add Case Study
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

            {/* IT Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm group hover:border-blue-400 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-stone-100 rounded-xl group-hover:bg-blue-50 transition-colors">
                                <s.icon className={`w-6 h-6 ${s.color}`} />
                            </div>
                            <Zap className="w-4 h-4 text-stone-200" />
                        </div>
                        <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider">{s.label}</h4>
                        <p className="text-3xl font-bold text-stone-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Support/Projects */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between font-bold text-stone-900">
                        <span className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-stone-400" />
                            Active Engagements
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest font-black">Live</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-widest font-bold border-b border-stone-100">
                                <tr>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Phase</th>
                                    <th className="px-6 py-4 text-right">Health</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {activeProjects.map((p) => (
                                    <tr key={p.name} className="hover:bg-stone-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-stone-900 group-hover:text-blue-600">{p.name}</td>
                                        <td className="px-6 py-4 text-stone-600 text-sm">{p.client}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 bg-stone-100 rounded text-stone-600">{p.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-black uppercase italic ${p.health === 'Healthy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {p.health}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Automation Integration Sidebar */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white space-y-6 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Globe className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold leading-tight">Autonomous IT Monitoring</h3>
                        <p className="text-stone-400 mt-4 text-sm leading-relaxed">
                            Division IT Solution is currently linked with the suggestion engine.
                            AI is analyzing server logs for performance anomalies.
                        </p>
                    </div>

                    <Link
                        href={`/dashboard/${brandSlug}/insights`}
                        className="w-full py-4 bg-white text-stone-900 font-black rounded-2xl text-center hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        View AI Insights
                    </Link>
                </div>
            </div>

            {/* Financial Overview Section */}
            <div>
                <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white p-1.5 rounded-lg"><TrendingUp size={16} /></span>
                    Financial Health & Inter-Company
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Budget Performance</h4>
                        <BudgetTracker brandId={brandId} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Inter-Company Transactions</h4>
                        <ICTracker brandId={brandId} brandName={brandName} />
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-stone-200 text-center text-stone-400 text-sm">
                <p>© 2026 Rasa Ibu - Achiera. Seluruh hak dilindungi.</p>
            </footer>
        </div >
    );
}
