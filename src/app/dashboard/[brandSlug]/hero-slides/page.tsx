'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl: string | null;
    videoUrl: string | null;
    ctaLabel: string | null;
    ctaLink: string | null;
    sortOrder: number;
    isActive: boolean;
}

export default function HeroSlidesPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
        imageUrl: '',
        videoUrl: '',
        ctaLabel: '',
        ctaLink: '',
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch('/api/admin/merch/hero-slides');
            if (res.ok) {
                const data = await res.json();
                setSlides(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admin/merch/hero-slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Create failed:', error);
                toast.error(`Error: ${error.error || 'Failed to create slide'}`);
                return;
            }

            setShowModal(false);
            resetForm();
            fetchSlides();
            toast.success('Slide created successfully!');
        } catch (error) {
            console.error('Error creating slide:', error);
            toast.error('Error creating slide. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlide) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/merch/hero-slides/${editingSlide.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    sortOrder: editingSlide.sortOrder
                })
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Update failed:', error);
                toast.error(`Error: ${error.error || 'Failed to update slide'}`);
                return;
            }

            setShowModal(false);
            setEditingSlide(null);
            resetForm();
            fetchSlides();
            toast.success('Slide updated successfully!');
        } catch (error) {
            console.error('Error updating slide:', error);
            toast.error('Error updating slide. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete slide "${title}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/admin/merch/hero-slides/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Delete failed:', error);
                toast.error(`Error: ${error.error || 'Failed to delete slide'}`);
                return;
            }

            fetchSlides();
            toast.success('Slide deleted successfully!');
        } catch (error) {
            console.error('Error deleting slide:', error);
            toast.error('Error deleting slide. Check console for details.');
        }
    };

    const toggleActive = async (slide: HeroSlide) => {
        try {
            const res = await fetch(`/api/admin/merch/hero-slides/${slide.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...slide,
                    isActive: !slide.isActive
                })
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Toggle failed:', error);
                toast.error(`Error: ${error.error || 'Failed to toggle slide'}`);
                return;
            }

            fetchSlides();
        } catch (error) {
            console.error('Error toggling slide:', error);
            toast.error('Error toggling slide. Check console for details.');
        }
    };

    const openEditModal = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle,
            mediaType: slide.mediaType,
            imageUrl: slide.imageUrl || '',
            videoUrl: slide.videoUrl || '',
            ctaLabel: slide.ctaLabel || '',
            ctaLink: slide.ctaLink || '',
            isActive: slide.isActive
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            mediaType: 'IMAGE',
            imageUrl: '',
            videoUrl: '',
            ctaLabel: '',
            ctaLink: '',
            isActive: true
        });
        setEditingSlide(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Hero Slides</h1>
                    <p className="text-stone-600">Manage hero slider for ACHIERA Merch</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Slide
                </button>
            </div>

            {slides.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
                    <p className="text-stone-600 mb-4">No slides yet</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                        Create your first slide
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="cursor-move text-stone-400 hover:text-stone-600">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold text-stone-900">
                                                {slide.title}
                                            </h3>
                                            <p className="text-sm text-stone-600">{slide.subtitle}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${slide.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-stone-100 text-stone-600'
                                                }`}>
                                                {slide.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                                {slide.mediaType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-stone-500 space-y-1">
                                        {slide.mediaType === 'IMAGE' && slide.imageUrl && (
                                            <p>Image: {slide.imageUrl}</p>
                                        )}
                                        {slide.mediaType === 'VIDEO' && slide.videoUrl && (
                                            <p>Video: {slide.videoUrl}</p>
                                        )}
                                        {slide.ctaLabel && (
                                            <p>CTA: {slide.ctaLabel} → {slide.ctaLink}</p>
                                        )}
                                        <p>Order: {slide.sortOrder}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleActive(slide)}
                                        className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                        title={slide.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(slide)}
                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slide.id, slide.title)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-stone-900 mb-4">
                            {editingSlide ? 'Edit Slide' : 'Create Slide'}
                        </h2>
                        <form onSubmit={editingSlide ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Subtitle
                                </label>
                                <textarea
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    rows={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Media Type
                                </label>
                                <select
                                    value={formData.mediaType}
                                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                    <option value="IMAGE">Image</option>
                                    <option value="VIDEO">Video</option>
                                </select>
                            </div>

                            {formData.mediaType === 'IMAGE' && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {formData.mediaType === 'VIDEO' && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">
                                        Video URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">
                                        CTA Label (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ctaLabel}
                                        onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="e.g. Learn More"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">
                                        CTA Link (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ctaLink}
                                        onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="/collections"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-stone-700">
                                    Active (show on public page)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingSlide ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
