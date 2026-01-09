
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
    companyName: z.string().min(1, 'Company Name is required'),
    contactName: z.string().min(1, 'Name is required'),
    email: z.string().email(),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

// POST /api/public/merch/catalogue-request
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return new NextResponse('Invalid request data', { status: 400 });
        }

        const { companyName, contactName, email, phone, notes } = validation.data;

        // Get Merch Brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return new NextResponse('Brand configuration error', { status: 500 });
        }

        // Create Request
        const request = await prisma.catalogueRequest.create({
            data: {
                brandId: brand.id,
                companyName,
                contactName,
                email,
                phone: phone || '',
                notes: notes || '',
                status: 'NEW'
            }
        });

        // TODO: Send email notification to admin (using EmailIntegration if available)
        // For now just save to DB.

        return NextResponse.json(request);
    } catch (error) {
        console.error('[CATALOGUE_REQUEST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
