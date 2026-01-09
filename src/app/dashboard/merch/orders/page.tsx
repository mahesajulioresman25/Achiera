
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MerchOrderList from '@/components/dashboard/merch/MerchOrderList';

export default function MerchOrdersPage() {
    return (
        <div className="p-8 space-y-8 bg-stone-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            href="/dashboard/merch"
                            className="text-stone-500 hover:text-stone-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-stone-900">Merchandise Orders</h1>
                    </div>
                    <p className="text-stone-500">Manage incoming orders and track fulfillment.</p>
                </div>
            </div>

            {/* List */}
            <MerchOrderList brandSlug="merch" />
        </div>
    );
}
