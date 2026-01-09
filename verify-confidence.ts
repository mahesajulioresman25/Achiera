import { calculateExecutiveConfidence } from './src/lib/autonomous-analytics/trust/confidence';
import { prisma } from './src/lib/prisma';

async function verifyConfidence() {
    const brandId = 'cmj7dw82v0000ugx41xgbxy63';

    console.log('--- Phase 3.75 Verification Start ---');

    // 1. Clear previous reviews
    await (prisma as any).executiveConfidenceReview.deleteMany({ where: { brandId } });

    // 2. Test Empty State
    const emptyReport = await calculateExecutiveConfidence(brandId);
    console.log('Empty Report Status:', emptyReport.status); // Expected: PENDING

    // 3. Test Weighted Aggregation
    await (prisma as any).executiveConfidenceReview.create({
        data: {
            brandId,
            reviewerRole: 'CFO',
            dimensions: { operational: 80, risk: 90, explainability: 70, psychological: 80 }
        }
    });

    await (prisma as any).executiveConfidenceReview.create({
        data: {
            brandId,
            reviewerRole: 'BOARD',
            dimensions: { operational: 90, risk: 80, explainability: 90, psychological: 90 }
        }
    });

    const report = await calculateExecutiveConfidence(brandId);
    console.log('Aggregated Score:', report.aggregated_score);
    console.log('Status (Expected ALIGNED):', report.status);

    // 4. Test Block Condition (Governance Freeze)
    await (prisma as any).executiveConfidenceReview.create({
        data: {
            brandId,
            reviewerRole: 'CFO',
            dimensions: { operational: 90, risk: 20, explainability: 90, psychological: 90 } // Risk < 30
        }
    });

    const frozenReport = await calculateExecutiveConfidence(brandId);
    console.log('Governance Frozen:', frozenReport.is_governance_frozen); // Expected: true
    console.log('Status (Expected CRITICAL):', frozenReport.status);

    console.log('Verification Complete.');
}

verifyConfidence().catch(console.error);
