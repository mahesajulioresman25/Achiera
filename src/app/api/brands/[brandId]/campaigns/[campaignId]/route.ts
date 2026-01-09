import { NextRequest, NextResponse } from 'next/server';
import { deleteCampaignAction } from '@/lib/actions/commerce/campaigns';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string, campaignId: string }> }
) {
    const { brandId, campaignId } = await params;
    try {
        const result = await deleteCampaignAction(campaignId, brandId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Campaign Delete API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
