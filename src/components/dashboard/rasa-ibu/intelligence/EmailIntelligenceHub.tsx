'use client';

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Mail,
    Star,
    Lightbulb,
    Target,
    BarChart3,
    MessageSquare,
    RefreshCw,
    Filter,
    Calendar,
    DollarSign,
    ShoppingCart,
    AlertCircle,
    CheckCircle2,
    Eye,
    ScrollText
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getDailySalesReports,
    getSalesTrend,
    getCampaignPerformance,
    getCustomerReviews,
    getMarketplaceInsights,
    markInsightAsReviewed,
    getEmailIntelligenceSummary
} from '@/lib/actions/rasa-ibu/emailIntelligence';

interface EmailIntelligenceHubProps {
    brandId: string;
    onClose?: () => void;
}

type TabState = 'overview' | 'sales' | 'campaigns' | 'reviews' | 'insights' | 'logs';

export default function EmailIntelligenceHub({ brandId, onClose }: EmailIntelligenceHubProps) {
    const [activeTab, setActiveTab] = useState<TabState>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [salesData, setSalesData] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any>({ reviews: [], stats: {} });
    const [insights, setInsights] = useState<any>({ insights: [], grouped: {} });
    const [platformFilter, setPlatformFilter] = useState<'ALL' | 'SHOPEE' | 'TOKOPEDIA'>('ALL');
    const [activeLogRefresh, setActiveLogRefresh] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const [summaryRes, salesRes, campaignRes, reviewRes, insightRes] = await Promise.all([
            getEmailIntelligenceSummary(brandId),
            getSalesTrend(brandId),
            getCampaignPerformance(brandId),
            getCustomerReviews(brandId, { limit: 20 }),
            getMarketplaceInsights(brandId)
        ]);

        if (summaryRes.success) setSummary(summaryRes.data);
        if (salesRes.success) setSalesData(salesRes.data?.reports || []);
        if (campaignRes.success) setCampaigns(campaignRes.data || []);
        if (reviewRes.success) setReviews(reviewRes.data);
        if (insightRes.success) setInsights(insightRes.data);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const handleMarkInsight = async (insightId: string) => {
        const res = await markInsightAsReviewed(insightId, 'current-user');
        if (res.success) {
            toast.success('Insight ditandai sebagai sudah dibaca');
            loadData();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredSales = platformFilter === 'ALL'
        ? salesData
        : salesData.filter(s => s.platform === platformFilter);

    const filteredCampaigns = platformFilter === 'ALL'
        ? campaigns
        : campaigns.filter(c => c.platform === platformFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Email Intelligence Hub</h2>
                        <p className="text-sm text-gray-500">Data otomatis dari inbox marketplace Bunda</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                    >
                        <option value="ALL">Semua Platform</option>
                        <option value="SHOPEE">Shopee</option>
                        <option value="TOKOPEDIA">Tokopedia</option>
                    </select>
                    <button
                        onClick={loadData}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-900">{summary.counts.salesReports}</div>
                                <div className="text-xs text-blue-700 font-semibold">Laporan Sales</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-900">{summary.counts.campaigns}</div>
                                <div className="text-xs text-purple-700 font-semibold">Kampanye Tracked</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-900">{summary.avgRating.toFixed(1)}⭐</div>
                                <div className="text-xs text-amber-700 font-semibold">Rata-rata Rating</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-900">{summary.counts.newInsights}</div>
                                <div className="text-xs text-green-700 font-semibold">Insight Baru</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'sales', label: 'Sales Harian', icon: TrendingUp },
                    { id: 'campaigns', label: 'Kampanye', icon: Target },
                    { id: 'reviews', label: 'Review', icon: Star },
                    { id: 'insights', label: 'Insights', icon: Lightbulb },
                    { id: 'logs', label: 'Logs', icon: ScrollText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-800">Ringkasan Email Intelligence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-bold text-blue-900">Revenue Terakhir</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(Number(summary?.latestRevenue || 0))}
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm font-bold text-purple-900">Total Review</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {summary?.counts.reviews || 0}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 italic">
                            💡 Sistem ini otomatis mengekstrak data dari email marketplace. Pastikan inbox Bunda selalu terkoneksi!
                        </p>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Laporan Penjualan Harian</h3>
                        {filteredSales.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada laporan sales dari email</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredSales.slice(0, 10).map((sale, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase">{sale.platform}</div>
                                                <div className="text-sm font-bold text-gray-800">
                                                    {new Date(sale.reportDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800">{formatCurrency(Number(sale.totalRevenue))}</div>
                                                <div className="text-xs text-gray-500">{sale.totalOrders} pesanan • {sale.totalItems} item</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                ✓ {sale.completedOrders}
                                            </span>
                                            {sale.canceledOrders > 0 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                                    ✗ {sale.canceledOrders}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'campaigns' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Performa Kampanye</h3>
                        {filteredCampaigns.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada data kampanye dari email</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCampaigns.map((campaign, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-gray-800">{campaign.campaignName}</h4>
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded uppercase">
                                                {campaign.platform}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 text-center">
                                            <div>
                                                <div className="text-xs text-gray-500">Views</div>
                                                <div className="text-sm font-bold">{campaign.totalViews.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Clicks</div>
                                                <div className="text-sm font-bold">{campaign.totalClicks.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Orders</div>
                                                <div className="text-sm font-bold text-green-600">{campaign.totalOrders}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Revenue</div>
                                                <div className="text-sm font-bold text-blue-600">{formatCurrency(Number(campaign.totalRevenue))}</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Conversion: <span className="font-bold text-purple-600">{campaign.conversionRate.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Customer Reviews</h3>
                            {reviews.stats && (
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                        😊 {reviews.stats.positive}
                                    </span>
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">
                                        😐 {reviews.stats.neutral}
                                    </span>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                        😞 {reviews.stats.negative}
                                    </span>
                                </div>
                            )}
                        </div>
                        {reviews.reviews.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada review dari email</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reviews.reviews.slice(0, 10).map((review: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-bold text-gray-800">{review.productName}</div>
                                                <div className="text-xs text-gray-500">{review.customerName || 'Anonymous'}</div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                        </div>
                                        {review.reviewText && (
                                            <p className="text-sm text-gray-600 italic">"{review.reviewText}"</p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                            <span className="uppercase font-bold">{review.platform}</span>
                                            <span>•</span>
                                            <span>{new Date(review.reviewDate).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Marketplace Insights</h3>
                        {insights.insights.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada insight dari platform</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {insights.insights.slice(0, 10).map((insight: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${insight.priority === 'HIGH' ? 'bg-red-50 border-red-500' :
                                        insight.priority === 'MEDIUM' ? 'bg-amber-50 border-amber-500' :
                                            'bg-blue-50 border-blue-500'
                                        }`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800">{insight.title}</div>
                                                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                            </div>
                                            {insight.status === 'NEW' && (
                                                <button
                                                    onClick={() => handleMarkInsight(insight.id)}
                                                    className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    Tandai Dibaca
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={`px-2 py-1 rounded font-bold ${insight.status === 'NEW' ? 'bg-green-100 text-green-700' :
                                                insight.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {insight.status}
                                            </span>
                                            <span className="text-gray-500 uppercase font-bold">{insight.platform}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">System Logs</h3>
                            <button
                                onClick={() => setActiveLogRefresh(prev => !prev)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Refresh
                            </button>
                        </div>
                        <LogViewer brandId={brandId} refreshTrigger={activeLogRefresh} />
                    </div>
                )}
            </div>
        </div>
    );
}

function LogViewer({ brandId, refreshTrigger }: { brandId: string, refreshTrigger: boolean }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/logs/system?brandId=${brandId}&limit=100`);
                const data = await res.json();
                if (data.success) {
                    setLogs(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch logs', error);
                toast.error('Gagal memuat logs');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [brandId, refreshTrigger]);

    if (loading) return <div className="text-center py-8 text-gray-500">Memuat logs...</div>;
    if (logs.length === 0) return <div className="text-center py-8 text-gray-500">Belum ada logs sistem.</div>;

    return (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Pesan</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                                {new Date(log.createdAt).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${log.severity === 'ERROR' ? 'bg-red-100 text-red-700' :
                                    log.severity === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {log.severity}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 font-medium">{log.type}</td>
                            <td className="px-4 py-3 text-gray-800">{log.message}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
