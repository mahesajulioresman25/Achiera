import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import CMSForm from '@/components/dashboard/rasa-ibu/CMSForm';

export default async function ContentPage() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    if (!brand) return <div>Brand Not Found</div>;

    // Create config if not exists
    let config = brand.brandConfig;
    if (!config) {
        config = await prisma.brandConfig.create({
            data: { brandId: brand.id }
        });
    }

    return (
        <div className="p-8">
            <Link
                href="/dashboard/rasa-ibu"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#8B7E66] hover:text-[#2D3A2D] transition-colors mb-6 group"
            >
                <div className="p-2 bg-white rounded-xl border border-[#E5E1D8] group-hover:bg-amber-50 group-hover:border-amber-200 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Kembali ke Dashboard</span>
            </Link>

            <h1 className="text-3xl font-black text-[#2D3A2D] mb-2 tracking-tight">Content Manager</h1>
            <p className="text-[#8B7E66] font-medium mb-8">Customize your public website content instantly.</p>

            <CMSForm brandId={brand.id} initialData={config} />
        </div>
    );
}
