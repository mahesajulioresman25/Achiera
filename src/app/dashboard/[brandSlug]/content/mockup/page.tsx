'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/admin/FormField';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MockupEditorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        mockupTitle: '',
        mockupSubtitle: '',
        mockupTagline: '',
        mockupEnabled: true,
    });

    useEffect(() => {
        fetch('/api/admin/merch-settings')
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setFormData({
                        mockupTitle: data.mockupTitle || '',
                        mockupSubtitle: data.mockupSubtitle || '',
                        mockupTagline: data.mockupTagline || '',
                        mockupEnabled: data.mockupEnabled ?? true,
                    });
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch settings:', err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admin/merch-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update');

            router.refresh();
            toast.success('Pengaturan mockup berhasil disimpan!');
        } catch (error) {
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Try Live Mockup</h1>
                    <p className="text-stone-600">Configure the mockup builder section</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <input
                        type="checkbox"
                        id="mockupEnabled"
                        name="mockupEnabled"
                        checked={formData.mockupEnabled}
                        onChange={handleChange}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="mockupEnabled" className="text-sm font-medium text-stone-900">
                        Enable Try Live Mockup Section
                    </label>
                </div>

                <FormField
                    label="Section Title"
                    name="mockupTitle"
                    value={formData.mockupTitle}
                    onChange={handleChange}
                    placeholder="e.g. Try Live Mockup — See Your Brand Come to Life"
                />

                <FormField
                    label="Subtitle"
                    name="mockupSubtitle"
                    value={formData.mockupSubtitle}
                    onChange={handleChange}
                    isTextArea
                    placeholder="Brief description of the mockup feature..."
                />

                <FormField
                    label="Tagline"
                    name="mockupTagline"
                    value={formData.mockupTagline}
                    onChange={handleChange}
                    placeholder="e.g. Fast, accurate, and completely free to try."
                />
            </div>
        </div>
    );
}
