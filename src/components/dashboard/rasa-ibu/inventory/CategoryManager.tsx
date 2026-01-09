'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { upsertIbuCategory, deleteIbuCategory } from '@/lib/actions/rasa-ibu/catalog';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface CategoryManagerProps {
    brandId: string;
    categories: any[];
    onClose: () => void;
    onRefresh: () => void;
}

export default function CategoryManager({ brandId, categories, onClose, onRefresh }: CategoryManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [folderName, setFolderName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const confirm = useConfirm();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!folderName.trim()) return;

        setIsSubmitting(true);
        const res = await upsertIbuCategory({
            id: editingCategory?.id,
            brandId,
            name: folderName
        });

        if (res.success) {
            setFolderName('');
            setEditingCategory(null);
            setIsAdding(false);
            onRefresh();
        } else {
            toast.error('Gagal menyimpan kategori: ' + res.error);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Kategori?',
            message: 'Bunda yakin ingin menghapus kategori ini? Produk di dalamnya mungkin perlu diatur ulang.',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsSubmitting(true);
        const res = await deleteIbuCategory(id);
        if (res.success) {
            onRefresh();
        } else {
            toast.error(res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-sm p-6 whitespace-normal">
            <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                            <Tag className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-black text-[#2D3A2D]">Kelola Kategori Menu</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Add/Edit Form */}
                    {(isAdding || editingCategory) ? (
                        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border-2 border-amber-200 border-dashed space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                                    {editingCategory ? 'Edit Nama Kategori' : 'Nama Kategori Baru'}
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-500"
                                    placeholder="Misal: Frozen, Camilan, Bumbu..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingCategory(null);
                                        setFolderName('');
                                    }}
                                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                >
                                    Batal
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="flex-2 px-8 py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-[#E5E1D8] rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-all font-bold group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                            Tambah Kategori Menu Baru
                        </button>
                    )}

                    {/* Category List */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map((cat) => (
                            <div key={cat.id} className="group flex items-center justify-between p-4 bg-white border border-[#E5E1D8] rounded-2xl hover:border-amber-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🍱</span>
                                    <div>
                                        <span className="font-bold text-[#2D3A2D]">{cat.name}</span>
                                        {cat.description && (
                                            <p className="text-[9px] text-slate-500 font-medium line-clamp-1">{cat.description}</p>
                                        )}
                                        {!cat.isActive && (
                                            <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">Hidden</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingCategory(cat);
                                            setFolderName(cat.name);
                                        }}
                                        className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-[#F9F7F2] border-t border-[#E5E1D8] text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Kategori ini hanya untuk mengatur tampilan Menu di Website.</p>
                </div>
            </div>
        </div>
    );
}
