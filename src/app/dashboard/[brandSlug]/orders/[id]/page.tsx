
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetailPage({ params }: { params: Promise<{ brandSlug: string; id: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug, id } = resolvedParams;

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Status Update State
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setNewStatus(data.status);

                // Fetch brand settings separately or if not in order
                // Actually the API /api/admin/orders/[id] returns order with relations.
                // We need to make sure that API includes product.brand.paymentSettings too.
            }
        } catch (error) {
            console.error('Failed to load order', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus || newStatus === order.status) return;
        if (!confirm(`Change status from ${order.status} to ${newStatus}?`)) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success('Status Berhasil Diperbarui');
                fetchOrderDetail();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            toast.error('Gagal memperbarui status');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyPayment = async (type: 'DP' | 'FINAL') => {
        // Calculate Total Paid so far to determine exact remaining balance
        const payments = order.payments || [];
        const verifiedPaid = payments.filter((p: any) => p.isVerified).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        let amount = 0;
        if (type === 'DP') {
            const dpPercentage = order.product?.brand?.paymentSettings?.downPaymentPercentage || 50;
            const dpDecimal = dpPercentage / 100;
            amount = Number(order.total) * dpDecimal;
        } else {
            amount = Number(order.total) - verifiedPaid;
        }

        const msg = type === 'DP'
            ? `Mark DP (Rp ${amount.toLocaleString()}) as Received?`
            : `Mark Final Payment (Rp ${amount.toLocaleString()}) as Received?`;

        if (!confirm(msg)) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentVerified: true,
                    paymentAmount: amount,
                    paymentType: type
                })
            });

            if (res.ok) {
                toast.success(`Pembayaran ${type} Berhasil Diverifikasi!`);
                fetchOrderDetail();
            } else {
                throw new Error('Failed to verify');
            }
        } catch (error) {
            toast.error('Gagal memverifikasi pembayaran');
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="p-12 text-center text-stone-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Order Details...</div>;
    if (!order) return <div className="p-12 text-center text-red-500">Order not found</div>;

    const timeline = order.statusLogs || [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/${brandSlug}/orders`} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
                            Order
                            <span className="font-mono text-xl bg-stone-100 px-2 py-1 rounded text-stone-600">#{order.invoiceNo}</span>
                        </h1>
                        <p className="text-sm text-stone-500">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions */}
                </div>
            </div>

            {(() => {
                const deliveryMatch = order.customerNote?.match(/^\[(.*?)\]/);
                const deliveryInfo = deliveryMatch ? deliveryMatch[1] : null;
                if (!deliveryInfo) return null;
                const [method, courier] = deliveryInfo.split(' - ');

                return (
                    <div className="bg-white border-2 border-stone-900 rounded-2xl p-6 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${method === 'Kurir Instan' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Shipping Mode</h3>
                                <div className="text-xl font-black text-stone-900">{method} {courier ? `via ${courier}` : ''}</div>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${method === 'Kurir Instan' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                Action Required
                            </span>
                        </div>
                    </div>
                );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Order Items */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-stone-900">Items Ordered</h3>
                        {(order.orderItems && order.orderItems.length > 0) ? order.orderItems.map((item: any) => (
                            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-6 flex gap-6">
                                <div className="w-32 h-32 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                                    {/* Mockup Preview */}
                                    {item.mockupResultPath && !item.mockupResultPath.includes('placeholder') ? (
                                        <img src={item.mockupResultPath} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">No Preview</div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-bold text-lg text-stone-900">{item.name}</h3>
                                    <div className="text-stone-600 flex items-center gap-2">
                                        <span className="font-medium">{item.variantName}</span>
                                    </div>
                                    <div className="text-stone-500 text-sm mt-2">
                                        Quantity: <span className="font-semibold text-stone-900">{item.quantity} pcs</span>
                                    </div>
                                    <div className="text-stone-600 font-bold text-lg mt-1">
                                        Subtotal: Rp {Number(item.subtotal).toLocaleString()}
                                    </div>
                                    {/* Design File Download Link if exists */}
                                    {item.designUploadPath && (
                                        <a href={item.designUploadPath} target="_blank" className="text-amber-600 text-xs hover:underline block mt-1">
                                            Download Design File
                                        </a>
                                    )}
                                </div>
                            </div>
                        )) : (
                            /* Legacy / Fallback for Single Item without OrderItems */
                            <div className="bg-white rounded-xl border border-stone-200 p-6 flex gap-6">
                                <div className="w-32 h-32 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Legacy Order</div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-bold text-lg text-stone-900">{order.product?.displayName}</h3>
                                    <div className="text-stone-600 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full border border-stone-300 shadow-sm" style={{ backgroundColor: order.variant?.colorHex || '#fff' }} />
                                        {order.variant?.name}
                                    </div>
                                    <div className="text-stone-500 text-sm mt-2">
                                        Quantity: <span className="font-semibold text-stone-900">{order.quantity} pcs</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-4 border-t border-stone-200">
                            <div className="text-right">
                                <div className="text-stone-500 text-sm mb-1">Grand Total</div>
                                <div className="text-3xl font-bold text-stone-900">
                                    Rp {Number(order.total).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-stone-400" />
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div>
                                <label className="block text-stone-500 mb-1">Name</label>
                                <div className="font-medium text-stone-900">{order.customerName}</div>
                            </div>
                            <div>
                                <label className="block text-stone-500 mb-1">Phone (WhatsApp)</label>
                                <div className="font-medium text-stone-900 font-mono">{order.customerPhone}</div>
                            </div>
                            <div>
                                <label className="block text-stone-500 mb-1">Email</label>
                                <div className="font-medium text-stone-900">{order.customerEmail}</div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-stone-500 mb-1">Shipping Address</label>
                                <div className="bg-stone-50 p-3 rounded-lg text-stone-700 leading-relaxed whitespace-pre-wrap">
                                    {order.customerAddress || '-'}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-stone-500 mb-1">Notes</label>
                                <div className="bg-stone-50 p-3 rounded-lg text-stone-700 italic">
                                    {order.customerNote || 'No notes'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Proofs (Placeholder) */}
                    <div className="bg-white rounded-xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-900 mb-4">Payment & Files</h3>
                        <div className="space-y-3">
                            {order.designUploadPath ? (
                                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded border border-stone-200">
                                            <Download className="w-4 h-4 text-stone-500" />
                                        </div>
                                        <div className="text-sm font-medium text-stone-700">User Design File</div>
                                    </div>
                                    <button className="text-amber-600 text-sm font-medium hover:underline">Download</button>
                                </div>
                            ) : (
                                <p className="text-sm text-stone-500 italic">No design file uploaded (Uses Builder only)</p>
                            )}

                            {order.payments && order.payments.length > 0 ? (
                                order.payments.map((p: any) => (
                                    <div key={p.id} className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-green-700 font-bold uppercase">{p.type} PAYMENT</div>
                                            <div className="text-sm font-medium text-green-900">Rp {Number(p.amount).toLocaleString()}</div>
                                            {(p.sourceBankName || p.destinationBank) && (
                                                <div className="text-xs text-stone-500 mt-1">
                                                    From <span className="font-bold">{p.sourceBankName || '-'}</span>
                                                    {p.destinationBank && <> to <span className="font-bold">{p.destinationBank.bankName}</span></>}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">{p.isVerified ? 'VERIFIED' : 'PENDING'}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
                                    <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-sm text-yellow-800 font-medium">No Payment Recorded</p>
                                    <p className="text-xs text-yellow-600 mt-1">Monitor bank account for transfers</p>
                                    {order.status === 'WAITING_PAYMENT' && (
                                        <button
                                            onClick={() => handleVerifyPayment('DP')}
                                            className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-bold hover:bg-yellow-200 transition-colors w-full"
                                        >
                                            Mark DP Paid ({order.product?.brand?.paymentSettings?.downPaymentPercentage || 50}%)
                                        </button>
                                    )}
                                    {order.status === 'WAITING_FINAL_PAYMENT' && (
                                        <button
                                            onClick={() => handleVerifyPayment('FINAL')}
                                            className="mt-3 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-bold hover:bg-orange-200 transition-colors w-full"
                                        >
                                            Mark Final Payment Paid
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: Status & Timeline */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Current Status</label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-bold text-stone-800 mb-4"
                        >
                            <option value="WAITING_PAYMENT">Waiting Payment</option>
                            <option value="PAYMENT_VERIFIED">Payment Verified (DP)</option>
                            <option value="IN_PRODUCTION">In Production</option>
                            <option value="QUALITY_CHECK">Quality Check</option>
                            <option value="PACKING">Packing</option>
                            <option value="WAITING_FINAL_PAYMENT">Waiting Final Payment</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button
                            onClick={handleUpdateStatus}
                            disabled={isSaving || newStatus === order.status}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${newStatus !== order.status ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Status
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-stone-200 p-6">
                        <h3 className="font-bold text-stone-900 mb-4">Order History</h3>
                        <div className="relative border-l-2 border-stone-100 ml-3 space-y-6 pl-6 py-2">
                            {timeline.map((log: any, idx: number) => (
                                <div key={log.id} className="relative">
                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-amber-500 border-amber-500' : 'bg-white border-stone-300'}`} />
                                    <div className={`text-sm font-bold ${idx === 0 ? 'text-stone-900' : 'text-stone-500'}`}>{log.status.replace('_', ' ')}</div>
                                    <div className="text-xs text-stone-500 mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                                    {log.message && <div className="text-xs text-stone-400 mt-1 italic">{log.message}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
