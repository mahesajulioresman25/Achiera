import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { toggleRecipeLike } from '@/lib/actions/rasa-ibu/recipes';

interface RecipeLikeButtonProps {
    brandId: string;
    recipeId: string;
    initialLikes: number;
    className?: string;
    iconClassName?: string;
    showCount?: boolean;
}

export default function RecipeLikeButton({
    brandId,
    recipeId,
    initialLikes,
    className = "",
    iconClassName = "w-4 h-4",
    showCount = true
}: RecipeLikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        // Get or Generate Device ID
        let deviceId = localStorage.getItem('recipe_device_id');
        if (!deviceId) {
            deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            localStorage.setItem('recipe_device_id', deviceId);
        }
        setUserId(deviceId);

        // Check local storage for liked status (optimistic UI)
        const likedRecipes = JSON.parse(localStorage.getItem('liked_recipes') || '[]');
        if (likedRecipes.includes(recipeId)) {
            setIsLiked(true);
        }
    }, [recipeId]);

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userId) return;

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
        setIsAnimating(true);

        // Update Local Storage
        const likedRecipes = JSON.parse(localStorage.getItem('liked_recipes') || '[]');
        if (newIsLiked) {
            if (!likedRecipes.includes(recipeId)) likedRecipes.push(recipeId);
        } else {
            const index = likedRecipes.indexOf(recipeId);
            if (index > -1) likedRecipes.splice(index, 1);
        }
        localStorage.setItem('liked_recipes', JSON.stringify(likedRecipes));

        // Call Server Action
        const res = await toggleRecipeLike(brandId, recipeId, userId);
        if (res.success && res.likes !== undefined) {
            setLikes(res.likes);
            setIsLiked(res.isLiked || false);
        }

        setTimeout(() => setIsAnimating(false), 300);
    };

    if (!mounted) {
        return (
            <button className={`flex items-center gap-1 ${className}`}>
                <Flame className={`${iconClassName} text-pink-500`} />
                {showCount && <span className="text-pink-500 font-bold">{initialLikes}</span>}
            </button>
        );
    }

    return (
        <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-all group ${className} ${isAnimating ? 'scale-125' : 'scale-100'}`}
            title={isLiked ? "Batal Suka" : "Suka Resep Ini"}
        >
            <Flame
                className={`${iconClassName} transition-all duration-300 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-gray-400 group-hover:text-pink-400 group-hover:fill-pink-100'}`}
            />
            {showCount && (
                <span className={`font-bold transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-500 group-hover:text-pink-400'}`}>
                    {likes}
                </span>
            )}
        </button>
    );
}
