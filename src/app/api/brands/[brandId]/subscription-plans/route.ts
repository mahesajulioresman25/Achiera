import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    try {
        const { brandId } = await params;
        const plans = await (prisma as any).subscriptionPlan.findMany({
            where: { brandId },
            include: {
                planProducts: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    try {
        const { brandId: paramBrandId } = await params;
        const body = await request.json();

        // Use brandId from body (sent by frontend) as primary source
        const brandId = body.brandId || paramBrandId;


        if (!brandId) {
            return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
        }

        // Basic Validation with detailed messages
        const missingFields = [];
        if (!body.name) missingFields.push('name');
        if (!body.price && body.price !== 0) missingFields.push('price');
        if (!body.interval) missingFields.push('interval');

        if (missingFields.length > 0) {
            console.error('[Subscription Plan POST] Missing fields:', missingFields);
            return NextResponse.json({
                error: "Missing required fields",
                missingFields,
                received: { name: body.name, price: body.price, interval: body.interval }
            }, { status: 400 });
        }

        const plan = await (prisma as any).subscriptionPlan.create({
            data: {
                brand: {
                    connect: { id: brandId }
                },
                name: body.name,
                description: body.description,
                price: body.price,
                interval: body.interval,
                type: body.type || 'FIXED',
                limitItems: body.limitItems || null,
                features: body.features || [],
                isActive: body.isActive ?? true,
                isScheduleFlexible: body.isScheduleFlexible ?? true,
                planProducts: {
                    create: body.planProducts?.map((pp: any) => ({
                        variantId: pp.variantId,
                        subscriptionPrice: pp.subscriptionPrice,
                        quantity: pp.quantity || 1
                    })) || []
                }
            },
            include: {
                planProducts: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error creating subscription plan:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create plan";
        return NextResponse.json({
            error: "Gagal menyimpan paket",
            details: errorMessage
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ brandId: string }> }
) {
    try {
        const { brandId } = await params;
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Update plan and its products
        const plan = await (prisma as any).subscriptionPlan.update({
            where: { id: body.id, brandId },
            data: {
                name: body.name,
                description: body.description,
                price: body.price,
                interval: body.interval,
                type: body.type,
                limitItems: body.limitItems,
                features: body.features,
                isActive: body.isActive,
                isScheduleFlexible: body.isScheduleFlexible,
                // Nested delete and create for simplicity
                planProducts: body.planProducts ? {
                    deleteMany: {},
                    create: body.planProducts.map((pp: any) => ({
                        variantId: pp.variantId,
                        subscriptionPrice: pp.subscriptionPrice,
                        quantity: pp.quantity || 1
                    }))
                } : undefined
            },
            include: {
                planProducts: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(plan);

    } catch (error) {
        console.error("Error updating subscription plan:", error);
        return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }
}
