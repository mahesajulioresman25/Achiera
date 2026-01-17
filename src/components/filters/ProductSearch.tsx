'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Utensils, X, Loader2 } from 'lucide-react';

interface ProductSearchProps {
    placeholder?: string;
    defaultValue?: string;
}

export default function ProductSearch({
    placeholder = "Cari menu favorit Bunda...",
    defaultValue = ""
}: ProductSearchProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(defaultValue);
    const [isPending, startTransition] = useTransition();

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query === defaultValue) return;

            const params = new URLSearchParams(searchParams.toString());
            if (query) {
                params.set('q', query);
            } else {
                params.delete('q');
            }

            startTransition(() => {
                router.push(`/rasa-ibu/products?${params.toString()}`, { scroll: false });
            });
        }, 400);

        return () => clearTimeout(timer);
    }, [query, router, searchParams, defaultValue]);

    const handleClear = () => {
        setQuery('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        router.push(`/rasa-ibu/products?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="relative w-full md:w-96 group">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-6 pr-14 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:outline-none focus:ring-4 focus:ring-[#B2BCA2]/20 font-medium transition-all group-hover:border-[#B2BCA2] placeholder:text-[#8B7E66]/50"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {query && (
                    <button
                        onClick={handleClear}
                        className="p-1 hover:bg-white rounded-full text-stone-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${isPending ? 'bg-amber-500' : 'bg-[#2D3A2D] group-hover:bg-[#1A241A]'
                    }`}>
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Utensils className="w-4 h-4" />
                    )}
                </div>
            </div>
        </div>
    );
}
