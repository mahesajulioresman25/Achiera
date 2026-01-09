# Audit Middleware Integration Guide

## Overview

The audit middleware automatically wraps server actions to log all critical operations. This ensures complete audit trail without manual logging in each action.

## Usage

### Method 1: Using `withAudit` (Full Control)

```typescript
import { withAudit, AuditHelpers } from '@/lib/middleware/auditMiddleware';

export const createBudgetAction = withAudit(
    async (data: BudgetInput) => {
        // Your action logic
        const budget = await budgetService.create(data);
        return { success: true, data: budget };
    },
    (args, result) => AuditHelpers.budgetCreated(
        result.data.id,
        { ...args[0] }
    )
);
```

### Method 2: Using `auditAction` (Simplified)

```typescript
import { auditAction } from '@/lib/middleware/auditMiddleware';

export const approveBudgetAction = auditAction(
    async (budgetId: string, userId: string) => {
        const budget = await budgetService.approve(budgetId, userId);
        return { success: true, data: budget };
    },
    'BUDGET_APPROVED',
    'Budget',
    (args, result) => result.data.id,
    'WARNING' // severity
);
```

## Integration Checklist

### Budget Actions
- [ ] `createBudgetAction` - BUDGET_CREATED
- [ ] `updateBudgetAction` - BUDGET_UPDATED
- [ ] `approveBudgetAction` - BUDGET_APPROVED
- [ ] `deleteBudgetAction` - BUDGET_DELETED

### IC Transaction Actions
- [ ] `createICTransactionAction` - IC_TRANSACTION_CREATED
- [ ] `approveICTransactionAction` - IC_TRANSACTION_APPROVED
- [ ] `rejectICTransactionAction` - IC_TRANSACTION_REJECTED

### Journal Actions
- [ ] `createJournalAction` - JOURNAL_CREATED
- [ ] `postJournalAction` - JOURNAL_POSTED
- [ ] `reverseJournalAction` - JOURNAL_REVERSED

### Invoice Actions
- [ ] `createInvoiceAction` - INVOICE_CREATED
- [ ] `payInvoiceAction` - INVOICE_PAID
- [ ] `voidInvoiceAction` - INVOICE_VOIDED

## Best Practices

1. **Always use middleware for financial actions**
2. **Set appropriate severity levels**:
   - INFO: Regular operations
   - WARNING: Approvals, significant changes
   - CRITICAL: Deletions, voids, errors
   - SECURITY: Login attempts, access violations

3. **Include relevant metadata**:
   - Amounts for financial transactions
   - User IDs for approvals
   - Error messages for failures

4. **Keep it non-blocking**:
   - Audit logging is fire-and-forget
   - Never throw errors from audit middleware

## Example: Full Integration

```typescript
// Before (manual logging)
export async function createBudgetAction(data: BudgetInput) {
    try {
        const budget = await budgetService.create(data);
        
        // Manual audit log
        await auditService.log({
            userId: data.userId,
            action: 'BUDGET_CREATED',
            entityType: 'Budget',
            entityId: budget.id,
            // ... more fields
        });
        
        return { success: true, data: budget };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// After (with middleware)
export const createBudgetAction = withAudit(
    async (data: BudgetInput) => {
        const budget = await budgetService.create(data);
        return { success: true, data: budget };
    },
    (args, result) => AuditHelpers.budgetCreated(result.data.id, args[0])
);
```

## Testing

```typescript
// Test that audit logs are created
const result = await createBudgetAction({
    userId: 'test-user',
    brandId: 'test-brand',
    // ... budget data
});

// Verify audit log exists
const logs = await auditService.getLogs({
    entityType: 'Budget',
    entityId: result.data.id
});

expect(logs).toHaveLength(1);
expect(logs[0].action).toBe('BUDGET_CREATED');
```

## Troubleshooting

**Q: Audit logs not appearing?**
- Check console for audit middleware errors
- Verify AuditService is working
- Ensure database connection is active

**Q: Performance impact?**
- Audit logging is async and non-blocking
- Average overhead: <10ms per action
- Uses fire-and-forget pattern

**Q: How to disable for testing?**
```typescript
// Set environment variable
DISABLE_AUDIT_LOGGING=true

// Or wrap in condition
if (process.env.NODE_ENV !== 'test') {
    await auditService.log(/* ... */);
}
```
