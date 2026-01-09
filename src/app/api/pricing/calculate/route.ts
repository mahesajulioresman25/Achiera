import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice } from '@/lib/pricing/engine';
import { OrderInput } from '@/lib/pricing/types';

export async function POST(req: NextRequest) {
    try {
        const body: OrderInput = await req.json();

        // Validate input
        if (!body.variantId) {
            return NextResponse.json(
                { error: 'variantId is required' },
                { status: 400 }
            );
        }

        if (!body.qty || body.qty < 1) {
            return NextResponse.json(
                { error: 'qty must be at least 1' },
                { status: 400 }
            );
        }

        // Calculate price
        const result = await calculatePrice(body);

        // Convert Decimal to number for JSON serialization
        const response = {
            total: Number(result.total),
            breakdown: result.breakdown.map(item => ({
                ...item,
                unit: item.unit ? Number(item.unit) : undefined,
                amount: Number(item.amount)
            })),
            appliedRules: result.appliedRules,
            usedFallback: result.usedFallback
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Price calculation error:', error);

        if (error.message?.includes('not found')) {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
