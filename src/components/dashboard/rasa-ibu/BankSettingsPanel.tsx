'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit2, Check, X, Building2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getBrandBankAccountsAction, upsertBankAccountAction, deleteBankAccountAction } from '@/lib/actions/rasa-ibu/bank-account-actions';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface BankSettingsPanelProps {
    brandId: string;
}

export default function BankSettingsPanel({ brandId }: BankSettingsPanelProps) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const confirm = useConfirm();

    // Form State (for adding new or editing)
    const [formData, setFormData] = useState({
        id: '',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isActive: true
    });

    useEffect(() => {
        loadAccounts();
    }, [brandId]);

    async function loadAccounts() {
        setIsLoading(true);
        const res = await getBrandBankAccountsAction(brandId);
        if (res.success) {
            setAccounts(res.data);
        }
        setIsLoading(false);
    }

    const handleEdit = (account: any) => {
        setFormData({
            id: account.id,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountHolder: account.accountHolder,
            isActive: account.isActive
        });
        setIsEditing(account.id);
    };

    const handleCreateNew = () => {
        setFormData({
            id: '',
            bankName: '',
            accountNumber: '',
            accountHolder: '',
            isActive: true
        });
        setIsEditing('NEW');
    };

    const handleCancel = () => {
        setIsEditing(null);
        setFormData({ id: '', bankName: '', accountNumber: '', accountHolder: '', isActive: true });
    };

    const handleSave = async () => {
        if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
            toast.error('Mohon lengkapi semua data bank');
            return;
        }

        setIsSaving(true);
        const res = await upsertBankAccountAction({
            id: formData.id || undefined, // undefined for new creation logic if needed, but our action handles empty string? check action.
            // Actually our action expects undefined for create if ID is missing.
            // Let's ensure we pass undefined if it's new
            brandId,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolder,
            isActive: formData.isActive
        });

        if (res.success) {
            toast.success('Rekening berhasil disimpan');
            setIsEditing(null);
            loadAccounts();
        } else {
            toast.error('Gagal menyimpan rekening: ' + res.error);
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Rekening?',
            message: 'Rekening ini akan dihapus permanen dari daftar metode pembayaran. Bunda yakin?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        const toastId = toast.loading('Menghapus rekening...');
        const res = await deleteBankAccountAction(id);

        if (res.success) {
            toast.success('Rekening dihapus', { id: toastId });
            loadAccounts();
        } else {
            toast.error('Gagal hapus: ' + res.error, { id: toastId });
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Metode Pembayaran (Transfer Bank)</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Kelola rekening tujuan transfer manual</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Bank
                    </button>
                )}
            </div>

            {/* Editing Form */}
            {isEditing && (
                <div className="bg-white border-2 border-emerald-100 p-6 rounded-2xl shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">
                        {isEditing === 'NEW' ? 'Tambah Rekening Baru' : 'Edit Rekening'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#8B7E66] uppercase">Nama Bank</label>
                            <input
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                placeholder="Contoh: BCA, Mandiri"
                                className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-600 transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#8B7E66] uppercase">Nomor Rekening</label>
                            <input
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                placeholder="1234567890"
                                className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-600 transition-colors"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-bold text-[#8B7E66] uppercase">Atas Nama (Holder)</label>
                            <input
                                value={formData.accountHolder}
                                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                                placeholder="Nama Pemilik Rekening"
                                className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-600 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* Accounts List */}
            <div className="grid grid-cols-1 gap-3">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                ) : accounts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 italic">Belum ada rekening bank terdaftar.</p>
                    </div>
                ) : (
                    accounts.map(acc => (
                        <div key={acc.id} className="group bg-white border border-[#E5E1D8] p-4 rounded-2xl flex justify-between items-center hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                                    <CreditCard className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-[#2D3A2D]">{acc.bankName}</span>
                                        {!acc.brandId && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold">GLOBAL</span>}
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 font-mono tracking-tight">{acc.accountNumber}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{acc.accountHolder}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(acc)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
