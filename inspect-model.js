const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('FrozenCategory fields:', Object.keys(prisma.frozenCategory));
    // Try to find one record to see structure
    const one = await prisma.frozenCategory.findFirst();
    console.log('Sample record:', one);
}

main().finally(() => prisma.$disconnect());
