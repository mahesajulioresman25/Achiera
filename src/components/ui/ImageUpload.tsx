'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    disabled?: boolean;
}

export default function ImageUpload({ value, onChange, label = "Image", disabled }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            onChange(data.url);
            toast.success('Image uploaded!');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <span className="block text-xs font-bold uppercase text-gray-500 mb-2">{label}</span>

            {value ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 group">
                    <img
                        src={value}
                        alt="Upload"
                        className="object-cover w-full h-full"
                    />
                    <button
                        onClick={() => onChange('')}
                        disabled={disabled}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                        {value}
                    </div>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#E5E1D8] border-dashed rounded-xl cursor-pointer bg-[#F9F7F2] hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 mb-2 animate-spin text-emerald-600" />
                        ) : (
                            <Upload className="w-8 h-8 mb-2" />
                        )}
                        <p className="text-xs font-bold uppercase">{isUploading ? 'Uploading...' : 'Click to Upload'}</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={disabled || isUploading}
                    />
                </label>
            )}
        </div>
    );
}
