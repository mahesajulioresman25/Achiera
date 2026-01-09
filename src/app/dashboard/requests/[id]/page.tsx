'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Mail, Phone, Building, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CatalogueRequest {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string | null;
    notes: string | null;
    status: string;
    createdAt: string;
}

export default function RequestDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [request, setRequest] = useState<CatalogueRequest | null>(null);
    const [status, setStatus] = useState('NEW');

    useEffect(() => {
        // Fetch request details
        fetch(`/api/admin/requests/${params.id}`)
            .then((res) => res.json())
            .then((data) => {
                setRequest(data);
                setStatus(data.status);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch request:', err);
                setLoading(false);
            });
    }, [params.id]);

    const handleStatusUpdate = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/requests/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const updated = await res.json();
            setRequest(updated);
            router.refresh();
            toast.success('Status berhasil diperbarui!');
        } catch (error) {
            toast.error('Gagal memperbarui status');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-stone-900 mb-2">Request Not Found</h2>
                    <Link href="/dashboard/requests" className="text-amber-600 hover:text-amber-700">
                        Back to Requests
                    </Link>
                </div>
            </div>
        );
    }

    const statusColors = {
        NEW: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-amber-100 text-amber-700',
        DONE: 'bg-green-100 text-green-700',
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/requests"
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-stone-900">Catalogue Request</h1>
                    <p className="text-stone-600">Request ID: {request.id.slice(0, 8)}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}>
                    {request.status}
                </span>
            </div>

            <div className="space-y-6">
                {/* Company Info */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Company Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm text-stone-500">Company Name</div>
                                <div className="font-medium text-stone-900">{request.companyName}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm text-stone-500">Contact Person</div>
                                <div className="font-medium text-stone-900">{request.contactName}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm text-stone-500">Email</div>
                                <div className="font-medium text-stone-900">{request.email}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-sm text-stone-500">Phone</div>
                                <div className="font-medium text-stone-900">{request.phone || 'Not provided'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-stone-600" />
                            </div>
                            <div>
                                <div className="text-sm text-stone-500">Submitted</div>
                                <div className="font-medium text-stone-900">
                                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {request.notes && (
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Additional Notes</h2>
                        <p className="text-stone-700 whitespace-pre-wrap">{request.notes}</p>
                    </div>
                )}

                {/* Status Update */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Update Status</h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        >
                            <option value="NEW">New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={saving || status === request.status}
                            className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Status
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
