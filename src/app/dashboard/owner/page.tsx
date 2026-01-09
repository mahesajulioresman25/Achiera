import React from 'react';
import Link from 'next/link';
import { OwnerService } from '@/lib/services/OwnerService';
import { DollarSign, ShieldAlert, TrendingUp, Activity, Building2, Users } from 'lucide-react';
import { InterCompanyHub } from '@/components/dashboard/owner/InterCompanyHub';
import { BudgetManagementHub } from '@/components/dashboard/owner/BudgetManagementHub';
import { CashFlowForecastPanel } from '@/components/dashboard/owner/CashFlowForecastPanel';
import { StrategicKPIDashboard } from '@/components/dashboard/owner/StrategicKPIDashboard';
import { ReportGeneratorDashboard } from '@/components/dashboard/owner/ReportGeneratorDashboard';
import { ConsolidatedStatementsHub } from '@/components/dashboard/owner/ConsolidatedStatementsHub';
import { CapitalAllocationDashboard } from '@/components/dashboard/owner/CapitalAllocationDashboard';
import { CashFlowForecastDashboard } from '@/components/dashboard/owner/CashFlowForecastDashboard';
import { ProcurementSynergyPanel } from '@/components/dashboard/owner/ProcurementSynergyPanel';
import { ProcurementSynergyService } from '@/lib/services/ProcurementSynergyService';
import { ChiefStrategyOfficer } from '@/components/dashboard/owner/ChiefStrategyOfficer';
import { GlobalStrategyService } from '@/lib/services/GlobalStrategyService';
import { WorkforceAnalyticsPanel } from '@/components/dashboard/owner/WorkforceAnalyticsPanel';
import { WorkforceAnalyticsService } from '@/lib/services/WorkforceAnalyticsService';
import { RecentInteractionsHub } from '@/components/dashboard/owner/RecentInteractionsHub';

export default async function OwnerDashboardPage() {
    const service = new OwnerService();
    const synergyService = new ProcurementSynergyService();
    const strategyService = new GlobalStrategyService();
    const workforceService = new WorkforceAnalyticsService();

    const stats = await service.getGlobalStats();
    const brands = await service.getBrandComparison();
    const risks = await service.getRisks();
    const assetPortfolio = await service.getGlobalAssetPortfolio();
    const consolidatedFinancials = await service.getConsolidatedFinancials();
    const synergyOpportunities = await synergyService.analyzeSynergy();
    const briefing = await strategyService.generateDailyBriefing();
    const workforceMetrics = await workforceService.getWorkforceMetrics();
    const interactions = await service.getRecentInteractions();

    // Formatters
    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Executive Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl p-8 text-white border border-white/5">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] -ml-32 -mb-32 rounded-full" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-500/30">
                                <Building2 size={24} className="text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">Achiera Holding</h1>
                        </div>
                        <p className="text-slate-400 font-medium text-lg flex items-center gap-2">
                            <Activity size={18} className="text-green-500" />
                            Executive Command Center · <span className="text-slate-500">Global Overview</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/dashboard/owner/users"
                            className="group flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl font-bold text-sm uppercase tracking-wider transition-all border border-white/10 hover:border-white/20"
                        >
                            <Users size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            User Management
                        </Link>
                        <Link
                            href="/dashboard/owner/audit-compliance"
                            className="group flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl font-bold text-sm uppercase tracking-wider transition-all border border-white/10 hover:border-white/20"
                        >
                            <ShieldAlert size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                            Audit & Compliance
                        </Link>
                        <Link
                            href="/autonomous/overview?brandId=rasa-ibu"
                            className="group flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                        >
                            <TrendingUp size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Autonomous Center
                        </Link>
                    </div>
                </div>

                <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stat Card: Profit Margin */}
                    <div className="group bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-indigo-500/50 transition-all hover:translate-y-[-4px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Net Profit Margin</div>
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Activity size={16} className="text-green-400" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tight">{consolidatedFinancials.netProfitMargin.toFixed(1)}</span>
                            <span className="text-xl font-bold text-slate-500">%</span>
                        </div>
                        <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, consolidatedFinancials.netProfitMargin * 2)}%` }} />
                        </div>
                    </div>

                    {/* Stat Card: Total Revenue */}
                    <div className="group bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-indigo-500/50 transition-all hover:translate-y-[-4px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Total Revenue</div>
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <DollarSign size={16} className="text-blue-400" />
                            </div>
                        </div>
                        <div className={`font-black tracking-tight break-all ${stats.totalRevenue > 1000000000 ? 'text-2xl pt-1' : 'text-3xl'}`}>
                            {currency.format(stats.totalRevenue)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 font-medium">CONSOLIDATED ACROSS ALL BRANDS</div>
                    </div>

                    {/* Stat Card: Cash on Hand */}
                    <div className="group bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-indigo-500/50 transition-all hover:translate-y-[-4px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Cash on Hand</div>
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Building2 size={16} className="text-indigo-400" />
                            </div>
                        </div>
                        <div className={`font-black tracking-tight break-all ${stats.totalCash > 1000000000 ? 'text-2xl pt-1' : 'text-3xl'}`}>
                            {currency.format(stats.totalCash)}
                        </div>
                        <div className="text-[10px] text-indigo-400 mt-2 font-bold animate-pulse">LIQUID ASSETS</div>
                    </div>

                    {/* Stat Card: Active Risks */}
                    <div className="group bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-amber-500/50 transition-all hover:translate-y-[-4px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Active Risks</div>
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <ShieldAlert size={16} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-amber-500 tracking-tight">
                            {stats.activeAlerts}
                        </div>
                        <div className="text-[10px] text-amber-600/80 mt-2 font-bold uppercase">Attention Required</div>
                    </div>
                </div>
            </div>

            {/* Chief Strategy Officer [NEW] - Placed right after header for maximum visibility */}
            <ChiefStrategyOfficer briefing={briefing} />

            {/* Inter-Company Transaction Center */}
            <InterCompanyHub />

            {/* Recent Intelligence Interactions [NEW] */}
            <RecentInteractionsHub interactions={interactions} />

            {/* Procurement Synergy Engine [NEW] */}
            <ProcurementSynergyPanel opportunities={synergyOpportunities} />

            {/* Consolidated Financial Statements */}
            <ConsolidatedStatementsHub />

            {/* Capital Allocation Optimizer */}
            <CapitalAllocationDashboard />

            {/* Cash Flow Forecast */}
            <CashFlowForecastDashboard />

            {/* Budget Management Center */}
            <BudgetManagementHub />

            {/* Cash Flow Forecast Panel (Legacy) */}
            <CashFlowForecastPanel brandId="rasa-ibu" />

            {/* Strategic KPI Dashboard */}
            <StrategicKPIDashboard />

            {/* Executive Report Generator */}
            <ReportGeneratorDashboard />

            {/* Global Asset Portfolio */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h3 className="font-black text-lg flex items-center gap-2 text-emerald-900">
                        <Building2 size={20} className="text-emerald-600" />
                        Global Asset Portfolio
                    </h3>
                    <p className="text-sm text-emerald-700 mt-1">Consolidated asset valuation across all brands</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Value</div>
                            <div className="text-2xl font-black text-slate-900">{currency.format(assetPortfolio.totalValue)}</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Accumulated Depreciation</div>
                            <div className="text-2xl font-black text-red-600">-{currency.format(assetPortfolio.totalDepreciation)}</div>
                        </div>
                        <div className="text-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Net Asset Value</div>
                            <div className="text-2xl font-black text-emerald-900">{currency.format(assetPortfolio.netValue)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">By Category</h4>
                            <div className="space-y-2">
                                {assetPortfolio.byCategory.map((cat) => (
                                    <div key={cat.category} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <div className="font-bold text-slate-900">{cat.category}</div>
                                            <div className="text-xs text-slate-500">{cat.count} assets</div>
                                        </div>
                                        <div className="font-bold text-slate-900">{currency.format(cat.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">By Brand</h4>
                            <div className="space-y-2">
                                {assetPortfolio.byBrand.map((brand) => (
                                    <div key={brand.brandName} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <div className="font-bold text-slate-900">{brand.brandName}</div>
                                            <div className="text-xs text-slate-500">{brand.count} assets</div>
                                        </div>
                                        <div className="font-bold text-slate-900">{currency.format(brand.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Brand Performance Leaderboard */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" />
                                Brand Performance Leaderboard
                            </h3>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Brand</th>
                                        <th className="px-6 py-4">Revenue</th>
                                        <th className="px-6 py-4">Profit Margin</th>
                                        <th className="px-6 py-4">COGS %</th>
                                        <th className="px-6 py-4">Efficiency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {brands.map((brand) => (
                                        <tr key={brand.slug} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium">{brand.name}</td>
                                            <td className="px-6 py-4">{currency.format(brand.revenue)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${brand.profitMargin >= 20 ? 'text-green-600' : brand.profitMargin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {brand.profitMargin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${brand.cogsPercentage <= 40 ? 'text-green-600' : brand.cogsPercentage <= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {brand.cogsPercentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${brand.efficiency === 'HIGH' ? 'bg-green-100 text-green-800' :
                                                    brand.efficiency === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {brand.efficiency}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {brands.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No active brands found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Risk Command Center */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-slate-100 bg-red-50/50">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-red-900">
                                <ShieldAlert size={20} className="text-red-600" />
                                Risk Command Center
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {risks.map((risk) => (
                                <div key={risk.id} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{risk.brandName}</span>
                                        <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{risk.type}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800">{risk.message}</p>
                                    <p className="text-xs text-slate-400 mt-2">{risk.date.toLocaleDateString()}</p>
                                </div>
                            ))}
                            {risks.length === 0 && (
                                <div className="p-8 text-center">
                                    <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp size={24} className="text-green-600" />
                                    </div>
                                    <h4 className="text-slate-900 font-medium">All Clear</h4>
                                    <p className="text-sm text-slate-500 mt-1">No critical risks detected.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Workforce Analytics [NEW] */}
                    <div className="mt-6 h-[400px]">
                        <WorkforceAnalyticsPanel metrics={workforceMetrics} />
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
                <p>© 2026 Rasa Ibu - Achiera. Seluruh hak dilindungi.</p>
                <div className="flex gap-6">
                    <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privasi</Link>
                    <Link href="/terms" className="hover:text-slate-600 transition-colors">Ketentuan</Link>
                </div>
            </footer>
        </div>
    );
}
