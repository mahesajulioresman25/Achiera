import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PriceScope } from '@prisma/client';

// GET /api/admin/pricing/rules - List all rules with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const componentId = searchParams.get('componentId');
        const scope = searchParams.get('scope');
        const isActive = searchParams.get('isActive');

        const where: any = {};

        if (componentId) {
            where.componentId = componentId;
        }

        if (scope) {
            where.scope = scope as PriceScope;
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        const rules = await prisma.priceRule.findMany({
            where,
            include: {
                component: {
                    select: {
                        code: true,
                        name: true,
                        type: true

export const dynamic = 'force-dynamic';
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(rules);
    } catch (error) {
        console.error('Failed to fetch rules:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/admin/pricing/rules - Create new rule
export async function POST(req: NextRequest) {
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

        // Validation
        if (!componentId || !scope || amount === undefined) {
            return NextResponse.json(
                { error: 'componentId, scope, and amount are required' },
                { status: 400 }
            );
        }

        // Verify component exists
        const component = await prisma.priceComponent.findUnique({
            where: { id: componentId }
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        const rule = await prisma.priceRule.create({
            data: {
                componentId,
                scope: scope as PriceScope,
                scopeId: scopeId || null,
                priority: priority || 0,
                currency: currency || 'IDR',
                amount,
                minQty: minQty || null,
                maxQty: maxQty || null,
                minOrderMeter: minOrderMeter || null,
                metadata: metadata || null,
                isActive: isActive !== undefined ? isActive : true,
                startAt: startAt ? new Date(startAt) : null,
                endAt: endAt ? new Date(endAt) : null
            },
            include: {
                component: true
            }
        });

        // Create audit log
        await prisma.priceHistory.create({
            data: {
                ruleId: rule.id,
                action: 'CREATED',
                payload: rule,
                performedBy: null // TODO: Add user ID from session
            }
        });

        return NextResponse.json(rule, { status: 201 });
    } catch (error) {
        console.error('Failed to create rule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
