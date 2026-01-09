'use client';

import { useEffect, useState } from 'react';
import { getMarketingAnalyticsAction } from '@/lib/actions/commerce/marketingAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketingAnalyticsDashboard({ brandId }: { brandId: string }) {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getMarketingAnalyticsAction(brandId).then(setData);
    }, [brandId]);

    if (!data) return <div className="p-4">Memuat Data Analitik Marketing...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Marketing Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flash Sale Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Performa Flash Sale (5 Terakhir)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.flashSaleStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                                <Bar dataKey="totalSales" fill="#BD302D" name="Total Penjualan" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Best Selling Bundles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bundle Terlaris</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.bundleStats.map((bundle: any, i: number) => (
                            <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-bold text-sm">{bundle.name}</p>
                                    <p className="text-xs text-gray-500">{bundle.sold} terjual</p>
                                </div>
                                <p className="font-bold text-[#2D3A2D]">Rp {bundle.revenue.toLocaleString()}</p>
                            </div>
                        ))}
                        {data.bundleStats.length === 0 && <p className="text-gray-500 text-sm">Belum ada data penjualan bundle.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
