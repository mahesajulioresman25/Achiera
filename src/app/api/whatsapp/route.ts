import { NextResponse } from 'next/server';
import { waEngine } from '@/lib/whatsapp/engine';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session || session.user.globalRole !== 'OWNER') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await waEngine.init();
        const status = waEngine.getStatus();
        return NextResponse.json({ success: true, ...status });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST() {
    const session = await auth();
    if (!session || session.user.globalRole !== 'OWNER') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await waEngine.logout();
        return NextResponse.json({ success: true, message: 'Logged out' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
