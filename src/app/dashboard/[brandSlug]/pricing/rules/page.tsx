'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, Plus, Loader2, Filter } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PricingRulesPage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;

    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/admin/pricing/rules');
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
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
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                        Pricing Rules
                    </h1>
                    <p className="text-stone-500 mt-1">Configure automated price adjustments</p>
                </div>
                <Link
                    href={`/dashboard/${brandSlug}/pricing/rules/new`}
                    className="bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Rule
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
                                <th className="px-6 py-4">Component</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Condition</th>
                                <th className="px-6 py-4">Scope</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-stone-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-stone-900">{rule.component.name}</span>
                                            <span className="text-xs text-stone-500 font-mono">{rule.component.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-stone-900">
                                        {rule.component.type === 'PERCENT' ? (
                                            <span className="text-blue-600">{Number(rule.amount)}%</span>
                                        ) : rule.component.type === 'MULTIPLIER' ? (
                                            <span className="text-purple-600">x{Number(rule.amount)}</span>
                                        ) : (
                                            <span className="text-emerald-600">+Rp {Number(rule.amount).toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {/* Quantity Condition */}
                                            {(rule.minQty || rule.maxQty) && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 w-fit">
                                                    Qty: {rule.minQty || 0} - {rule.maxQty || '∞'}
                                                </span>
                                            )}
                                            {/* Metadata Conditions */}
                                            {rule.metadata && Object.keys(rule.metadata).length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {Object.entries(rule.metadata).map(([k, v]) => (
                                                        <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-stone-100 text-stone-600 border border-stone-200">
                                                            {k}: {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {(!rule.minQty && !rule.maxQty && (!rule.metadata || Object.keys(rule.metadata).length === 0)) && (
                                                <span className="text-xs text-stone-400">Always Applied</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {rule.scope}
                                        {rule.scopeId && <span className="text-xs text-stone-400 ml-1">({rule.scopeId.slice(0, 4)}...)</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rule.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                                        No active rules found.
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
