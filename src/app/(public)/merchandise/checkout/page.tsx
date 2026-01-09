
'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { Loader2, ArrowRight, MapPin, Phone, User, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: ''
    });

    if (items.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
                <button onClick={() => router.push('/merchandise')} className="text-amber-600 underline">
                    Browse Merchandise
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Submit Order to Backend
            const res = await fetch('/api/public/merch/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Use customerAddress directly as API expects it now
                    items: items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        variantName: item.variantName,
                        quantity: item.quantity,
                        price: item.price,
                        image: item.image,
                        mockupResultPath: item.mockupResultPath,
                        metadata: item.metadata
                    }))
                })
            });

            if (!res.ok) throw new Error('Failed to create order');
            const data = await res.json();
            const { invoiceNo } = data;

            // 2. Prepare WhatsApp Message
            const message = encodeURIComponent(
                `Halo Achiera Merch, saya ingin konfirmasi pesanan *${invoiceNo}*.\n\n` +
                `Nama: ${formData.customerName}\n` +
                `Total: Rp ${cartTotal.toLocaleString()}\n\n` +
                `Mohon info pembayaran. Terima kasih!`
            );
            const waLink = `https://wa.me/6282215191435?text=${message}`;

            // 3. Clear Cart & Redirect
            clearCart();
            toast.success('Order placed successfully!');
            window.location.href = waLink;

        } catch (error) {
            console.error(error);
            toast.error('Failed to submit order. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Left: Form */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-stone-900 mb-2">Checkout</h1>
                        <p className="text-stone-500">Complete your details to finalize the order.</p>
                    </div>

                    <form id="checkout-form" onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Your Name"
                                    value={formData.customerName}
                                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">WhatsApp Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="0812..."
                                    value={formData.customerPhone}
                                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Shipping Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                    placeholder="Street address, City, Postal Code..."
                                    value={formData.customerAddress}
                                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-stone-900">Order Summary</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                                        {item.image ? (
                                            <img src={item.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingBag className="w-full h-full p-4 text-stone-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-stone-900 line-clamp-1">{item.name}</h3>
                                            <span className="font-bold text-sm">Rp {item.total.toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-stone-500">{item.variantName}</p>
                                        <p className="text-xs text-stone-400 mt-1">Qty: {item.quantity} x Rp {item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
                            <div className="flex justify-between items-center text-lg font-bold text-stone-900">
                                <span>Total Amount</span>
                                <span>Rp {cartTotal.toLocaleString()}</span>
                            </div>
                            <button
                                form="checkout-form"
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Confirm & Chat on WhatsApp
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-center text-stone-400">
                                You will be redirected to WhatsApp to finalize payment.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
