// Toggle Autonomy Level API - POST /api/autonomous-analytics/settings/autonomy-level
// Enables or disables specific autonomy level

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { brandId, level, enabled, performedBy } = body;

        if (!brandId || level === undefined || enabled === undefined || !performedBy) {
            return NextResponse.json(
                { error: 'brandId, level, enabled, and performedBy are required' },
                { status: 400 }
            );
        }

        if (![1, 2, 3].includes(level)) {
            return NextResponse.json(
                { error: 'level must be 1, 2, or 3' },
                { status: 400 }
            );
        }

        // Get current brand
        const brand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (!brand) {
            return NextResponse.json(
                { error: 'Brand not found' },
                { status: 404 }
            );
        }

        // Use paymentSettings as temporary storage for autonomy settings
        const paymentSettings = (brand.paymentSettings as any) || {};
        const autonomy = paymentSettings.autonomy || {};

        // Update level setting
        autonomy[`level${level}Enabled`] = enabled;
        paymentSettings.autonomy = autonomy;

        // Update brand
        await prisma.brand.update({
            where: { id: brandId },
            data: {
                paymentSettings: paymentSettings
            }
        });

        // Log to audit
        await prisma.auditLog.create({
            data: {
                userId: performedBy,
                brandId,
                action: `level${level}_${enabled ? 'enabled' : 'disabled'}`,
                entityType: 'Brand',
                entityId: brandId,
                metadata: {
                    level,
                    enabled
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: `Level ${level} ${enabled ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Error toggling autonomy level:', error);
        return NextResponse.json(
            { error: 'Failed to toggle autonomy level' },
            { status: 500 }
        );
    }
}
