const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log('Starting data correction...');

    // Fix Anchor: 200g @ 50,800 -> 254/g
    const anchor = await prisma.frozenVariant.findFirst({
        where: { product: { name: { contains: 'Anchor' } } }
    });
    if (anchor) {
        await prisma.frozenVariant.update({
            where: { id: anchor.id },
            data: { costPrice: 254, unit: 'gram' }
        });
        console.log(`Updated Anchor (${anchor.id}): Cost set to 254/gram`);
    } else {
        console.log('Anchor not found');
    }

    // Fix UHT: 1L @ 18,000 -> 18/ml
    const uht = await prisma.frozenVariant.findFirst({
        where: { product: { name: { contains: 'UHT' } } }
    });
    if (uht) {
        await prisma.frozenVariant.update({
            where: { id: uht.id },
            data: { costPrice: 18, unit: 'ml' }
        });
        console.log(`Updated UHT (${uht.id}): Cost set to 18/ml`);
    } else {
        console.log('UHT Full Cream not found');
    }

    // Check others
    const others = ['Bawang Putih', 'Sphagetti Carbonara', 'Keju Kraft', 'Onion', 'Ladaku', 'Maizenaku'];
    console.log('\nChecking other suspicious items:');
    for (const name of others) {
        const item = await prisma.frozenVariant.findFirst({
            where: { product: { name: { contains: name } } },
            include: { product: true }
        });
        if (item) {
            console.log(`STILL EXISTS: ${item.product.name} | Unit: ${item.unit} | Cost: ${item.costPrice}`);
        } else {
            console.log(`NOT FOUND (Probably deleted): ${name}`);
        }
    }
}

fix()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
