const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx3qor60000jp954nkba43d';

async function main() {
    const warehouses = await prisma.warehouse.count({ where: { brandId: BRAND_ID } });
    const accounts = await prisma.ledgerAccount.count({ where: { brandId: BRAND_ID } });
    const rawMaterials = await prisma.frozenProduct.count({ where: { inventoryType: 'RAW_MATERIAL' } });
    const recipes = await prisma.recipe.count({ where: { brandId: BRAND_ID } });
    const bankAccounts = await prisma.bankAccount.count({ where: { brandId: BRAND_ID } });

    console.log(`Warehouses: ${warehouses}`);
    console.log(`Ledger Accounts: ${accounts}`);
    console.log(`Raw Materials: ${rawMaterials}`);
    console.log(`Recipes: ${recipes}`);
    console.log(`Bank Accounts: ${bankAccounts}`);
}

main().finally(() => prisma.$disconnect());
