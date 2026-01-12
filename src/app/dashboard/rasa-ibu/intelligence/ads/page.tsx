
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdsEngine } from '@/lib/intelligence/adsEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, PieChart, DollarSign, Target, MousePointer2 } from 'lucide-react';

export default async function AdsAnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) return <div>Brand not found</div>;

    // Fetch ROI Summary for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const summaries = await AdsEngine.getROISummary(brand.id, startDate, endDate);

    // Aggregate totals
    const totalMetrics = summaries.reduce((acc, curr) => ({
        spend: acc.spend + curr.metrics.spend,
        revenue: acc.revenue + curr.metrics.revenue,
        impressions: acc.impressions + curr.metrics.impressions,
        clicks: acc.clicks + curr.metrics.clicks,
        conversions: acc.conversions + curr.metrics.conversions,
    }), { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 });

    const totalROAS = totalMetrics.spend > 0 ? totalMetrics.revenue / totalMetrics.spend : 0;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Ads Analytics</h1>
                    <p className="text-slate-400">Marketing performance & ROI Tracking - Rasa Ibu</p>
                </div>
                <div className="flex gap-2">
                    {/* Placeholder for Import Button/Drawer */}
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Upload Ads Data
                    </button>
                </div>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Ad Spend"
                    value={`Rp ${totalMetrics.spend.toLocaleString()}`}
                    subtitle="Last 30 days"
                    icon={<DollarSign className="w-5 h-5 text-rose-400" />}
                />
                <KPICard
                    title="Attributed Revenue"
                    value={`Rp ${totalMetrics.revenue.toLocaleString()}`}
                    subtitle="Conversion value"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                />
                <KPICard
                    title="Avg. ROAS"
                    value={`${totalROAS.toFixed(2)}x`}
                    subtitle="Return on Ad Spend"
                    icon={<Target className="w-5 h-5 text-indigo-400" />}
                />
                <KPICard
                    title="Direct Clicks"
                    value={totalMetrics.clicks.toLocaleString()}
                    subtitle={`${((totalMetrics.clicks / (totalMetrics.impressions || 1)) * 100).toFixed(2)}% CTR`}
                    icon={<MousePointer2 className="w-5 h-5 text-amber-400" />}
                />
            </div>

            {/* Campaign Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/80">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Campaign Performance Breakdown
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Campaign</th>
                                <th className="px-6 py-4 font-medium">Spend</th>
                                <th className="px-6 py-4 font-medium">Revenue</th>
                                <th className="px-6 py-4 font-medium">ROAS</th>
                                <th className="px-6 py-4 font-medium">CTR</th>
                                <th className="px-6 py-4 font-medium">CPA</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {summaries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Data belum tersedia. Silakan upload data ads Anda.
                                    </td>
                                </tr>
                            ) : summaries.map((summary) => (
                                <tr key={summary.campaignId} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-100">{summary.campaignName}</td>
                                    <td className="px-6 py-4">Rp {summary.metrics.spend.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-semibold">Rp {summary.metrics.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-sm ${summary.metrics.roas >= 4 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {summary.metrics.roas.toFixed(2)}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{(summary.metrics.ctr * 100).toFixed(2)}%</td>
                                    <td className="px-6 py-4">Rp {summary.metrics.cpa.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs font-medium uppercase text-emerald-500">Active</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-all shadow-lg group">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <h4 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{value}</h4>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
        </div>
    );
}
