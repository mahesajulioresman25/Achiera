import { EmailService } from '@/lib/services/EmailService';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('🚀 Triggering Email Service Test via API...');

    const testOrder = {
        invoiceNo: 'TEST-API-123456',
        customerName: 'Bunda Tester (API)',
        customerEmail: process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER || '',
        total: 250000
    };

    const testLoyalty = {
        pointsEarned: 250,
        currentBalance: 5000
    };

    if (!testOrder.customerEmail) {
        return NextResponse.json({
            success: false,
            error: 'No WA_ADMIN_EMAIL or SMTP_USER found in .env'
        }, { status: 500 });
    }

    try {
        const success = await EmailService.sendOrderConfirmation(testOrder as any, testLoyalty);
        const adminSuccess = await EmailService.sendAdminAlert('API TEST ALERT', 'Test alert from API route.');

        return NextResponse.json({
            success: true,
            customerEmail: success,
            adminEmail: adminSuccess,
            message: 'Check your inbox!'
        });
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}
