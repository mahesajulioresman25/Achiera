import { NextRequest, NextResponse } from 'next/server';
import { deleteFlashSaleAction } from '@/lib/actions/commerce/flashSale';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ brandId: string, id: string }> }
) {
    const { brandId, id } = await params;
    try {
        const result = await deleteFlashSaleAction(id, brandId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[Flash Sale Delete API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
