'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import ImageUploadField from '@/components/admin/ImageUploadField';

export default function EditCollectionPage({
    params
}: {
    params: Promise<{ brandSlug: string; id: string }>;
}) {
    const { brandSlug, id } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        heroTitle: '',
        heroSubtitle: '',
        visibility: 'draft',
        coverImage: '',
    });

    useEffect(() => {
        fetchCollection();
    }, [id]);

    const fetchCollection = async () => {
        try {
            const res = await fetch(`/api/admin/collections/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    description: data.description || '',
                    heroTitle: data.heroTitle || '',
                    heroSubtitle: data.heroSubtitle || '',
                    visibility: data.visibility || 'draft',
                    coverImage: data.coverImage || '',
                });
            } else {
                toast.error('Failed to load collection');
                router.push(`/dashboard/${brandSlug}/collections`);
            }
        } catch (error) {
            console.error('Error fetching collection:', error);
            toast.error('Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/collections/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    brandSlug
                })
            });

            if (res.ok) {
                toast.success('Collection updated successfully');
                router.push(`/dashboard/${brandSlug}/collections`);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update collection');
            }
        } catch (error) {
            console.error('Update collection error:', error);
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/dashboard/${brandSlug}/collections`}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Edit Collection</h1>
                    <p className="text-stone-600">Update collection details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 md:p-8 space-y-8">

                {/* Basic Info */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-stone-900 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Collection Name <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="e.g. Summer Essentials"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <ImageUploadField
                                label="Cover Image"
                                description="Image for collection card/banner"
                                value={formData.coverImage}
                                onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Slug (URL) <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-600 focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                                    className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
                                    title="Regenerate Slug"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Description</label>
                        <textarea
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            rows={3}
                            placeholder="Brief description of this collection..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Hero / Display Info */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-stone-900 border-b pb-2">Display Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Hero Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="Displayed on banner"
                                value={formData.heroTitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Hero Subtitle</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="Displayed under title"
                                value={formData.heroSubtitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg">
                    <input
                        type="checkbox"
                        id="isPublished"
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                        checked={formData.visibility === 'published'}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            visibility: e.target.checked ? 'published' : 'draft'
                        }))}
                    />
                    <label htmlFor="isPublished" className="font-medium text-stone-900 cursor-pointer">
                        Publish Collection (Visible to public)
                    </label>
                    <span className="text-sm text-stone-500 ml-2">
                        {formData.visibility === 'published' ? '(Live)' : '(Hidden)'}
                    </span>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Changes
                    </button>
                </div>
            </form >
        </div >
    );
}
