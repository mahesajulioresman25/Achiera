import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSuggestions } from '@/lib/suggestions/suggestionEngine';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    try {
        // 1. Fetch observation days from brand
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { createdAt: true }
        });

        const observationDays = brand ? Math.floor((Date.now() - new Date(brand.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

        // 2. Fetch or Generate suggestions
        let suggestions = await (prisma as any).suggestionDraft.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        if (suggestions.length === 0) {
            suggestions = await generateSuggestions({ brandId, observationDays });
        }

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Fetch Suggestions Error:', error);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
