
import { PrismaClient } from '@prisma/client';
import { generateInvoiceNumber, calculateOrderTotal } from '../src/lib/orderLogic';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Order Test...");

    // 1. Fetch a Template and Variant
    const template = await prisma.product.findFirst({
        include: { variants: true }
    });

    if (!template || template.variants.length === 0) {
        console.error("No templates/variants found to test with.");
        return;
    }

    const variant = template.variants[0];
    console.log(`Found Variant: ${variant.name}, Price: ${variant.basePrice}`);

    const price = Number(variant.basePrice);
    const quantity = 2;
    const { subtotal, tax, total } = calculateOrderTotal(price, quantity);

    console.log(`Calculated: Subtotal=${subtotal}, Tax=${tax}, Total=${total}`);

    const invoiceNo = generateInvoiceNumber();
    console.log(`Generated Invoice: ${invoiceNo}`);

    try {
        const order = await prisma.order.create({
            data: {
                invoiceNo,
                quantity,
                subtotal,
                tax,
                total,
                customerName: "Test User",
                customerEmail: "test@example.com",
                customerPhone: "08123456789",
                customerAddress: "Test Address",
                customerNote: "Test Note",
                mockupResultPath: "/none.png",
                status: "DIPESAN",
                termsAccepted: true,
                orderItems: {
                    create: {
                        name: template.name,
                        variantName: variant.name,
                        quantity,
                        price: variant.basePrice,
                        subtotal,
                        variantId: variant.id
                    }
                },
                statusLogs: {
                    create: {
                        status: "DIPESAN",
                        message: "Test Order Log"
                    }
                }
            }
        });
        console.log("Order Created Successfully!", order);
    } catch (e) {
        console.error("Order Creation Failed:", e);
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
