
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- DEBUG PRISMA CLIENT ---');
    console.log('Prisma keys:', Object.keys(prisma));

    // @ts-ignore
    if (prisma.decisionRule) {
        console.log('✅ prisma.decisionRule exists');
        // @ts-ignore
        const count = await prisma.decisionRule.count();
        console.log(`Current decisionRule count: ${count}`);
    } else {
        console.log('❌ prisma.decisionRule is MISSING');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
