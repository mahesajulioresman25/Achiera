const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brands = await prisma.brand.findMany({ where: { isActive: true }, select: { name: true } });
    console.log('ACTIVE_BRANDS_START');
    console.log(JSON.stringify(brands));
    console.log('ACTIVE_BRANDS_END');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
