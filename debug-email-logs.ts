
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
    console.log("Checking AppLog for Processing events...");
    const logs = await prisma.appLog.findMany({
        where: {
            type: 'EMAIL_PARSE',
            message: {
                contains: 'Processing email'
            },
            createdAt: {
                gte: new Date('2026-02-01T00:00:00Z')
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    });

    console.log(`Found ${logs.length} processing logs.`);
    logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.message}`);
        try {
            console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
        } catch (e) {
            console.log('Metadata: (Invalid JSON)');
        }
        console.log('---');
    });

    console.log("\nChecking for specific Grab parsing logs...");
    const grabLogs = await prisma.appLog.findMany({
        where: {
            type: 'EMAIL_PARSE',
            message: {
                contains: 'Grab'
            },
            createdAt: {
                gte: new Date('2026-02-01T00:00:00Z')
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    });

    console.log(`Found ${grabLogs.length} Grab-specific logs.`);
    grabLogs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.message}`);
        console.log('Start Metadata');
        console.log(JSON.stringify(log.metadata));
        console.log('End Metadata');
        console.log('---');
    });
}

checkLogs()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
