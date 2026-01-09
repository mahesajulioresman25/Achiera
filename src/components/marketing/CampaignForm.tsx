'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface CampaignFormProps {
    brandId: string;
    initialData?: any;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CampaignForm({ brandId, initialData, onCancel, onSuccess }: CampaignFormProps) {
    const [loading, setLoading] = useState(false);

    // Simple state form
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        isActive: initialData?.isActive ?? false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns`, {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    id: initialData?.id,
                    brandId
                })
            });

            console.log('[CampaignForm] Sending payload:', { ...formData, id: initialData?.id, brandId });

            const result = await res.json();

            if (!res.ok) {
                if (result.error?.includes('Unique constraint') && result.error?.includes('slug')) {
                    throw new Error('URL (Slug) sudah digunakan. Silakan gunakan URL lain.');
                }
                throw new Error(result.error || 'Failed to save');
            }

            toast.success('Campaign saved');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Gagal menyimpan campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border max-w-2xl mx-auto mt-6">
            <h2 className="text-2xl font-bold text-[#1A241A] mb-4">
                {initialData ? 'Edit Campaign' : 'Buat Campaign Baru'}
            </h2>

            <div className="space-y-2">
                <Label>Judul Campaign</Label>
                <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Contoh: Pahlawan Gizi 2024"
                />
            </div>

            <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    placeholder="pahlawan-gizi"
                />
            </div>

            <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ceritakan tentang campaign ini..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
                <Switch
                    checked={formData.isActive}
                    onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                />
                <span className="text-sm font-bold">{formData.isActive ? 'PUBLIK (AKTIF)' : 'DRAFT (NON-AKTIF)'}</span>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#2D3A2D] hover:bg-[#1A241A]">
                    {loading ? 'Menyimpan...' : 'Simpan Campaign'}
                </Button>
            </div>
        </form>
    );
}

