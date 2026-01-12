'use client';

import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock, Calendar, Plus, ChevronRight, User, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { startProductionAction, completeProductionAction, createProductionPlanAction } from '@/lib/actions/rasa-ibu/production';
import QuantityModal from '@/components/ui/QuantityModal';

interface CookingListProps {
    brandId: string;
    plans: any[];
    recipes: any[];
    onRefresh: () => void;
}

export default function CookingList({ brandId, plans, recipes, onRefresh }: CookingListProps) {
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [newPlanDate, setNewPlanDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPlanItems, setNewPlanItems] = useState<{ recipeId: string; targetQuantity: number }[]>([
        { recipeId: '', targetQuantity: 0 }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; itemId: string; targetQuantity: number; unit: string; recipeName: string } | null>(null);

    const handleCreatePlan = async () => {
        const validItems = newPlanItems.filter(i => i.recipeId && i.targetQuantity > 0);
        if (validItems.length === 0) {
            toast.error('Mohon isi minimal satu menu dengan jumlah target yang valid.');
            return;
        }

        setIsLoading(true);
        const res = await createProductionPlanAction({
            brandId,
            date: new Date(newPlanDate),
            items: validItems
        });

        if (res.success) {
            setIsCreatingPlan(false);
            setNewPlanItems([{ recipeId: '', targetQuantity: 0 }]);
            onRefresh();
        } else {
            toast.error('Gagal membuat rencana: ' + res.error);
        }
        setIsLoading(false);
    };

    const updateItem = (index: number, field: keyof typeof newPlanItems[0], value: any) => {
        const updated = [...newPlanItems];
        updated[index] = { ...updated[index], [field]: value };
        setNewPlanItems(updated);
    };

    const addItem = () => {
        setNewPlanItems([...newPlanItems, { recipeId: '', targetQuantity: 0 }]);
    };

    const removeItem = (index: number) => {
        const updated = newPlanItems.filter((_, i) => i !== index);
        setNewPlanItems(updated);
    };

    const handleStart = async (itemId: string) => {
        const res = await startProductionAction(itemId);
        if (res.success) {
            onRefresh();
        } else {
            toast.error('Gagal memulai masak: ' + res.error);
        }
    };

    const handleComplete = async (itemId: string, targetQuantity: number, unit: string, recipeName: string) => {
        setCompletionModal({ isOpen: true, itemId, targetQuantity, unit, recipeName });
    };

    const confirmCompletion = async (actual: number) => {
        if (!completionModal) return;

        setIsLoading(true);
        const res = await completeProductionAction(completionModal.itemId, actual, 'SYSTEM_KITCHEN');
        setIsLoading(false);

        if (res.success) {
            toast.success(`Produksi ${completionModal.recipeName} berhasil diselesaikan!`);
            setCompletionModal(null);
            onRefresh();
        } else {
            toast.error('Gagal menyelesaikan produksi: ' + res.error);
        }
    };

    const activePlans = plans.filter(p => p.status !== 'CANCELLED');

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-[#2D3A2D]">Daftar Masak Hari Ini</h3>
                    <p className="text-xs text-slate-400 font-medium">Pantau dan selesaikan rencana produksi harian.</p>
                </div>
                {!isCreatingPlan && (
                    <button
                        onClick={() => setIsCreatingPlan(true)}
                        className="flex items-center gap-2 bg-[#2D3A2D] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#1A241A] transition-all"
                    >
                        <Plus className="w-4 h-4" /> Buat Rencana Baru
                    </button>
                )}
            </div>

            {isCreatingPlan ? (
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] space-y-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-lg font-black text-[#2D3A2D] uppercase tracking-wide">Rencana Produksi Baru</h4>
                            <p className="text-xs text-slate-400 font-bold">Tentukan menu yang akan dimasak hari ini.</p>
                        </div>
                        <input
                            type="date"
                            value={newPlanDate}
                            onChange={(e) => setNewPlanDate(e.target.value)}
                            className="bg-[#FDFBF7] border border-[#E5E1D8] px-4 py-2 rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#2D3A2D]/20"
                        />
                    </div>

                    <div className="space-y-4">
                        {newPlanItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66] mb-2 block">Menu Masakan</label>
                                    <select
                                        value={item.recipeId}
                                        onChange={(e) => updateItem(idx, 'recipeId', e.target.value)}
                                        className="w-full bg-white border border-[#E5E1D8] px-4 py-3 rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:border-[#2D3A2D]"
                                    >
                                        <option value="">Pilih Menu...</option>
                                        {recipes.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66] mb-2 block">
                                        Target ({recipes.find(r => r.id === item.recipeId)?.frozenVariant?.unit || 'pcs'})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.targetQuantity}
                                        onChange={(e) => updateItem(idx, 'targetQuantity', parseInt(e.target.value))}
                                        className="w-full bg-white border border-[#E5E1D8] px-4 py-3 rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:border-[#2D3A2D]"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    {newPlanItems.length > 1 && (
                                        <button onClick={() => removeItem(idx)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="w-full py-4 border-2 border-dashed border-[#E5E1D8] rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-[#2D3A2D] hover:text-[#2D3A2D] transition-all"
                    >
                        + Tambah Menu Lain
                    </button>

                    <div className="flex justify-end gap-4 pt-4 border-t border-[#E5E1D8]">
                        <button
                            onClick={() => setIsCreatingPlan(false)}
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCreatePlan}
                            disabled={isLoading}
                            className="px-8 py-4 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A241A] transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Rencana'}
                        </button>
                    </div>
                </div>
            ) : null}
            {/* Active Plans List */}
            <div className="space-y-6">
                {
                    activePlans.length === 0 ? (
                        <div className="py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                            <Calendar className="w-12 h-12 text-slate-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Belum ada rencana produksi hari ini.</p>
                        </div>
                    ) : (
                        activePlans.map((plan) => (
                            <div key={plan.id} className="bg-white rounded-[2.5rem] border border-[#E5E1D8] overflow-hidden shadow-sm">
                                <div className="px-8 py-5 bg-[#F9F7F2] border-b border-[#E5E1D8] flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-[#E5E1D8] flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">
                                                Rencana: {new Date(plan.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${plan.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {plan.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-50">
                                    {plan.items.map((item: any) => (
                                        <div key={item.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                                                    {item.recipe.name.charAt(0)}
                                                </div>
                                                <div className="space-y-1">
                                                    <h5 className="font-black text-[#2D3A2D] uppercase tracking-tight">{item.recipe.name}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400">Target: <span className="text-emerald-600">{item.targetQuantity} {item.recipe?.frozenVariant?.unit || 'pcs'}</span></p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {item.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handleStart(item.id)}
                                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <Play className="w-3 h-3" /> Mulai Masak
                                                    </button>
                                                )}
                                                {item.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => handleComplete(item.id, item.targetQuantity, item.recipe?.frozenVariant?.unit || 'pcs', item.recipe.name)}
                                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" /> Selesai
                                                    </button>
                                                )}
                                                {item.status === 'COMPLETED' && (
                                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Selesai ({item.actualQuantity} {item.recipe?.frozenVariant?.unit || 'pcs'})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )
                }
            </div >

            {completionModal && (
                <QuantityModal
                    isOpen={completionModal.isOpen}
                    onClose={() => setCompletionModal(null)}
                    onConfirm={confirmCompletion}
                    title="Konfirmasi Hasil Masak"
                    description={`Berapa jumlah aktual ${completionModal.recipeName} yang berhasil dimasak hari ini?`}
                    defaultValue={completionModal.targetQuantity}
                    unit={completionModal.unit}
                />
            )}
        </div >
    );
}
