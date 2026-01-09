import { prisma } from '../src/lib/prisma';

async function fixSchema() {
    console.log('--- Checking Database Schema ---');
    try {
        const dbName: any[] = await prisma.$queryRawUnsafe('SELECT DATABASE() as db');
        console.log('CURRENT_DB:', dbName[0].db);
        const columns: any[] = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM orders');
        const hasBrandId = columns.some(c => c.Field === 'brand_id');
        console.log('HAS_BRAND_ID:', hasBrandId);

        if (hasBrandId) {
            console.log('SUCCESS: brand_id column already exists.');
        } else {
            console.log('MISSING: brand_id column not found. Attempting to add it...');
            // Step 1: Add the column
            await prisma.$queryRawUnsafe('ALTER TABLE orders ADD COLUMN brand_id VARCHAR(191)');
            console.log('Step 1 complete: Column added.');

            // Step 2: Add foreign key constraint
            // We need to make sure the brands table exists and has id column (it does)
            await prisma.$queryRawUnsafe('ALTER TABLE orders ADD CONSTRAINT orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE ON UPDATE CASCADE');
            console.log('Step 2 complete: Foreign key constraint added.');

            console.log('SUCCESS: Schema fixed manually via SQL.');
        }
    } catch (error) {
        console.error('FAILED to fix schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSchema();
