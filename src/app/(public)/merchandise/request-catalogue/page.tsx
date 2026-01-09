
'use client';

import React, { useState } from 'react';
import { Loader2, Send, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CatalogueRequestPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/public/merch/catalogue-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to submit request');

            setIsSuccess(true);
            toast.success('Request submitted successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Info Side */}
                    <div className="md:w-5/12 bg-stone-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-6 font-display">Achiera Merch Catalogue</h2>
                            <p className="text-stone-300 mb-8 leading-relaxed">
                                Get access to our complete collection of premium corporate merchandise.
                                Discover exclusive items not listed on the public site.
                            </p>

                            <ul className="space-y-4 text-stone-300">
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-amber-500">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span>Complete Price List</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-amber-500">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span>Volume Discount Tiers</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-amber-500">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span>Customization Options</span>
                                </li>
                            </ul>
                        </div>

                        <div className="relative z-10 mt-12">
                            <p className="text-sm text-stone-500">
                                Trusted by 50+ Corporate Partners
                            </p>
                        </div>

                        {/* Abstract Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    </div>

                    {/* Right: Form Side */}
                    <div className="md:w-7/12 p-10 bg-white">
                        {isSuccess ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-stone-900">Request Sent!</h3>
                                <p className="text-stone-500 max-w-sm">
                                    Thank you for your interest. Our team has received your request and will send the catalogue to <b>{formData.email}</b> shortly.
                                </p>
                                <Link
                                    href="/merchandise"
                                    className="px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium mt-4"
                                >
                                    Back to Merchandise
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-stone-900">Request Download</h3>
                                    <p className="text-sm text-stone-500">Please fill in your details to receive the PDF.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Company Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="e.g. Acme Corp"
                                                value={formData.companyName}
                                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Contact Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="e.g. John Doe"
                                                value={formData.contactName}
                                                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp / Phone</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="+62..."
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Notes (Optional)</label>
                                        <textarea
                                            rows={2}
                                            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                            placeholder="Specific needs or event dates..."
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Request Catalogue</span>
                                                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-center text-stone-400 mt-4">
                                        By downloading, you agree to receive follow-up communication from Achiera Merch.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
