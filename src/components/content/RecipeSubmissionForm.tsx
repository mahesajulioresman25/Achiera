'use client';

import React, { useState } from 'react';
import { ChefHat, Plus, Minus, Image as ImageIcon, Send, CheckCircle2, ShieldCheck, Gift } from 'lucide-react';
import { createRecipePost } from '@/lib/actions/rasa-ibu/recipes';
import { toast } from 'sonner';

interface RecipeSubmissionFormProps {
    brandId: string;
}

export default function RecipeSubmissionForm({ brandId }: RecipeSubmissionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        authorName: '',
        authorPhone: '',
        category: 'Sarapan',
        duration: 30,
        difficulty: 'Mudah',
        servings: 2,
        image: '',
        ingredients: [''],
        steps: [''],
        tips: ''
    });

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = value;
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const addIngredient = () => {
        setFormData({ ...formData, ingredients: [...formData.ingredients, ''] });
    };

    const removeIngredient = (index: number) => {
        const newIngredients = formData.ingredients.filter((_, i) => i !== index);
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const addStep = () => {
        setFormData({ ...formData, steps: [...formData.steps, ''] });
    };

    const removeStep = (index: number) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        setFormData({ ...formData, steps: newSteps });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.authorName || !formData.authorPhone || formData.ingredients.some(i => !i) || formData.steps.some(s => !s)) {
            toast.error('Mohon lengkapi data wajib (Judul, Nama, No. WhatsApp, Bahan, & Cara Buat)');
            return;
        }

        setIsSubmitting(true);
        const res = await createRecipePost(brandId, formData);

        if (res.success) {
            setHasSubmitted(true);
            toast.success('Resep berhasil dikirim! Menunggu moderasi admin.');
        } else {
            toast.error('Gagal mengirim resep');
        }
        setIsSubmitting(false);
    };

    if (hasSubmitted) {
        return (
            <div className="bg-[#E7F3E7] rounded-3xl p-12 text-center border-2 border-dashed border-[#B2D8B2]">
                <CheckCircle2 className="w-16 h-16 text-[#2D8A2D] mx-auto mb-6" />
                <h2 className="text-3xl font-black text-[#2D3A2D] mb-4">Yeay! Resep Bunda Terkirim!</h2>
                <p className="text-[#2D8A2D] text-lg max-w-md mx-auto mb-8">
                    Terima kasih telah berbagi inspirasi masakan lezat. Admin kami akan meninjau resep Bunda sebelum diterbitkan.
                </p>
                <button
                    onClick={() => {
                        setHasSubmitted(false);
                        setFormData({
                            title: '',
                            description: '',
                            authorName: '',
                            category: 'Sarapan',
                            duration: 30,
                            difficulty: 'Mudah',
                            servings: 2,
                            image: '',
                            ingredients: [''],
                            steps: [''],
                            tips: '',
                            authorPhone: ''
                        });
                    }}
                    className="px-8 py-3 bg-[#2D3A2D] text-white rounded-xl font-bold hover:bg-[#1A241A] transition-all"
                >
                    Kirim Resep Lainnya
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 md:p-10 shadow-2xl border border-[#E5E1D8] space-y-8 md:space-y-10 group mb-24 pb-24">
            <div className="text-center">
                <div className="w-16 h-16 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#B2BCA2] mx-auto mb-4 border border-[#E5E1D8]">
                    <ChefHat className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-[#2D3A2D]">Bagikan Resepmu</h2>
                <p className="text-gray-500 font-medium">Jadilah inspirasi bagi jutaan Ibu hebat lainnya</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#2D3A2D] border-l-4 border-[#B2BCA2] pl-4">1. Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Judul Resep *</label>
                        <input
                            type="text"
                            placeholder="Contoh: Sarden Tumis Pedas Kemangi"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nama Penulis *</label>
                        <input
                            type="text"
                            placeholder="Contoh: Bunda Ani"
                            value={formData.authorName}
                            onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">No. WhatsApp Bunda *</label>
                        <input
                            type="tel"
                            placeholder="Contoh: 08123456789"
                            value={formData.authorPhone}
                            onChange={(e) => setFormData({ ...formData, authorPhone: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                            required
                        />
                        <p className="text-[10px] text-gray-400 italic">Digunakan untuk pengiriman reward 50.000 Poin</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Deskripsi Singkat</label>
                    <textarea
                        placeholder="Ceritakan sedikit tentang resep ini..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm min-h-[80px]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                        >
                            <option>Sarapan</option>
                            <option>Makan Siang</option>
                            <option>Makan Malam</option>
                            <option>Camilan</option>
                            <option>Bekal Anak</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Durasi (Menit)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Kesulitan</label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                        >
                            <option>Mudah</option>
                            <option>Sedang</option>
                            <option>Sulit</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#2D3A2D] border-l-4 border-[#B2BCA2] pl-4">2. Bahan-bahan</h3>
                    <button
                        type="button"
                        onClick={addIngredient}
                        className="p-2 bg-[#F9F7F2] text-[#8B7E66] rounded-lg hover:bg-[#B2BCA2] hover:text-white transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3">
                    {formData.ingredients.map((ingredient, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                type="text"
                                placeholder={`Bahan ${idx + 1}`}
                                value={ingredient}
                                onChange={(e) => handleIngredientChange(idx, e.target.value)}
                                className="flex-grow px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                                required={idx === 0}
                            />
                            {formData.ingredients.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(idx)}
                                    className="p-3 text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[#2D3A2D] border-l-4 border-[#B2BCA2] pl-4">3. Cara Membuat</h3>
                    <button
                        type="button"
                        onClick={addStep}
                        className="p-2 bg-[#F9F7F2] text-[#8B7E66] rounded-lg hover:bg-[#B2BCA2] hover:text-white transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-4">
                    {formData.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] text-[#8B7E66] flex items-center justify-center font-black shrink-0">
                                {idx + 1}
                            </div>
                            <textarea
                                placeholder={`Langkah ke-${idx + 1}`}
                                value={step}
                                onChange={(e) => handleStepChange(idx, e.target.value)}
                                className="flex-grow px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm min-h-[60px]"
                                required={idx === 0}
                            />
                            {formData.steps.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeStep(idx)}
                                    className="p-3 text-red-400 hover:text-red-600 transition-colors mt-1"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Image & URL (Optional) */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#2D3A2D] border-l-4 border-[#B2BCA2] pl-4">4. Tambahan</h3>
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Foto Masakan (Opsional)</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Upload logic
                                const data = new FormData();
                                data.append('file', file);

                                const toastId = toast.loading('Mengupload foto...');
                                try {
                                    const res = await fetch('/api/upload/recipe-image', {
                                        method: 'POST',
                                        body: data
                                    });
                                    const result = await res.json();

                                    if (result.success) {
                                        setFormData({ ...formData, image: result.url });
                                        toast.success('Foto berhasil diupload', { id: toastId });
                                    } else {
                                        toast.error('Gagal mengupload foto', { id: toastId });
                                    }
                                } catch (err) {
                                    toast.error('Terjadi kesalahan saat upload', { id: toastId });
                                }
                            }}
                            className="w-full pl-12 pr-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B2BCA2] file:text-white hover:file:bg-[#2D3A2D]"
                        />
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                    </div>
                    {formData.image && (
                        <div className="mt-2 relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, image: '' })}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tips Spesial</label>
                    <textarea
                        placeholder="Ada rahasia agar masakan lebih mantap? Tulis di sini!"
                        value={formData.tips}
                        onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                        className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm min-h-[60px]"
                    />
                </div>
            </div>

            {/* Ethics & Rewards Notice */}
            <div className="bg-stone-50 rounded-2xl p-5 md:p-8 border border-stone-100 space-y-4">
                <div className="flex items-center gap-3 text-[#2D3A2D]">
                    <ShieldCheck className="w-6 h-6 text-[#B2BCA2]" />
                    <h4 className="font-black uppercase tracking-widest text-[10px] md:text-sm">Etika & Apresiasi Resep Bunda</h4>
                </div>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                    Dengan mempublikasikan resep di platform Rasa Ibu, Bunda setuju bahwa Rasa Ibu dapat menggunakan/mengadaptasi resep ini untuk dijadikan <span className="text-[#2D3A2D] font-black italic">Menu Resmi Rasa Ibu</span>.
                    <br /><br />
                    Jika resep Bunda terpilih, kami akan memberikan apresiasi berupa:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
                        <Gift className="w-8 h-8 text-amber-500" />
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Rewards</p>
                            <p className="text-sm font-black text-[#2D3A2D]">50.000 Poin Loyalty</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Pengakuan</p>
                            <p className="text-sm font-black text-[#2D3A2D]">Author Credits di Menu</p>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-stone-400 font-medium italic pt-2">
                    * Poin dapat digunakan secara langsung untuk berbelanja produk Rasa Ibu lainnya.
                </p>
            </div>

            {/* Sticky Submit Button */}
            <div className="sticky bottom-0 left-0 right-0 -mx-5 md:mx-0 p-5 md:p-0 bg-white/80 backdrop-blur-xl border-t border-[#E5E1D8] md:border-none md:bg-transparent md:backdrop-blur-none md:static z-[60]">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#2D3A2D] text-white rounded-2xl font-black text-lg hover:bg-[#1A241A] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#2D3A2D]/30 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <span className="animate-pulse">Mengirim Resep...</span>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            PUBLIKASIKAN RESEP SAYA
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
