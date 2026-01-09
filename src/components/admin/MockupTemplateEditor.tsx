'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';

interface MockupTemplateEditorProps {
    productId: string;
    variantId?: string;
    brandSlug: string;
}

export default function MockupTemplateEditor({
    productId,
    variantId,
    brandSlug
}: MockupTemplateEditorProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        canvasWidth: 2000,
        canvasHeight: 2000,
        printAreaWidth: 1000,
        printAreaHeight: 1200,
        printAreaX: 500,
        printAreaY: 400,
        frontMockupImage: '',
        backMockupImage: '',
        hasBackView: false,
        isActive: true
    });

    useEffect(() => {
        fetchTemplate();
    }, [productId, variantId]);

    const fetchTemplate = async () => {
        try {
            const url = `/api/admin/products/${productId}/mockup${variantId ? `?variantId=${variantId}` : ''
                }`;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
                setFormData({
                    canvasWidth: data.canvasWidth,
                    canvasHeight: data.canvasHeight,
                    printAreaWidth: data.printAreaWidth,
                    printAreaHeight: data.printAreaHeight,
                    printAreaX: data.printAreaX,
                    printAreaY: data.printAreaY,
                    frontMockupImage: data.frontMockupImage || '',
                    backMockupImage: data.backMockupImage || '',
                    hasBackView: data.hasBackView,
                    isActive: data.isActive
                });
            } else if (res.status !== 404) {
                toast.error('Failed to load mockup template');
            }
        } catch (error) {
            console.error('Error fetching template:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/products/${productId}/mockup`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variantId,
                    ...formData
                })
            });

            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
                toast.success('Print setup saved successfully');
            } else {
                toast.error('Failed to save print setup');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save print setup');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'frontMockupImage' | 'backMockupImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, [field]: data.url }));
                toast.success('Image uploaded');
            } else {
                toast.error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Upload failed');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900">
                    Print Area Configuration
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Configuration
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Editor (Placeholder) */}
                <div className="bg-stone-100 rounded-xl border border-stone-200 aspect-square flex items-center justify-center relative overflow-hidden">
                    {formData.frontMockupImage ? (
                        <div className="relative w-full h-full">
                            <img
                                src={formData.frontMockupImage}
                                alt="Mockup Base"
                                className="w-full h-full object-contain"
                            />
                            {/* Print Area Overlay */}
                            <div
                                className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
                                style={{
                                    left: `${(formData.printAreaX / formData.canvasWidth) * 100}%`,
                                    top: `${(formData.printAreaY / formData.canvasHeight) * 100}%`,
                                    width: `${(formData.printAreaWidth / formData.canvasWidth) * 100}%`,
                                    height: `${(formData.printAreaHeight / formData.canvasHeight) * 100}%`,
                                }}
                            >
                                <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-1">
                                    Print Area
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-stone-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>Upload a mockup base image to visualize</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    {/* Images */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-stone-900">Mockup Images</h4>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Front Mockup Base
                            </label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    value={formData.frontMockupImage}
                                    onChange={(e) => setFormData({ ...formData, frontMockupImage: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                                    placeholder="Image URL"
                                />
                                <label className="cursor-pointer px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'frontMockupImage')}
                                    />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={formData.hasBackView}
                                    onChange={(e) => setFormData({ ...formData, hasBackView: e.target.checked })}
                                    className="w-4 h-4 text-amber-600 border-stone-300 rounded"
                                />
                                <span className="text-sm font-medium text-stone-700">Enable Back View</span>
                            </label>

                            {formData.hasBackView && (
                                <div className="pl-6">
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Back Mockup Base
                                    </label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="text"
                                            value={formData.backMockupImage}
                                            onChange={(e) => setFormData({ ...formData, backMockupImage: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                                            placeholder="Image URL"
                                        />
                                        <label className="cursor-pointer px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, 'backMockupImage')}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-stone-200" />

                    {/* Dimensions */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-stone-900">Dimensions (px)</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">Canvas Width</label>
                                <input
                                    type="number"
                                    value={formData.canvasWidth}
                                    onChange={(e) => setFormData({ ...formData, canvasWidth: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">Canvas Height</label>
                                <input
                                    type="number"
                                    value={formData.canvasHeight}
                                    onChange={(e) => setFormData({ ...formData, canvasHeight: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <h5 className="text-sm font-medium text-amber-800 mb-3">Print Area</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Width</label>
                                    <input
                                        type="number"
                                        value={formData.printAreaWidth}
                                        onChange={(e) => setFormData({ ...formData, printAreaWidth: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Height</label>
                                    <input
                                        type="number"
                                        value={formData.printAreaHeight}
                                        onChange={(e) => setFormData({ ...formData, printAreaHeight: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Position X</label>
                                    <input
                                        type="number"
                                        value={formData.printAreaX}
                                        onChange={(e) => setFormData({ ...formData, printAreaX: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Position Y</label>
                                    <input
                                        type="number"
                                        value={formData.printAreaY}
                                        onChange={(e) => setFormData({ ...formData, printAreaY: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
