import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/merch/settings - Fetch merch settings for public page
export async function GET() {
    try {
        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        // Return settings or default values
        const defaults = {
            heroTitle: 'Modern Brands Deserve Thoughtful Merchandise',
            heroSubtitle: 'ACHIERA Merchandise helps companies create lasting impressions with high-quality products.',
            heroTagline: '',
            heroCtaLabel: 'Request Catalogue',
            heroCtaLink: '/contact',
            highlightLine: '',
            mockupTitle: 'Try Live Mockup',
            mockupSubtitle: 'See your design on our products',
            mockupTagline: 'Fast, accurate, and free',
            mockupEnabled: true
        };

        if (!brand) {
            console.warn('Merch brand not found, using defaults');
            return NextResponse.json(defaults);
        }

        // Fetch settings for this brand
        const settings = await prisma.merchSettings.findFirst({
            where: { brandId: brand.id }
        });

        // Return settings or default values
        return NextResponse.json(settings || defaults);
    } catch (error) {
        console.error('Error fetching public merch settings:', error);
        // Fallback to defaults on error
        return NextResponse.json({
            heroTitle: 'Modern Brands Deserve Thoughtful Merchandise',
            heroSubtitle: 'ACHIERA Merchandise helps companies create lasting impressions with high-quality products.',
            heroTagline: '',
            heroCtaLabel: 'Request Catalogue',
            heroCtaLink: '/contact',
            highlightLine: '',
            mockupTitle: 'Try Live Mockup',
            mockupSubtitle: 'See your design on our products',
            mockupTagline: 'Fast, accurate, and free',
            mockupEnabled: true
        });
    }
}
