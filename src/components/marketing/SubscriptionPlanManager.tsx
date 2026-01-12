'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';

import { getFrozenProducts } from '@/lib/actions/rasa-ibu/catalog';

interface PlanProduct {
    variantId: string;
    subscriptionPrice: number;
    quantity: number;
    variant?: {
        id: string;
        name: string;
        product: {
            name: string;
        }
    };
}

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'WEEKLY' | 'MONTHLY';
    type: 'FIXED' | 'CUSTOMIZABLE';
    limitItems: number | null;
    features: string[];
    isActive: boolean;
    isScheduleFlexible: boolean;
    planProducts: PlanProduct[];
}

export default function SubscriptionPlanManager({ brandId, onClose }: { brandId: string, onClose: () => void }) {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan>>({});
    const [availableVariants, setAvailableVariants] = useState<any[]>([]);

    useEffect(() => {
        fetchPlans();
        loadAvailableVariants();
    }, [brandId]);

    const loadAvailableVariants = async () => {
        const res = await getFrozenProducts(brandId);
        if (res.success) {
            const variants = res.data.flatMap((p: any) =>
                p.variants.map((v: any) => ({
                    ...v,
                    productName: p.name
                }))
            );
            setAvailableVariants(variants);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch(`/api/brands/${brandId}/subscription-plans`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPlans(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data paket");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('[SubscriptionPlanManager] Saving plan:', editingPlan);

            const res = await fetch(`/api/brands/${brandId}/subscription-plans`, {
                method: editingPlan.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingPlan, brandId })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('[SubscriptionPlanManager] Error response:', errorData);
                throw new Error(errorData.error || "Failed to save");
            }

            toast.success("Paket berhasil disimpan");
            setIsEditing(false);
            setEditingPlan({});
            fetchPlans();
        } catch (error) {
            toast.error("Gagal menyimpan paket");
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(editingPlan.features || [])];
        newFeatures[index] = value;
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    const addFeature = () => {
        setEditingPlan({ ...editingPlan, features: [...(editingPlan.features || []), ""] });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(editingPlan.features || [])];
        newFeatures.splice(index, 1);
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    if (isEditing) {
        return (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">{editingPlan.id ? 'Edit Paket' : 'Buat Paket Baru'}</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Nama Paket</Label>
                        <Input
                            value={editingPlan.name || ''}
                            onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                            placeholder="Contoh: Paket Rantau (Mingguan)"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Harga (Rp)</Label>
                            <Input
                                type="number"
                                value={editingPlan.price || ''}
                                onChange={e => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Interval</Label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={editingPlan.interval || 'WEEKLY'}
                                onChange={e => setEditingPlan({ ...editingPlan, interval: e.target.value as any })}
                            >
                                <option value="WEEKLY">Mingguan</option>
                                <option value="MONTHLY">Bulanan</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Deskripsi Singkat</Label>
                        <Textarea
                            value={editingPlan.description || ''}
                            onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fitur / Benefit</Label>
                        {editingPlan.features?.map((feat, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <Input
                                    value={feat}
                                    onChange={e => handleFeatureChange(idx, e.target.value)}
                                    placeholder="Contoh: Gratis Ongkir"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(idx)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                            <Plus className="w-4 h-4 mr-2" /> Tambah Fitur
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipe Paket</Label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                value={editingPlan.type || 'FIXED'}
                                onChange={e => setEditingPlan({ ...editingPlan, type: e.target.value as any })}
                            >
                                <option value="FIXED">Tetap (Fixed Menu)</option>
                                <option value="CUSTOMIZABLE">Bebas Pilih (Customizable)</option>
                            </select>
                        </div>
                        {editingPlan.type === 'CUSTOMIZABLE' && (
                            <div className="space-y-2">
                                <Label>Limit Item</Label>
                                <Input
                                    type="number"
                                    value={editingPlan.limitItems || ''}
                                    onChange={e => setEditingPlan({ ...editingPlan, limitItems: parseInt(e.target.value) })}
                                    placeholder="Contoh: 5"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-bold">Produk Tersedia dlm Paket</Label>
                            <div className="flex gap-2">
                                <select
                                    className="h-8 text-xs rounded border border-gray-300 px-2"
                                    onChange={(e) => {
                                        const variantId = e.target.value;
                                        if (!variantId) return;
                                        const variant = availableVariants.find(v => v.id === variantId);
                                        const currentPlanProducts = editingPlan.planProducts || [];
                                        if (currentPlanProducts.find(p => p.variantId === variantId)) return;

                                        setEditingPlan({
                                            ...editingPlan,
                                            planProducts: [...currentPlanProducts, {
                                                variantId,
                                                subscriptionPrice: variant.price,
                                                quantity: 1,
                                                variant: {
                                                    id: variantId,
                                                    name: variant.name,
                                                    product: { name: variant.productName }
                                                }
                                            }]
                                        });
                                    }}
                                    value=""
                                >
                                    <option value="">+ Tambah Produk</option>
                                    {availableVariants.map(v => (
                                        <option key={v.id} value={v.id}>{v.productName} - {v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {editingPlan.planProducts?.map((pp, idx) => (
                                <div key={pp.variantId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                                    <div className="flex-1">
                                        <div className="font-medium">{pp.variant?.product?.name || 'Produk Tidak Ditemukan'}</div>
                                        <div className="text-xs text-gray-500">{pp.variant?.name}</div>
                                    </div>
                                    <div className="w-24">
                                        <Label className="text-[10px] uppercase text-gray-400">Harga Sub</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs font-bold"
                                            value={pp.subscriptionPrice}
                                            onChange={e => {
                                                const newPP = [...(editingPlan.planProducts || [])];
                                                newPP[idx].subscriptionPrice = parseFloat(e.target.value);
                                                setEditingPlan({ ...editingPlan, planProducts: newPP });
                                            }}
                                        />
                                    </div>
                                    <div className="w-16">
                                        <Label className="text-[10px] uppercase text-gray-400">Qty</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs font-bold"
                                            value={pp.quantity}
                                            onChange={e => {
                                                const newPP = [...(editingPlan.planProducts || [])];
                                                newPP[idx].quantity = parseInt(e.target.value);
                                                setEditingPlan({ ...editingPlan, planProducts: newPP });
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const newPP = [...(editingPlan.planProducts || [])];
                                            newPP.splice(idx, 1);
                                            setEditingPlan({ ...editingPlan, planProducts: newPP });
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                            {(!editingPlan.planProducts || editingPlan.planProducts.length === 0) && (
                                <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg text-xs">
                                    Belum ada produk dlm paket ini.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6 border-t pt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editingPlan.isActive ?? true}
                                onCheckedChange={c => setEditingPlan({ ...editingPlan, isActive: c })}
                            />
                            <span className="text-sm font-medium">{editingPlan.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span>
                        </div>

                        <div className="flex items-center gap-2 border-l pl-6">
                            <Switch
                                checked={editingPlan.isScheduleFlexible ?? true}
                                onCheckedChange={c => setEditingPlan({ ...editingPlan, isScheduleFlexible: c })}
                            />
                            <div>
                                <div className="text-sm font-medium">Jadwal Fleksibel</div>
                                <div className="text-[10px] text-gray-400 leading-tight">Customer bisa pilih hari & jam</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#1A241A]">Subscription Config</h1>
                    <p className="text-[#8B7E66]">Atur paket langganan mingguan/bulanan.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>Kembali</Button>
                    <Button onClick={() => {
                        setEditingPlan({
                            name: '',
                            description: '',
                            price: 0,
                            interval: 'WEEKLY',
                            type: 'FIXED',
                            isActive: true,
                            isScheduleFlexible: true,
                            features: [],
                            planProducts: []
                        });
                        setIsEditing(true);
                    }} className="bg-[#2D3A2D]">
                        <Plus className="w-4 h-4 mr-2" /> Buat Paket Baru
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className="border p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all relative">
                            <div className="absolute top-4 right-4">
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {plan.isActive ? 'AKTIF' : 'NON-AKTIF'}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                            <p className="text-2xl font-black text-[#2D3A2D] mb-4">
                                Rp {plan.price.toLocaleString()}
                                <span className="text-sm font-normal text-gray-500">/{plan.interval === 'WEEKLY' ? 'minggu' : 'bulan'}</span>
                            </p>

                            <p className="text-sm text-gray-600 mb-2 h-10 line-clamp-2">{plan.description}</p>

                            <div className="mb-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Tipe: </span>
                                <span className="text-xs font-semibold text-blue-600">
                                    {plan.type === 'FIXED' ? 'Menu Tetap' : `Bebas Pilih (Limit ${plan.limitItems})`}
                                </span>
                                <div className="mt-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Jadwal: </span>
                                    <span className={`text-[10px] font-bold ${plan.isScheduleFlexible ? 'text-green-600' : 'text-amber-600'}`}>
                                        {plan.isScheduleFlexible ? 'FLEKSIBEL' : 'FIXED BY RASA IBU'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                {(plan.features as string[])?.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" /> {f}
                                    </div>
                                ))}
                                {plan.planProducts?.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-dashed">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Produk dlm Paket:</div>
                                        {plan.planProducts.slice(0, 3).map((pp, i) => (
                                            <div key={i} className="text-[10px] text-gray-500 truncate">
                                                • {pp.quantity}x {pp.variant?.product?.name || 'Produk'}
                                            </div>
                                        ))}
                                        {plan.planProducts.length > 3 && (
                                            <div className="text-[10px] text-blue-500 font-medium">+{plan.planProducts.length - 3} produk lainnya</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button variant="outline" className="w-full" onClick={() => { setEditingPlan(plan); setIsEditing(true); }}>
                                <Edit className="w-4 h-4 mr-2" /> Edit Paket
                            </Button>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">Belum ada paket langganan.</div>
                    )}
                </div>
            )}
        </div>
    );
}
