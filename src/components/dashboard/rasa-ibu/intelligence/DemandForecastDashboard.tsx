'use client';

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Package,
    Calendar,
    Target,
    Activity,
    Bell,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import {
    generateAllForecasts,
    getDemandForecasts,
    getStockAlerts,
    acknowledgeStockAlert,
    resolveStockAlert,
    getDemandForecastSummary
} from '@/lib/actions/rasa-ibu/demandForecast';

interface DemandForecastDashboardProps {
    brandId: string;
    onClose?: () => void;
}

export default function DemandForecastDashboard({ brandId, onClose }: DemandForecastDashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'alerts'>('overview');

    const loadData = async () => {
        setIsLoading(true);
        const [summaryRes, forecastsRes, alertsRes] = await Promise.all([
            getDemandForecastSummary(brandId),
            getDemandForecasts(brandId),
            getStockAlerts(brandId, 'OPEN')
        ]);

        if (summaryRes.success) setSummary(summaryRes.data);
        if (forecastsRes.success) setForecasts(forecastsRes.data || []);
        if (alertsRes.success) setAlerts(alertsRes.data || []);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const handleGenerateForecasts = async () => {
        setIsGenerating(true);
        const res = await generateAllForecasts(brandId);
        if (res.success) {
            toast.success(res.message || 'Forecasts generated!');
            loadData();
        } else {
            toast.error(res.error || 'Failed to generate forecasts');
        }
        setIsGenerating(false);
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        const res = await acknowledgeStockAlert(alertId, 'current-user');
        if (res.success) {
            toast.success('Alert acknowledged');
            loadData();
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        const res = await resolveStockAlert(alertId);
        if (res.success) {
            toast.success('Alert resolved');
            loadData();
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-blue-100 text-blue-700 border-blue-300';
        }
    };

    // Group forecasts by product
    const forecastsByProduct = forecasts.reduce((acc: any, f) => {
        const productName = f.variant.product.name;
        if (!acc[productName]) acc[productName] = [];
        acc[productName].push(f);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">AI Demand Forecasting</h2>
                        <p className="text-sm text-gray-500">Prediksi demand & stock alerts otomatis</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerateForecasts}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate Forecasts'}
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-900">{summary.criticalAlerts}</div>
                                <div className="text-xs text-red-700 font-semibold">Critical Alerts</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-900">{summary.openAlerts}</div>
                                <div className="text-xs text-orange-700 font-semibold">Open Alerts</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-indigo-900">{summary.activeForecasts}</div>
                                <div className="text-xs text-indigo-700 font-semibold">Active Forecasts</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-900">{summary.avgAccuracy}%</div>
                                <div className="text-xs text-green-700 font-semibold">Avg Accuracy</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'forecasts', label: 'Forecasts', icon: Calendar },
                    { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-800">System Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <h4 className="font-bold text-indigo-900 mb-2">How It Works</h4>
                                <ul className="text-sm text-indigo-700 space-y-1">
                                    <li>✓ Analyzes 90 days of sales history</li>
                                    <li>✓ Detects trends & seasonal patterns</li>
                                    <li>✓ Predicts demand 7-30 days ahead</li>
                                    <li>✓ Auto-generates stock alerts</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-bold text-green-900 mb-2">Benefits</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>💰 Prevent lost sales from stockouts</li>
                                    <li>📦 Reduce overstock waste</li>
                                    <li>🎯 Optimize inventory levels</li>
                                    <li>⏱️ Save time on manual planning</li>
                                </ul>
                            </div>
                        </div>
                        {forecasts.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 mb-4">No forecasts yet. Click "Generate Forecasts" to start!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'forecasts' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">7-Day Demand Forecasts</h3>
                        {Object.keys(forecastsByProduct).length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No forecasts available. Generate forecasts to see predictions.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(forecastsByProduct).map(([productName, productForecasts]: [string, any]) => (
                                    <div key={productName} className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-bold text-gray-800 mb-3">{productName}</h4>
                                        <div className="grid grid-cols-7 gap-2">
                                            {productForecasts.slice(0, 7).map((f: any, idx: number) => (
                                                <div key={idx} className="text-center p-2 bg-white rounded border border-gray-200">
                                                    <div className="text-xs text-gray-500 font-semibold">
                                                        {new Date(f.forecastDate).toLocaleDateString('id-ID', { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-lg font-bold text-indigo-600">{f.predictedDemand}</div>
                                                    <div className="text-xs text-gray-400">{f.confidence}% conf</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Alerts</h3>
                        {alerts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                <p className="font-semibold text-green-600">All Good!</p>
                                <p className="text-sm">No stock alerts at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Package className="w-4 h-4" />
                                                    <h4 className="font-bold">{alert.variant.product.name}</h4>
                                                    <span className="px-2 py-0.5 bg-white rounded text-xs font-bold">
                                                        {alert.alertType.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm mb-2">{alert.recommendedAction}</p>
                                                <div className="text-xs opacity-75">
                                                    Current Stock: <span className="font-bold">{alert.currentStock}</span>
                                                    {alert.suggestedOrderQty && (
                                                        <> • Suggested Order: <span className="font-bold">{alert.suggestedOrderQty} units</span></>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                                    className="px-3 py-1 bg-white rounded text-xs font-bold hover:bg-gray-100 transition-colors"
                                                >
                                                    Acknowledge
                                                </button>
                                                <button
                                                    onClick={() => handleResolveAlert(alert.id)}
                                                    className="px-3 py-1 bg-white rounded text-xs font-bold hover:bg-gray-100 transition-colors"
                                                >
                                                    Resolve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
