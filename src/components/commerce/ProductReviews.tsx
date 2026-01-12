'use client';

import { useState } from 'react';
import { Star, MessageSquare, User, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { addProductReviewAction } from '@/lib/actions/commerce/reviews';

interface Review {
    id: string;
    customerName: string;
    rating: number;
    reviewText: string;
    reviewDate: Date;
    platform?: string;
}

interface ProductReviewsProps {
    brandId: string;
    productName: string;
    initialReviews: Review[];
}

export default function ProductReviews({ brandId, productName, initialReviews }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !reviewText) {
            toast.error('Mohon isi nama dan ulasan Bunda.');
            return;
        }

        setIsSubmitting(true);
        const res = await addProductReviewAction({
            brandId,
            productName,
            rating,
            reviewText,
            customerName
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success('Terima kasih atas ulasan cantiknya, Bunda! ✨');
            // Optimistic update
            const newReview: Review = {
                id: Math.random().toString(),
                customerName,
                rating,
                reviewText,
                reviewDate: new Date(),
                platform: 'WEBSITE'
            };
            setReviews([newReview, ...reviews]);
            setReviewText('');
            setShowForm(false);
        } else {
            toast.error('Gagal mengirim ulasan.');
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-[#F9F7F2] shadow-sm">
                <div>
                    <h3 className="text-2xl font-black text-[#2D3A2D]">Ulasan Menu</h3>
                    <p className="text-sm text-[#8B7E66]">Apa kata Bunda lainnya tentang menu ini?</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-8 py-3 bg-[#2D3A2D] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-green-900/10"
                >
                    {showForm ? 'Batal Mengulas' : 'Tulis Ulasan Bunda'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-[#FDFBF7] p-8 rounded-3xl border-2 border-dashed border-[#E5E1D8] space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nama Bunda</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                placeholder="Nama Bunda..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Rating Rasa</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`transition-all ${rating >= s ? 'text-amber-500 scale-110' : 'text-gray-200'}`}
                                    >
                                        <Star className={`w-8 h-8 ${rating >= s ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Ulasan Bunda</label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] min-h-[100px]"
                            placeholder="Ceritakan pengalaman Bunda menyajikan menu ini..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#B2BCA2] text-[#2D3A2D] py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#2D3A2D] hover:text-white transition-all disabled:opacity-50 shadow-md"
                    >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan Sekarang'} <Send className="w-4 h-4" />
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 gap-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-[#F9F7F2] italic text-gray-400">
                        Belum ada ulasan untuk menu ini. Jadilah yang pertama mengulas!
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white p-8 rounded-3xl border border-[#F9F7F2] shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                            {review.rating === 5 && (
                                <div className="absolute -top-1 -right-1">
                                    <div className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-[0.2em] transform rotate-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Rekomendasi Bunda
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#F9F7F2] rounded-full flex items-center justify-center text-[#B2BCA2]">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-[#2D3A2D] text-sm">{review.customerName}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-current' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-[#8B7E66] font-bold">
                                            {new Date(review.reviewDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[#4A5D4A] leading-relaxed italic text-sm">
                                "{review.reviewText}"
                            </p>

                            <div className="flex items-center gap-2 pt-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${review.platform === 'WEBSITE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                    {review.platform === 'WEBSITE' ? 'Terverifikasi' : 'Gofood/Grabfood'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
