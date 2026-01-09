
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Loader2, Search, Filter, Eye } from 'lucide-react';

// Enum helper or just string mapping
const STATUS_COLORS: Record<string, string> = {
    WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    PAYMENT_VERIFIED: 'bg-blue-100 text-blue-800',
    in_production: 'bg-purple-100 text-purple-800', // Prisma might return uppercase or standard? Schema said UPPERCASE
    IN_PRODUCTION: 'bg-purple-100 text-purple-800',
    WAITING_FINAL_PAYMENT: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderListPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug } = resolvedParams;

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(`/api/admin/orders?brandSlug=${brandSlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (error) {
                console.error('Failed to load orders', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [brandSlug]);

    const filteredOrders = orders.filter(o =>
        o.invoiceNo.toLowerCase().includes(filter.toLowerCase()) ||
        o.customerName.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-stone-900">Order Management</h1>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search invoice or customer..."
                        className="pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-64"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 border-b border-stone-100 text-stone-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Invoice</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Item</th>
                                <th className="px-6 py-4 font-semibold text-center">Delivery</th>
                                <th className="px-6 py-4 font-semibold text-right">Total</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading data...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-stone-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900 font-mono">
                                            {order.invoiceNo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-900">{order.customerName}</div>
                                            <div className="text-xs text-stone-500">{order.customerEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.product ? (
                                                <>
                                                    <div className="text-stone-900">{order.product.displayName}</div>
                                                    <div className="text-xs text-stone-500">
                                                        {order.variant?.name} (x{order.quantity})
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-stone-900">
                                                        {order.orderItems?.[0]?.name || 'Multi-Item Order'}
                                                    </div>
                                                    <div className="text-xs text-stone-500">
                                                        {order.orderItems?.length > 1
                                                            ? `+ ${order.orderItems.length - 1} other items`
                                                            : order.orderItems?.[0]?.variantName}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const deliveryMatch = order.customerNote?.match(/^\[(.*?)\]/);
                                                const deliveryInfo = deliveryMatch ? deliveryMatch[1] : null;

                                                if (!deliveryInfo) return <span className="text-stone-400 italic">No Info</span>;

                                                const [method, courier] = deliveryInfo.split(' - ');
                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${method === 'Kurir Instan' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {method}
                                                        </span>
                                                        {courier && (
                                                            <span className="text-[9px] font-black text-stone-500 uppercase">{courier}</span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-stone-900">
                                            Rp {Number(order.total).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/${brandSlug}/orders/${order.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-all text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
