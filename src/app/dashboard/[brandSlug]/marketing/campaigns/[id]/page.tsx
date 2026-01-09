import { prisma } from '@/lib/prisma';
import CampaignForm from '@/components/marketing/CampaignForm';

export default async function CampaignEditPage({ params }: { params: Promise<{ brandSlug: string, id: string }> }) {
    const { brandSlug, id } = await params;
    let campaign = null;

    if (id !== 'new') {
        campaign = await prisma.campaign.findUnique({
            where: { id: id }
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {id === 'new' ? 'Buat Campaign Baru' : 'Edit Campaign'}
                </h1>
            </div>

            <CampaignForm
                brandId={brandSlug}
                initialData={campaign}
            />
        </div>
    );
}
