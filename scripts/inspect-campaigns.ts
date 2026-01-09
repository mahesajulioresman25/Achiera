import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Orders for Campaign Patterns ---');

    const orders = await prisma.order.findMany({
        where: {
            brand: {
                slug: 'rasa-ibu'
            }
        },
        take: 20,
        orderBy: {
            createdAt: 'desc'
        },
        select: {
            invoiceNo: true,
            channel: true,
            internalNotes: true,
            customerNote: true,
            createdAt: true
        }
    });

    console.log(`Found ${orders.length} orders to inspect.`);

    orders.forEach(o => {
        console.log(`\nInvoice: ${o.invoiceNo}`);
        console.log(`Channel: ${o.channel}`);
        console.log(`Internal Notes: ${o.internalNotes || 'EMPTY'}`);
        console.log(`Customer Note: ${o.customerNote || 'EMPTY'}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
