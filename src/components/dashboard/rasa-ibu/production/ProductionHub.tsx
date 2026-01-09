'use client';

import React, { useState, useEffect } from 'react';
import { X, ChefHat, BookOpen, BarChart3, Plus, Search, ChevronRight, Play, CheckCircle2, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { getRecipesAction, getProductionPlansAction } from '@/lib/actions/rasa-ibu/production';
import RecipeManager from './RecipeManager';
import CookingList from './CookingList';
import IngredientForecaster from './IngredientForecaster';
import MenuCreationHub from './MenuCreationHub';

interface ProductionHubProps {
    brandId: string;
    onClose: () => void;
}

export default function ProductionHub({ brandId, onClose }: ProductionHubProps) {
    const [activeTab, setActiveTab] = useState<'COOKING' | 'RECIPES' | 'FORECAST' | 'MENU'>('COOKING');
    const [recipes, setRecipes] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const [recipeRes, planRes] = await Promise.all([
            getRecipesAction(brandId),
            getProductionPlansAction(brandId)
        ]);

        if (recipeRes.success) setRecipes(recipeRes.data);
        if (planRes.success) setPlans(planRes.data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    return (
        <div className="flex flex-col h-full bg-[#FDFBF7] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">

            {/* Header */}
            <div className="px-12 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                        <ChefHat className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Kitchen Intelligence</span>
                        <h2 className="text-3xl font-black text-[#2D3A2D]">Pusat Produksi Dapur</h2>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-slate-400" />
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-[#E5E1D8] bg-[#F9F7F2]">
                <button
                    onClick={() => setActiveTab('COOKING')}
                    className={`flex-1 py-6 flex flex-col items-center justify-center gap-2 border-b-4 transition-colors ${activeTab === 'COOKING' ? 'border-emerald-600 bg-white' : 'border-transparent hover:bg-white/50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Play className={`w-4 h-4 ${activeTab === 'COOKING' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${activeTab === 'COOKING' ? 'text-[#2D3A2D]' : 'text-slate-400'}`}>Produksi Aktif</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('RECIPES')}
                    className={`flex-1 py-6 flex flex-col items-center justify-center gap-2 border-b-4 transition-colors ${activeTab === 'RECIPES' ? 'border-emerald-600 bg-white' : 'border-transparent hover:bg-white/50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className={`w-4 h-4 ${activeTab === 'RECIPES' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${activeTab === 'RECIPES' ? 'text-[#2D3A2D]' : 'text-slate-400'}`}>Katalog Resep</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('FORECAST')}
                    className={`flex-1 py-6 flex flex-col items-center justify-center gap-2 border-b-4 transition-colors ${activeTab === 'FORECAST' ? 'border-emerald-600 bg-white' : 'border-transparent hover:bg-white/50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 className={`w-4 h-4 ${activeTab === 'FORECAST' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${activeTab === 'FORECAST' ? 'text-[#2D3A2D]' : 'text-slate-400'}`}>Ramalan Bahan</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('MENU')}
                    className={`flex-1 py-6 flex flex-col items-center justify-center gap-2 border-b-4 transition-colors ${activeTab === 'MENU' ? 'border-emerald-600 bg-white' : 'border-transparent hover:bg-white/50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className={`w-4 h-4 ${activeTab === 'MENU' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${activeTab === 'MENU' ? 'text-[#2D3A2D]' : 'text-slate-400'}`}>Buat Menu</span>
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white p-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Menyiapkan Dapur...</p>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto">
                        {activeTab === 'COOKING' && (
                            <CookingList
                                brandId={brandId}
                                plans={plans}
                                recipes={recipes}
                                onRefresh={loadData}
                            />
                        )}
                        {activeTab === 'RECIPES' && (
                            <RecipeManager
                                brandId={brandId}
                                recipes={recipes}
                                onRefresh={loadData}
                            />
                        )}
                        {activeTab === 'FORECAST' && (
                            <IngredientForecaster
                                brandId={brandId}
                                plans={plans}
                            />
                        )}
                        {activeTab === 'MENU' && (
                            <MenuCreationHub
                                brandId={brandId}
                                onClose={() => setActiveTab('RECIPES')}
                                onSuccess={loadData}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Status Footer */}
            <div className="px-12 py-4 bg-[#FDFBF7] border-t border-[#E5E1D8] flex justify-between items-center opacity-70">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-[#8B7E66] uppercase">Kitchen Link Online</span>
                    </div>
                </div>
                <p className="text-[9px] font-medium text-[#8B7E66] italic">
                    "Produksi yang terencana adalah kunci efisiensi."
                </p>
            </div>
        </div>
    );
}
