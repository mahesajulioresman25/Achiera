
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';

    // Mask password and print only host
    // Format: postgres://user:pass@HOST:PORT/db
    let masked = 'INVALID_FORMAT';
    try {
        const url = new URL(dbUrl);
        masked = `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`;
    } catch (e) {
        masked = dbUrl.substring(0, 15) + '...';
    }

    return NextResponse.json({
        database_url_host: masked,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
