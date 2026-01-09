import { prisma } from '@/lib/prisma';
import { ReconciliationStatus } from '@prisma/client';
import { updateOrderStatus } from '@/lib/actions/rasa-ibu/orders';

export class ReconciliationService {

    /**
     * Create a new payment reconciliation request (e.g. customer uploads proof)
     */
    static async submitPaymentProof(
        orderId: string,
        brandId: string,
        amount: number,
        paymentMethod: string,
        proofUrl: string,
        bankAccount?: string,
        notes?: string
    ) {
        return prisma.paymentReconciliation.create({
            data: {
                brandId,
                orderId,
                amount,
                paymentMethod,
                paymentProof: proofUrl,
                bankAccount,
                notes,
                status: 'PENDING'
            }
        });
    }

    /**
     * Get pending reconciliations for dashboard
     */
    static async getPendingReconciliations(brandId: string) {
        return prisma.paymentReconciliation.findMany({
            where: {
                brandId,
                status: 'PENDING'
            },
            include: {
                order: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        customerName: true,
                        totalAmount: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Verify a payment reconciliation
     * - Updates Reconciliation status to VERIFIED
     * - Updates Order status to DIBAYAR (which triggers Journal Entry)
     */
    static async verifyPayment(reconciliationId: string, verifiedBy: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Get and specific reconciliation
            const recon = await tx.paymentReconciliation.findUnique({
                where: { id: reconciliationId }
            });

            if (!recon) throw new Error('Reconciliation not found');

            // 2. Update status
            const updatedRecon = await tx.paymentReconciliation.update({
                where: { id: reconciliationId },
                data: {
                    status: 'VERIFIED',
                    reconciledBy: verifiedBy,
                    reconciledAt: new Date()
                }
            });

            // 3. Update Order Status (This triggers Journal Entry via existing orders.ts logic)
            // We need to call the server action logic. calling imported function behaves as server-side call.
            await updateOrderStatus(recon.orderId, 'DIBAYAR');

            return updatedRecon;
        });
    }

    /**
     * Reject a payment reconciliation
     */
    static async rejectPayment(reconciliationId: string, reason: string, rejectedBy: string) {
        return prisma.paymentReconciliation.update({
            where: { id: reconciliationId },
            data: {
                status: 'REJECTED',
                notes: reason, // Append or overwrite notes? Overwrite for now or append logic needed
                reconciledBy: rejectedBy,
                reconciledAt: new Date()
            }
        });
    }
}
