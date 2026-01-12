'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface RecipeBookmarkButtonProps {
    recipeId: string;
    className?: string;
    iconClassName?: string;
}

export default function RecipeBookmarkButton({
    recipeId,
    className = "",
    iconClassName = "w-5 h-5"
}: RecipeBookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_recipes') || '[]');
        if (bookmarks.includes(recipeId)) {
            setIsBookmarked(true);
        }
    }, [recipeId]);

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_recipes') || '[]');
        let newIsBookmarked = !isBookmarked;

        if (newIsBookmarked) {
            if (!bookmarks.includes(recipeId)) bookmarks.push(recipeId);
            toast.success('Resep disimpan ke koleksi Anda!', {
                description: 'Anda dapat melihat resep ini kapan saja.',
                icon: '🔖'
            });
        } else {
            const index = bookmarks.indexOf(recipeId);
            if (index > -1) bookmarks.splice(index, 1);
            toast.info('Resep dihapus dari koleksi.');
        }

        setIsBookmarked(newIsBookmarked);
        localStorage.setItem('bookmarked_recipes', JSON.stringify(bookmarks));
    };

    if (!mounted) {
        return (
            <button className={`p-2 rounded-full bg-white/10 ${className}`}>
                <Bookmark className={`${iconClassName} text-white/40`} />
            </button>
        );
    }

    return (
        <button
            onClick={handleBookmark}
            className={`p-3 rounded-full transition-all flex items-center justify-center gap-2 ${isBookmarked
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20'
                } ${className}`}
            title={isBookmarked ? "Hapus dari koleksi" : "Simpan Resep"}
        >
            <Bookmark
                className={`${iconClassName} transition-all duration-300 ${isBookmarked ? 'fill-current' : ''}`}
            />
            {isBookmarked && <span className="text-xs font-bold hidden md:inline">Tersimpan</span>}
        </button>
    );
}
