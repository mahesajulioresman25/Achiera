'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '../../hooks/useDebounce';

export default function RecipeSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) {
            params.set('q', debouncedSearch);
        } else {
            params.delete('q');
        }
        router.push(`?${params.toString()}`);
    }, [debouncedSearch, router]);

    return (
        <div className="relative w-full md:w-80">
            <input
                type="text"
                placeholder="Cari resep sarden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-5 pr-12 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] text-sm"
            />
            {searchTerm ? (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            ) : null}
            <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B2BCA2] w-5 h-5" />
        </div>
    );
}
