'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    DollarSign,
    Package,
    AlertCircle,
    CheckCircle,
    Settings
} from 'lucide-react';

export default function PricingDashboardPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug } = resolvedParams;

    const [components, setComponents] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalComponents: 0,
        totalRules: 0,
        activeRules: 0,
        inactiveRules: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [componentsRes, rulesRes] = await Promise.all([
                fetch('/api/admin/pricing/components'),
                fetch('/api/admin/pricing/rules')
            ]);

            if (componentsRes.ok && rulesRes.ok) {
                const componentsData = await componentsRes.json();
                const rulesData = await rulesRes.json();

                setComponents(componentsData);
                setRules(rulesData);

                setStats({
                    totalComponents: componentsData.length,
                    totalRules: rulesData.length,
                    activeRules: rulesData.filter((r: any) => r.isActive).length,
                    inactiveRules: rulesData.filter((r: any) => !r.isActive).length
                });
            }
        } catch (error) {
            console.error('Failed to fetch pricing data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Pricing Management</h1>
                    <p className="text-stone-600 mt-1">Manage price components, rules, and bulk tiers</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/${brandSlug}/pricing/test`}
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Test Sandbox
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-600">Components</span>
                        <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-stone-900">{stats.totalComponents}</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-600">Total Rules</span>
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-stone-900">{stats.totalRules}</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-600">Active Rules</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-600">{stats.activeRules}</div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-600">Inactive Rules</span>
                        <AlertCircle className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="text-3xl font-bold text-stone-400">{stats.inactiveRules}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Components Section */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-stone-900">Price Components</h2>
                        <Link
                            href={`/dashboard/${brandSlug}/pricing/components`}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {components.slice(0, 5).map((component) => (
                            <div key={component.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-stone-900">{component.name}</div>
                                    <div className="text-xs text-stone-500">{component.code} • {component.type}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded">
                                        {component._count?.rules || 0} rules
                                    </span>
                                    {component.isActive ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-stone-400" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/dashboard/${brandSlug}/pricing/components/new`}
                        className="mt-4 w-full py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Component
                    </Link>
                </div>

                {/* Rules Section */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-stone-900">Recent Rules</h2>
                        <Link
                            href={`/dashboard/${brandSlug}/pricing/rules`}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {rules.slice(0, 5).map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-stone-900">{rule.component.name}</div>
                                    <div className="text-xs text-stone-500">
                                        {rule.scope} • Priority {rule.priority} • Rp {Number(rule.amount).toLocaleString()}
                                    </div>
                                </div>
                                {rule.isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-stone-400" />
                                )}
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/dashboard/${brandSlug}/pricing/rules/new`}
                        className="mt-4 w-full py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Rule
                    </Link>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 mb-2">How Pricing System Works</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Components</strong> define types of pricing (base unit, bulk tier, printing costs, etc.)</li>
                            <li>• <strong>Rules</strong> set actual amounts for each component with conditions (qty range, scope, metadata)</li>
                            <li>• <strong>Scope Priority</strong>: VARIANT &gt; PRODUCT &gt; BRAND &gt; GLOBAL</li>
                            <li>• <strong>Test Sandbox</strong> lets you simulate orders and see live pricing calculations</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
