const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDailyDigest() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

    if (!brand) {
        console.error('Brand Rasa Ibu not found');
        return;
    }

    console.log('Testing Daily Digest for Brand:', brand.name);

    // We can't easily call Server Actions from a direct node script without setup.
    // So I'll replicate the core logic or just print what would be sent.

    const orders = await prisma.order.findMany({
        where: {
            brandId: brand.id,
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        },
        include: { orderItems: true }
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total), 0);
    console.log('Total Sales Today:', totalSales);
    console.log('Order Count Today:', orders.length);

    const lowStockItems = await prisma.frozenVariant.findMany({
        where: {
            product: { category: { brandId: brand.id } },
            stockOnHand: { lt: 10 }
        },
        include: { product: true }
    });

    console.log('Low Stock Items detected:', lowStockItems.length);
    lowStockItems.forEach(i => console.log(` - ${i.product.name} (${i.stockOnHand})`));

    console.log('\n--- MOCK WA REPORT ---');
    console.log(`📊 RINGKASAN HARIAN: ${brand.name.toUpperCase()} 📊`);
    console.log(`💰 Penjualan: Rp${totalSales.toLocaleString('id-ID')}`);
    console.log(`📦 Total Pesanan: ${orders.length}`);
    console.log(`🚨 Status Stok Menipis:\n${lowStockItems.map(i => `- ${i.product.name} (${i.stockOnHand} sisa)`).join('\n') || '✅ Semua stok aman.'}`);
}

testDailyDigest();
