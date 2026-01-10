'use client';

import { useState, useTransition } from 'react';

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
    const [active, setActive] = useState(initialCategory);
    const [isPending, startTransition] = useTransition();

    const handleClick = (cat: Category) => {
        startTransition(() => {
            setActive(cat.name);
            // Update URL with category filter
            const url = new URL(window.location.href);
            if (cat.name === 'Semua') {
                url.searchParams.delete('category');
            } else {
                url.searchParams.set('category', cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'));
            }
            window.history.pushState({}, '', url);
            window.location.reload(); // Reload to fetch filtered data
        });
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
                onClick={() => handleClick({ name: 'Semua' })}
                disabled={isPending}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${active === 'Semua'
                        ? 'bg-[#2D3A2D] text-[#FDFBF7]'
                        : 'bg-[#F9F7F2] text-[#8B7E66] hover:bg-[#F0EEE9]'
                    } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Semua
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.slug || cat.name}
                    onClick={() => handleClick(cat)}
                    disabled={isPending}
                    className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${active === cat.name
                            ? 'bg-[#2D3A2D] text-[#FDFBF7]'
                            : 'bg-[#F9F7F2] text-[#8B7E66] hover:bg-[#F0EEE9]'
                        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {cat.name} {cat.count !== undefined && `(${cat.count})`}
                </button>
            ))}
        </div>
    );
}
