import { NextResponse } from 'next/server';
import { EmailParserService } from '@/lib/services/EmailParserService';
import { prisma } from '@/lib/prisma';
import { logSystemActivity } from '@/lib/logger';

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
        const results: { brandId: string; status: string; error?: string }[] = [];

        // Group integrations by email address to handle shared mailboxes
        const emailMap: Record<string, string[]> = {};
        for (const integration of integrations) {
            const email = process.env.EMAIL_ADDRESS || integration.emailAddress;
            if (!emailMap[email]) emailMap[email] = [];
            emailMap[email].push(integration.brandId);
        }

        for (const [email, brandIds] of Object.entries(emailMap)) {
            const password = process.env.EMAIL_APP_PASSWORD;

            if (!password) {
                console.error(`Email credentials not configured for ${email}`);
                continue;
            }

            try {
                await parser.connect(email, password);

                // If multiple brands share an email, we should ideally fetch once 
                // and attribute to each brand if possible, or just process for all.
                // For Phase 1 simplification: we iterate through brandIds
                // and call listenForOrders but DON'T mark as seen until the last one?
                // Actually, listenForOrders currently marks as seen.

                for (let i = 0; i < brandIds.length; i++) {
                    const brandId = brandIds[i];
                    // We might need to fetch Seen emails too if they were just marked 
                    // by the previous loop iteration for the same account.
                    await parser.listenForOrders(brandId);
                }

                await parser.disconnect();

                // Update lastSyncAt for all integrations of this email
                await prisma.emailIntegration.updateMany({
                    where: { emailAddress: email, brandId: { in: brandIds } },
                    data: { lastSyncAt: new Date() }
                });

                brandIds.forEach(id => results.push({ brandId: id, status: 'success' }));
            } catch (err) {
                console.error(`Error syncing for email ${email}:`, err);
                brandIds.forEach(id => results.push({ brandId: id, status: 'failed', error: String(err) }));
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
