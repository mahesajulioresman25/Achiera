'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
    id: string;
    slug: string;
    name: string;
    heroTitle: string;
    heroSubtitle: string;
    highlights: string[];
    whatsInside: string[];
    designOptions: string[];
    materialPoints: string[];
    useCases: Array<{ title: string; description: string }>;
    packagingOptions: string[];
    faq: Array<{ question: string; answer: string }>;
    galleryImages: string[];
}

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        fetchCollection();
    }, [id]);

    const fetchCollection = async () => {
        try {
            const res = await fetch(`/api/admin/merch/collections/${id}`);
            const data = await res.json();
            setCollection(data);
        } catch (error) {
            console.error('Failed to fetch collection:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!collection) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/merch/collections/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collection)
            });

            if (!res.ok) {
                toast.error('Gagal menyimpan koleksi');
                return;
            }

            toast.success('Koleksi berhasil disimpan!');
        } catch (error) {
            toast.error('Gagal menyimpan koleksi');
        } finally {
            setSaving(false);
        }
    };

    const addArrayItem = (field: keyof Collection, defaultValue: any) => {
        if (!collection) return;
        setCollection({
            ...collection,
            [field]: [...(collection[field] as any[]), defaultValue]
        });
    };

    const removeArrayItem = (field: keyof Collection, index: number) => {
        if (!collection) return;
        const newArray = [...(collection[field] as any[])];
        newArray.splice(index, 1);
        setCollection({
            ...collection,
            [field]: newArray
        });
    };

    const updateArrayItem = (field: keyof Collection, index: number, value: any) => {
        if (!collection) return;
        const newArray = [...(collection[field] as any[])];
        newArray[index] = value;
        setCollection({
            ...collection,
            [field]: newArray
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="p-8">
                <p className="text-stone-600">Collection not found</p>
            </div>
        );
    }

    const tabs = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'highlights', label: 'Highlights' },
        { id: 'whatsInside', label: "What's Inside" },
        { id: 'designOptions', label: 'Design Options' },
        { id: 'material', label: 'Material & Quality' },
        { id: 'faq', label: 'FAQ' },
        { id: 'gallery', label: 'Gallery' }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/merch/content/collections')}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Edit Collection</h1>
                        <p className="text-stone-600">{collection.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                {activeTab === 'basic' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Collection Name
                            </label>
                            <input
                                type="text"
                                value={collection.name}
                                onChange={(e) => setCollection({ ...collection, name: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Slug
                            </label>
                            <input
                                type="text"
                                value={collection.slug}
                                onChange={(e) => setCollection({ ...collection, slug: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Hero Title
                            </label>
                            <input
                                type="text"
                                value={collection.heroTitle}
                                onChange={(e) => setCollection({ ...collection, heroTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Hero Subtitle
                            </label>
                            <textarea
                                value={collection.heroSubtitle}
                                onChange={(e) => setCollection({ ...collection, heroSubtitle: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'highlights' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">Highlight Badges</h3>
                            <button
                                onClick={() => addArrayItem('highlights', '')}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Highlight
                            </button>
                        </div>
                        {collection.highlights.map((highlight, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={highlight}
                                    onChange={(e) => updateArrayItem('highlights', index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. Premium Quality"
                                />
                                <button
                                    onClick={() => removeArrayItem('highlights', index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'whatsInside' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">What's Inside Items</h3>
                            <button
                                onClick={() => addArrayItem('whatsInside', '')}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>
                        {collection.whatsInside.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayItem('whatsInside', index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. T-Shirts"
                                />
                                <button
                                    onClick={() => removeArrayItem('whatsInside', index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'designOptions' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">Design Options</h3>
                            <button
                                onClick={() => addArrayItem('designOptions', '')}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option
                            </button>
                        </div>
                        {collection.designOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateArrayItem('designOptions', index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. Screen Printing"
                                />
                                <button
                                    onClick={() => removeArrayItem('designOptions', index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'material' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">Material & Quality Points</h3>
                            <button
                                onClick={() => addArrayItem('materialPoints', '')}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Point
                            </button>
                        </div>
                        {collection.materialPoints.map((point, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={point}
                                    onChange={(e) => updateArrayItem('materialPoints', index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. 100% Premium Cotton"
                                />
                                <button
                                    onClick={() => removeArrayItem('materialPoints', index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">FAQ</h3>
                            <button
                                onClick={() => addArrayItem('faq', { question: '', answer: '' })}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add FAQ
                            </button>
                        </div>
                        {collection.faq.map((item, index) => (
                            <div key={index} className="p-4 border border-stone-200 rounded-lg space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <input
                                        type="text"
                                        value={item.question}
                                        onChange={(e) => updateArrayItem('faq', index, { ...item, question: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="Question"
                                    />
                                    <button
                                        onClick={() => removeArrayItem('faq', index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    value={item.answer}
                                    onChange={(e) => updateArrayItem('faq', index, { ...item, answer: e.target.value })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Answer"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-stone-900">Gallery Images</h3>
                            <button
                                onClick={() => addArrayItem('galleryImages', '')}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Image
                            </button>
                        </div>
                        <p className="text-sm text-stone-600">Enter image URLs for the gallery</p>
                        {collection.galleryImages.map((url, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => updateArrayItem('galleryImages', index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="https://..."
                                />
                                <button
                                    onClick={() => removeArrayItem('galleryImages', index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
