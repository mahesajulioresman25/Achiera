'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RuleForm from '@/components/admin/pricing/RuleForm';
import { Loader2 } from 'lucide-react';

export default function EditRulePage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;
    const id = params.id as string;

    const [rule, setRule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRule = async () => {
            try {
                // We'll need a single GET endpoint for Rules too.
                const res = await fetch(`/api/admin/pricing/rules/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setRule(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRule();
    }, [id]);

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
    );

    if (!rule) return <div className="p-8">Rule not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">Edit Pricing Rule</h1>
            </div>

            <RuleForm brandSlug={brandSlug} initialData={rule} />
        </div>
    );
}
