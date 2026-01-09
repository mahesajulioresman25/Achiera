
'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Search,
    ShoppingBag,
    CheckCircle2,
    Calendar,
    DollarSign,
    Package,
    Truck,
    MapPin,
    Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
    id: string;
    name: string;
    variantName: string | null;
    quantity: number;
    price: number;
    subtotal: number;
    mockupResultPath: string | null;
}

interface Order {
    id: string;
    invoiceNo: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
}

export default function MerchOrderList({ brandSlug }: { brandSlug: string }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [brandSlug]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/orders`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const data = await res.json();

            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error('Expected array but got:', data);
                setOrders([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load orders');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const previous = [...orders];
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));

        try {
            const res = await fetch(`/api/admin/${brandSlug}/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');
            toast.success(`Order marked as ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
            setOrders(previous);
        }
    };

    const filtered = orders.filter(o =>
        o.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'PAID': return 'bg-blue-100 text-blue-700';
            case 'PROCESSED': return 'bg-purple-100 text-purple-700';
            case 'SHIPPED': return 'bg-cyan-100 text-cyan-700';
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-stone-100 text-stone-700';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
                <div className="text-sm text-stone-500">
                    {filtered.length} Orders Found
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <ShoppingBag className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">No Orders Yet</h3>
                    <p className="text-stone-500 max-w-sm mx-auto">
                        New orders from checkout will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filtered.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            {/* Order Header */}
                            <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-stone-900">{order.invoiceNo}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-stone-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {order.customerName} ({order.customerAddress.substring(0, 20)}...)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                        className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="PROCESSED">Processed</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Order Content */}
                            <div className="p-6 flex flex-col md:flex-row gap-8">
                                {/* Items */}
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Items</h4>
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-4 items-start">
                                            <div className="w-12 h-12 bg-stone-100 rounded border border-stone-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {item.mockupResultPath ? (
                                                    <img src={item.mockupResultPath} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-stone-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <p className="font-medium text-stone-900 line-clamp-1">{item.name}</p>
                                                    <p className="hidden font-medium text-stone-900">Rp {Number(item.subtotal).toLocaleString()}</p>
                                                </div>
                                                <div className="text-sm text-stone-500 flex justify-between">
                                                    <span>{item.variantName || 'Standard'} x {item.quantity}</span>
                                                    <span>@ Rp {Number(item.price).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 mt-2 border-t border-stone-100 flex justify-between items-center">
                                        <span className="font-bold text-stone-500">Total Order Amount</span>
                                        <span className="text-xl font-bold text-stone-900">Rp {Number(order.totalAmount).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="md:w-72 space-y-4 border-l border-stone-100 md:pl-8">
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Customer Details</h4>

                                    <div>
                                        <p className="text-sm font-medium text-stone-900">{order.customerName}</p>
                                        <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                                            <Phone className="w-3 h-3" />
                                            <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`} target="_blank" className="hover:text-amber-600 hover:underline">
                                                {order.customerPhone}
                                            </a>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-stone-400 mb-1">Shipping Address</p>
                                        <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
                                            {order.customerAddress || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
