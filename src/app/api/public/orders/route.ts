
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            items, // Array of { productId, variantId, quantity, mockupResultPath, designUploadPath }
            productId, variantId, quantity, // Legacy fallback
            customerName, customerEmail, customerPhone, customerAddress, customerNote,
            mockupResultPath // Legacy fallback
        } = body;

        // Normalize items
        let orderItemsData = [];
        if (items && Array.isArray(items) && items.length > 0) {
            orderItemsData = items;
        } else if (productId && variantId) {
            orderItemsData = [{ productId, variantId, quantity, mockupResultPath }];
        } else {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        console.log(`[OrderAPI] Processing ${orderItemsData.length} items`);

        // 1. Validate & Calculate Totals
        let finalSubtotal = 0;
        let finalTax = 0;
        let finalTotal = 0;
        const processedItems = [];

        for (const item of orderItemsData) {
            // Updated to use ProductVariant (Collection-First Schema)
            const variant = await prisma.mockupVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true }
            });

            if (!variant || variant.productId !== item.productId) {
                return NextResponse.json({ error: `Invalid product/variant for item ${item.variantId}` }, { status: 400 });
            }

            // If price is provided (e.g. from Bulk Calculator), use it. Otherwise fallback to Base Price.
            // In a strict environment, we should Re-Calculate here using PriceCalculator.
            let price = item.price ? Number(item.price) : Number(variant.basePrice);
            if (isNaN(price)) price = Number(variant.basePrice);

            const { subtotal, tax, total } = calculateOrderTotal(price, item.quantity);

            finalSubtotal += subtotal;
            finalTax += tax;
            finalTotal += total;

            processedItems.push({
                name: variant.product.name,
                variantName: variant.name,
                quantity: item.quantity,
                price: price,
                subtotal: subtotal,
                // Design Meta: Use provided mockup, or fallback to product base image
                mockupResultPath: item.mockupResultPath || variant.product.baseImage,
                designUploadPath: item.designUploadPath || undefined,
                metadata: (item as any).metadata || undefined
            });
        }

        console.log(`[OrderAPI] Total Order Amount: ${finalTotal}`);

        // 2. Generate Invoice No
        let invoiceNo = generateInvoiceNumber();
        let exists = await prisma.order.findUnique({ where: { invoiceNo } });
        while (exists) {
            invoiceNo = generateInvoiceNumber();
            exists = await prisma.order.findUnique({ where: { invoiceNo } });
        }

        // 3. Create Order with Items
        const order = await prisma.order.create({
            data: {
                invoiceNo,
                quantity: processedItems.reduce((acc, i) => acc + i.quantity, 0),
                subtotal: finalSubtotal,
                tax: finalTax,
                total: finalTotal,

                customerName,
                customerEmail,
                customerPhone,
                customerAddress,
                customerNote,
                // Save the "Raw Design" path if provided
                designUploadPath: items[0]?.designUploadPath || null,
                // Legacy Order-level mockup path (optional, can just use first item's or leave null)
                mockupResultPath: processedItems[0]?.mockupResultPath,

                status: 'WAITING_PAYMENT',
                termsAccepted: true,

                orderItems: {
                    create: processedItems
                },

                statusLogs: {
                    create: {
                        status: 'DIPESAN',
                        message: `Order created with ${processedItems.length} items`
                    }
                }
            },
            include: {
                orderItems: true
            }
        });

        // 4. Trigger Async Services
        try {
            const { InvoiceService } = await import('@/lib/services/InvoiceService');
            const { EmailService } = await import('@/lib/services/EmailService');

            await InvoiceService.generateAndSend(order);
            await EmailService.sendOrderConfirmation(order as any);
        } catch (serviceError) {
            console.error('[OrderAPI] Service trigger failed:', serviceError);
        }

        return NextResponse.json({
            success: true,
            invoiceNo: order.invoiceNo,
            total: Number(order.total)
        });

    } catch (error) {
        console.error('Order creation failed:', error);
        // @ts-ignore
        const errorMessage = error?.message || 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}

function calculateOrderTotal(price: number, quantity: number) {
    const subtotal = price * quantity;
    const tax = subtotal * 0.11; // 11% Tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
}

function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV/${year}${month}${day}/${random}`;
}
