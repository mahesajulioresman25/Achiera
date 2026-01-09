# ACHIERA Platform - Cron Jobs Setup

## Overview

This directory contains cron jobs for production hardening maintenance tasks.

## Jobs

### 1. Daily Health Check
**File**: `daily-health-check.ts`  
**Schedule**: `0 3 * * *` (3 AM daily)  
**Purpose**: Verify system integrity (ledger balance, stock consistency, orphan transactions)

### 2. Idempotency Cleanup
**File**: `cleanup-idempotency.ts`  
**Schedule**: `0 2 * * *` (2 AM daily)  
**Purpose**: Remove expired idempotency keys (24+ hours old)

## Setup with Node-Cron

Install node-cron:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

Create `src/lib/hardening/cron/scheduler.ts`:
```typescript
import cron from 'node-cron';
import { dailyHealthCheck } from './daily-health-check';
import { cleanupIdempotencyKeys } from './cleanup-idempotency';

export function startCronJobs() {
  // Daily health check at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running daily health check...');
    await dailyHealthCheck();
  });

  // Idempotency cleanup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running idempotency cleanup...');
    await cleanupIdempotencyKeys();
  });

  console.log('Cron jobs scheduled');
}
```

Add to your app startup (e.g., `src/app/layout.tsx` or server entry):
```typescript
import { startCronJobs } from '@/lib/hardening/cron/scheduler';

if (process.env.NODE_ENV === 'production') {
  startCronJobs();
}
```

## Setup with Vercel Cron

If deploying to Vercel, create API routes instead:

**`src/app/api/cron/health-check/route.ts`**:
```typescript
import { NextResponse } from 'next/server';
import { dailyHealthCheck } from '@/lib/hardening/cron/daily-health-check';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await dailyHealthCheck();
  return NextResponse.json(result);
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Manual Execution

Run manually for testing:
```bash
# Health check
npx tsx src/lib/hardening/cron/daily-health-check.ts

# Cleanup
npx tsx src/lib/hardening/cron/cleanup-idempotency.ts
```

## Monitoring

Check logs for cron execution:
```bash
# View system logs
SELECT * FROM system_logs 
WHERE context->>'$.action' IN ('DAILY_HEALTH_CHECK', 'IDEMPOTENCY_CLEANUP')
ORDER BY timestamp DESC 
LIMIT 100;
```

## Alerts

Health check failures automatically send alerts to:
- Slack (if `SLACK_WEBHOOK_URL` is configured)
- System logs (always)

Configure in `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
CRON_SECRET=your-secret-key-here
```
