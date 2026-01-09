'use client';

import { useParams } from 'next/navigation';
import ComponentForm from '@/components/admin/pricing/ComponentForm';

export default function NewComponentPage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">Create New Component</h1>
                <p className="text-stone-500 mt-1">Define a new pricing building block</p>
            </div>

            <ComponentForm brandSlug={brandSlug} />
        </div>
    );
}
