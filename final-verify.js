const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx4dhk6000014nb6hwd1umu';

async function main() {
    const warehouses = await prisma.warehouse.count({ where: { brandId: BRAND_ID } });
    const accounts = await prisma.ledgerAccount.count({ where: { brandId: BRAND_ID } });
    const products = await prisma.frozenProduct.count({ where: { category: { brandId: BRAND_ID } } });
    const configs = await prisma.brandConfig.findUnique({ where: { brandId: BRAND_ID } });

    console.log(`Warehouses: ${warehouses}`);
    console.log(`Ledger Accounts: ${accounts}`);
    console.log(`Products: ${products}`);
    console.log(`BrandConfig Found: ${!!configs}`);
}

main().finally(() => prisma.$disconnect());
