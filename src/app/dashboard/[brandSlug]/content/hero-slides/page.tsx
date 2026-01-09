'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, Video, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface HeroSlide {
    id: string;
    title: string;
    subtitle: string;
    ctaLabel: string | null;
    ctaLink: string | null;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl: string | null;
    videoUrl: string | null;
    sortOrder: number;
    isActive: boolean;
}

export default function HeroSlidesPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const router = useRouter();
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchSlides();
    }, [brandSlug]);

    const fetchSlides = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/hero-slides`);
            const data = await res.json();
            // Ensure data is always an array
            setSlides(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch slides:', error);
            setSlides([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (slide: HeroSlide) => {
        try {
            await fetch(`/api/admin/${brandSlug}/hero-slides/${slide.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...slide, isActive: !slide.isActive }),
            });
            fetchSlides();
        } catch (error) {
            toast.error('Gagal memperbarui slide');
        }
    };

    const deleteSlide = async (id: string) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            await fetch(`/api/admin/${brandSlug}/hero-slides/${id}`, {
                method: 'DELETE',
            });
            fetchSlides();
        } catch (error) {
            toast.error('Gagal menghapus slide');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Hero Slides</h1>
                    <p className="text-stone-600">Manage hero slider content</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Slide
                </button>
            </div>

            {slides.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No slides yet</h3>
                    <p className="text-stone-600 mb-6">Create your first hero slide to get started</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Slide
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="cursor-move text-stone-400 hover:text-stone-600">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-stone-900 mb-1">{slide.title}</h3>
                                            <p className="text-sm text-stone-600">{slide.subtitle}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${slide.mediaType === 'IMAGE'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {slide.mediaType === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                                {slide.mediaType}
                                            </span>
                                            <button
                                                onClick={() => toggleActive(slide)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${slide.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-stone-100 text-stone-600'
                                                    }`}
                                            >
                                                {slide.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                {slide.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>
                                    </div>

                                    {slide.ctaLabel && (
                                        <div className="text-sm text-stone-600 mb-3">
                                            CTA: <span className="font-medium">{slide.ctaLabel}</span> → {slide.ctaLink}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {/* TODO: Edit modal */ }}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteSlide(slide.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Hero slider UI is ready! Add/edit modal and drag-and-drop reordering will be added in the next iteration.
                </p>
            </div>
        </div>
    );
}
