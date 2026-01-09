'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/admin/FormField';
import { Save, Loader2, ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface UseCase {
    title: string;
    description: string;
}

interface FAQ {
    question: string;
    answer: string;
}

export default function CollectionEditorPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        heroTitle: '',
        heroSubtitle: '',
        highlights: [] as string[],
        whatsInside: [] as string[],
        designOptions: [] as string[],
        materialPoints: [] as string[],
        useCases: [] as UseCase[],
        packagingOptions: [] as string[],
        faq: [] as FAQ[],
        galleryImages: [] as string[],
    });

    useEffect(() => {
        fetch(`/api/admin/collections/${params.slug}`)
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setFormData({
                        name: data.name || '',
                        heroTitle: data.heroTitle || '',
                        heroSubtitle: data.heroSubtitle || '',
                        highlights: Array.isArray(data.highlights) ? data.highlights : JSON.parse(data.highlights || '[]'),
                        whatsInside: Array.isArray(data.whatsInside) ? data.whatsInside : JSON.parse(data.whatsInside || '[]'),
                        designOptions: Array.isArray(data.designOptions) ? data.designOptions : JSON.parse(data.designOptions || '[]'),
                        materialPoints: Array.isArray(data.materialPoints) ? data.materialPoints : JSON.parse(data.materialPoints || '[]'),
                        useCases: Array.isArray(data.useCases) ? data.useCases : JSON.parse(data.useCases || '[]'),
                        packagingOptions: Array.isArray(data.packagingOptions) ? data.packagingOptions : JSON.parse(data.packagingOptions || '[]'),
                        faq: Array.isArray(data.faq) ? data.faq : JSON.parse(data.faq || '[]'),
                        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : JSON.parse(data.galleryImages || '[]'),
                    });
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch collection:', err);
                setLoading(false);
            });
    }, [params.slug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (field: keyof typeof formData, value: string) => {
        const items = value.split('\n').filter((item) => item.trim());
        setFormData((prev) => ({ ...prev, [field]: items }));
    };

    const addUseCase = () => {
        setFormData((prev) => ({
            ...prev,
            useCases: [...prev.useCases, { title: '', description: '' }],
        }));
    };

    const updateUseCase = (index: number, field: 'title' | 'description', value: string) => {
        setFormData((prev) => ({
            ...prev,
            useCases: prev.useCases.map((uc, i) => (i === index ? { ...uc, [field]: value } : uc)),
        }));
    };

    const removeUseCase = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            useCases: prev.useCases.filter((_, i) => i !== index),
        }));
    };

    const addFAQ = () => {
        setFormData((prev) => ({
            ...prev,
            faq: [...prev.faq, { question: '', answer: '' }],
        }));
    };

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        setFormData((prev) => ({
            ...prev,
            faq: prev.faq.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
        }));
    };

    const removeFAQ = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            faq: prev.faq.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/collections/${params.slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update');

            router.refresh();
            toast.success('Koleksi berhasil disimpan!');
        } catch (error) {
            toast.error('Gagal menyimpan koleksi');
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
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/collections"
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Edit Collection</h1>
                        <p className="text-stone-600">{formData.name}</p>
                    </div>
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

            {/* Form */}
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <FormField
                            label="Collection Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Hero Title"
                            name="heroTitle"
                            value={formData.heroTitle}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Hero Subtitle"
                            name="heroSubtitle"
                            value={formData.heroSubtitle}
                            onChange={handleChange}
                            isTextArea
                        />
                    </div>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Highlights</h2>
                    <FormField
                        label="Highlights (one per line)"
                        value={formData.highlights.join('\n')}
                        onChange={(e) => handleArrayChange('highlights', e.target.value)}
                        isTextArea
                        helperText="Enter each highlight on a new line"
                    />
                </div>

                {/* What's Inside */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">What's Inside</h2>
                    <FormField
                        label="Items (one per line)"
                        value={formData.whatsInside.join('\n')}
                        onChange={(e) => handleArrayChange('whatsInside', e.target.value)}
                        isTextArea
                    />
                </div>

                {/* Design Options */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Design Options</h2>
                    <FormField
                        label="Options (one per line)"
                        value={formData.designOptions.join('\n')}
                        onChange={(e) => handleArrayChange('designOptions', e.target.value)}
                        isTextArea
                    />
                </div>

                {/* Material Points */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Material Points</h2>
                    <FormField
                        label="Materials (one per line)"
                        value={formData.materialPoints.join('\n')}
                        onChange={(e) => handleArrayChange('materialPoints', e.target.value)}
                        isTextArea
                    />
                </div>

                {/* Use Cases */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-stone-900">Use Cases</h2>
                        <button
                            onClick={addUseCase}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Use Case
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.useCases.map((useCase, index) => (
                            <div key={index} className="p-4 border border-stone-200 rounded-lg relative">
                                <button
                                    onClick={() => removeUseCase(index)}
                                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="space-y-3 pr-8">
                                    <FormField
                                        label="Title"
                                        value={useCase.title}
                                        onChange={(e) => updateUseCase(index, 'title', e.target.value)}
                                    />
                                    <FormField
                                        label="Description"
                                        value={useCase.description}
                                        onChange={(e) => updateUseCase(index, 'description', e.target.value)}
                                        isTextArea
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Packaging Options */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Packaging Options</h2>
                    <FormField
                        label="Options (one per line)"
                        value={formData.packagingOptions.join('\n')}
                        onChange={(e) => handleArrayChange('packagingOptions', e.target.value)}
                        isTextArea
                    />
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-stone-900">FAQ</h2>
                        <button
                            onClick={addFAQ}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add FAQ
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.faq.map((item, index) => (
                            <div key={index} className="p-4 border border-stone-200 rounded-lg relative">
                                <button
                                    onClick={() => removeFAQ(index)}
                                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="space-y-3 pr-8">
                                    <FormField
                                        label="Question"
                                        value={item.question}
                                        onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                                    />
                                    <FormField
                                        label="Answer"
                                        value={item.answer}
                                        onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                                        isTextArea
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gallery Images */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Gallery Images</h2>
                    <FormField
                        label="Image URLs (one per line)"
                        value={formData.galleryImages.join('\n')}
                        onChange={(e) => handleArrayChange('galleryImages', e.target.value)}
                        isTextArea
                        helperText="Enter full image URLs, one per line"
                    />
                </div>
            </div>
        </div>
    );
}
