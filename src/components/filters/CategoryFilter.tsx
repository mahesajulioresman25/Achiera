'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
    name: string;
    slug?: string;
    count?: number;
}

interface CategoryFilterProps {
    categories: Category[];
    initialCategory?: string;
}

export default function CategoryFilter({ categories, initialCategory = 'Semua' }: CategoryFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [active, setActive] = useState(initialCategory);
    const [isPending, startTransition] = useTransition();

    const handleClick = (cat: Category) => {
        startTransition(() => {
            setActive(cat.name);
            const params = new URLSearchParams(searchParams.toString());

            if (cat.name === 'Semua') {
                params.delete('category');
            } else {
                params.set('category', cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'));
            }

            router.push(`/rasa-ibu/products?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
                onClick={() => handleClick({ name: 'Semua' })}
                disabled={isPending}
                className={`px-6 py-3 rounded-full text-sm font-black whitespace-nowrap transition-all duration-300 shadow-sm ${active === 'Semua'
                        ? 'bg-[#2D3A2D] text-[#FDFBF7] shadow-lg shadow-[#2D3A2D]/20 -translate-y-0.5'
                        : 'bg-white text-[#8B7E66] hover:bg-[#F9F7F2] border border-[#E5E1D8]'
                    } ${isPending ? 'opacity-50' : ''}`}
            >
                Semua
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.slug || cat.name}
                    onClick={() => handleClick(cat)}
                    disabled={isPending}
                    className={`px-6 py-3 rounded-full text-sm font-black whitespace-nowrap transition-all duration-300 shadow-sm ${active === cat.name
                            ? 'bg-[#2D3A2D] text-[#FDFBF7] shadow-lg shadow-[#2D3A2D]/20 -translate-y-0.5'
                            : 'bg-white text-[#8B7E66] hover:bg-[#F9F7F2] border border-[#E5E1D8]'
                        } ${isPending ? 'opacity-50' : ''}`}
                >
                    {cat.name} {cat.count !== undefined && <span className="ml-1 opacity-50">({cat.count})</span>}
                </button>
            ))}
        </div>
    );
}
