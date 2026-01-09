'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/admin/FormField';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HeroEditorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroTagline: '',
        heroCtaLabel: '',
        heroCtaLink: '',
        highlightLine: '',
    });

    useEffect(() => {
        fetch('/api/admin/merch-settings')
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setFormData({
                        heroTitle: data.heroTitle || '',
                        heroSubtitle: data.heroSubtitle || '',
                        heroTagline: data.heroTagline || '',
                        heroCtaLabel: data.heroCtaLabel || '',
                        heroCtaLink: data.heroCtaLink || '',
                        highlightLine: data.highlightLine || '',
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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
            toast.success('Pengaturan berhasil disimpan!');
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
                    <h1 className="text-2xl font-bold text-stone-900">Hero & Highlight</h1>
                    <p className="text-stone-600">Manage the main landing page content</p>
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

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="border-b border-stone-100 pb-6">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Hero Section</h2>
                        <div className="grid gap-4">
                            <FormField
                                label="Headline"
                                name="heroTitle"
                                value={formData.heroTitle}
                                onChange={handleChange}
                                placeholder="e.g. Modern Brands Deserve Thoughtful Merchandise"
                            />
                            <FormField
                                label="Subheadline"
                                name="heroSubtitle"
                                value={formData.heroSubtitle}
                                onChange={handleChange}
                                isTextArea
                                placeholder="Brief description..."
                            />
                            <FormField
                                label="Tagline (Optional)"
                                name="heroTagline"
                                value={formData.heroTagline}
                                onChange={handleChange}
                                placeholder="e.g. Designed for teams. Crafted for brands."
                            />
                        </div>
                    </div>

                    <div className="border-b border-stone-100 pb-6">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Call to Action</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Button Label"
                                name="heroCtaLabel"
                                value={formData.heroCtaLabel}
                                onChange={handleChange}
                                placeholder="e.g. Request Catalogue"
                            />
                            <FormField
                                label="Button Link"
                                name="heroCtaLink"
                                value={formData.heroCtaLink}
                                onChange={handleChange}
                                placeholder="e.g. /contact"
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Highlight Section</h2>
                        <FormField
                            label="Highlight Line"
                            name="highlightLine"
                            value={formData.highlightLine}
                            onChange={handleChange}
                            placeholder="Text appearing below the hero section"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
