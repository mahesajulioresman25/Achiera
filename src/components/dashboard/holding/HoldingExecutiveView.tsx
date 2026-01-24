'use client';

import React from 'react';
import {
    LayoutDashboard,
    ArrowUpRight,
    TrendingUp,
    Users,
    ShoppingBag,
    Settings,
    Building2,
    ShieldCheck,
    LogOut,
    ArrowRightLeft,
    RefreshCw,
    History,
    Plus,
    ArrowRight,
    ShieldAlert,
    Brain,
    Trophy
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import HoldingFinanceHub from './HoldingFinanceHub';
import ResourceTransferModal from './ResourceTransferModal';
import RiskControlCenter from './RiskControlCenter';
import HoldingAuditLog from './HoldingAuditLog';
import HoldingIntelligenceHub from './HoldingIntelligenceHub';
import GlobalLoyaltyAnalytics from './GlobalLoyaltyAnalytics';
import HoldingTalentHub from './HoldingTalentHub';
// Added import

interface AggregatedStats {
    totalRevenue: string;
    activeOrders: number;
    activeProduction: number;
    itProjectHealth: string;
}

interface HoldingExecutiveViewProps {
    stats: AggregatedStats;
    brandSummary: Array<{
        name: string;
        slug: string;
        role: string;
        status: string;
    }>;
}

export default function HoldingExecutiveView({ stats, brandSummary }: HoldingExecutiveViewProps) {
    const [activeTransfer, setActiveTransfer] = React.useState(false);
    const [currentTab, setCurrentTab] = React.useState<'overview' | 'finance' | 'risk' | 'control' | 'intelligence' | 'loyalty' | 'talent'>('overview');
    // Added 'loyalty'

    // Auto-trigger risk scan on load to refresh alerts
    React.useEffect(() => {
        async function runScan() {
            try {
                const { triggerRiskScanAction } = await import('@/lib/actions/holding');
                await triggerRiskScanAction();
            } catch (e) {
                console.error("Failed to trigger risk scan", e);
            }
        }
        runScan();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Sidebar Navigation - Fixed side on Desktop, Bottom tab on Mobile */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-200 flex-col items-center py-8 space-y-8 z-50">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
                    <Building2 className="w-6 h-6" />
                </div>

                <nav className="flex flex-col gap-4">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'intelligence', icon: Brain, label: 'AI Intelligence' },
                        { id: 'finance', icon: TrendingUp, label: 'Finance' },
                        { id: 'risk', icon: ShieldCheck, label: 'Risks' },
                        { id: 'control', icon: History, label: 'Audit' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentTab(item.id as any)}
                            className={`p-3 rounded-2xl transition-all group relative ${currentTab === item.id
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                                {item.label}
                            </span>
                        </button>
                    ))}

                    <div className="pt-8 border-t border-slate-100 flex flex-col items-center space-y-8">
                        <button
                            onClick={() => setCurrentTab('loyalty')}
                            className={`p-3 rounded-2xl transition-all ${currentTab === 'loyalty' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                            title="Global Loyalty"
                        >
                            <Trophy className="w-6 h-6" />
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentTab('talent')}
                        className={`p-3 rounded-2xl transition-all ${currentTab === 'talent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Talent Performance"
                    >
                        <Users className="w-6 h-6" />
                    </button>
                </nav>

                <div className="mt-auto flex flex-col gap-4">
                    <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Settings className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-3 text-slate-400 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {[
                    { id: 'overview', icon: LayoutDashboard },
                    { id: 'intelligence', icon: Brain },
                    { id: 'finance', icon: TrendingUp },
                    { id: 'risk', icon: ShieldCheck },
                    { id: 'control', icon: History }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id as any)}
                        className={`p-3 rounded-xl transition-all ${currentTab === item.id
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-400'
                            }`}
                    >
                        <item.icon className="w-6 h-6" />
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <main className="lg:pl-20 pb-24 lg:pb-0">
                {/* Executive Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-40 px-10 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                <ShieldCheck className="w-5 h-5 rotate-12" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Command Center • 2026</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTransfer(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                Resource Transfer
                            </button>
                            <div className="h-4 w-px bg-slate-200 mx-1" />
                            <div className="flex items-center gap-3 pl-2">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-900 uppercase">Administrator</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Global Permissions</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-2 border-white shadow-md" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto space-y-10">
                    {currentTab === 'overview' && (
                        <>
                            {/* Key Performance Multipliers */}
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <MetricCard
                                    label="Consolidated Revenue"
                                    value={stats.totalRevenue}
                                    trend="+12.4%"
                                    icon={TrendingUp}
                                    color="indigo"
                                />
                                <MetricCard
                                    label="Active Operations"
                                    value={stats.activeOrders.toString()}
                                    trend="+8"
                                    icon={ShoppingBag}
                                    color="emerald"
                                />
                                <MetricCard
                                    label="Total Workload"
                                    value={stats.activeProduction.toString()}
                                    trend="-2"
                                    icon={RefreshCw}
                                    color="amber"
                                />
                                <MetricCard
                                    label="IT Systems Health"
                                    value={stats.itProjectHealth}
                                    trend="Optimal"
                                    icon={LayoutDashboard} // Changed icon to LayoutDashboard
                                    color="blue"
                                />
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Brand Ecosystem */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Subsidiary Brands</h2>
                                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Portfolio</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {brandSummary.filter(b => b.slug !== 'achiera').map((brand) => (
                                            <BrandCard key={brand.slug} brand={brand} />
                                        ))}
                                        <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors group">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incorporate New Brand</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Risk Monitoring */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Risk Radar</h2>
                                        <button
                                            onClick={() => setCurrentTab('risk')}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <RiskControlCenter />
                                </div>
                            </div>
                        </>
                    )}

                    {currentTab === 'intelligence' && <HoldingIntelligenceHub />}
                    {currentTab === 'finance' && <HoldingFinanceHub onBack={() => setCurrentTab('overview')} />}
                    {currentTab === 'risk' && <RiskControlCenter />}
                    {currentTab === 'loyalty' && <GlobalLoyaltyAnalytics />}
                    {currentTab === 'talent' && <HoldingTalentHub />}
                    {currentTab === 'control' && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <HoldingAuditLog />
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Components */}
            {activeTransfer && (
                <ResourceTransferModal
                    brands={brandSummary.map(b => ({ id: b.slug, name: b.name, slug: b.slug }))}
                    onClose={() => setActiveTransfer(false)}
                    onSuccess={() => {
                        // Refresh logic here if needed, or just close
                        setActiveTransfer(false);
                        // We could trigger a global refresh or switch to Audit tab
                        setCurrentTab('control');
                    }}
                />
            )}
        </div>
    );
}

// --- Helper Components ---

function MetricCard({ label, value, trend, icon: Icon, color }: any) {
    const colorMap: any = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${colorMap[color] || colorMap.indigo}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="mt-1 flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function BrandCard({ brand }: any) {
    return (
        <Link
            href={`/dashboard/${brand.slug}`}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <Building2 className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">{brand.name}</h4>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{brand.role}</span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{brand.status}</span>
                </div>
            </div>
        </Link>
    );
}
