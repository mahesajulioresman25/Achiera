
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ error: 'Order ID or Invoice required' }, { status: 400 });
        }

        // Common include object
        const includeConfig = {
            brand: {
                select: {
                    name: true,
                    paymentSettings: true
                }
            },
            statusLogs: { orderBy: { createdAt: 'desc' } },
            payments: { orderBy: { createdAt: 'desc' } },
            orderItems: {
                include: {
                    frozenVariant: {
                        include: {
                            product: {
                                include: {
                                    category: true
                                }
                            }
                        }
                    },
                    variant: true
                },
                orderBy: { createdAt: 'asc' }
            }
        } as const;

        // Try finding by ID first
        let order = await prisma.order.findUnique({
            where: { id },
            include: includeConfig
        });

        if (!order) {
            // Fallback to Invoice lookup
            order = await prisma.order.findUnique({
                where: { invoiceNo: id },
                include: includeConfig
            });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const safeOrder = order as any;

        // Process items with self-healing logic for missing data (legacy/broken orders)
        const enrichedItems = await Promise.all(safeOrder.orderItems.map(async (item: any) => {
            let imagePath = item.mockupResultPath;
            let subtotal = Number(item.subtotal);
            let name = item.name;
            let variantName = item.variantName;
            let categorySlug = 'siap-saji'; // Default

            // Enriched info from relations if available
            if (item.frozenVariant) {
                name = item.frozenVariant.product?.name || name;
                variantName = item.frozenVariant.name || variantName;
                imagePath = imagePath || item.frozenVariant.product?.image;
                categorySlug = item.frozenVariant.product?.category?.slug || 'siap-saji';
            } else if (item.variant) {
                variantName = item.variant.name || variantName;
            }

            return {
                id: item.id,
                name: name,
                variantName: variantName,
                quantity: item.quantity,
                subtotal: subtotal,
                mockupResultPath: imagePath,
                categorySlug: categorySlug
            };
        }));

        // Recalculate total if original was 0 (broken order)
        const calculatedTotal = enrichedItems.reduce((acc, item) => acc + item.subtotal, 0);
        const finalTotal = Number(safeOrder.total) === 0 ? calculatedTotal : Number(safeOrder.total);

        // Return safe public data
        return NextResponse.json({
            id: order.id,
            invoiceNo: safeOrder.invoiceNo,
            createdAt: safeOrder.createdAt,
            status: safeOrder.status,
            paymentMethod: safeOrder.paymentMethod,
            customerName: safeOrder.customerName,
            customerNote: safeOrder.customerNote,
            subtotal: Number(safeOrder.subtotal) === 0 ? calculatedTotal : Number(safeOrder.subtotal),
            total: finalTotal,

            // Legacy / Single Item Fields (Fallback for components expecting these)
            productName: enrichedItems[0]?.name,
            variantName: enrichedItems[0]?.variantName,
            variantImage: enrichedItems[0]?.mockupResultPath,

            quantity: safeOrder.quantity,
            logs: safeOrder.statusLogs,
            payments: safeOrder.payments,
            items: enrichedItems,
            paymentSettings: safeOrder.brand?.paymentSettings || { downPaymentPercentage: 50 },
            brandId: safeOrder.brandId,
            brandName: safeOrder.brand?.name || 'ACHIERA',
        });

    } catch (error) {
        console.error('Track order error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
