'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ImageUploadFieldProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
}

export default function ImageUploadField({
    value,
    onChange,
    label = "Image",
    description
}: ImageUploadFieldProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();
            onChange(data.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Gagal mengunggah gambar');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">
                {label}
            </label>

            <div className="flex items-start gap-4">
                {/* Preview Area */}
                <div className="relative w-32 h-32 bg-stone-100 rounded-lg border border-stone-200 overflow-hidden flex-shrink-0">
                    {value ? (
                        <>
                            <Image
                                src={value}
                                alt="Preview"
                                fill
                                className="object-contain p-2"
                            />
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-stone-500 hover:text-red-500 hover:bg-white shadow-sm transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-400">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                        </div>
                    )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Browse Image'}
                    </button>
                    {description && (
                        <p className="mt-2 text-xs text-stone-500">
                            {description}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-stone-400">
                        Supported formats: PNG, JPG, WebP. Max size: 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
}
