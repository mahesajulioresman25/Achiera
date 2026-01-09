import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const configs = await prisma.mockupConfig.findMany({
            where: { isActive: true },
            orderBy: { displayName: 'asc' },
        });

        return NextResponse.json(configs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mockup configs' }, { status: 500 });
    }
}
