import { prisma } from '@/lib/prisma';
import FlashSaleManager from '@/components/marketing/FlashSaleManager';

export default async function FlashSalePage({ params }: { params: { brandSlug: string } }) {
    const brand = await prisma.brand.findUnique({
        where: { slug: params.brandSlug }
    });

    if (!brand) return <div>Brand not found</div>;

    // 1. Get Existing Config
    const config = await prisma.flashSaleConfig.findFirst({
        where: { brandId: brand.id }
    });

    return (
        <div className="space-y-6">
            <FlashSaleManager
                brandId={brand.id}
                initialConfig={config}
                onClose={() => { }}
            />
        </div>
    );
}
