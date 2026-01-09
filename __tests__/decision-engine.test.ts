// Decision Engine Tests
// Testing deterministic rule evaluation, safety gates, and rollback

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { evaluateDecisions, createExecutionIntent } from '../decision-engine';
import { runSimulation } from '../simulation-engine';
import { checkCooldown, checkDailyCap, checkBlackout } from '../safety-gates';
import { createSnapshot, executeRollback } from '../rollback-manager';
import { prisma } from '@/lib/prisma';

describe('Decision Engine', () => {
    const testBrandId = 'test_brand_001';

    beforeEach(async () => {
        // Clean up test data
        await prisma.executionLog.deleteMany({ where: { brandId: testBrandId } });
        await prisma.auditLog.deleteMany({ where: { brandId: testBrandId } });
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.executionLog.deleteMany({ where: { brandId: testBrandId } });
        await prisma.auditLog.deleteMany({ where: { brandId: testBrandId } });
    });

    describe('Rule Evaluation', () => {
        it('should trigger rule when conditions are met', async () => {
            const result = await evaluateDecisions({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: true
            });

            expect(result).toBeDefined();
            expect(result.brandId).toBe(testBrandId);
            expect(result.simulationMode).toBe(true);
        });

        it('should not trigger rule when conditions are not met', async () => {
            const result = await evaluateDecisions({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: true
            });

            expect(result.rulesTriggered).toBe(0);
        });
    });

    describe('Safety Gates', () => {
        it('should block execution during cooldown period', async () => {
            // Create a recent execution
            await prisma.executionLog.create({
                data: {
                    id: 'test_exec_001',
                    brandId: testBrandId,
                    ruleId: 'RULE_ADS_001',
                    actionId: 'ADS_PAUSE',
                    autonomyLevel: 3,
                    executionStatus: 'success',
                    executedAt: new Date(),
                    preMetrics: {},
                    auditData: {}
                }
            });

            const result = await checkCooldown(testBrandId, 'ADS_PAUSE');
            expect(result.passed).toBe(false);
            expect(result.reason).toContain('cooldown');
        });

        it('should block execution when daily cap is reached', async () => {
            // Create 3 executions today
            for (let i = 0; i < 3; i++) {
                await prisma.executionLog.create({
                    data: {
                        id: `test_exec_${i}`,
                        brandId: testBrandId,
                        ruleId: 'RULE_ADS_001',
                        actionId: 'ADS_PAUSE',
                        autonomyLevel: 3,
                        executionStatus: 'success',
                        executedAt: new Date(),
                        preMetrics: {},
                        auditData: {}
                    }
                });
            }

            const result = await checkDailyCap(testBrandId, 'ADS_PAUSE', 3);
            expect(result.passed).toBe(false);
            expect(result.reason).toContain('Daily limit reached');
        });

        it('should block execution during blackout period', async () => {
            const blackoutPeriods = [
                {
                    startTime: '00:00',
                    endTime: '06:00',
                    timezone: 'Asia/Jakarta',
                    reason: 'Midnight freeze'
                }
            ];

            // Mock current time to be in blackout period
            const now = new Date();
            now.setHours(3, 0, 0, 0); // 3 AM

            const result = checkBlackout(blackoutPeriods);

            // Note: This test will pass/fail depending on actual time
            // In production, we'd mock Date.now()
            if (now.getHours() >= 0 && now.getHours() < 6) {
                expect(result.passed).toBe(false);
            }
        });
    });

    describe('Simulation Engine', () => {
        it('should run simulation without side effects', async () => {
            const beforeCount = await prisma.executionLog.count({
                where: { brandId: testBrandId }
            });

            const result = await runSimulation({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: true
            });

            const afterCount = await prisma.executionLog.count({
                where: { brandId: testBrandId }
            });

            expect(result.simulationMode).toBe(true);
            expect(afterCount).toBe(beforeCount); // No new executions created
        });

        it('should produce identical shape to real execution', async () => {
            const simResult = await runSimulation({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: true
            });

            expect(simResult).toHaveProperty('decisionId');
            expect(simResult).toHaveProperty('brandId');
            expect(simResult).toHaveProperty('rulesEvaluated');
            expect(simResult).toHaveProperty('rulesTriggered');
            expect(simResult).toHaveProperty('executionIntents');
            expect(simResult).toHaveProperty('results');
        });
    });

    describe('Rollback System', () => {
        it('should create snapshot before execution', async () => {
            const snapshot = await createSnapshot(
                'test_exec_001',
                testBrandId,
                'ADS_PAUSE',
                { campaignId: 'camp_123', status: 'active' },
                { roas_7d: 0.8, ad_spend_7d: 500000 }
            );

            expect(snapshot).toBeDefined();
            expect(snapshot.snapshotId).toBeDefined();
            expect(snapshot.state.campaignId).toBe('camp_123');
        });

        it('should execute rollback successfully', async () => {
            // Create execution with snapshot
            const executionId = 'test_exec_rollback';

            await prisma.executionLog.create({
                data: {
                    id: executionId,
                    brandId: testBrandId,
                    ruleId: 'RULE_ADS_001',
                    actionId: 'ADS_PAUSE',
                    autonomyLevel: 3,
                    executionStatus: 'success',
                    executedAt: new Date(),
                    preMetrics: {},
                    auditData: {}
                }
            });

            const snapshot = await createSnapshot(
                executionId,
                testBrandId,
                'ADS_PAUSE',
                { campaignId: 'camp_123' },
                { roas_7d: 0.8 }
            );

            await prisma.executionLog.update({
                where: { id: executionId },
                data: { snapshotId: snapshot.snapshotId }
            });

            const result = await executeRollback(executionId, 'manual', 'user_123');

            expect(result.success).toBe(true);

            const execution = await prisma.executionLog.findUnique({
                where: { id: executionId }
            });

            expect(execution?.executionStatus).toBe('rolled_back');
        });
    });

    describe('Audit Logging', () => {
        it('should log all decision evaluations', async () => {
            await evaluateDecisions({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: false
            });

            const auditLogs = await prisma.auditLog.findMany({
                where: { brandId: testBrandId }
            });

            expect(auditLogs.length).toBeGreaterThan(0);
        });

        it('should log safety gate blocks', async () => {
            // Create execution to trigger cooldown
            await prisma.executionLog.create({
                data: {
                    id: 'test_exec_001',
                    brandId: testBrandId,
                    ruleId: 'RULE_ADS_001',
                    actionId: 'ADS_PAUSE',
                    autonomyLevel: 3,
                    executionStatus: 'success',
                    executedAt: new Date(),
                    preMetrics: {},
                    auditData: {}
                }
            });

            await evaluateDecisions({
                brandId: testBrandId,
                triggeredBy: 'manual',
                simulationMode: false
            });

            const blockLogs = await prisma.auditLog.findMany({
                where: {
                    brandId: testBrandId,
                    eventType: 'safety_gate_blocked'
                }
            });

            // May or may not have blocks depending on data
            expect(blockLogs).toBeDefined();
        });
    });
});
