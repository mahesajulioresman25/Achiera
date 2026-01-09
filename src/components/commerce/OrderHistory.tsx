'use client';

import React, { useEffect, useState } from 'react';
import { getUserOrdersAction } from '@/lib/actions/commerce/orders';
import { Package, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface OrderHistoryProps {
    userId: string;
}

export default function OrderHistory({ userId }: OrderHistoryProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const data = await getUserOrdersAction(userId);
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [userId]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3A2D] mx-auto"></div>
                <p className="mt-4 text-gray-500">Memuat riwayat pesanan...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Riwayat Pesanan</h1>
                <div className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada pesanan.</p>
                    <Link href="/rasa-ibu/products" className="mt-4 inline-block text-[#2D3A2D] font-bold hover:underline">
                        Mulai Belanja →
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'DIPESAN': 'bg-yellow-100 text-yellow-800',
            'WAITING_PAYMENT': 'bg-orange-100 text-orange-800',
            'LUNAS': 'bg-green-100 text-green-800',
            'DIPROSES': 'bg-blue-100 text-blue-800',
            'DIKIRIM': 'bg-purple-100 text-purple-800',
            'SELESAI': 'bg-gray-100 text-gray-800',
            'DIBATALKAN': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Riwayat Pesanan</h1>

            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900">{order.invoiceNo}</h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            {order.orderItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                        {item.quantity}x {item.name}
                                        {item.variantName && ` (${item.variantName})`}
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                        Rp {item.subtotal.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-sm">
                                <span className="text-gray-600">Total: </span>
                                <span className="font-bold text-gray-900 text-lg">
                                    Rp {order.total.toLocaleString()}
                                </span>
                            </div>
                            <Link
                                href={`/order/track/${order.invoiceNo}`}
                                className="flex items-center gap-2 text-sm font-bold text-[#2D3A2D] hover:underline"
                            >
                                Lacak Pesanan
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
