'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ComponentForm from '@/components/admin/pricing/ComponentForm';
import { Loader2 } from 'lucide-react';

export default function EditComponentPage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;
    const id = params.id as string;

    const [component, setComponent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComponent = async () => {
            try {
                // We'll need a single GET endpoint. For now, filter from list or create new endpoint? 
                // Let's assume we create a [id] GET endpoint next.
                // Using a direct find for now if endpoint not ready, but better to query API.
                // Actually, the list endpoint returns all. We can't filter server side yet?
                // Let's implement specific GET endpoint logic or use the list as fallback 
                // But efficient practice: GET /api/admin/pricing/components/[id]

                const res = await fetch(`/api/admin/pricing/components/${id}`);

                if (res.ok) {
                    const data = await res.json();
                    setComponent(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchComponent();
    }, [id]);

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
    );

    if (!component) return <div className="p-8">Component not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">Edit Component</h1>
            </div>

            <ComponentForm brandSlug={brandSlug} initialData={component} />
        </div>
    );
}
