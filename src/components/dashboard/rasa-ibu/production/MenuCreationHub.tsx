'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, FileText, DollarSign, Save, ArrowLeft, Info, RefreshCw } from 'lucide-react';
import { getRecipesAction } from '@/lib/actions/rasa-ibu/production';
import { getStockAction } from '@/lib/actions/rasa-ibu/stock';
import { createMenuFromRecipeAction, createMenuManualAction } from '@/lib/actions/rasa-ibu/menu';
import { getPricingDataAction } from '@/lib/actions/rasa-ibu/overhead';
import PricingCalculator from './PricingCalculator';
import { toast } from 'sonner';

interface MenuCreationHubProps {
    brandId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MenuCreationHub({ brandId, onClose, onSuccess }: MenuCreationHubProps) {
    const [path, setPath] = useState<'recipe' | 'manual' | null>(null);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPricing, setIsLoadingPricing] = useState(false);

    // Pricing data from Financial Hub
    const [pricingData, setPricingData] = useState<any>(null);

    // Form data
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [manualHPP, setManualHPP] = useState(0);
    const [operationalCost, setOperationalCost] = useState(2000);
    const [marketplaceFee, setMarketplaceFee] = useState(0.15); // 15%
    const [targetMargin, setTargetMargin] = useState(0.30); // 30%

    // Calculated HPP from recipe
    const [calculatedHPP, setCalculatedHPP] = useState(0);

    useEffect(() => {
        loadData();
        loadPricingData();
    }, [brandId]);

    const loadPricingData = async () => {
        setIsLoadingPricing(true);
        const res = await getPricingDataAction(brandId);
        if (res.success && res.data) {
            setPricingData(res.data);
            // Auto-fill from Financial Hub data
            setOperationalCost(Math.round(res.data.operationalCost?.operationalCostPerUnit || 2000));
            setMarketplaceFee(res.data.marketplaceFee?.feeRate || 0.15);
            setTargetMargin(res.data.targetMargin || 0.30);
        }
        setIsLoadingPricing(false);
    };

    useEffect(() => {
        if (path === 'recipe' && selectedRecipeId) {
            calculateHPPFromRecipe(selectedRecipeId);
        }
    }, [selectedRecipeId]);

    const loadData = async () => {
        setIsLoading(true);
        const [recipesRes, stockRes] = await Promise.all([
            getRecipesAction(brandId),
            getStockAction(brandId)
        ]);

        if (recipesRes.success) setRecipes(recipesRes.data);
        if (stockRes.success) {
            const finished = stockRes.data.filter((v: any) => v.product.inventoryType === 'FINISHED_GOOD');
            setFinishedGoods(finished);
        }
        setIsLoading(false);
    };

    const calculateHPPFromRecipe = (recipeId: string) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        let totalCost = 0;
        recipe.items.forEach((item: any) => {
            const costPrice = Number(item.ingredient.costPrice) || 0;
            const quantity = Number(item.quantity) || 0;
            totalCost += costPrice * quantity;
        });

        const hppPerUnit = recipe.outputQuantity > 0 ? totalCost / recipe.outputQuantity : totalCost;
        setCalculatedHPP(hppPerUnit);
    };

    const handleSave = async () => {
        if (path === 'recipe') {
            if (!selectedRecipeId) {
                toast.error('Pilih resep terlebih dahulu');
                return;
            }

            setIsSaving(true);
            const res = await createMenuFromRecipeAction({
                brandId,
                recipeId: selectedRecipeId,
                operationalCostPerUnit: operationalCost,
                marketplaceFeeRate: marketplaceFee,
                targetMargin
            });

            if (res.success) {
                toast.success('Menu berhasil dibuat dari resep!');
                onSuccess();
                onClose();
            } else {
                toast.error('Gagal membuat menu: ' + res.error);
            }
            setIsSaving(false);
        } else if (path === 'manual') {
            if (!selectedVariantId) {
                toast.error('Pilih produk terlebih dahulu');
                return;
            }

            setIsSaving(true);
            const res = await createMenuManualAction({
                brandId,
                variantId: selectedVariantId,
                hpp: manualHPP,
                operationalCostPerUnit: operationalCost,
                marketplaceFeeRate: marketplaceFee,
                targetMargin
            });

            if (res.success) {
                toast.success('Menu berhasil dibuat dengan pricing manual!');
                onSuccess();
                onClose();
            } else {
                toast.error('Gagal membuat menu: ' + res.error);
            }
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!path) {
        return (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-[#2D3A2D]">Buat Menu Baru</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Pilih metode pembuatan menu</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Path 1: From Recipe */}
                    <button
                        onClick={() => setPath('recipe')}
                        className="group p-8 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-[2rem] transition-all active:scale-95"
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className="p-5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <ChefHat className="w-10 h-10" />
                            </div>
                            <div className="space-y-1 text-center">
                                <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Dari Resep</h4>
                                <p className="text-xs text-emerald-700 font-medium">HPP dihitung otomatis dari bahan baku</p>
                            </div>
                            <div className="pt-4 space-y-1">
                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Akurat & Konsisten
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Tracking Bahan Baku
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Path 2: Manual */}
                    <button
                        onClick={() => setPath('manual')}
                        className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-[2rem] transition-all active:scale-95"
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className="p-5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <FileText className="w-10 h-10" />
                            </div>
                            <div className="space-y-1 text-center">
                                <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Manual</h4>
                                <p className="text-xs text-blue-700 font-medium">Input HPP manual tanpa resep</p>
                            </div>
                            <div className="pt-4 space-y-1">
                                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    Cepat & Fleksibel
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    Untuk Menu Sederhana
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setPath(null)}
                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-[#2D3A2D]">
                            {path === 'recipe' ? 'Buat Menu dari Resep' : 'Buat Menu Manual'}
                        </h3>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                            {path === 'recipe' ? 'HPP otomatis dari bahan baku' : 'Input HPP manual'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Left: Form */}
                <div className="space-y-6">
                    {path === 'recipe' ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-900 uppercase">Pilih Resep</label>
                            <select
                                value={selectedRecipeId}
                                onChange={e => setSelectedRecipeId(e.target.value)}
                                className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">-- Pilih Resep --</option>
                                {recipes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.outputQuantity} porsi)</option>
                                ))}
                            </select>
                            {selectedRecipeId && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800 uppercase tracking-tighter">
                                        <span>Modal Bahan (Resep)</span>
                                        <span>Rp {calculatedHPP.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800 uppercase tracking-tighter">
                                        <span>Alokasi Operasional</span>
                                        <span>+ Rp {operationalCost.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="h-px bg-emerald-200/50" />
                                    <div className="flex justify-between items-center font-black">
                                        <span className="text-[11px] text-emerald-900">TOTAL MODAL DASAR</span>
                                        <span className="text-sm text-emerald-900">Rp {(calculatedHPP + operationalCost).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-900 uppercase">Pilih Produk</label>
                                <select
                                    value={selectedVariantId}
                                    onChange={e => setSelectedVariantId(e.target.value)}
                                    className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {finishedGoods.map(v => (
                                        <option key={v.id} value={v.id}>{v.product.name} - {v.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-900 uppercase">HPP Manual (Rp)</label>
                                <input
                                    type="number"
                                    value={manualHPP}
                                    onChange={e => setManualHPP(parseFloat(e.target.value) || 0)}
                                    className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="10000"
                                />
                                {manualHPP > 0 && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-blue-800 uppercase tracking-tighter">
                                            <span>Modal Bahan</span>
                                            <span>Rp {manualHPP.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-blue-800 uppercase tracking-tighter">
                                            <span>Alokasi Operasional</span>
                                            <span>+ Rp {operationalCost.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="h-px bg-blue-200/50" />
                                        <div className="flex justify-between items-center font-black">
                                            <span className="text-[11px] text-blue-900">TOTAL MODAL DASAR</span>
                                            <span className="text-sm text-blue-900">Rp {(manualHPP + operationalCost).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase">Biaya Operasional per Unit (Rp)</label>
                            <button
                                onClick={loadPricingData}
                                disabled={isLoadingPricing}
                                className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${isLoadingPricing ? 'animate-spin' : ''}`} />
                                Reload dari Financial Hub
                            </button>
                        </div>
                        <input
                            type="number"
                            value={operationalCost}
                            onChange={e => setOperationalCost(parseFloat(e.target.value) || 0)}
                            className="w-full p-4 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        {pricingData?.operationalCost && (
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-blue-900">Dihitung dari Financial Hub:</p>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-[9px] text-blue-700">Total Overhead:</span>
                                            <span className="text-[9px] font-bold text-blue-700">Rp {Math.round(pricingData.operationalCost.totalOverhead).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-[9px] text-blue-700">Target Volume:</span>
                                            <span className="text-[9px] font-bold text-blue-700">{pricingData.operationalCost.targetVolume} porsi/bulan</span>
                                        </div>
                                        <div className="h-px bg-blue-200 my-1" />
                                        <div className="flex justify-between gap-4">
                                            <span className="text-[9px] font-black text-blue-800">Biaya per Porsi:</span>
                                            <span className="text-[9px] font-black text-blue-800">Rp {Math.round(pricingData.operationalCost.operationalCostPerUnit).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase">Marketplace Fee (%)</label>
                            <input
                                type="number"
                                value={marketplaceFee * 100}
                                onChange={e => setMarketplaceFee((parseFloat(e.target.value) || 0) / 100)}
                                className="w-full p-4 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                step="0.1"
                            />
                            {pricingData?.marketplaceFee && (
                                <p className="text-[9px] text-blue-600 font-bold flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    {pricingData.marketplaceFee.platform === 'AVERAGE' ? 'Rata-rata' : pricingData.marketplaceFee.platform}: {pricingData.marketplaceFee.feePercentage.toFixed(1)}%
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase">Target Margin (%)</label>
                            <input
                                type="number"
                                value={targetMargin * 100}
                                onChange={e => setTargetMargin((parseFloat(e.target.value) || 0) / 100)}
                                className="w-full p-4 bg-white border border-[#E5E1D8] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || (path === 'recipe' ? !selectedRecipeId : !selectedVariantId)}
                        className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Menyimpan...' : 'Simpan Menu & Pricing'}
                    </button>
                </div>

                {/* Right: Pricing Calculator */}
                <div>
                    <PricingCalculator
                        hpp={path === 'recipe' ? calculatedHPP : manualHPP}
                        operationalCost={operationalCost}
                        marketplaceFeeRate={marketplaceFee}
                        targetMargin={targetMargin}
                    />
                </div>
            </div>
        </div>
    );
}
