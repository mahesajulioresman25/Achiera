import { prisma } from './src/lib/prisma';

async function verify() {
    const logs = await prisma.appLog.findMany({
        where: { type: 'EMAIL_PARSE' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(logs, null, 2));
}

verify().catch(console.error);
