'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PricingComponentsPage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;

    const [components, setComponents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const res = await fetch('/api/admin/pricing/components');
            if (res.ok) {
                const data = await res.json();
                setComponents(data);
            }
        } catch (error) {
            console.error('Error fetching components:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-amber-600" />
                        Pricing Components
                    </h1>
                    <p className="text-stone-500 mt-1">Manage standard price elements (Base, Print, Material)</p>
                </div>
                <Link
                    href={`/dashboard/${brandSlug}/pricing/components/new`}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Component
                </Link>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Active Rules</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {components.map((comp) => (
                                <tr key={comp.id} className="hover:bg-stone-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <code className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-600">
                                            {comp.code}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{comp.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${comp.type === 'BASE' ? 'bg-blue-50 text-blue-700' :
                                                comp.type === 'ADDON' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-stone-100 text-stone-600'
                                            }`}>
                                            {comp.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-stone-500">
                                        {comp._count?.rules || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/${brandSlug}/pricing/components/${comp.id}`}
                                            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {components.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                                        No components found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
