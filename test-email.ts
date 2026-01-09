import { EmailService } from './src/lib/services/EmailService';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runTest() {
    console.log('🚀 Starting Email Service Test...');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP User:', process.env.SMTP_USER);

    const testOrder = {
        invoiceNo: 'TEST-123456',
        customerName: 'Bunda Tester',
        customerEmail: process.env.WA_ADMIN_EMAIL || process.env.SMTP_USER || '',
        total: 150000
    };

    const testLoyalty = {
        pointsEarned: 150,
        currentBalance: 1250
    };

    if (!testOrder.customerEmail) {
        console.error('❌ Error: No WA_ADMIN_EMAIL or SMTP_USER found in .env for testing.');
        process.exit(1);
    }

    console.log(`📧 Attempting to send test email to: ${testOrder.customerEmail}...`);

    try {
        const success = await EmailService.sendOrderConfirmation(testOrder, testLoyalty);
        if (success) {
            console.log('✅ Test Email SENT SUCCESSFULLY!');
        } else {
            console.error('❌ Test Email FAILED to send. check logs.');
        }
    } catch (err) {
        console.error('💥 CRITICAL ERROR during test:', err);
    }

    console.log('\n--- Admin Alert Test ---');
    try {
        const adminSuccess = await EmailService.sendAdminAlert('TEST ALERT', 'This is a test low stock alert from Achiera Platform.');
        if (adminSuccess) {
            console.log('✅ Admin Alert SENT SUCCESSFULLY!');
        } else {
            console.error('❌ Admin Alert FAILED.');
        }
    } catch (err) {
        console.error('💥 Admin Alert Error:', err);
    }
}

runTest();
