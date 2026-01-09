
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    shippingAddress: z.string().min(1),
    items: z.array(z.object({
        productId: z.string(),
        variantId: z.string(),
        name: z.string(),
        variantName: z.string().optional(),
        quantity: z.number().min(1),
        price: z.number(),
        image: z.string().optional(),
        mockupResultPath: z.string().optional(),
        metadata: z.any().optional()
    }))
});

// POST /api/public/merch/orders
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = schema.safeParse(body);

        if (!validation.success) {
            return new NextResponse('Invalid data', { status: 400 });
        }

        const { customerName, customerPhone, shippingAddress, items } = validation.data;

        // Get Merch Brand
        const brand = await prisma.brand.findUnique({
            where: { slug: 'merch' }
        });

        if (!brand) {
            return new NextResponse('Brand error', { status: 500 });
        }

        // Calculate Total
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Generate Order Number (Simple Timestamp based)
        const invoiceNo = `ORD-MERCH-${Date.now()}`;

        // Create Order
        // Note: We assume 'Order' model has these fields. If fails, we might need to adjust.
        const order = await prisma.order.create({
            data: {
                brandId: brand.id,
                invoiceNo: invoiceNo,
                status: 'PENDING',
                customerName,
                customerPhone,
                customerAddress: shippingAddress,
                total: total, // Required field
                totalAmount: total, // Optional legacy/alt field
                // Create Items
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        variantName: item.variantName || '',
                        quantity: item.quantity,
                        price: item.price, // Unit Price
                        subtotal: item.price * item.quantity,
                        variantId: item.variantId,
                        mockupResultPath: item.mockupResultPath || null,
                        metadata: item.metadata || undefined
                    }))
                }
            }
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            invoiceNo: order.invoiceNo
        });

    } catch (error) {
        console.error('[ORDER_CREATE]', error);
        return new NextResponse('Order creation failed', { status: 500 });
    }
}
