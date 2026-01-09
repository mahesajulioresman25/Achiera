
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Available models on PrismaClient:');
    const models = Object.keys(prisma).filter(key =>
        !key.startsWith('_') &&
        typeof (prisma as any)[key] === 'object' &&
        (prisma as any)[key] !== null &&
        'findMany' in (prisma as any)[key]
    );
    console.log(JSON.stringify(models, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
