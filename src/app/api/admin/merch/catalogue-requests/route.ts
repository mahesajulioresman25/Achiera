import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/merch/catalogue-requests - List all catalogue requests
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query params for pagination
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');

        // Get merch brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
        }

        // Build where clause
        const where: any = { brandId: brand.id };
        if (status) {
            where.status = status;
        }

        // Fetch requests with pagination
        const [requests, total] = await Promise.all([
            prisma.catalogueRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.catalogueRequest.count({ where })
        ]);

        return NextResponse.json({
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching catalogue requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
