
'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Search,
    Mail,
    Phone,
    CheckCircle2,
    Calendar,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

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

interface CatalogueRequestListProps {
    brandSlug: string;
}

export default function CatalogueRequestList({ brandSlug }: CatalogueRequestListProps) {
    const [requests, setRequests] = useState<CatalogueRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [brandSlug]);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/catalogue-requests`);
            if (!res.ok) throw new Error('Failed to fetch requests');
            const data = await res.json();

            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error('Expected array but got:', data);
                setRequests([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load requests');
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        const previous = [...requests];
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));

        try {
            const res = await fetch(`/api/admin/${brandSlug}/catalogue-requests`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
            setRequests(previous);
        }
    };

    const filteredRequests = requests.filter(r =>
        r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
                <div className="text-sm text-stone-500">
                    {filteredRequests.length} Requests Found
                </div>
            </div>

            {/* List */}
            {filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <Mail className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">No Requests Yet</h3>
                    <p className="text-stone-500 max-w-sm mx-auto">
                        New catalogue download requests will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRequests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                {/* Lead Info */}
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-stone-900">{req.companyName}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${req.status === 'NEW'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="text-stone-500 flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(req.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-stone-700">
                                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-stone-500">{req.contactName.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{req.contactName}</div>
                                                <div className="text-xs text-stone-500">Contact Person</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-stone-700">
                                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-4 h-4 text-stone-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{req.email}</div>
                                                <div className="text-xs text-stone-500">Email Address</div>
                                            </div>
                                        </div>
                                        {req.phone && (
                                            <div className="flex items-center gap-2 text-stone-700">
                                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                    <Phone className="w-4 h-4 text-stone-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{req.phone}</div>
                                                    <div className="text-xs text-stone-500">Phone / WhatsApp</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {req.notes && (
                                        <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 flex gap-2 items-start">
                                            <MessageSquare className="w-4 h-4 mt-0.5 text-stone-400" />
                                            <p>{req.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                                    {req.status === 'NEW' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(req.id, 'CONTACTED')}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Mark Contacted
                                        </button>
                                    ) : (
                                        <div className="px-4 py-2 bg-stone-100 text-stone-500 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap cursor-default">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Completed
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
