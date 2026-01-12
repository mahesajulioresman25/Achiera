'use client';

import { useEffect } from 'react';

export default function RecentlyViewedTracker({ productId }: { productId: string }) {
    useEffect(() => {
        if (!productId) return;

        try {
            const history = JSON.parse(localStorage.getItem('rasa_ibu_history') || '[]');
            // Remove if already exists and move to front
            const newHistory = [productId, ...history.filter((id: string) => id !== productId)].slice(0, 10);
            localStorage.setItem('rasa_ibu_history', JSON.stringify(newHistory));
        } catch (e) {
            console.error('Failed to update history', e);
        }
    }, [productId]);

    return null;
}
