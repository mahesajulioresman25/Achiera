// Update Budget Limits API - POST /api/autonomous-analytics/settings/budget-limits
// Updates budget limits (CFO only) - Simplified without BudgetPolicy table

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            brandId,
            daily_execution_limit,
            daily_financial_cap,
            weekly_execution_limit,
            weekly_financial_cap,
            performedBy
        } = body;

        if (!brandId || !performedBy) {
            return NextResponse.json(
                { error: 'brandId and performedBy are required' },
                { status: 400 }
            );
        }

        // Validate limits
        if (daily_execution_limit < 1 || daily_financial_cap < 1000000) {
            return NextResponse.json(
                { error: 'Invalid budget limits' },
                { status: 400 }
            );
        }

        // Store in Brand paymentSettings as temporary solution
        const brand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (!brand) {
            return NextResponse.json(
                { error: 'Brand not found' },
                { status: 404 }
            );
        }

        const paymentSettings = (brand.paymentSettings as any) || {};
        paymentSettings.budgetLimits = {
            daily_execution_limit,
            daily_financial_cap,
            weekly_execution_limit,
            weekly_financial_cap,
            updatedAt: new Date()
        };

        await prisma.brand.update({
            where: { id: brandId },
            data: {
                paymentSettings
            }
        });

        // Log to audit
        await prisma.auditLog.create({
            data: {
                userId: performedBy,
                brandId,
                action: 'budget_limits_updated',
                entityType: 'Brand',
                entityId: brandId,
                metadata: {
                    daily_execution_limit,
                    daily_financial_cap,
                    weekly_execution_limit,
                    weekly_financial_cap
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Budget limits updated successfully'
        });
    } catch (error) {
        console.error('Error updating budget limits:', error);
        return NextResponse.json(
            { error: 'Failed to update budget limits' },
            { status: 500 }
        );
    }
}
