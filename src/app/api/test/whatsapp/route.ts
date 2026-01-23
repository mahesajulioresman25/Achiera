// Testing endpoint for QuikWA integration
// Access: /api/test/whatsapp

import { NextRequest, NextResponse } from 'next/server';
import { quikWAService } from '@/lib/services/QuikWAService';

export async function GET(request: NextRequest) {
    try {
        // Get stats from QuikWA
        const stats = await quikWAService.getStats();

        return NextResponse.json({
            success: true,
            message: 'QuikWA Service Status',
            data: stats
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { testType, phone } = body;

        if (!phone) {
            return NextResponse.json({
                success: false,
                error: 'Phone number is required'
            }, { status: 400 });
        }

        let result;

        switch (testType) {
            case 'shipping':
                result = await quikWAService.sendShippingNotification({
                    invoiceNo: 'INV-TEST-' + Date.now(),
                    customerName: 'Test Customer',
                    customerPhone: phone,
                    courierName: 'Shopee Express',
                    trackingNo: 'TEST123456789',
                    trackingUrl: 'https://cekresi.com/?noresi=TEST123456789',
                    driverName: 'Driver Test',
                    brandId: 'test-brand'
                });
                break;

            case 'payment':
                result = await quikWAService.sendPaymentConfirmation({
                    invoiceNo: 'INV-TEST-' + Date.now(),
                    customerName: 'Test Customer',
                    customerPhone: phone,
                    totalAmount: 150000,
                    brandId: 'test-brand'
                });
                break;

            case 'completed':
                result = await quikWAService.sendDeliveryCompleted({
                    invoiceNo: 'INV-TEST-' + Date.now(),
                    customerName: 'Test Customer',
                    customerPhone: phone,
                    brandId: 'test-brand'
                });
                break;

            case 'custom':
                const { session, text } = body;
                result = await quikWAService.sendText({
                    session: session || 'marketing',
                    to: phone,
                    text: text || 'Test message from Achiera'
                });
                break;

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid testType. Use: shipping, payment, completed, or custom'
                }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Test ${testType} message sent`,
            data: result
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
