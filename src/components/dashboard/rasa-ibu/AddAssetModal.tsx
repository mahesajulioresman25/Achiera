'use client';

import React, { useState } from 'react';
import { X, Save, Box, Calendar, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { createAssetAction } from '@/lib/actions/rasa-ibu/assets';
import { AssetCategory } from '@prisma/client';
import { toast } from 'sonner';

interface AddAssetModalProps {
    brandId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddAssetModal({ brandId, onClose, onSuccess }: AddAssetModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'EQUIPMENT' as AssetCategory,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
        usefulLifeMonths: '48',
        salvageValue: '0'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const price = parseFloat(formData.purchasePrice);
        const life = parseInt(formData.usefulLifeMonths);
        const salvage = parseFloat(formData.salvageValue || '0');

        if (price <= 0) {
            toast.error('Harga beli harus lebih besar dari 0');
            return;
        }
        if (life <= 0) {
            toast.error('Umur ekonomis harus lebih besar dari 0');
            return;
        }
        if (salvage >= price) {
            toast.error('Nilai residu tidak boleh lebih besar dari harga beli');
            return;
        }

        setIsSubmitting(true);

        const res = await createAssetAction({
            brandId,
            name: formData.name,
            code: formData.code,
            category: formData.category,
            purchaseDate: new Date(formData.purchaseDate),
            purchasePrice: price,
            usefulLifeMonths: life,
            salvageValue: salvage
        });

        if (res.success) {
            toast.success('Aset berhasil didaftarkan');
            onSuccess();
        } else {
            toast.error('Gagal mendaftarkan aset: ' + res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-4">
            <div className="bg-[#FDFBF7] w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <Box className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Registrasi Aset</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">New Fixed Asset</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Nama Aset</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D] placeholder:text-slate-300"
                                placeholder="Contoh: Freezer Box GEA"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Kode Aset</label>
                            <input
                                required
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full px-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Kategori</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                                className="w-full px-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                            >
                                <option value="EQUIPMENT">Peralatan (Equipment)</option>
                                <option value="VEHICLE">Kendaraan (Vehicle)</option>
                                <option value="BUILDING">Bangunan (Building)</option>
                                <option value="FURNITURE">Perabotan (Furniture)</option>
                                <option value="OTHER">Lainnya</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Tanggal Perolehan</label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                                />
                            </div>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Harga Beli (Rp)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Umur Ekonomis (Bulan)</label>
                            <div className="relative">
                                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="number"
                                    value={formData.usefulLifeMonths}
                                    onChange={(e) => setFormData({ ...formData, usefulLifeMonths: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                                    placeholder="48"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">Nilai Residu (Rp)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="number"
                                    value={formData.salvageValue}
                                    onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value })}
                                    className="w-full pl-14 pr-5 py-4 bg-[#F9F7F2] border-2 border-transparent focus:border-[#8B7E66] focus:bg-white rounded-2xl outline-none transition-all text-sm font-bold text-[#2D3A2D]"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-[#2D3A2D]">Automated Financial Integration</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                Sistem akan secara otomatis menghitung penyusutan setiap bulan sebesar
                                <strong> {formData.purchasePrice && formData.usefulLifeMonths ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format((parseFloat(formData.purchasePrice) - parseFloat(formData.salvageValue || '0')) / parseInt(formData.usefulLifeMonths)) : 'Rp 0'} / bulan</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-[#E5E1D8] flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="px-10 py-4 bg-[#2D3A2D] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:bg-[#1A241A] disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? 'Menyimpan...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Simpan Aset
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
