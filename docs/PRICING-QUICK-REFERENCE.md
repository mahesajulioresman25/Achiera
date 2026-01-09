# Advanced Pricing System - Quick Reference

## 🚀 Quick Start

### Access Points
- **Admin Dashboard**: `http://localhost:3000/dashboard/merch/pricing`
- **Test Sandbox**: `http://localhost:3000/dashboard/merch/pricing/test`
- **API Endpoint**: `POST /api/pricing/calculate`

### Seed Data (If Needed)
```bash
npx ts-node prisma/seed-pricing.ts
```

## 📊 Default Pricing Rules

### Bulk Tiers (Global)
| Quantity | Price per Unit | Total (example) |
|----------|---------------|-----------------|
| 1-9      | Rp 15,000     | Rp 15,000 (×1)  |
| 10-49    | Rp 13,500     | Rp 270,000 (×20)|
| 50-199   | Rp 12,000     | Rp 600,000 (×50)|
| 200+     | Rp 10,500     | Rp 2,100,000 (×200)|

### Printing Costs

**Plastisol:**
- Setup Fee: Rp 30,000 (one-time)
- Per Color: Rp 3,500 per color per piece
- Example: 10 pcs, 2 colors = Rp 30,000 + (Rp 3,500 × 2 × 10) = Rp 100,000

**Size Multipliers:**
- S: 1.0x (no extra)
- M: 1.05x (+5%)
- L: 1.1x (+10%)
- XL: 1.15x (+15%)
- XXL: 1.2x (+20%)

**DTF (Direct-to-Film):**
- Per Meter: Rp 65,000
- Minimum: 1 meter
- Example: 2.5m = Rp 162,500

## 🔧 Common Tasks

### Create New Component
```typescript
POST /api/admin/pricing/components
{
  "code": "CUSTOM_FEE",
  "name": "Custom Processing Fee",
  "description": "Additional processing charge",
  "type": "FIXED"
}
```

### Create New Rule
```typescript
POST /api/admin/pricing/rules
{
  "componentId": "component-id",
  "scope": "GLOBAL",
  "amount": 5000,
  "priority": 0,
  "isActive": true
}
```

### Calculate Price
```typescript
POST /api/pricing/calculate
{
  "variantId": "variant-id",
  "qty": 25,
  "printing": {
    "method": "plastisol",
    "colors": 2,
    "size": "L"
  }
}
```

## 🎯 Scope Priority

Rules are applied in this order (highest to lowest):
1. **VARIANT** - Specific variant override
2. **PRODUCT** - Product-level pricing
3. **BRAND** - Brand-specific rules
4. **GLOBAL** - Default for all

## 💡 Pro Tips

1. **Testing**: Always use Test Sandbox before deploying new rules
2. **Bulk Tiers**: Set priority higher for tier rules (10, 15, 20)
3. **Metadata**: Use for filtering (e.g., `{"printMethod": "plastisol"}`)
4. **Date Ranges**: Set `startAt`/`endAt` for promotional pricing
5. **Audit Trail**: Check `price_history` table for all changes

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Fallback price used | Check if rules exist and are active |
| Wrong tier applied | Verify minQty/maxQty ranges |
| Metadata not matching | Ensure exact JSON match (case-sensitive) |
| Variant not found | Verify variantId exists in database |

## 📞 Files Reference

| File | Purpose |
|------|---------|
| `lib/pricing/engine.ts` | Core calculation logic |
| `lib/pricing/types.ts` | TypeScript types |
| `app/api/pricing/calculate/route.ts` | Public API |
| `app/api/admin/pricing/components/route.ts` | Components CRUD |
| `app/api/admin/pricing/rules/route.ts` | Rules CRUD |
| `app/dashboard/[brandSlug]/pricing/page.tsx` | Admin dashboard |
| `app/dashboard/[brandSlug]/pricing/test/page.tsx` | Test sandbox |
| `prisma/seed-pricing.ts` | Seed data script |
| `__tests__/pricing.test.ts` | Unit tests |

## 🎨 Example Calculations

### Example 1: Simple Order
- Qty: 1
- No printing
- **Result**: Rp 15,000

### Example 2: Bulk Order
- Qty: 50
- No printing
- **Result**: Rp 600,000 (50 × Rp 12,000)

### Example 3: Plastisol 2 Colors
- Qty: 10
- Plastisol, 2 colors, size L
- **Breakdown**:
  - Base: 10 × Rp 13,500 = Rp 135,000
  - Setup: Rp 30,000
  - Colors: 2 × Rp 3,500 × 10 = Rp 70,000
  - Size L (1.1x): Rp 13,500
- **Total**: Rp 248,500

### Example 4: DTF
- Qty: 1
- DTF, 3 meters
- **Breakdown**:
  - Base: Rp 15,000
  - DTF: 3m × Rp 65,000 = Rp 195,000
- **Total**: Rp 210,000

---

**Last Updated**: December 7, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
