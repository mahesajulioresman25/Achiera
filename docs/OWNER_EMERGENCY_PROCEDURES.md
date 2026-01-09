# ACHIERA Platform - OWNER Emergency Procedures

## 🚨 Emergency Response Guide

This document provides step-by-step procedures for OWNER to handle critical platform incidents.

---

## Emergency Contacts

**Platform Owner**: [Your Name]  
**Technical Lead**: [Tech Lead Name]  
**Database Admin**: [DBA Name]  
**Slack Channel**: #achiera-incidents  

---

## Emergency Scenarios

### 1. Payment Gateway Failure

**Symptoms**:
- Multiple payment failures
- Payment gateway timeout errors
- Customer complaints about failed transactions

**Immediate Actions**:

```typescript
// 1. Freeze all orders immediately
import { activateKillSwitch } from '@/lib/hardening/kill-switch';
import { createCorrelationContext } from '@/lib/hardening/correlation';

const context = createCorrelationContext(
  'EMERGENCY',
  undefined,
  'OWNER_USER_ID'
);

await activateKillSwitch(
  context,
  'FREEZE_ALL_ORDERS',
  'Payment gateway failure - investigating',
  undefined,
  new Date(Date.now() + 3600000) // Auto-expire in 1 hour
);
```

**Investigation Steps**:
1. Check payment gateway status dashboard
2. Review recent payment logs:
   ```sql
   SELECT * FROM system_logs 
   WHERE context->>'$.action' = 'PAYMENT_CONFIRM'
   AND timestamp > NOW() - INTERVAL 1 HOUR
   ORDER BY timestamp DESC;
   ```
3. Contact payment gateway support
4. Check for ledger imbalances

**Resolution**:
```typescript
// After fixing, deactivate kill switch
await deactivateKillSwitch(context, 'KILL_SWITCH_ID');
```

---

### 2. Ledger Imbalance Detected

**Symptoms**:
- Health check failure email
- System enters read-only mode
- Ledger balance check fails

**Immediate Actions**:

```typescript
// 1. System automatically enters read-only mode
// 2. Review ledger errors
import { verifyLedgerIntegrity } from '@/lib/hardening/ledger-integrity';

const result = await verifyLedgerIntegrity('BRAND_ID');
console.log('Imbalances:', result.errors);
```

**Investigation Steps**:
1. Identify imbalanced transactions:
   ```sql
   SELECT 
     jt.id,
     jt.description,
     SUM(je.debit) as total_debit,
     SUM(je.credit) as total_credit,
     SUM(je.debit) - SUM(je.credit) as difference
   FROM journal_transactions jt
   JOIN journal_entries je ON je.transactionId = jt.id
   WHERE jt.brandId = 'BRAND_ID'
   GROUP BY jt.id
   HAVING ABS(SUM(je.debit) - SUM(je.credit)) > 0.01;
   ```

2. Review audit logs for the transactions:
   ```sql
   SELECT * FROM audit_logs
   WHERE entityType = 'JOURNAL_TRANSACTION'
   AND entityId IN ('TRANSACTION_IDS')
   ORDER BY createdAt;
   ```

3. Check correlation IDs to trace the issue

**Resolution**:
1. Fix imbalanced transactions (manual correction)
2. Run health check to verify:
   ```bash
   npx tsx src/lib/hardening/cron/daily-health-check.ts
   ```
3. Exit read-only mode:
   ```typescript
   import { setDegradationMode } from '@/lib/hardening/degradation';
   await setDegradationMode('NORMAL', 'Ledger corrected');
   ```

---

### 3. Negative Stock Detected

**Symptoms**:
- Stock consistency check fails
- Customers can't place orders
- Inventory discrepancies

**Immediate Actions**:

```typescript
// 1. Freeze affected brand
await activateKillSwitch(
  context,
  'FREEZE_BRAND',
  'Negative stock detected - investigating',
  'BRAND_ID'
);
```

**Investigation Steps**:
1. Find negative stock items:
   ```sql
   SELECT 
     fv.id,
     fv.sku,
     fv.stockOnHand,
     fp.name as product_name
   FROM frozen_variants fv
   JOIN frozen_products fp ON fp.id = fv.productId
   WHERE fv.stockOnHand < 0;
   ```

2. Review stock mutation history:
   ```sql
   SELECT * FROM audit_logs
   WHERE action IN ('STOCK_DEDUCT', 'STOCK_ADD')
   AND entityId = 'VARIANT_ID'
   ORDER BY createdAt DESC
   LIMIT 50;
   ```

3. Check for concurrent order processing issues

**Resolution**:
1. Correct stock levels manually:
   ```sql
   UPDATE frozen_variants 
   SET stockOnHand = [CORRECT_VALUE]
   WHERE id = 'VARIANT_ID';
   ```
2. Add audit log for manual correction
3. Unfreeze brand

---

### 4. Security Breach Suspected

**Symptoms**:
- Multiple unauthorized access attempts
- Unusual role changes
- Suspicious data exports

**Immediate Actions**:

```typescript
// 1. Platform-wide freeze
await activateKillSwitch(
  context,
  'FREEZE_ALL_ORDERS',
  'Security incident - platform locked',
  undefined,
  undefined // No auto-expire
);

// 2. Freeze finance operations
await activateKillSwitch(
  context,
  'FREEZE_FINANCE',
  'Security incident - finance locked',
  undefined,
  undefined
);
```

**Investigation Steps**:
1. Review security logs:
   ```sql
   SELECT * FROM audit_logs
   WHERE action LIKE 'SECURITY_%'
   AND createdAt > NOW() - INTERVAL 24 HOUR
   ORDER BY createdAt DESC;
   ```

2. Check for unauthorized role changes:
   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'ROLE_ASSIGN'
   AND createdAt > NOW() - INTERVAL 24 HOUR;
   ```

3. Review system logs for suspicious patterns:
   ```sql
   SELECT * FROM system_logs
   WHERE level IN ('ERROR', 'CRITICAL')
   AND timestamp > NOW() - INTERVAL 24 HOUR;
   ```

**Resolution**:
1. Reset compromised user passwords
2. Revoke suspicious role assignments
3. Review and update security policies
4. Gradually unfreeze after verification

---

### 5. Database Connection Loss

**Symptoms**:
- Multiple database errors
- Timeout errors
- Application unresponsive

**Immediate Actions**:
1. Check database server status
2. Review connection pool settings
3. Check for long-running queries:
   ```sql
   SHOW FULL PROCESSLIST;
   ```

**Resolution**:
1. Kill long-running queries if needed
2. Restart application if necessary
3. Scale database if under load

---

## Quick Reference Commands

### Check System Health
```bash
npx tsx src/lib/hardening/cron/daily-health-check.ts
```

### View Active Kill Switches
```sql
SELECT * FROM kill_switches 
WHERE status = 'ACTIVE'
ORDER BY activatedAt DESC;
```

### View Recent Critical Logs
```sql
SELECT * FROM system_logs
WHERE level = 'CRITICAL'
AND timestamp > NOW() - INTERVAL 24 HOUR
ORDER BY timestamp DESC;
```

### Check Degradation Mode
```sql
SELECT * FROM system_config
WHERE key = 'DEGRADATION_MODE';
```

### View Recent Audit Logs
```sql
SELECT * FROM audit_logs
WHERE createdAt > NOW() - INTERVAL 1 HOUR
ORDER BY createdAt DESC
LIMIT 100;
```

---

## Escalation Matrix

| Severity | Response Time | Escalate To |
|----------|--------------|-------------|
| **CRITICAL** | Immediate | Owner + Tech Lead |
| **HIGH** | 15 minutes | Tech Lead |
| **MEDIUM** | 1 hour | On-call Engineer |
| **LOW** | Next business day | Support Team |

---

## Post-Incident Checklist

After resolving any incident:

- [ ] Document what happened
- [ ] Document root cause
- [ ] Document resolution steps
- [ ] Update runbooks if needed
- [ ] Conduct post-mortem meeting
- [ ] Implement preventive measures
- [ ] Update monitoring/alerts
- [ ] Communicate to stakeholders

---

## Emergency Contact Information

**Database Emergency**:
- Provider: [Your DB Provider]
- Support: [Support Number]
- Account ID: [Account ID]

**Payment Gateway Emergency**:
- Provider: [Payment Provider]
- Support: [Support Number]
- Merchant ID: [Merchant ID]

**Hosting Emergency**:
- Provider: [Hosting Provider]
- Support: [Support Number]
- Account ID: [Account ID]

---

## Important Notes

1. **Always log your actions** - Use correlation IDs
2. **Communicate** - Update team in Slack
3. **Document** - Write down what you did
4. **Verify** - Run health checks after fixes
5. **Monitor** - Watch for recurring issues

---

## Training

All OWNER-level users should:
- Review this document quarterly
- Practice emergency procedures in staging
- Understand kill switch implications
- Know how to read audit logs
- Have access to all emergency contacts
