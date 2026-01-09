'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Box,
    TrendingDown,
    Activity,
    Calendar,
    DollarSign,
    MoreVertical,
    Trash2,
    Wrench,
    ArrowLeft,
    Monitor,
    Truck,
    Building2,
    Armchair
} from 'lucide-react';
import { getAssetsAction, runDepreciationAction, disposeAssetAction } from '@/lib/actions/rasa-ibu/assets';
import AddAssetModal from './AddAssetModal';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface AssetManagementHubProps {
    brandId: string;
    onBack: () => void;
}

export default function AssetManagementHub({ brandId, onBack }: AssetManagementHubProps) {
    const [overview, setOverview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const confirm = useConfirm();

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const loadAssets = async () => {
        setIsLoading(true);
        const res = await getAssetsAction(brandId);
        if (res.success) {
            setOverview(res.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadAssets();
    }, [brandId]);

    const handleRunDepreciation = async () => {
        const res = await runDepreciationAction(brandId);
        if (res.success) {
            toast.success('Penyusutan bulan ini berhasil diproses');
            loadAssets();
        } else {
            toast.error('Gagal memproses penyusutan: ' + res.error);
        }
    };

    const handleDispose = async (assetId: string) => {
        const confirmed = await confirm({
            title: 'Tarik Aset?',
            message: 'Aset ini akan ditarik dari operasional dan dihapus dari daftar aktif. Lanjutkan?',
            confirmText: 'Ya, Tarik',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        const res = await disposeAssetAction(assetId, 'Disposed via UI');
        if (res.success) {
            toast.success('Aset berhasil ditarik');
            loadAssets();
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'EQUIPMENT': return <Monitor className="w-5 h-5" />;
            case 'VEHICLE': return <Truck className="w-5 h-5" />;
            case 'BUILDING': return <Building2 className="w-5 h-5" />;
            case 'FURNITURE': return <Armchair className="w-5 h-5" />;
            default: return <Box className="w-5 h-5" />;
        }
    };

    if (isLoading && !overview) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-[#8B7E66] rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest text-[#8B7E66]">Memuat Data Aset...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 hover:bg-white rounded-2xl border border-[#E5E1D8] transition-all hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#8B7E66]" />
                    </button>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Manajemen Aset</h2>
                        <p className="text-xs text-slate-500 font-medium">Lacak nilai buku dan penyusutan aset tetap Anda.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunDepreciation}
                        className="px-6 py-3 bg-white border border-[#E5E1D8] text-[#2D3A2D] rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <TrendingDown className="w-4 h-4" />
                        Jalankan Penyusutan
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-[#2D3A2D] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-xl hover:bg-[#1A241A] transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Aset
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Nilai Perolehan</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-black text-[#2D3A2D]">{currency.format(overview?.totalPurchasePrice || 0)}</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">Berdasarkan harga beli awal</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-rose-50 rounded-xl">
                            <TrendingDown className="w-5 h-5 text-rose-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Akumulasi Penyusutan</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-black text-rose-600">-{currency.format(overview?.totalAccumulatedDepreciation || 0)}</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">Total penurunan nilai hingga saat ini</p>
                    </div>
                </div>

                <div className="bg-[#2D3A2D] p-6 rounded-[2rem] shadow-xl flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Nilai Buku</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-black text-emerald-400">{currency.format(overview?.totalBookValue || 0)}</p>
                        <p className="text-[10px] text-white/40 font-medium italic">Net Book Value (Current Value)</p>
                    </div>
                </div>
            </div>

            {/* Asset List */}
            <div className="bg-white rounded-[2.5rem] border border-[#E5E1D8] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-[#E5E1D8] bg-[#FDFBF7]">
                    <h3 className="font-black text-[#2D3A2D] uppercase tracking-widest text-xs">Daftar Inventaris & Aset</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F9F7F2]">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aset</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tgl Perolehan</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Harga Beli</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Nilai Buku</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sisa Umur</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 empty:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2F0EA]">
                            {overview?.assets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-12 text-center text-slate-400 text-xs italic">
                                        Belum ada aset terdaftar. Klik "Tambah Aset" untuk memulai.
                                    </td>
                                </tr>
                            ) : overview?.assets.map((asset: any) => (
                                <tr key={asset.id} className={`hover:bg-[#FDFBF7] transition-colors group ${asset.status !== 'ACTIVE' ? 'opacity-50' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                                {getCategoryIcon(asset.category)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#2D3A2D]">{asset.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{asset.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-50 text-[10px] font-black text-slate-500 rounded-full border border-slate-100 uppercase tracking-widest">
                                            {asset.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(asset.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-slate-500 text-sm">
                                        {currency.format(asset.purchasePrice)}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-[#2D3A2D] text-sm">
                                        {currency.format(asset.bookValue)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${(asset.remainingMonths / asset.usefulLifeMonths) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {asset.remainingMonths} bln tersisa
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDispose(asset.id)}
                                                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                title="Tarik Aset / Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddAssetModal
                    brandId={brandId}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        loadAssets();
                    }}
                />
            )}
        </div>
    );
}
