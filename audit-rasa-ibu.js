const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditRasaIbu() {
    try {
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: {
                frozenCategories: {
                    include: {
                        products: {
                            include: {
                                variants: true
                            }
                        }
                    }
                },
                flashSaleConfigs: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!brand) {
            console.log('Brand "rasa-ibu" not found.');
            return;
        }

        console.log(`Brand: ${brand.name} (ID: ${brand.id})`);

        console.log('\n--- Flash Sale Configs ---');
        if (brand.flashSaleConfigs.length === 0) console.log('No Flash Sale Configs found.');
        brand.flashSaleConfigs.forEach(c => {
            console.log(`- ${c.name} [${c.isActive ? 'ACTIVE' : 'INACTIVE'}]`);
            console.log(`  Date: ${c.startDate} to ${c.endDate}`);
            console.log(`  Time: ${c.startTime} to ${c.endTime}`);
            console.log(`  Discount: ${c.discountPercentage}% (Min: ${c.minPurchaseAmount})`);
            console.log(`  Target: ${c.targetType} (${c.items.length} items)`);
        });

        console.log('\n--- Frozen Categories & Products ---');
        brand.frozenCategories.forEach(cat => {
            console.log(`Category: ${cat.name}`);
            cat.products.forEach(p => {
                console.log(`  - ${p.name}`);
                p.variants.forEach(v => {
                    console.log(`    * [${v.isActive ? 'ACTIVE' : 'INACTIVE'}] ${v.name} (ID: ${v.id}, SKU: ${v.sku}) - Price: ${v.price}`);
                });
            });
        });

    } catch (e) {
        console.error('Audit Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

auditRasaIbu();
