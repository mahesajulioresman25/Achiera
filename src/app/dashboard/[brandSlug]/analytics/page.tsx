'use client';

import { use, useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MousePointer, Eye, Sparkles, Users, ExternalLink } from 'lucide-react';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import ConversionFunnel from '@/components/analytics/ConversionFunnel';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import ExportButton from '@/components/analytics/ExportButton';

interface AnalyticsData {
    stats: {
        totalPageViews: number;
        totalCollectionClicks: number;
        totalMockupOpens: number;
        totalMockupConfirms: number;
        totalHeroCtaClicks: number;
    };
    conversionRates: {
        viewToClick: number;
        clickToMockup: number;
        mockupToConfirm: number;
        overallConversion: number;
    };
    topCollections: { slug: string; count: number }[];
    topPages: { path: string; count: number }[];
    dailyStats: any[];
    sessionAnalytics: {
        uniqueSessions: number;
        avgEventsPerSession: number;
    };
    topReferrers: { referrer: string; count: number }[];
}

export default function AnalyticsPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    });
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchAnalytics();
    }, [brandSlug, startDate, endDate]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });
            const res = await fetch(`/api/admin/${brandSlug}/analytics?${params}`);
            const analyticsData = await res.json();
            setData(analyticsData);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading analytics...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Failed to load analytics</div>
            </div>
        );
    }

    // Provide default values if data is missing
    const stats = data?.stats || {
        totalPageViews: 0,
        totalCollectionClicks: 0,
        totalMockupOpens: 0,
        totalMockupConfirms: 0,
        totalHeroCtaClicks: 0,
    };

    const dailyStats = data?.dailyStats || [];
    const conversionRates = data?.conversionRates || {
        viewToClick: 0,
        clickToMockup: 0,
        mockupToConfirm: 0,
        overallConversion: 0,
    };
    const topCollections = data?.topCollections || [];
    const topPages = data?.topPages || [];
    const sessionAnalytics = data?.sessionAnalytics || {
        uniqueSessions: 0,
        avgEventsPerSession: 0,
    };
    const topReferrers = data?.topReferrers || [];

    const funnelSteps = [
        { name: 'Page Views', value: stats.totalPageViews, color: '#3b82f6' },
        { name: 'Collection Clicks', value: stats.totalCollectionClicks, color: '#10b981' },
        { name: 'Mockup Opens', value: stats.totalMockupOpens, color: '#a855f7' },
        { name: 'Mockup Confirms', value: stats.totalMockupConfirms, color: '#f59e0b' },
    ];

    const trendChartData = dailyStats.map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Page Views': day.pageViews,
        'Collection Clicks': day.collectionClicks,
        'Mockup Opens': day.mockupOpens,
        'Mockup Confirms': day.mockupConfirms,
    }));

    const chartDataKeys = [
        { key: 'Page Views', name: 'Page Views', color: '#3b82f6' },
        { key: 'Collection Clicks', name: 'Collection Clicks', color: '#10b981' },
        { key: 'Mockup Opens', name: 'Mockup Opens', color: '#a855f7' },
        { key: 'Mockup Confirms', name: 'Mockup Confirms', color: '#f59e0b' },
    ];


    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
                    <p className="text-stone-600">Track user engagement and behavior</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onDateChange={handleDateChange}
                    />
                    <ExportButton
                        brandSlug={brandSlug}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-stone-900 mb-1">
                        {stats.totalPageViews.toLocaleString()}
                    </div>
                    <div className="text-sm text-stone-600">Page Views</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <MousePointer className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-stone-900 mb-1">
                        {stats.totalCollectionClicks.toLocaleString()}
                    </div>
                    <div className="text-sm text-stone-600">Collection Clicks</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-stone-900 mb-1">
                        {stats.totalMockupOpens.toLocaleString()}
                    </div>
                    <div className="text-sm text-stone-600">Mockup Opens</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-stone-900 mb-1">
                        {stats.totalMockupConfirms.toLocaleString()}
                    </div>
                    <div className="text-sm text-stone-600">Mockup Confirms</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-stone-900 mb-1">
                        {stats.totalHeroCtaClicks.toLocaleString()}
                    </div>
                    <div className="text-sm text-stone-600">Hero CTA Clicks</div>
                </div>
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-6">Activity Trends</h2>
                <AnalyticsChart
                    data={trendChartData}
                    type="line"
                    dataKeys={chartDataKeys}
                    height={350}
                />
            </div>

            {/* Conversion Funnel & Session Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-6">Conversion Funnel</h2>
                    <ConversionFunnel steps={funnelSteps} />
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-stone-50 rounded-lg p-4">
                            <div className="text-sm text-stone-600 mb-1">View → Click</div>
                            <div className="text-2xl font-bold text-stone-900">
                                {conversionRates.viewToClick.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-stone-50 rounded-lg p-4">
                            <div className="text-sm text-stone-600 mb-1">Overall</div>
                            <div className="text-2xl font-bold text-stone-900">
                                {conversionRates.overallConversion.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-6">Session Analytics</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-stone-900">
                                    {sessionAnalytics.uniqueSessions.toLocaleString()}
                                </div>
                                <div className="text-sm text-stone-600">Unique Sessions</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-stone-900">
                                    {sessionAnalytics.avgEventsPerSession}
                                </div>
                                <div className="text-sm text-stone-600">Avg Events/Session</div>
                            </div>
                        </div>
                    </div>

                    {topReferrers.length > 0 && (
                        <>
                            <h3 className="text-md font-semibold text-stone-900 mt-6 mb-3">Top Referrers</h3>
                            <div className="space-y-2">
                                {topReferrers.map((ref, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-stone-700 truncate">
                                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{ref.referrer}</span>
                                        </div>
                                        <span className="text-sm font-medium text-stone-900">{ref.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Top Collections & Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-4">Top Collections</h2>
                    {topCollections.length === 0 ? (
                        <p className="text-stone-600 text-center py-8">No collection clicks yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topCollections.map((collection, index) => (
                                <div key={collection.slug} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="font-medium text-stone-900 capitalize">
                                            {collection.slug.replace(/-/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-stone-600">
                                        {collection.count} clicks
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-4">Top Pages</h2>
                    {topPages.length === 0 ? (
                        <p className="text-stone-600 text-center py-8">No page views yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topPages.map((page, index) => (
                                <div key={page.path} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="font-medium text-stone-900 text-sm truncate">
                                            {page.path}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-stone-600">
                                        {page.count} views
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
