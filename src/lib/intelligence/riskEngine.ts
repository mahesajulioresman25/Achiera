import { prisma, unisolatedPrisma } from '@/lib/prisma';
import { AnomalyType, AnomalySeverity, AnomalyStatus } from '@prisma/client';

/**
 * Proactively scans the database for suspicious operational patterns.
 * This should be triggered by specific events (e.g. order cancellation) 
 * or run as a scheduled job.
 */
export async function scanForAnomalies() {
    const findings: any[] = [];
    const now = new Date();
    const probePeriod = new Date(now.getTime() - 48 * 60 * 60 * 1000); // Scan last 48h

    // 1. High-Value Cancellations (Greater than Rp 1.000.000)
    const highValueCancellations = await unisolatedPrisma.order.findMany({
        where: {
            status: 'CANCELLED',
            totalAmount: { gte: 1000000 },
            updatedAt: { gte: probePeriod }
        },
        include: { brand: { select: { name: true } } }
    });

    for (const order of highValueCancellations) {
        findings.push({
            brandId: order.brandId,
            type: AnomalyType.HIGH_VALUE_CANCELLATION,
            severity: AnomalySeverity.CRITICAL,
            description: `High-value order ${order.invoiceNo} (Rp ${Number(order.totalAmount || 0).toLocaleString()}) was cancelled in brand ${order.brand?.name || 'Unknown'}.`,
            metadata: {
                orderId: order.id,
                invoiceNo: order.invoiceNo,
                amount: Number(order.totalAmount || 0),
                cancelledAt: order.updatedAt,
                brandName: order.brand?.name
            }
        });
    }

    // 2. Transfer Velocity (Detected as more than 3 transfers between same brands in 48h)
    const recentTransfers = await prisma.interBrandTransfer.findMany({
        where: {
            createdAt: { gte: probePeriod }
        },
        include: {
            sendingBrand: { select: { name: true } },
            receivingBrand: { select: { name: true } }
        }
    });

    const pairingCounts: Record<string, { count: number; sendName: string; recvName: string }> = {};
    recentTransfers.forEach((t: any) => {
        const key = `${t.sendingBrandId}-${t.receivingBrandId}`;
        if (!pairingCounts[key]) {
            pairingCounts[key] = {
                count: 0,
                sendName: t.sendingBrand.name,
                recvName: t.receivingBrand.name
            };
        }
        pairingCounts[key].count++;
    });

    for (const [key, data] of Object.entries(pairingCounts)) {
        if (data.count >= 3) {
            const [sendId, recvId] = key.split('-');
            findings.push({
                type: AnomalyType.TRANSFER_VELOCITY,
                severity: AnomalySeverity.WARNING,
                description: `Suspicious transfer frequency (${data.count} transfers) between ${data.sendName} and ${data.recvName}.`,
                metadata: {
                    sendingBrandId: sendId,
                    receivingBrandId: recvId,
                    sendingBrandName: data.sendName,
                    receivingBrandName: data.recvName,
                    count: data.count,
                    period: '48h'
                }
            });
        }
    }

    // 3. Unauthorized Holding Access (Patterns of forbidden attempts in Audit Logs)
    const securityAlerts = await unisolatedPrisma.auditLog.findMany({
        where: {
            // @ts-ignore
            action: { in: ['UNAUTHORIZED_ACCESS', 'FORBIDDEN_ATTEMPT', 'HOLDING_ACCESS_DENIED'] },
            createdAt: { gte: probePeriod }
        },
        include: { user: { select: { id: true, name: true, email: true } } }
    }) as any[];

    for (const log of securityAlerts) {
        findings.push({
            type: AnomalyType.UNAUTHORIZED_HOLDING_ACCESS,
            severity: AnomalySeverity.CRITICAL,
            description: `Unauthorized access attempt to sensitive data by user ${log.user.name}.`,
            metadata: {
                userId: log.userId,
                userName: log.user.name,
                userEmail: log.user.email,
                action: log.action,
                entityType: log.entityType,
                ipAddress: log.ipAddress
            }
        });
    }

    // 4. Low Stock Risk (Detection as variant stockOnHand < 50)
    const lowStockItems = await prisma.frozenVariant.findMany({
        where: { stockOnHand: { lt: 50 } },
        include: {
            product: {
                include: {
                    category: { include: { brand: true } },
                    inventoryCategory: { include: { brand: true } }
                }
            }
        }
    }) as any[];

    for (const item of lowStockItems) {
        const brand = item.product?.category?.brand || item.product?.inventoryCategory?.brand;
        findings.push({
            brandId: brand?.id,
            type: 'LOW_STOCK' as any,
            severity: AnomalySeverity.WARNING,
            description: `Variant "${item.name}" (SKU: ${item.sku}) is running low on stock (${item.stockOnHand} left) in brand ${brand?.name || 'Unknown'}.`,
            metadata: {
                variantId: item.id,
                sku: item.sku,
                stockOnHand: item.stockOnHand,
                brandName: brand?.name
            }
        });
    }

    // 5. Expiring Inventory Risk (Detection as batches expiring within 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringBatches = await unisolatedPrisma.inventoryBatch.findMany({
        where: {
            expiryDate: { gte: now, lte: thirtyDaysFromNow },
            quantity: { gt: 0 }
        },
        include: {
            variant: {
                include: {
                    product: {
                        include: {
                            category: { include: { brand: true } },
                            inventoryCategory: { include: { brand: true } }
                        }
                    }
                }
            }
        }
    }) as any[];

    for (const batch of expiringBatches) {
        const variant = batch.variant;
        const brand = variant?.product?.category?.brand || variant?.product?.inventoryCategory?.brand;

        findings.push({
            brandId: brand?.id,
            type: 'EXPIRING_INVENTORY' as any,
            severity: AnomalySeverity.CRITICAL,
            description: `Batch ${batch.batchCode} of "${variant?.name}" (${batch.quantity} units) is expiring on ${batch.expiryDate.toLocaleDateString()} in brand ${brand?.name || 'Unknown'}.`,
            metadata: {
                batchId: batch.id,
                batchCode: batch.batchCode,
                variantId: batch.variantId,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity,
                brandName: brand?.name || 'Unknown'
            }
        });
    }

    // 6. Persistence with Deduplication
    let createdCount = 0;
    for (const finding of findings) {
        // Find if this specific anomaly was already reported recently to avoid spam
        const existing = await prisma.anomaly.findFirst({
            where: {
                type: finding.type,
                description: finding.description,
                status: AnomalyStatus.OPEN,
                createdAt: { gte: probePeriod }
            }
        });

        if (!existing) {
            await prisma.anomaly.create({
                data: {
                    ...finding,
                    status: AnomalyStatus.OPEN
                }
            });
            createdCount++;
        }
    }

    return createdCount;
}
