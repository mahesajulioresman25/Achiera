import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const brands = await prisma.brand.findMany({
        select: { slug: true, name: true }
    });
    console.log('Current Brands in Database:');
    brands.forEach(b => console.log(`- ${b.name} (${b.slug})`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
