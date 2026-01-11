'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { addRecipeComment } from '@/lib/actions/rasa-ibu/recipes';
import { toast } from 'sonner';

interface Comment {
    id: string;
    authorName: string;
    content: string;
    rating: number;
    createdAt: Date;
}

interface RecipeCommentsProps {
    recipeId: string;
    initialComments: any[];
}

export default function RecipeComments({ recipeId, initialComments }: RecipeCommentsProps) {
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [authorName, setAuthorName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment || !authorName) {
            toast.error('Nama dan komentar harus diisi');
            return;
        }

        setIsSubmitting(true);
        const res = await addRecipeComment(recipeId, {
            content: newComment,
            authorName,
            rating
        });

        if (res.success) {
            setHasSubmitted(true);
            setNewComment('');
            setRating(5);
            toast.success('Komentar terkirim! Menunggu moderasi admin.');
        } else {
            toast.error('Gagal mengirim komentar');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#E5E1D8]">
            <h2 className="text-2xl font-black text-[#2D3A2D] mb-8 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-[#B2BCA2]" />
                Komentar & Ulasan
            </h2>

            {/* Existing Comments */}
            <div className="space-y-6 mb-10">
                {comments.length > 0 ? (
                    comments.map((comment: any) => (
                        <div key={comment.id} className="border-b border-gray-50 pb-6 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] font-bold text-xs">
                                        {comment.authorName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-[#2D3A2D]">{comment.authorName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < comment.rating ? 'fill-current' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed ml-10">
                                {comment.content}
                            </p>
                            <div className="text-[10px] text-gray-400 mt-2 ml-10">
                                {new Date(comment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-6 text-gray-400 italic text-sm">
                        Belum ada ulasan. Jadilah yang pertama memberikan ulasan!
                    </p>
                )}
            </div>

            {/* Comment Form */}
            {!hasSubmitted ? (
                <form onSubmit={handleSubmit} className="bg-[#F9F7F2] rounded-2xl p-6 border border-[#E5E1D8]">
                    <h3 className="font-bold text-[#2D3A2D] mb-4">Tulis Ulasan</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Nama Anda"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
                            required
                        />
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-[#E5E1D8]">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Rating:</span>
                            <div className="flex items-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className="hover:scale-110 transition-transform"
                                    >
                                        <Star className={`w-5 h-5 ${s <= rating ? 'fill-current' : 'text-gray-200'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <textarea
                        placeholder="Apa pendapat Bunda tentang resep ini?"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm min-h-[100px] mb-4"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#2D3A2D] text-white rounded-xl font-bold hover:bg-[#1A241A] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Mengirim...</span>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Kirim Ulasan
                            </>
                        )}
                    </button>
                </form>
            ) : (
                <div className="bg-[#E7F3E7] rounded-2xl p-8 border border-[#B2D8B2] text-center">
                    <CheckCircle2 className="w-12 h-12 text-[#2D8A2D] mx-auto mb-4" />
                    <h3 className="text-[#2D3A2D] font-black text-xl mb-2">Terima Kasih, Bunda!</h3>
                    <p className="text-[#2D8A2D] text-sm">
                        Ulasan Bunda telah kami terima dan akan segera tampil setelah diverifikasi oleh admin.
                    </p>
                    <button
                        onClick={() => setHasSubmitted(false)}
                        className="mt-6 text-sm font-bold text-[#2D3A2D] underline decoration-[#B2BCA2] decoration-2 underline-offset-4"
                    >
                        Tulis ulasan lain
                    </button>
                </div>
            )}
        </div>
    );
}
