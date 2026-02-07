
'use client';

import React, { useState, useEffect } from 'react';
import { TicketPercent, Plus, Loader2, Trash2, Check, X, Copy } from 'lucide-react';
import { getVouchersAction, createVoucherAction, toggleVoucherStatusAction, deleteVoucherAction } from '@/lib/actions/rasa-ibu/marketing';
import { toast } from 'sonner';

interface VoucherManagerProps {
    brandId: string;
    onClose: () => void;
}

export default function VoucherManager({ brandId, onClose }: VoucherManagerProps) {
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newCode, setNewCode] = useState('');
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
    const [discountAmount, setDiscountAmount] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadVouchers();
    }, [brandId]);

    async function loadVouchers() {
        setLoading(true);
        const res = await getVouchersAction(brandId);
        if (res.success) {
            setVouchers(res.data);
        } else {
            toast.error('Gagal memuat voucher.');
        }
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFormLoading(true);

        const res = await createVoucherAction({
            brandId,
            code: newCode.toUpperCase(),
            discountType,
            discountAmount: Number(discountAmount),
            minOrderAmount: minOrder ? Number(minOrder) : undefined,
            usageLimit: usageLimit ? Number(usageLimit) : undefined
        });

        if (res.success) {
            toast.success('Voucher berhasil dibuat!');
            setIsCreating(false);
            resetForm();
            loadVouchers();
        } else {
            toast.error(res.error || 'Gagal membuat voucher.');
        }
        setFormLoading(false);
    }

    function resetForm() {
        setNewCode('');
        setDiscountType('FIXED');
        setDiscountAmount('');
        setMinOrder('');
        setUsageLimit('');
    }

    async function toggleStatus(code: string, currentStatus: boolean) {
        const res = await toggleVoucherStatusAction(brandId, code, !currentStatus);
        if (res.success) {
            toast.success(`Voucher ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
            loadVouchers();
        } else {
            toast.error('Gagal mengubah status.');
        }
    }

    async function handleDelete(code: string) {
        if (!confirm('Yakin ingin menghapus voucher ini?')) return;
        const res = await deleteVoucherAction(brandId, code);
        if (res.success) {
            toast.success('Voucher dihapus.');
            loadVouchers();
        } else {
            toast.error('Gagal menghapus voucher.');
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Manajemen Voucher</h2>
                    <p className="text-[#8B7E66] text-sm">Buat dan kelola kode promo untuk pelanggan.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-50 transition-all"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 bg-[#2D3A2D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#3d4d3d] transition-all flex items-center gap-2 shadow-lg shadow-green-900/10"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Voucher
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20 text-[#8B7E66] animate-pulse">Memuat data voucher...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map((voucher) => (
                        <div key={voucher.id} className={`p-6 bg-white border rounded-[2rem] transition-all relative overflow-hidden group ${voucher.isActive ? 'border-[#E5E1D8] hover:border-emerald-200' : 'border-slate-100 opacity-60 grayscale'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <TicketPercent className="w-6 h-6 text-[#2D3A2D]" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(voucher.code, voucher.isActive)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${voucher.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {voucher.isActive ? 'Aktif' : 'Nonaktif'}
                                    </button>
                                    <button onClick={() => handleDelete(voucher.code)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-2xl font-black text-[#2D3A2D] tracking-tight">{voucher.code}</h3>
                                <p className="text-sm font-medium text-[#8B7E66]">
                                    Diskon {voucher.ruleType === 'FIXED' ? `Rp ${Number(voucher.priceAdjustment).toLocaleString('id-ID')}` : `${voucher.priceAdjustment}%`}
                                </p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-50">
                                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    <span>Dipakai</span>
                                    <span>{voucher.usageCount} {voucher.usageLimit ? `/ ${voucher.usageLimit}` : 'kali'}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#2D3A2D] rounded-full transition-all"
                                        style={{ width: voucher.usageLimit ? `${Math.min(100, (voucher.usageCount / voucher.usageLimit) * 100)}%` : '0%' }}
                                    ></div>
                                </div>
                                {voucher.minPrice && (
                                    <p className="text-[10px] text-slate-400 text-right mt-1">Min. Order: Rp {Number(voucher.minPrice).toLocaleString('id-ID')}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {vouchers.length === 0 && (
                        <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-[#E5E1D8] rounded-[3rem]">
                            <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto text-[#8B7E66]">
                                <TicketPercent className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-[#8B7E66] font-medium">Belum ada voucher aktif.</p>
                            <button onClick={() => setIsCreating(true)} className="text-sm font-bold text-[#2D3A2D] underline">Buat Voucher Baru</button>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#2D3A2D]">Buat Voucher Baru</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Kode Voucher</label>
                                <input
                                    required
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                    placeholder="CONTOH: PROMO10"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Tipe Diskon</label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                        className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                    >
                                        <option value="FIXED">Nominal (Rp)</option>
                                        <option value="PERCENT">Persen (%)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nominal / %</label>
                                    <input
                                        required
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(e.target.value)}
                                        className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                        placeholder="10000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Min. Order (Opsional)</label>
                                    <input
                                        type="number"
                                        value={minOrder}
                                        onChange={(e) => setMinOrder(e.target.value)}
                                        className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                        placeholder="50000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Batas Pakai (Opsional)</label>
                                    <input
                                        type="number"
                                        value={usageLimit}
                                        onChange={(e) => setUsageLimit(e.target.value)}
                                        className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                        placeholder="100"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full py-4 bg-[#2D3A2D] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#3d4d3d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {formLoading ? 'Menyimpan...' : 'Simpan Voucher'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
