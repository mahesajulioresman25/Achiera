'use server';

import { CapitalAllocationEngine } from '@/lib/services/CapitalAllocationEngine';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const engine = new CapitalAllocationEngine();

/**
 * Generate capital allocation recommendations
 */
export async function generateAllocationRecommendationsAction(userId: string) {
    try {
        const allocation = await engine.generateRecommendations(userId);

        revalidatePath('/dashboard/owner');

        // Serialize Decimal to Number
        return {
            success: true,
            data: {
                ...allocation,
                totalCashAvailable: Number(allocation.totalCashAvailable),
                overallScore: Number(allocation.overallScore),
                confidence: Number(allocation.confidence)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get cash positions across all brands
 */
export async function getCashPositionsAction() {
    try {
        const analysis = await engine.analyzeCashPositions();

        return {
            success: true,
            data: analysis
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get IC loan suggestions
 */
export async function getICLoanSuggestionsAction() {
    try {
        const analysis = await engine.analyzeCashPositions();
        const suggestions = await engine.suggestICLoans(analysis);

        return {
            success: true,
            data: suggestions
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Predict ROI for an investment
 */
export async function predictROIAction(
    brandId: string,
    amount: number,
    purpose: string
) {
    try {
        const prediction = await engine.predictROI(brandId, amount, purpose);

        return {
            success: true,
            data: prediction
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all allocation recommendations
 */
export async function getAllAllocationsAction(limit: number = 10) {
    try {
        const allocations = await prisma.capitalAllocation.findMany({
            take: limit,
            orderBy: { generatedAt: 'desc' }
        });

        // Serialize Decimals
        const serialized = allocations.map(a => ({
            ...a,
            totalCashAvailable: Number(a.totalCashAvailable),
            overallScore: Number(a.overallScore),
            confidence: Number(a.confidence)
        }));

        return {
            success: true,
            data: serialized
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Approve allocation recommendation
 */
export async function approveAllocationAction(
    allocationId: string,
    userId: string
) {
    try {
        const allocation = await prisma.capitalAllocation.update({
            where: { id: allocationId },
            data: {
                status: 'APPROVED',
                executedBy: userId,
                executedAt: new Date()
            }
        });

        revalidatePath('/dashboard/owner');

        return {
            success: true,
            data: {
                ...allocation,
                totalCashAvailable: Number(allocation.totalCashAvailable),
                overallScore: Number(allocation.overallScore),
                confidence: Number(allocation.confidence)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create allocation scenario
 */
export async function createScenarioAction(data: {
    name: string;
    description?: string;
    allocations: Record<string, number>;
    assumptions: any;
    createdBy: string;
}) {
    try {
        // Simple ROI prediction for scenario
        const predictedROI = 20; // Simplified
        const predictedRevenue = Object.values(data.allocations).reduce((sum, amt) => sum + amt, 0) * 1.2;
        const predictedProfit = predictedRevenue * 0.15;
        const riskScore = 50;

        const scenario = await prisma.allocationScenario.create({
            data: {
                name: data.name,
                description: data.description,
                allocations: data.allocations,
                assumptions: data.assumptions,
                predictedROI,
                predictedRevenue,
                predictedProfit,
                riskScore,
                riskFactors: [],
                createdBy: data.createdBy
            }
        });

        revalidatePath('/dashboard/owner');

        // Serialize Decimals
        return {
            success: true,
            data: {
                ...scenario,
                predictedROI: Number(scenario.predictedROI),
                predictedRevenue: Number(scenario.predictedRevenue),
                predictedProfit: Number(scenario.predictedProfit),
                riskScore: Number(scenario.riskScore)
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get all scenarios
 */
export async function getAllScenariosAction(userId: string) {
    try {
        const scenarios = await prisma.allocationScenario.findMany({
            where: { createdBy: userId },
            orderBy: { createdAt: 'desc' }
        });

        // Serialize Decimals
        const serialized = scenarios.map(s => ({
            ...s,
            predictedROI: Number(s.predictedROI),
            predictedRevenue: Number(s.predictedRevenue),
            predictedProfit: Number(s.predictedProfit),
            riskScore: Number(s.riskScore)
        }));

        return {
            success: true,
            data: serialized
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
