'use client';

import React, { useState, useRef } from 'react';
import { QrCode, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadQRISImageAction, toggleQRISAction } from '@/lib/actions/rasa-ibu/qris';

interface QRISSettingsPanelProps {
    brandId: string;
    settings: any;
    onSettingsUpdate: (newSettings: any) => void;
}

export default function QRISSettingsPanel({ brandId, settings, onSettingsUpdate }: QRISSettingsPanelProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(settings.qrisImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await uploadQRISImageAction(brandId, formData);
            if (res.success) {
                toast.success('QRIS Image berhasil diunggah dan disimpan!');
                onSettingsUpdate({
                    ...settings,
                    qrisImageUrl: res.url,
                    qrisEnabled: true
                });
            } else {
                toast.error('Gagal mengunggah QRIS: ' + res.error);
                setPreviewUrl(settings.qrisImageUrl || null);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengunggah');
            setPreviewUrl(settings.qrisImageUrl || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        try {
            const res = await toggleQRISAction(brandId, enabled);
            if (res.success) {
                toast.success(enabled ? 'QRIS Pembayaran Diaktifkan' : 'QRIS Pembayaran Dinonaktifkan');
                onSettingsUpdate({
                    ...settings,
                    qrisEnabled: enabled
                });
            } else {
                toast.error('Gagal memperbarui status QRIS');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F9F7F2] pb-4">
                <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Metode Pembayaran QRIS</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7E66] uppercase">Status:</span>
                    <button
                        onClick={() => handleToggle(!settings.qrisEnabled)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${settings.qrisEnabled
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                    >
                        {settings.qrisEnabled ? 'Aktif' : 'Non-Aktif'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Image Preview & Upload */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Preview QRIS</label>
                    <div className="relative aspect-square max-w-[280px] bg-white border-2 border-dashed border-[#E5E1D8] rounded-[2rem] overflow-hidden flex flex-col items-center justify-center group">
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt="QRIS Preview" className="w-full h-full object-contain p-4" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-white text-emerald-600 rounded-2xl hover:scale-110 transition-transform shadow-xl"
                                    >
                                        <Upload className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6 space-y-3">
                                <div className="w-12 h-12 bg-[#F9F7F2] text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-medium text-slate-400">Belum ada image QRIS ditalakan</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                    Upload QRIS
                                </button>
                            </div>
                        )}

                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                                    <p className="text-[10px] font-black text-[#2D3A2D] uppercase">Mengunggah...</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                {/* Instructions & Features */}
                <div className="space-y-6 bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2.5rem]">
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Smart Payment Logic
                        </h4>
                        <p className="text-[11px] text-emerald-800/70 leading-relaxed font-medium">
                            Aktifkan fitur ini untuk memberikan opsi pembayaran QRIS yang dikelola secara dinamis.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {[
                            'Otomatis muncul di halaman pesanan pelanggan',
                            'Customer mengunggah bukti transfer',
                            'Notifikasi WhatsApp otomatis setelah verifikasi',
                            'Laporan finansial terupdate secara real-time'
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-emerald-900/60">
                                <div className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div className="pt-4 border-t border-emerald-100 mt-6 flex items-start gap-3 bg-white/50 p-4 rounded-2xl">
                        <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-emerald-900 uppercase">Verifikasi Manual</p>
                            <p className="text-[9px] text-emerald-800/60 leading-tight">
                                Pastikan staff memeriksa bukti transfer di dashboard sebelum memvalidasi status pesanan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
