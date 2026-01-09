'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Upload, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ColorVariant {
    id?: string;
    key: string;
    label: string;
    swatchHex: string;
    imageUrl: string;
    backImageUrl?: string;
    sortOrder: number;
    isActive: boolean;
}

interface ColorVariantsFieldProps {
    templateId?: string;
    value: ColorVariant[];
    onChange: (variants: ColorVariant[]) => void;
}

export default function ColorVariantsField({ templateId, value, onChange }: ColorVariantsFieldProps) {
    const [uploading, setUploading] = useState<{ index: number, field: 'imageUrl' | 'backImageUrl' } | null>(null);

    const handleAddVariant = () => {
        const newVariant: ColorVariant = {
            key: '',
            label: '',
            swatchHex: '#000000',
            imageUrl: '',
            backImageUrl: '',
            sortOrder: value.length,
            isActive: true
        };
        onChange([...value, newVariant]);
    };

    const handleRemoveVariant = (index: number) => {
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleUpdateVariant = (index: number, field: keyof ColorVariant, newValue: any) => {
        const updated = [...value];
        updated[index] = { ...updated[index], [field]: newValue };
        onChange(updated);
    };

    const handleImageUpload = async (index: number, field: 'imageUrl' | 'backImageUrl', file: File) => {
        setUploading({ index, field });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            handleUpdateVariant(index, field, data.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Gagal mengunggah gambar');
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">
                    Color Variants
                </label>
                <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Color
                </button>
            </div>

            {value.length === 0 ? (
                <div className="text-center py-8 text-stone-400 border-2 border-dashed border-stone-200 rounded-lg">
                    No color variants yet. Click "Add Color" to start.
                </div>
            ) : (
                <div className="space-y-3">
                    {value.map((variant, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200"
                        >
                            {/* Drag Handle */}
                            <div className="flex items-center pt-2">
                                <GripVertical className="w-5 h-5 text-stone-400 cursor-move" />
                            </div>

                            {/* Swatch Preview */}
                            <div className="flex-shrink-0 pt-2">
                                <div
                                    className="w-10 h-10 rounded-lg border-2 border-stone-300 shadow-sm"
                                    style={{ backgroundColor: variant.swatchHex }}
                                />
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Key
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.key}
                                        onChange={(e) => handleUpdateVariant(index, 'key', e.target.value)}
                                        placeholder="black"
                                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Label
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.label}
                                        onChange={(e) => handleUpdateVariant(index, 'label', e.target.value)}
                                        placeholder="Black"
                                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Swatch Hex
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={variant.swatchHex}
                                            onChange={(e) => handleUpdateVariant(index, 'swatchHex', e.target.value)}
                                            className="w-10 h-8 border border-stone-300 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={variant.swatchHex}
                                            onChange={(e) => handleUpdateVariant(index, 'swatchHex', e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 px-2 py-1.5 text-sm border border-stone-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Front Image */}
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Front Image
                                    </label>
                                    <div className="flex gap-2">
                                        {variant.imageUrl && (
                                            <div className="relative w-10 h-10 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={variant.imageUrl}
                                                    alt={variant.label}
                                                    fill
                                                    sizes="40px"
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                        <label className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-sm border border-stone-300 rounded cursor-pointer hover:bg-stone-50 transition-colors">
                                            <Upload className="w-4 h-4" />
                                            {uploading?.index === index && uploading?.field === 'imageUrl' ? '...' : 'Front'}
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(index, 'imageUrl', file);
                                                }}
                                                className="hidden"
                                                disabled={uploading !== null}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Back Image */}
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1">
                                        Back Image (Optional)
                                    </label>
                                    <div className="flex gap-2">
                                        {variant.backImageUrl && (
                                            <div className="relative w-10 h-10 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={variant.backImageUrl}
                                                    alt={`${variant.label} Back`}
                                                    fill
                                                    sizes="40px"
                                                    className="object-contain"
                                                />
                                            </div>
                                        )}
                                        <label className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-sm border border-stone-300 rounded cursor-pointer hover:bg-stone-50 transition-colors">
                                            <Upload className="w-4 h-4" />
                                            {uploading?.index === index && uploading?.field === 'backImageUrl' ? '...' : 'Back'}
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(index, 'backImageUrl', file);
                                                }}
                                                className="hidden"
                                                disabled={uploading !== null}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveVariant(index)}
                                className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete variant"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-stone-500">
                Each color variant should have a unique key, display label, swatch color for buttons, and a final PNG image of the product in that color.
            </p>
        </div>
    );
}
