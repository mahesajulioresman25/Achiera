'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { GripVertical, Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import {
    getHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    toggleHeroSlideStatus
} from '@/lib/actions/rasa-ibu/hero-slides';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    ctaLabel: string | null;
    ctaLink: string | null;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl: string | null;
    videoUrl: string | null;
    isActive: boolean;
    sortOrder: number;
}

interface HeroSliderManagerProps {
    brandId: string;
}

export default function HeroSliderManager({ brandId }: HeroSliderManagerProps) {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const confirm = useConfirm();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        ctaLabel: '',
        ctaLink: '',
        mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
        imageUrl: '',
        videoUrl: '',
        tagline: '',
        isActive: true
    });

    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        setIsLoading(true);
        const result = await getHeroSlides(brandId);
        if (result.success && result.slides) {
            setSlides(result.slides as HeroSlide[]);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSlide) {
            // Update existing slide
            const result = await updateHeroSlide(editingSlide.id, formData);
            if (result.success) {
                toast.success('Hero slide berhasil diupdate!');
                loadSlides();
                resetForm();
            } else {
                toast.error(result.error || 'Gagal update slide');
            }
        } else {
            // Create new slide
            const result = await createHeroSlide({
                brandId,
                ...formData
            });
            if (result.success) {
                toast.success('Hero slide berhasil ditambahkan!');
                loadSlides();
                resetForm();
            } else {
                toast.error(result.error || 'Gagal menambahkan slide');
            }
        }
    };

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle,
            ctaLabel: slide.ctaLabel || '',
            ctaLink: slide.ctaLink || '',
            mediaType: slide.mediaType,
            imageUrl: slide.imageUrl || '',
            videoUrl: slide.videoUrl || '',
            tagline: (slide as any).tagline || '',
            isActive: slide.isActive
        });
        setImagePreview(slide.imageUrl || '');
        setShowForm(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran gambar maksimal 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setFormData({ ...formData, imageUrl: base64 });
            setImagePreview(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Slide?',
            message: 'Slide banner ini akan dihapus secara permanen dari beranda. Lanjutkan?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        const result = await deleteHeroSlide(id);
        if (result.success) {
            toast.success('Slide berhasil dihapus!');
            loadSlides();
        } else {
            toast.error(result.error || 'Gagal menghapus slide');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleHeroSlideStatus(id, !currentStatus);
        if (result.success) {
            toast.success(`Slide ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
            loadSlides();
        } else {
            toast.error(result.error || 'Gagal mengubah status');
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newSlides = [...slides];
        const draggedSlide = newSlides[draggedIndex];
        newSlides.splice(draggedIndex, 1);
        newSlides.splice(index, 0, draggedSlide);

        setSlides(newSlides);
        setDraggedIndex(index);
    };

    const handleDragEnd = async () => {
        if (draggedIndex === null) return;

        const slideIds = slides.map(s => s.id);
        const result = await reorderHeroSlides(slideIds);

        if (result.success) {
            toast.success('Urutan slide berhasil diupdate!');
            loadSlides();
        } else {
            toast.error(result.error || 'Gagal mengubah urutan');
            loadSlides(); // Reload to reset order
        }

        setDraggedIndex(null);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            ctaLabel: '',
            ctaLink: '',
            mediaType: 'IMAGE',
            imageUrl: '',
            videoUrl: '',
            tagline: '',
            isActive: true
        });
        setImagePreview('');
        setEditingSlide(null);
        setShowForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-[#2D3A2D]">Hero Slider Management</h3>
                    <p className="text-sm text-slate-500">Kelola banner promosi di homepage (max 5 slides aktif)</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-[#2D3A2D] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Slide
                </button>
            </div>

            {/* Slides List */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : slides.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">Belum ada hero slide. Tambahkan slide pertama!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white border-2 rounded-2xl p-6 transition-all ${slide.isActive ? 'border-emerald-200' : 'border-slate-200 opacity-60'
                                } ${draggedIndex === index ? 'opacity-50' : ''} hover:shadow-md cursor-move`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Drag Handle */}
                                <div className="pt-2">
                                    <GripVertical className="w-5 h-5 text-slate-400" />
                                </div>

                                {/* Preview */}
                                <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {slide.mediaType === 'IMAGE' && slide.imageUrl ? (
                                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                                    ) : slide.mediaType === 'VIDEO' && slide.videoUrl ? (
                                        <video src={slide.videoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                            No Media
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-[#2D3A2D] truncate">{slide.title}</h4>
                                            <p className="text-sm text-slate-600 line-clamp-2">{slide.subtitle}</p>
                                            {slide.ctaLabel && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    CTA: {slide.ctaLabel} → {slide.ctaLink}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                            <button
                                                onClick={() => handleToggleStatus(slide.id, slide.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${slide.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                title={slide.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {slide.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(slide)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slide.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8 space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-[#2D3A2D]">
                                    {editingSlide ? 'Edit Hero Slide' : 'Tambah Hero Slide'}
                                </h3>
                                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tagline (Kecil - Atas)</label>
                                    <input
                                        type="text"
                                        value={formData.tagline}
                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                        placeholder="Misal: HANGATNYA MEJA MAKAN"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Judul *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                        required
                                        placeholder="Promo Ramadan - Diskon 20%"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Subtitle *</label>
                                    <textarea
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                        rows={3}
                                        required
                                        placeholder="Nikmati diskon spesial untuk semua menu favorit"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">CTA Label</label>
                                        <input
                                            type="text"
                                            value={formData.ctaLabel}
                                            onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                            placeholder="Lihat Menu"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">CTA Link</label>
                                        <input
                                            type="text"
                                            value={formData.ctaLink}
                                            onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                            placeholder="/rasa-ibu/products"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Media Type *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="IMAGE"
                                                checked={formData.mediaType === 'IMAGE'}
                                                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">Image</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="VIDEO"
                                                checked={formData.mediaType === 'VIDEO'}
                                                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm font-medium">Video</span>
                                        </label>
                                    </div>
                                </div>

                                {formData.mediaType === 'IMAGE' ? (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Upload Gambar *</label>
                                        {imagePreview && (
                                            <div className="mb-3 relative">
                                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview('');
                                                        setFormData({ ...formData, imageUrl: '' });
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Max 2MB. Format: JPG, PNG, WebP</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Video URL</label>
                                        <input
                                            type="url"
                                            value={formData.videoUrl}
                                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                                            placeholder="https://example.com/video.mp4"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                                        Aktifkan slide ini
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-[#2D3A2D] text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                                    >
                                        {editingSlide ? 'Update Slide' : 'Tambah Slide'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
