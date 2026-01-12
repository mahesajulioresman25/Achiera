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
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'REVIEWS'>('ALL');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Filter Logic
    const filteredRecipes = recipes.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(r => {
        if (activeTab === 'PENDING') return !r.isPublished;
        return true;
    });

    // Flatten all comments for moderation (Review Only, since Auto-Approved)
    const allComments = recipes.flatMap(r =>
        (r.comments || []).map((c: any) => ({ ...c, recipeTitle: r.title }))
    );

    const handleTogglePublish = async (recipeId: string, currentStatus: boolean) => {
        setLoadingId(recipeId);
        const promise = toggleRecipePublish(brandId, recipeId, !currentStatus);

        toast.promise(promise, {
            loading: 'Mengupdate status...',
            success: (res) => {
                if (res.success) {
                    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, isPublished: !currentStatus } : r));
                    return currentStatus ? 'Resep disembunyikan' : 'Resep dipublikasikan!';
                }
                throw new Error('Gagal update');
            },
            error: 'Terjadi kesalahan'
        });

        try { await promise; } finally { setLoadingId(null); }
    };

    const handleDeleteRecipe = async (recipeId: string) => {
        if (!confirm('Hapus resep ini secara permanen?')) return;

        setLoadingId(recipeId);
        const res = await deleteRecipePost(brandId, recipeId);
        if (res.success) {
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            toast.success('Resep berhasil dihapus');
        } else {
            toast.error('Gagal menghapus resep');
        }
        setLoadingId(null);
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
        const promise = createProductionRecipeFromPost(brandId, recipeId);

        toast.promise(promise, {
            loading: 'Sedang menganalisis bahan...',
            success: (res) => {
                if (res.success && res.data) {
                    return `Sukses! ${res.data.matchesCount} bahan terhubung otomatis. Cek menu Produksi.`;
                }
                throw new Error(res.error || 'Gagal konversi');
            },
            error: (err) => `Gagal: ${err.message}`
        });

        try { await promise; } finally { setLoadingId(null); }
    };

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Kreasi</div>
                    <div className="text-3xl font-black text-slate-800">{recipes.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Menunggu Review</div>
                    <div className="text-3xl font-black text-amber-500">{recipes.filter(r => !r.isPublished).length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Ulasan</div>
                    <div className="text-3xl font-black text-emerald-600">{allComments.length}</div>
                </div>
                <div className="bg-[#2D3A2D] p-6 rounded-2xl shadow-lg border border-[#2D3A2D] text-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#1A241A] transition-colors"
                    onClick={() => window.open('/rasa-ibu/recipes/submit', '_blank')}>
                    <ChefHat className="w-8 h-8 opacity-80" />
                    <span className="font-bold text-sm">+ Input Resep Manual</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-10">
                    <div className="flex bg-gray-100/50 p-1.5 rounded-xl">
                        {(['ALL', 'PENDING', 'REVIEWS'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                        ? 'bg-white shadow-md text-slate-800 scale-105'
                                        : 'text-gray-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab === 'ALL' ? 'Semua Resep' : tab === 'PENDING' ? 'Butuh Persetujuan' : 'Ulasan Masuk'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari kreasi resep..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-amber-500/20 transition-all font-medium placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto relative">
                    {activeTab === 'REVIEWS' ? (
                        <div className="p-6 space-y-4">
                            {allComments.length > 0 ? (
                                allComments.map((comment: any) => (
                                    <div key={comment.id} className="p-5 bg-gray-50/50 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4 border border-gray-100 hover:border-gray-200 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                                                    {comment.authorName.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 text-sm block">{comment.authorName}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white px-2 rounded-full border border-gray-100">
                                                        pada {comment.recipeTitle}
                                                    </span>
                                                </div>
                                                <div className="flex gap-0.5 ml-auto md:ml-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < comment.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 pl-11 leading-relaxed">"{comment.content}"</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(comment.recipeId, comment.id)}
                                            className="self-end md:self-center p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                            title="Hapus Spam"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-4">
                                    <MessageSquare className="w-12 h-12 opacity-20" />
                                    <p>Belum ada ulasan masuk.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-5 pl-8">Info Resep</th>
                                    <th className="px-6 py-5">Penulis</th>
                                    <th className="px-6 py-5">Stats</th>
                                    <th className="px-6 py-5 text-center">Bridge</th>
                                    <th className="px-6 py-5 text-right pr-8">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecipes.map((recipe) => (
                                    <tr key={recipe.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="px-6 py-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shadow-sm shrink-0">
                                                    <img src={recipe.image || '/placeholder-recipe.jpg'} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-1">{recipe.title}</div>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-gray-100 text-[10px] font-bold text-gray-500 rounded-md uppercase tracking-wider">
                                                        {recipe.category || 'Umum'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-600">{recipe.authorName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-gray-400">
                                                <div className="flex flex-col items-center tooltip" title="Views">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10px] font-bold mt-0.5">{recipe.views}</span>
                                                </div>
                                                <div className="flex flex-col items-center" title="Likes">
                                                    <Flame className="w-4 h-4 text-rose-400" />
                                                    <span className="text-[10px] font-bold mt-0.5">{recipe.likesCount}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleConvertToProduction(recipe.id)}
                                                    className="group/btn flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-indigo-200"
                                                    title="Convert to Production Recipe"
                                                >
                                                    <ChefHat className="w-4 h-4" />
                                                    <span className="text-xs font-bold hidden xl:inline">Convert</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleTogglePublish(recipe.id, recipe.isPublished)}
                                                    disabled={loadingId === recipe.id}
                                                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${recipe.isPublished
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 animate-pulse'
                                                        }`}
                                                >
                                                    {loadingId === recipe.id ? (
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        recipe.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                                    className="p-2.5 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
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
