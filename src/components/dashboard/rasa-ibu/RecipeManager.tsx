'use client';

import React, { useState } from 'react';
import {
    ChefHat,
    Eye,
    EyeOff,
    MoreVertical,
    Trash2,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Search,
    Clock,
    Flame,
    Star
} from 'lucide-react';
import { toast } from 'sonner';
import {
    toggleRecipePublish,
    approveRecipeComment,
    deleteRecipeComment,
    deleteRecipePost
} from '@/lib/actions/rasa-ibu/admin-recipes';
import { createProductionRecipeFromPost } from '@/lib/actions/rasa-ibu/bridge';

interface RecipeManagerProps {
    brandId: string;
    recipes: any[];
}

export default function RecipeManager({ brandId, recipes: initialRecipes }: RecipeManagerProps) {
    const [recipes, setRecipes] = useState(initialRecipes);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMMENTS'>('ALL');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Filtering
    const filteredRecipes = recipes.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(r => {
        if (activeTab === 'PENDING') return !r.isPublished;
        return true;
    });

    const pendingComments = recipes.flatMap(r =>
        (r.comments || []).filter((c: any) => !c.isApproved).map((c: any) => ({ ...c, recipeTitle: r.title }))
    );

    const handleTogglePublish = async (recipeId: string, currentStatus: boolean) => {
        setLoadingId(recipeId);
        const res = await toggleRecipePublish(brandId, recipeId, !currentStatus);
        if (res.success) {
            setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, isPublished: !currentStatus } : r));
            toast.success(currentStatus ? 'Resep disembunyikan' : 'Resep dipublikasikan!');
        } else {
            toast.error('Gagal memperbarui status');
        }
        setLoadingId(null);
    };

    const handleDeleteRecipe = async (recipeId: string) => {
        if (!confirm('Yakin ingin menghapus resep ini selamanya?')) return;

        setLoadingId(recipeId);
        const res = await deleteRecipePost(brandId, recipeId);
        if (res.success) {
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            toast.success('Resep dihapus');
        } else {
            toast.error('Gagal menghapus resep');
        }
        setLoadingId(null);
    };

    const handleApproveComment = async (recipeId: string, commentId: string) => {
        const res = await approveRecipeComment(recipeId, commentId);
        if (res.success) {
            setRecipes(prev => prev.map(r => {
                if (r.id === recipeId) {
                    return {
                        ...r,
                        comments: r.comments.map((c: any) => c.id === commentId ? { ...c, isApproved: true } : c)
                    };
                }
                return r;
            }));
            toast.success('Komentar disetujui');
        }
    };

    const handleDeleteComment = async (recipeId: string, commentId: string) => {
        const res = await deleteRecipeComment(recipeId, commentId);
        if (res.success) {
            setRecipes(prev => prev.map(r => {
                if (r.id === recipeId) {
                    return {
                        ...r,
                        comments: r.comments.filter((c: any) => c.id !== commentId)
                    };
                }
                return r;
            }));
            toast.success('Komentar dihapus');
        }
    };

    const handleConvertToProduction = async (recipeId: string) => {
        setLoadingId(recipeId);
        const res = await createProductionRecipeFromPost(brandId, recipeId);
        if (res.success && res.data) {
            toast.success(`Berhasil! Resep Produksi dibuat dengan ${res.data.matchesCount} bahan terhubung.`);
        } else {
            toast.error(res.error || 'Gagal membuat resep produksi');
        }
        setLoadingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Resep</div>
                    <div className="text-2xl font-black text-slate-800">{recipes.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Menunggu Publikasi</div>
                    <div className="text-2xl font-black text-amber-500">{recipes.filter(r => !r.isPublished).length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Komentar Pending</div>
                    <div className="text-2xl font-black text-rose-500">{pendingComments.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center flex items-center justify-center">
                    <button
                        onClick={() => window.open('/rasa-ibu/recipes/submit', '_blank')}
                        className="w-full py-2 bg-[#2D3A2D] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                        + Tambah Resep
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        {(['ALL', 'PENDING', 'COMMENTS'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-800' : 'text-gray-400 hover:text-slate-600'}`}
                            >
                                {tab === 'ALL' ? 'Semua Resep' : tab === 'PENDING' ? 'Butuh Review' : `Komentar (${pendingComments.length})`}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari resep..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'COMMENTS' ? (
                        <div className="p-6 space-y-4">
                            {pendingComments.length > 0 ? (
                                pendingComments.map((comment: any) => (
                                    <div key={comment.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-100">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{comment.authorName}</span>
                                                <div className="flex items-center gap-0.5 text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < comment.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-white rounded-full">Pada: {comment.recipeTitle}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{comment.content}"</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveComment(comment.recipeId, comment.id)}
                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                title="Setujui"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComment(comment.recipeId, comment.id)}
                                                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400">Tidak ada komentar yang menunggu moderasi.</div>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Resep</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Penulis</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Engagement</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecipes.map((recipe) => (
                                    <tr key={recipe.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    <img src={recipe.image || '/placeholder-recipe.jpg'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="font-bold text-slate-800 line-clamp-1">{recipe.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-slate-600">{recipe.authorName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-[10px] font-black uppercase text-slate-500 rounded-md">
                                                {recipe.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> <span className="text-[10px]">{recipe.views}</span></div>
                                                <div className="flex items-center gap-1"><Flame className="w-3 h-3" /> <span className="text-[10px]">{recipe.likesCount}</span></div>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    <span className={`text-[10px] ${recipe.comments?.some((c: any) => !c.isApproved) ? 'text-rose-500 font-bold' : ''}`}>
                                                        {recipe.comments?.length || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {recipe.isPublished ? (
                                                <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleConvertToProduction(recipe.id)}
                                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                                                    title="Jadikan Resep Produksi"
                                                >
                                                    <ChefHat className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleTogglePublish(recipe.id, recipe.isPublished)}
                                                    disabled={loadingId === recipe.id}
                                                    className={`p-2 rounded-lg transition-all ${recipe.isPublished ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                    title={recipe.isPublished ? "Sembunyikan" : "Terbitkan"}
                                                >
                                                    {loadingId === recipe.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (recipe.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
