import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.appLog.findMany({
        where: {
            type: 'EMAIL_PARSE',
            severity: { in: ['WARN', 'ERROR'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    console.log('--- RECENT EMAIL PARSING ISSUES ---');
    logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] [${log.severity}] ${log.message}`);
        console.log(`Metadata: ${JSON.stringify(log.metadata)}`);
        console.log('---');
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
