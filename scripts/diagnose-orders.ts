import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug }
    });

    if (!brand) {
        console.error('Brand not found:', brandSlug);
        return;
    }

    console.log('Found Brand:', brand.name, 'ID:', brand.id);

    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await prisma.order.findMany({
        where: { brandId: brand.id },
        select: {
            id: true,
            createdAt: true,
            totalAmount: true,
            total: true,
            status: true
        }
    });

    console.log('Total Orders found for brand:', orders.length);
    if (orders.length > 0) {
        console.log('Sample Order Date:', orders[0].createdAt);
        const filtered = orders.filter(o => o.createdAt >= ninetyDaysAgo);
        console.log('Orders in last 90 days:', filtered.length);
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = orders.filter(o => o.createdAt >= startOfMonth);
    console.log('Orders this month:', thisMonth.length);
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
