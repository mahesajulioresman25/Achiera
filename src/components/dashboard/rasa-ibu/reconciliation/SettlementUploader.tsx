'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadSettlementReportAction } from '@/lib/actions/rasa-ibu/reconciliation';

interface SettlementUploaderProps {
    brandId: string;
    onUploadComplete?: () => void;
}

export default function SettlementUploader({ brandId, onUploadComplete }: SettlementUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            toast.error('Mohon upload file .CSV ya Bunda');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platform', 'SHOPEE'); // Default for now

        try {
            const res = await uploadSettlementReportAction(brandId, formData);
            if (res.success) {
                toast.success(res.message);
                if (onUploadComplete) onUploadComplete();
            } else {
                toast.error('Gagal memproses file: ' + res.error);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat upload');
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800">
                        {isUploading ? 'Sedang Memproses...' : 'Upload Laporan Settlement'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Drag & drop file CSV dari Shopee disini
                    </p>
                </div>
            </div>
        </div>
    );
}
