import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceComponentType } from '@prisma/client';

// GET /api/admin/pricing/components - List all components
export async function GET(req: NextRequest) {
    try {
        const components = await prisma.priceComponent.findMany({
            include: {
                _count: {
                    select: { rules: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(components);
    } catch (error) {
        console.error('Failed to fetch components:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/admin/pricing/components - Create new component
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, name, description, type } = body;

        // Validation
        if (!code || !name || !type) {
            return NextResponse.json(
                { error: 'code, name, and type are required' },
                { status: 400 }
            );
        }

        if (!Object.values(PriceComponentType).includes(type)) {
            return NextResponse.json(
                { error: 'Invalid component type' },
                { status: 400 }
            );
        }

        // Check for duplicate code
        const existing = await prisma.priceComponent.findUnique({
            where: { code }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Component with this code already exists' },
                { status: 409 }
            );
        }

        const component = await prisma.priceComponent.create({
            data: {
                code,
                name,
                description,
                type,

export const dynamic = 'force-dynamic';
                isActive: true
            }
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        console.error('Failed to create component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
