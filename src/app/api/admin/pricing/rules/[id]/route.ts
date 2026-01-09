import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceScope } from '@prisma/client';

// GET /api/admin/pricing/rules/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const rule = await prisma.priceRule.findUnique({
            where: { id },
            include: { component: true }
        });

        if (!rule) {
            return NextResponse.json(
                { error: 'Rule not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(rule);
    } catch (error) {
        console.error('Failed to fetch rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/pricing/rules/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const {
            componentId,
            scope,
            scopeId,
            priority,
            currency,
            amount,
            minQty,
            maxQty,
            minOrderMeter,
            metadata,
            isActive,
            startAt,
            endAt
        } = body;

        const rule = await prisma.priceRule.update({
            where: { id },
            data: {
                componentId,
                scope: scope as PriceScope,
                scopeId: scopeId || null,
                priority: priority || 0,
                amount: Number(amount),
                minQty: minQty !== '' ? Number(minQty) : null,
                maxQty: maxQty !== '' ? Number(maxQty) : null,
                metadata: metadata || {},
                isActive: isActive,
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error('Failed to update rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/pricing/rules/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.priceRule.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete rule:', error);
        return NextResponse.json(
            { error: 'Failed to delete rule' },
            { status: 500 }
        );
    }
}
