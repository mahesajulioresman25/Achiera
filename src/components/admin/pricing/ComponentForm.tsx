'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { PriceComponentType } from '@prisma/client';

interface ComponentFormProps {
    initialData?: any;
    brandSlug: string;
}

export default function ComponentForm({ initialData, brandSlug }: ComponentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        code: initialData?.code || '',
        name: initialData?.name || '',
        type: initialData?.type || 'BASE',
        description: initialData?.description || ''
    });

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = isEditing
                ? `/api/admin/pricing/components/${initialData.id}`
                : '/api/admin/pricing/components';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push(`/dashboard/${brandSlug}/pricing/components`);
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                <h2 className="text-lg font-bold text-stone-900">
                    {isEditing ? 'Edit Component' : 'New Component'}
                </h2>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" /> Cancel
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Code</label>
                        <input
                            type="text"
                            required
                            disabled={isEditing}
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                            placeholder="e.g. DTF_PRINT"
                            className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono text-sm disabled:bg-stone-50 disabled:text-stone-500"
                        />
                        <p className="text-xs text-stone-400 mt-1">Unique identifier (UPPERCASE)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            {Object.keys(PriceComponentType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Display Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. DTF Printing Service"
                        className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Description (Optional)</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-stone-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditing ? 'Update Component' : 'Create Component'}
                    </button>
                </div>
            </div>
        </form>
    );
}
