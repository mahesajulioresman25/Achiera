'use client';

import { useParams } from 'next/navigation';
import RuleForm from '@/components/admin/pricing/RuleForm';

export default function NewRulePage() {
    const params = useParams();
    const brandSlug = params.brandSlug as string;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-900">New Pricing Rule</h1>
                <p className="text-stone-500 mt-1">Set specific price adjustments or fees</p>
            </div>

            <RuleForm brandSlug={brandSlug} />
        </div>
    );
}
