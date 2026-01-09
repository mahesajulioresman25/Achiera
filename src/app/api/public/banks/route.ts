import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        // Filter: banks that belong to this brand OR are global (brandId: null)
        const banks = await prisma.bankAccount.findMany({
            where: {
                isActive: true,
                OR: [
                    { brandId: brandId },
                    { brandId: null }
                ]
            },
            select: {
                id: true,
                bankName: true,
                accountNumber: true,
                accountHolder: true,
                logo: true
            }
        });
        return NextResponse.json(banks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 });
    }
}
