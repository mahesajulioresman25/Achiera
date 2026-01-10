import { unisolatedPrisma as prisma } from '@/lib/prisma';
import { JournalService } from "../intelligence/journalService";

export interface ICTransactionInput {
    fromBrandId: string;
    toBrandId: string;
    type: 'LOAN' | 'MATERIAL_TRANSFER' | 'SERVICE_FEE' | 'SHARED_EXPENSE';
    amount: number;
    description: string;
    referenceNo?: string;
}

export interface ICBalance {
    brandId: string;
    brandName: string;
    netPosition: number; // Positive = receivable, Negative = payable
    details: {
        counterpartyBrandId: string;
        counterpartyName: string;
        receivable: number;
        payable: number;
        net: number;
    }[];
}

export interface ConsolidationElimination {
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
}

export class InterCompanyService {
    /**
     * Create new inter-company transaction (PENDING status)
     */
    async createICTransaction(data: ICTransactionInput) {
        try {
            // Validate brands exist
            const [fromBrand, toBrand] = await Promise.all([
                prisma.brand.findUnique({ where: { id: data.fromBrandId } }),
                prisma.brand.findUnique({ where: { id: data.toBrandId } })
            ]);

            if (!fromBrand || !toBrand) {
                return { success: false, error: 'Invalid brand ID' };
            }

            if (data.fromBrandId === data.toBrandId) {
                return { success: false, error: 'Cannot create IC transaction with same brand' };
            }

            // Apply transfer pricing validation
            const validationResult = this.validateTransferPricing(data);
            if (!validationResult.valid) {
                return { success: false, error: validationResult.message };
            }

            const transaction = await prisma.interCompanyTransaction.create({
                data: {
                    fromBrandId: data.fromBrandId,
                    toBrandId: data.toBrandId,
                    type: data.type,
                    amount: data.amount,
                    description: data.description,
                    referenceNo: data.referenceNo,
                    status: 'PENDING'
                },
                include: {
                    fromBrand: true,
                    toBrand: true
                }
            });

            return { success: true, data: transaction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Approve IC transaction and create dual journal entries
     */
    async approveICTransaction(transactionId: string, approvedBy: string) {
        try {
            const transaction = await prisma.interCompanyTransaction.findUnique({
                where: { id: transactionId },
                include: { fromBrand: true, toBrand: true }
            });

            if (!transaction) {
                return { success: false, error: 'Transaction not found' };
            }

            if (transaction.status !== 'PENDING') {
                return { success: false, error: 'Transaction already processed' };
            }

            // Create journal entries based on transaction type
            const journalEntries = await this.createDualJournalEntries(transaction);

            // Update transaction status
            await prisma.interCompanyTransaction.update({
                where: { id: transactionId },
                data: {
                    status: 'APPROVED',
                    approvedBy,
                    approvedAt: new Date(),
                    fromJournalId: journalEntries.fromJournalId,
                    toJournalId: journalEntries.toJournalId
                }
            });

            return { success: true, data: { journalEntries } };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject IC transaction
     */
    async rejectICTransaction(transactionId: string) {
        try {
            await prisma.interCompanyTransaction.update({
                where: { id: transactionId },
                data: { status: 'REJECTED' }
            });

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get IC balances for all brands
     */
    async getICBalances(): Promise<ICBalance[]> {
        const transactions = await prisma.interCompanyTransaction.findMany({
            where: { status: 'APPROVED' },
            include: {
                fromBrand: true,
                toBrand: true
            }
        });

        // Group by brand
        const balanceMap = new Map<string, ICBalance>();

        transactions.forEach(tx => {
            const amount = Number(tx.amount);

            // Process "from" brand (has receivable)
            if (!balanceMap.has(tx.fromBrandId)) {
                balanceMap.set(tx.fromBrandId, {
                    brandId: tx.fromBrandId,
                    brandName: tx.fromBrand.name,
                    netPosition: 0,
                    details: []
                });
            }

            // Process "to" brand (has payable)
            if (!balanceMap.has(tx.toBrandId)) {
                balanceMap.set(tx.toBrandId, {
                    brandId: tx.toBrandId,
                    brandName: tx.toBrand.name,
                    netPosition: 0,
                    details: []
                });
            }

            const fromBalance = balanceMap.get(tx.fromBrandId)!;
            const toBalance = balanceMap.get(tx.toBrandId)!;

            // Update "from" brand details
            let fromDetail = fromBalance.details.find(d => d.counterpartyBrandId === tx.toBrandId);
            if (!fromDetail) {
                fromDetail = {
                    counterpartyBrandId: tx.toBrandId,
                    counterpartyName: tx.toBrand.name,
                    receivable: 0,
                    payable: 0,
                    net: 0
                };
                fromBalance.details.push(fromDetail);
            }
            fromDetail.receivable += amount;
            fromDetail.net = fromDetail.receivable - fromDetail.payable;
            fromBalance.netPosition += amount;

            // Update "to" brand details
            let toDetail = toBalance.details.find(d => d.counterpartyBrandId === tx.fromBrandId);
            if (!toDetail) {
                toDetail = {
                    counterpartyBrandId: tx.fromBrandId,
                    counterpartyName: tx.fromBrand.name,
                    receivable: 0,
                    payable: 0,
                    net: 0
                };
                toBalance.details.push(toDetail);
            }
            toDetail.payable += amount;
            toDetail.net = toDetail.receivable - toDetail.payable;
            toBalance.netPosition -= amount;
        });

        return Array.from(balanceMap.values());
    }

    /**
     * Get consolidation elimination entries
     */
    async getConsolidationEliminationEntries(): Promise<ConsolidationElimination[]> {
        const transactions = await prisma.interCompanyTransaction.findMany({
            where: { status: 'APPROVED' },
            include: { fromBrand: true, toBrand: true }
        });

        const eliminations: ConsolidationElimination[] = [];

        transactions.forEach(tx => {
            const amount = Number(tx.amount);

            // Eliminate IC receivable/payable
            eliminations.push({
                description: `Eliminate IC ${tx.type} between ${tx.fromBrand.name} and ${tx.toBrand.name}`,
                debitAccount: 'IC_PAYABLE',
                creditAccount: 'IC_RECEIVABLE',
                amount
            });

            // For material transfers and service fees, eliminate revenue/expense
            if (tx.type === 'MATERIAL_TRANSFER' || tx.type === 'SERVICE_FEE') {
                eliminations.push({
                    description: `Eliminate IC revenue/expense for ${tx.type}`,
                    debitAccount: 'IC_REVENUE',
                    creditAccount: 'IC_EXPENSE',
                    amount
                });
            }
        });

        return eliminations;
    }

    /**
     * Validate transfer pricing
     */
    private validateTransferPricing(data: ICTransactionInput): { valid: boolean; message?: string } {
        // Material transfer should have reasonable markup (e.g., cost + 10%)
        if (data.type === 'MATERIAL_TRANSFER') {
            // In a real system, you'd check against actual cost
            // For now, just validate amount is positive
            if (data.amount <= 0) {
                return { valid: false, message: 'Material transfer amount must be positive' };
            }
        }

        // Loan should have interest rate validation
        if (data.type === 'LOAN') {
            // Could validate against market rates
            if (data.amount <= 0) {
                return { valid: false, message: 'Loan amount must be positive' };
            }
        }

        return { valid: true };
    }

    /**
     * Create dual journal entries for IC transaction
     */
    private async createDualJournalEntries(transaction: any) {
        const amount = Number(transaction.amount);
        const journalService = new JournalService();

        let fromJournalId: string | undefined;
        let toJournalId: string | undefined;

        switch (transaction.type) {
            case 'LOAN':
                // From brand: Debit IC Receivable, Credit Cash
                fromJournalId = await this.createJournalEntry(
                    transaction.fromBrandId,
                    `IC Loan to ${transaction.toBrand.name}`,
                    'IC_RECEIVABLE',
                    'CASH',
                    amount
                );

                // To brand: Debit Cash, Credit IC Payable
                toJournalId = await this.createJournalEntry(
                    transaction.toBrandId,
                    `IC Loan from ${transaction.fromBrand.name}`,
                    'CASH',
                    'IC_PAYABLE',
                    amount
                );
                break;

            case 'MATERIAL_TRANSFER':
                // From brand: Debit IC Receivable, Credit IC Revenue
                fromJournalId = await this.createJournalEntry(
                    transaction.fromBrandId,
                    `IC Material sale to ${transaction.toBrand.name}`,
                    'IC_RECEIVABLE',
                    'IC_REVENUE',
                    amount
                );

                // To brand: Debit IC Expense, Credit IC Payable
                toJournalId = await this.createJournalEntry(
                    transaction.toBrandId,
                    `IC Material purchase from ${transaction.fromBrand.name}`,
                    'IC_EXPENSE',
                    'IC_PAYABLE',
                    amount
                );
                break;

            case 'SERVICE_FEE':
                // Similar to material transfer
                fromJournalId = await this.createJournalEntry(
                    transaction.fromBrandId,
                    `IC Service fee from ${transaction.toBrand.name}`,
                    'IC_RECEIVABLE',
                    'IC_REVENUE',
                    amount
                );

                toJournalId = await this.createJournalEntry(
                    transaction.toBrandId,
                    `IC Service fee to ${transaction.fromBrand.name}`,
                    'IC_EXPENSE',
                    'IC_PAYABLE',
                    amount
                );
                break;

            case 'SHARED_EXPENSE':
                // From brand: Debit IC Receivable, Credit Expense (reimbursement)
                fromJournalId = await this.createJournalEntry(
                    transaction.fromBrandId,
                    `IC Shared expense reimbursement from ${transaction.toBrand.name}`,
                    'IC_RECEIVABLE',
                    'SHARED_EXPENSE',
                    amount
                );

                // To brand: Debit Expense, Credit IC Payable
                toJournalId = await this.createJournalEntry(
                    transaction.toBrandId,
                    `IC Shared expense to ${transaction.fromBrand.name}`,
                    'SHARED_EXPENSE',
                    'IC_PAYABLE',
                    amount
                );
                break;
        }

        return { fromJournalId, toJournalId };
    }

    /**
     * Helper to create journal entry
     */
    private async createJournalEntry(
        brandId: string,
        description: string,
        debitAccount: string,
        creditAccount: string,
        amount: number
    ): Promise<string> {
        // Find or create IC accounts
        const debitAcc = await this.getOrCreateICAccount(brandId, debitAccount);
        const creditAcc = await this.getOrCreateICAccount(brandId, creditAccount);

        // Create journal transaction
        const transaction = await prisma.journalTransaction.create({
            data: {
                brandId,
                description,
                date: new Date(),
                entries: {
                    create: [
                        {
                            accountId: debitAcc.id,
                            debit: amount,
                            credit: 0
                        },
                        {
                            accountId: creditAcc.id,
                            debit: 0,
                            credit: amount
                        }
                    ]
                }
            }
        });

        return transaction.id;
    }

    /**
     * Get or create IC ledger account
     */
    private async getOrCreateICAccount(brandId: string, code: string) {
        let account = await prisma.ledgerAccount.findFirst({
            where: { brandId, code }
        });

        if (!account) {
            // Create IC account based on code
            const accountConfig = this.getICAccountConfig(code);
            account = await prisma.ledgerAccount.create({
                data: {
                    brandId,
                    code,
                    name: accountConfig.name,
                    type: accountConfig.type,
                    balance: 0
                }
            });
        }

        return account;
    }

    /**
     * Get IC account configuration
     */
    private getICAccountConfig(code: string) {
        const configs: Record<string, { name: string; type: any }> = {
            IC_RECEIVABLE: { name: 'Inter-Company Receivable', type: 'ASSET' },
            IC_PAYABLE: { name: 'Inter-Company Payable', type: 'LIABILITY' },
            IC_REVENUE: { name: 'Inter-Company Revenue', type: 'REVENUE' },
            IC_EXPENSE: { name: 'Inter-Company Expense', type: 'EXPENSE' },
            CASH: { name: 'Cash', type: 'ASSET' },
            SHARED_EXPENSE: { name: 'Shared Expenses', type: 'EXPENSE' }
        };

        return configs[code] || { name: code, type: 'ASSET' };
    }

    /**
     * Get IC transactions for a specific period (for consolidation)
     */
    async getICTransactionsForPeriod(startDate: Date, endDate: Date) {
        return await prisma.interCompanyTransaction.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'APPROVED'
            },
            include: {
                fromBrand: {
                    select: { id: true, name: true }
                },
                toBrand: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Validate IC balance (should be zero-sum)
     */
    async validateICBalance(): Promise<{ isBalanced: boolean; difference: number }> {
        const balances = await this.getICBalances();

        // Sum all net positions - should equal zero
        const totalNet = balances.reduce((sum, b) => sum + b.netPosition, 0);

        return {
            isBalanced: Math.abs(totalNet) < 0.01, // Allow for rounding errors
            difference: totalNet
        };
    }
}
