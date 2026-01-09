'use client';

import { Suspense, use } from 'react';
import MarketingAnalyticsDashboard from '@/components/marketing/MarketingAnalyticsDashboard';
import Link from 'next/link';
import { Zap, Target, Megaphone } from 'lucide-react';

export default function MarketingDashboardPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Marketing Center</h1>
                    <p className="text-stone-600 mt-1">Analisa performa campaign dan atur promosi.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/${brandSlug}/marketing/flash-sale`}
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium hover:bg-yellow-200 transition-colors flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Flash Sale
                    </Link>
                    <Link
                        href={`/dashboard/${brandSlug}/marketing/campaigns`}
                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" />
                        Campaigns
                    </Link>
                </div>
            </div>

            {/* Analytics Content */}
            <Suspense fallback={<div className="p-12 text-center text-gray-500">Memuat Data Analitik...</div>}>
                <MarketingAnalyticsDashboard brandId={brandSlug} />
            </Suspense>
        </div>
    );
}
