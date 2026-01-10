import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const brands = await prisma.brand.findMany({
        select: { id: true, name: true, slug: true, isActive: true }
    });
    console.log('BRANDS:', JSON.stringify(brands, null, 2));
    process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
