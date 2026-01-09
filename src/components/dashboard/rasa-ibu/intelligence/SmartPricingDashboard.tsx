'use client';

import React, { useEffect, useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Check,
    CheckCircle2,
    X,
    History,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getPriceRecommendations,
    applyPriceChange,
    getPriceHistory
} from '@/lib/actions/rasa-ibu/businessIntelligence';

interface SmartPricingDashboardProps {
    brandId: string;
    onClose?: () => void;
}

export default function SmartPricingDashboard({ brandId, onClose }: SmartPricingDashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);

    const loadRecommendations = async () => {
        setIsLoading(true);
        const res = await getPriceRecommendations(brandId);
        if (res.success) {
            setRecommendations(res.data || []);
        }
        setIsLoading(false);
    };

    const loadHistory = async (variantId: string) => {
        const res = await getPriceHistory(variantId);
        if (res.success) {
            setPriceHistory(res.data || []);
        }
    };

    useEffect(() => {
        loadRecommendations();
    }, [brandId]);

    useEffect(() => {
        if (selectedVariant) {
            loadHistory(selectedVariant);
        }
    }, [selectedVariant]);

    const handleApplyPrice = async (variantId: string, newPrice: number, reason: string) => {
        const res = await applyPriceChange(variantId, newPrice, reason);
        if (res.success) {
            toast.success('Harga berhasil diupdate!');
            loadRecommendations();
        } else {
            toast.error(res.error || 'Gagal update harga');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Smart Pricing Optimizer</h2>
                        <p className="text-sm text-gray-500">AI-powered price recommendations</p>
                    </div>
                </div>
                <button
                    onClick={loadRecommendations}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Price Recommendations</h3>
                    {recommendations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                            <p className="font-semibold text-green-600">All Prices Optimal!</p>
                            <p className="text-sm">No price changes recommended at this time.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recommendations.map((rec, idx) => {
                                const isIncrease = rec.recommendedPrice > rec.currentPrice;
                                const changePercent = ((rec.recommendedPrice - rec.currentPrice) / rec.currentPrice) * 100;

                                return (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 mb-1">Product #{idx + 1}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Current:</span>
                                                        <span className="ml-2 font-bold">{formatCurrency(rec.currentPrice)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isIncrease ? (
                                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                                        )}
                                                        <span className={`font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                                            {isIncrease ? '+' : ''}{changePercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Recommended:</span>
                                                        <span className="ml-2 font-bold text-indigo-600">{formatCurrency(rec.recommendedPrice)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    💡 {rec.expectedImpact}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleApplyPrice(rec.variantId, rec.recommendedPrice, rec.reason)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Apply
                                                </button>
                                                <button
                                                    onClick={() => setSelectedVariant(rec.variantId)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors flex items-center gap-2"
                                                >
                                                    <History className="w-4 h-4" />
                                                    History
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Price History Modal */}
            {selectedVariant && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Price History</h3>
                            <button
                                onClick={() => setSelectedVariant(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {priceHistory.map((h, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">
                                            {formatCurrency(Number(h.oldPrice))} → {formatCurrency(Number(h.newPrice))}
                                        </div>
                                        <div className="text-xs text-gray-500">{h.reason}</div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(h.effectiveFrom).toLocaleDateString('id-ID')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">How Smart Pricing Works:</p>
                        <ul className="space-y-1 text-xs">
                            <li>• <strong>Premium Pricing:</strong> Low stock + High demand → +15% price</li>
                            <li>• <strong>Clearance:</strong> Overstock → -15% price to move inventory</li>
                            <li>• <strong>Margin Protection:</strong> Ensure minimum 35% markup</li>
                            <li>• <strong>Auto-Cap:</strong> Price changes limited to ±20% for safety</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
