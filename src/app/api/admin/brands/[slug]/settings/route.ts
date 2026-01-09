import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params;
        const { slug } = resolvedParams;

        const brand = await prisma.brand.findUnique({
            where: { slug },
            select: { paymentSettings: true }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        return NextResponse.json({
            paymentSettings: brand.paymentSettings || { downPaymentPercentage: 50 } // Default
        });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params;
        const { slug } = resolvedParams;
        const body = await req.json();

        // Validate body (e.g., allow specific keys)
        const paymentSettings = {
            downPaymentPercentage: Number(body.downPaymentPercentage),
            allowFullPayment: Boolean(body.allowFullPayment ?? false)
        };

        const updatedBrand = await prisma.brand.update({
            where: { slug },
            data: {
                paymentSettings: paymentSettings
            }
        });

        return NextResponse.json({ success: true, paymentSettings: updatedBrand.paymentSettings });
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
