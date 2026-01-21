import { NextResponse } from 'next/server';
import { EmailParserService } from '@/lib/services/EmailParserService';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max duration
export const fetchCache = 'force-no-store';

export async function GET() {
    try {
        const integrations = await prisma.emailIntegration.findMany({
            where: { isActive: true }
        });

        if (integrations.length === 0) {
            return NextResponse.json({ message: 'No active email integrations found' });
        }

        const parser = new EmailParserService();
        const results = [];

        for (const integration of integrations) {
            // Decrypt password in real app (using plain text for MVP/Phase 1)
            // Ideally we should use environment variable for app password if it's the brand's own email
            // Or stored encrypted in DB.
            // For this implementation, we assume the integration record might store a reference or we use a system-wide env
            // CHECK: The implementation plan said "EMAIL_ADDRESS" and "EMAIL_APP_PASSWORD" in env.
            // But the schema handles multiple integrations.
            // If we use system env, it only supports 1 email. 
            // Let's assume for Phase 1 we use the system env for all (single brand scenario) 
            // OR if the integration record has email, we might need password there.

            // Re-visiting implementation plan:
            // "EMAIL_ADDRESS=rasaibu@gmail.com" in env.
            // "EMAIL_APP_PASSWORD=..." in env.

            // So we will ignore the email in the DB record for the credentials, and use the ENV credentials.
            // But we filter by the DB record to know WHICH brand to attribute to? 
            // Or just use the env credentials to check THAT mailbox.

            const email = process.env.EMAIL_ADDRESS;
            const password = process.env.EMAIL_APP_PASSWORD;

            if (!email || !password) {
                console.error('Email credentials not configured in environment variables');
                continue;
            }

            // Process the sync using ENV credentials for the brand
            // This allows the system to work even if the DB emailAddress doesn't match the ENV email
            // (common in forwarding scenarios)

            try {
                await parser.connect(email, password);
                await parser.listenForOrders(integration.brandId);
                await parser.disconnect();

                await prisma.emailIntegration.update({
                    where: { id: integration.id },
                    data: { lastSyncAt: new Date() }
                });

                results.push({ brandId: integration.brandId, status: 'success' });
            } catch (err) {
                console.error(`Error syncing for brand ${integration.brandId}:`, err);
                results.push({ brandId: integration.brandId, status: 'failed', error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Email sync completed',
            results
        });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
