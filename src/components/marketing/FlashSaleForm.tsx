import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ChevronLeft, X, Plus } from 'lucide-react';
import ProductSelector from './ProductSelector';


interface FlashSaleFormProps {
    brandId: string;
    initialData?: any;
    onSuccess?: () => void;
}

export default function FlashSaleForm({ brandId, initialData, onSuccess }: FlashSaleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Simple state form for speed (can upgrade to zod later)
    const [formData, setFormData] = useState({
        id: initialData?.id || '',
        name: initialData?.name || '',
        // description removed as per schema
        discountPercentage: initialData?.discountPercentage || 0,
        startTime: initialData?.startTime || '12:00',
        endTime: initialData?.endTime || '13:00',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        minPurchaseAmount: initialData?.minPurchaseAmount || 0,
        targetType: initialData?.targetType || 'ALL',
        targetIds: initialData?.targetIds || [],
        isActive: initialData?.isActive ?? true,
    });

    const [targetMeta, setTargetMeta] = useState<Record<string, string>>({});


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                discountPercentage: Number(formData.discountPercentage) || 0,
                minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
                id: initialData?.id // Include ID if updating
            };

            console.log('[FlashSaleForm] Sending payload:', payload);

            const res = await fetch(`/api/brands/${brandId}/flash-sale`, {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Failed to save');

            toast.success('Flash Sale updated');
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Gagal menyimpan konfigurasi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Nama Campaign</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label className="text-orange-900 font-bold">Cakupan Flash Sale</Label>
                    <div className="relative">
                        <select
                            value={formData.targetType}
                            onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border-[#E5E1D8] bg-white text-sm focus:ring-2 focus:ring-orange-500 appearance-none shadow-sm"
                        >
                            <option value="ALL">Semua Produk (Seluruh Toko)</option>
                            <option value="CATEGORY">Kategori Spesifik</option>
                            <option value="SPECIFIC">Produk Tertentu Sahaja</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-stone-400">
                            <ChevronLeft className="w-4 h-4 rotate-[270deg]" />
                        </div>
                    </div>
                </div>

                {formData.targetType === 'SPECIFIC' && (
                    <div className="col-span-1 md:col-span-2 space-y-4 bg-orange-50/30 p-4 rounded-2xl border border-orange-100">
                        <Label className="text-orange-800 font-bold">Pilih Produk (Dumped Flash Sale)</Label>

                        <ProductSelector
                            brandId={brandId}
                            onSelect={(product) => {
                                if (!formData.targetIds.includes(product.id)) {
                                    setFormData({
                                        ...formData,
                                        targetIds: [...formData.targetIds, product.id]
                                    });
                                    // Also meta storage for names
                                    setTargetMeta({
                                        ...targetMeta,
                                        [product.id]: product.name
                                    });
                                }
                            }}
                            placeholder="Cari & Pilih Produk..."
                        />

                        {/* Selected Products List */}
                        <div className="flex flex-wrap gap-2">
                            {formData.targetIds.map(id => (
                                <div key={id} className="flex items-center gap-2 bg-white border border-orange-200 px-3 py-1.5 rounded-full shadow-sm animate-in fade-in zoom-in-95">
                                    <span className="text-xs font-bold text-orange-700">{targetMeta[id] || id}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            targetIds: formData.targetIds.filter(i => i !== id)
                                        })}
                                        className="text-orange-400 hover:text-orange-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {formData.targetIds.length === 0 && (
                                <p className="text-xs text-orange-400 italic">Belum ada produk dipilih.</p>
                            )}
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Diskon (%)</Label>
                    <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Min. Belanja</Label>
                    <Input
                        type="number"
                        value={formData.minPurchaseAmount}
                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            className="flex-1"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            type="time"
                            className="w-32"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            className="flex-1"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                        />
                        <Input
                            type="time"
                            className="w-32"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={formData.isActive}
                        onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                    />
                    <span className="text-sm font-bold">{formData.isActive ? 'AKTIF' : 'NON-AKTIF'}</span>
                </div>

                <div className="flex-1"></div>

                <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </Button>
            </div>

        </form>
    );
}
