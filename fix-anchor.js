const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const variants = await prisma.frozenVariant.findMany({
        where: {
            product: {
                name: {
                    contains: 'Anchor',
                }
            }
        },
        include: {
            product: true
        }
    });

    console.log('Found variants:', JSON.stringify(variants, null, 2));

    for (const v of variants) {
        if (Number(v.costPrice) === 50800) {
            console.log(`Fixing variant ${v.id}...`);
            await prisma.frozenVariant.update({
                where: { id: v.id },
                data: { costPrice: 254 } // 50800 / 200 = 254
            });
            console.log('Fixed!');
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
