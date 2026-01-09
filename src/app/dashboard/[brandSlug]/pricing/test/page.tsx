'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Calculator, AlertCircle } from 'lucide-react';

export default function PricingTestPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug } = resolvedParams;

    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState('');
    const [qty, setQty] = useState(10);
    const [printMethod, setPrintMethod] = useState<'none' | 'plastisol' | 'dtf' | 'heatpress'>('none');
    const [colors, setColors] = useState(1);
    const [size, setSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M');
    const [lengthMeter, setLengthMeter] = useState(1);

    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVariants();
    }, []);

    const fetchVariants = async () => {
        try {
            const res = await fetch('/api/public/mockup-template');
            if (res.ok) {
                const templates = await res.json();
                const allVariants = templates.flatMap((t: any) =>
                    t.variants?.map((v: any) => ({
                        id: v.id,
                        name: `${t.displayName} - ${v.name}`,
                        price: v.price
                    })) || []
                );
                setVariants(allVariants);
                if (allVariants.length > 0) {
                    setSelectedVariant(allVariants[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch variants:', error);
        }
    };

    const handleCalculate = async () => {
        if (!selectedVariant) {
            setError('Please select a variant');
            return;
        }

        setIsCalculating(true);
        setError('');
        setResult(null);

        try {
            const payload: any = {
                variantId: selectedVariant,
                qty,
                currency: 'IDR'
            };

            if (printMethod !== 'none') {
                payload.printing = {
                    method: printMethod,
                    ...(printMethod === 'plastisol' && { colors, size }),
                    ...(printMethod === 'dtf' && { lengthMeter })
                };
            }

            const res = await fetch('/api/pricing/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                const err = await res.json();
                setError(err.error || 'Calculation failed');
            }
        } catch (error: any) {
            setError(error.message || 'Network error');
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-stone-900">Pricing Test Sandbox</h1>
                <p className="text-stone-600 mt-1">Simulate orders and see live pricing calculations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-stone-900">Order Configuration</h2>

                    {/* Variant Selection */}
                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2">Product Variant</label>
                        <select
                            value={selectedVariant}
                            onChange={(e) => setSelectedVariant(e.target.value)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            {variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name} (Rp {Number(v.price).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>

                    {/* Print Method */}
                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2">Printing Method</label>
                        <select
                            value={printMethod}
                            onChange={(e) => setPrintMethod(e.target.value as any)}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            <option value="none">No Printing</option>
                            <option value="plastisol">Plastisol</option>
                            <option value="dtf">DTF (Direct-to-Film)</option>
                            <option value="heatpress">Heat Press</option>
                        </select>
                    </div>

                    {/* Plastisol Options */}
                    {printMethod === 'plastisol' && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-stone-900 mb-2">Number of Colors</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={colors}
                                    onChange={(e) => setColors(Number(e.target.value))}
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-stone-900 mb-2">Print Size</label>
                                <select
                                    value={size}
                                    onChange={(e) => setSize(e.target.value as any)}
                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="S">S (1.0x)</option>
                                    <option value="M">M (1.05x)</option>
                                    <option value="L">L (1.1x)</option>
                                    <option value="XL">XL (1.15x)</option>
                                    <option value="XXL">XXL (1.2x)</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* DTF Options */}
                    {printMethod === 'dtf' && (
                        <div>
                            <label className="block text-sm font-bold text-stone-900 mb-2">Length (Meters)</label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={lengthMeter}
                                onChange={(e) => setLengthMeter(Number(e.target.value))}
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Calculate Button */}
                    <button
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isCalculating ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Calculating...</>
                        ) : (
                            <><Calculator className="w-5 h-5" /> Calculate Price</>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">{error}</div>
                        </div>
                    )}
                </div>

                {/* Result Display */}
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-stone-900">Calculation Result</h2>

                    {!result && (
                        <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                            <Calculator className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm">Configure order and click Calculate</p>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Total */}
                            <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                                <div className="text-sm text-amber-800 font-medium mb-1">Total Price</div>
                                <div className="text-4xl font-bold text-amber-900">
                                    Rp {result.total.toLocaleString()}
                                </div>
                                {result.usedFallback && (
                                    <div className="mt-2 text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded inline-block">
                                        Using fallback (variant price)
                                    </div>
                                )}
                            </div>

                            {/* Breakdown */}
                            <div>
                                <h3 className="font-bold text-stone-900 mb-3">Price Breakdown</h3>
                                <div className="space-y-2">
                                    {result.breakdown.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-stone-900">{item.name}</div>
                                                <div className="text-xs text-stone-500">
                                                    {item.unit && `Rp ${Number(item.unit).toLocaleString()} × ${item.qty || 1}`}
                                                    {item.colors && ` × ${item.colors} colors`}
                                                </div>
                                            </div>
                                            <div className="font-bold text-stone-900">
                                                Rp {Number(item.amount).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Applied Rules */}
                            {result.appliedRules && result.appliedRules.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-stone-900 mb-3">Applied Rules</h3>
                                    <div className="space-y-2">
                                        {result.appliedRules.map((rule: any, idx: number) => (
                                            <div key={idx} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                                                <span className="font-mono text-blue-900">{rule.componentCode}</span>
                                                <span className="text-blue-600 mx-2">•</span>
                                                <span className="text-blue-700">{rule.scope}</span>
                                                <span className="text-blue-600 mx-2">•</span>
                                                <span className="text-blue-700">Priority {rule.priority}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
