'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import ProductSelector from './ProductSelector';

interface BundleFormProps {
    brandId: string;
    campaignId: string;
    initialData?: any;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function BundleForm({ brandId, campaignId, initialData, onCancel, onSuccess }: BundleFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price || 0,
        quota: initialData?.quota || 0,
        isActive: initialData?.isActive ?? true,
        items: initialData?.items?.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            name: item.variant?.product?.name || 'Unknown Item'
        })) || []
    });

    const handleAddItem = (variant: any) => {
        if (formData.items.find((i: any) => i.variantId === variant.id)) {
            toast.error('Item sudah ada dalam bundle');
            return;
        }

        setFormData({
            ...formData,
            items: [...formData.items, {
                variantId: variant.id,
                quantity: 1,
                name: variant.product.name + (variant.name !== 'Default' ? ` (${variant.name})` : '')
            }]
        });
        setSearchQuery('');
        setProducts([]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            toast.error('Bundle harus berisi minimal 1 item.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns/${campaignId}/bundles`, {
                method: initialData ? 'POST' : 'POST', // We use POST for both as upsert logic is in server action
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    id: initialData?.id
                })
            });

            if (!res.ok) throw new Error('Gagal menyimpan bundle');

            toast.success('Bundle berhasil disimpan');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nama Paket (Bundle)</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contoh: Paket Kenyang Keluarga"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Harga Paket (Rp)</Label>
                    <Input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Apa isi paket ini?"
                />
            </div>

            <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold">Isi Produk</Label>
                    <div className="relative w-64">
                        <ProductSelector
                            brandId={brandId}
                            onSelect={(product) => {
                                // Default to first variant or show selection? 
                                // Since Bundle needs specific variant, we might need to adjust ProductSelector or iterate variants here.
                                // For now, let's assume Bundle simply adds the main product or first variant as per current logic flow?
                                // Actually, current logic iterates `p.variants`. ProductSelector select `product`.

                                // Let's try to smart-add: Add all variants or prompt user? 
                                // To keep it simple and consistent: Add the first variant found.
                                if (product.variants && product.variants.length > 0) {
                                    handleAddItem({ ...product.variants[0], product: product });
                                } else {
                                    // Fallback if no variants loaded
                                    toast.error('Produk ini tidak memiliki varian.');
                                }
                            }}
                            placeholder="Cari produk..."
                        />
                    </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {formData.items.map((item, index) => (
                        <div key={item.variantId} className="flex items-center gap-3 bg-[#F9F7F2] p-3 rounded-xl border border-[#E5E1D8]">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#1A241A]">{item.name}</p>
                            </div>
                            <div className="w-20">
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => {
                                        const newItems = [...formData.items];
                                        newItems[index].quantity = Math.max(1, Number(e.target.value));
                                        setFormData({ ...formData, items: newItems });
                                    }}
                                    className="h-8 text-center"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-600"
                                onClick={() => handleRemoveItem(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {formData.items.length === 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm italic border-2 border-dashed rounded-xl">
                            Belum ada produk terpilih. Gunakan pencarian diatas.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#2D3A2D] hover:bg-[#1A241A]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Simpan Paket
                </Button>
            </div>
        </form>
    );
}
