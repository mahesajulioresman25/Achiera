
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj';
    console.log('Listing all variants matching "susu uht"...');

    const variants = await prisma.frozenVariant.findMany({
        where: {
            brandId,
            OR: [
                { name: { contains: 'susu uht', mode: 'insensitive' } },
                { product: { name: { contains: 'susu uht', mode: 'insensitive' } } }
            ]
        },
        include: { product: true }
    });

    console.log(`Found ${variants.length} variants.`);
    variants.forEach(v => {
        console.log(`ID: ${v.id}`);
        console.log(`Name: ${v.name}`);
        console.log(`Product: ${v.product?.name}`);
        console.log(`StockOnHand: ${v.stockOnHand}`);
        console.log('---');
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
