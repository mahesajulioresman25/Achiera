import { prisma } from '@/lib/prisma';
import { AccountType, LedgerAccount } from '@prisma/client';
import { getAccountByCode } from './chartOfAccounts';

export type DateRange = {
    start: Date;
    end: Date;
};

/**
 * Financial Reports Engine
 */
export class FinancialReports {

    /**
     * Generate Profit & Loss Statement (Income Statement)
     * @param consolidated - If true, excludes inter-company revenue/expense accounts
     */
    static async getProfitLoss(brandId: string, range: DateRange, consolidated = false) {
        // 1. Fetch Tax Settings
        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });
        const settings = (brand?.paymentSettings as any) || { taxRates: { PPN: 11, PPH: 0.5 } };
        const taxRate = settings.taxRates?.PPH || 0.5;

        // 2. Fetch Revenue and Expense Accounts
        const whereClause: any = {
            brandId,
            type: { in: ['REVENUE', 'EXPENSE'] }
        };

        if (consolidated) {
            whereClause.code = {
                notIn: ['IC_REVENUE', 'IC_EXPENSE', 'IC_RECEIVABLE', 'IC_PAYABLE']
            };
        }

        const accounts = await prisma.ledgerAccount.findMany({
            where: whereClause,
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                entries: {
                    where: {
                        createdAt: {
                            gte: range.start,
                            lte: range.end
                        }
                    },
                    select: {
                        debit: true,
                        credit: true
                    }
                }
            }
        });

        const report = {
            revenue: { total: 0, items: [] as any[] },
            cogs: { total: 0, items: [] as any[] }, // Harga Pokok Penjualan
            grossProfit: 0,
            expenses: { total: 0, items: [] as any[] },
            operatingIncome: 0,
            otherIncomeExpense: { total: 0, items: [] as any[] },
            netIncomeBeforeTax: 0,
            taxAmount: 0,
            netProfit: 0,
            margin: 0
        };

        for (const acc of accounts) {
            let balance = 0;
            const debits = acc.entries.reduce((sum: number, e: any) => sum + Number(e.debit), 0);
            const credits = acc.entries.reduce((sum: number, e: any) => sum + Number(e.credit), 0);

            if (acc.type === 'REVENUE') {
                balance = credits - debits;
                if (balance !== 0) {
                    if (acc.code.startsWith('4-')) {
                        report.revenue.items.push({ code: acc.code, name: acc.name, amount: balance });
                        report.revenue.total += balance;
                    } else {
                        report.otherIncomeExpense.items.push({ code: acc.code, name: acc.name, amount: balance });
                        report.otherIncomeExpense.total += balance;
                    }
                }
            } else if (acc.code === '5-1000' || acc.code.startsWith('5-1')) { // HPP / COGS
                balance = debits - credits;
                if (balance !== 0) {
                    report.cogs.items.push({ code: acc.code, name: acc.name, amount: balance });
                    report.cogs.total += balance;
                }
            } else {
                balance = debits - credits;
                if (balance !== 0) {
                    if (acc.code.startsWith('5-9')) { // Non-operating expenses
                        report.otherIncomeExpense.items.push({ code: acc.code, name: acc.name, amount: -balance });
                        report.otherIncomeExpense.total -= balance;
                    } else {
                        report.expenses.items.push({ code: acc.code, name: acc.name, amount: balance });
                        report.expenses.total += balance;
                    }
                }
            }
        }

        report.grossProfit = report.revenue.total - report.cogs.total;
        report.operatingIncome = report.grossProfit - report.expenses.total;
        report.netIncomeBeforeTax = report.operatingIncome + report.otherIncomeExpense.total;

        // Calculate Tax (UMKM PPh Final is usually based on Gross Revenue)
        report.taxAmount = (report.revenue.total * (taxRate / 100));
        report.netProfit = report.netIncomeBeforeTax - report.taxAmount;

        const margin = report.revenue.total > 0 ? (report.netProfit / report.revenue.total) * 100 : 0;
        report.margin = isFinite(margin) ? margin : 0;

        return report;
    }

    /**
     * Generate Balance Sheet
     */
    static async getBalanceSheet(brandId: string, asOfDate: Date) {
        // 1. Fetch Asset, Liability, Equity Accounts
        const accounts = await prisma.ledgerAccount.findMany({
            where: {
                brandId,
                type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
            }
        });

        // 2. Fetch Net Income (Retained Earnings adjustment) up to asOfDate
        const plAccounts = await prisma.ledgerAccount.findMany({
            where: {
                brandId,
                type: { in: ['REVENUE', 'EXPENSE'] }
            },
            include: {
                entries: {
                    where: { createdAt: { lte: asOfDate } }
                }
            }
        });

        let netIncomeAllTime = 0;
        for (const acc of plAccounts) {
            const debits = acc.entries.reduce((sum: number, e: any) => sum + Number(e.debit), 0);
            const credits = acc.entries.reduce((sum: number, e: any) => sum + Number(e.credit), 0);
            if (acc.type === 'REVENUE') netIncomeAllTime += (credits - debits);
            else netIncomeAllTime -= (debits - credits);
        }

        // 3. Batch fetch balances for Asset, Liability, Equity
        const accountIds = accounts.map((a: any) => a.id);
        const balances = await prisma.journalEntry.groupBy({
            by: ['accountId'],
            where: {
                accountId: { in: accountIds },
                createdAt: { lte: asOfDate }
            },
            _sum: { debit: true, credit: true }
        });

        const balanceMap = new Map(balances.map((b: any) => [b.accountId, b]));

        const report = {
            assets: { total: 0, items: [] as any[] },
            liabilities: { total: 0, items: [] as any[] },
            equity: { total: 0, items: [] as any[], retainedEarnings: 0 },
            isBalanced: false,
            difference: 0
        };

        for (const acc of accounts) {
            const sum: any = balanceMap.get(acc.id);
            const debits = Number(sum?._sum?.debit || 0);
            const credits = Number(sum?._sum?.credit || 0);
            let balance = 0;

            if (acc.type === 'ASSET') {
                balance = debits - credits;
                if (balance !== 0) {
                    report.assets.items.push({ code: acc.code, name: acc.name, amount: balance });
                    report.assets.total += balance;
                }
            } else if (acc.type === 'LIABILITY') {
                balance = credits - debits;
                if (balance !== 0) {
                    report.liabilities.items.push({ code: acc.code, name: acc.name, amount: balance });
                    report.liabilities.total += balance;
                }
            } else if (acc.type === 'EQUITY') {
                balance = credits - debits;
                if (balance !== 0) {
                    report.equity.items.push({ code: acc.code, name: acc.name, amount: balance });
                    report.equity.total += balance;
                }
            }
        }

        // Add Net Income to Equity
        if (netIncomeAllTime !== 0) {
            report.equity.items.push({ code: 'CALC-RE', name: 'Laba/Rugi s.d Saat Ini', amount: netIncomeAllTime });
            report.equity.total += netIncomeAllTime;
        }

        report.difference = report.assets.total - (report.liabilities.total + report.equity.total);
        report.isBalanced = Math.abs(report.difference) < 1; // Tolerance for float precision

        return report;
    }

    /**
     * Generate Cash Flow Statement (Direct Method)
     */
    static async getCashFlow(brandId: string, range: DateRange) {
        // 1. Identify Cash & Bank Accounts (usually 1-1xxx)
        const cashAccounts = await prisma.ledgerAccount.findMany({
            where: {
                brandId,
                code: { startsWith: '1-1' } // Kas & Bank
            }
        });
        const cashAccountIds = cashAccounts.map((a: any) => a.id);

        // 2. Fetch all entries involving these accounts in range
        const entries = await prisma.journalEntry.findMany({
            where: {
                accountId: { in: cashAccountIds },
                createdAt: { gte: range.start, lte: range.end },
                account: { brandId } // Ensure isolation through relation
            },
            include: {
                transaction: {
                    include: {
                        entries: {
                            where: {
                                accountId: { notIn: cashAccountIds },
                                account: { brandId } // Fixed: filter through relation
                            },
                            include: { account: true }
                        }
                    }
                }
            }
        });

        const report = {
            operating: { total: 0, items: [] as any[] },
            investing: { total: 0, items: [] as any[] },
            financing: { total: 0, items: [] as any[] },
            netChange: 0,
            openingBalance: 0,
            closingBalance: 0
        };

        // Get Opening Balance
        const openingEntries = await prisma.journalEntry.aggregate({
            where: {
                account: { brandId }, // Nested for isolation
                accountId: { in: cashAccountIds },
                createdAt: { lt: range.start }
            },
            _sum: { debit: true, credit: true }
        });
        report.openingBalance = Number(openingEntries?._sum?.debit || 0) - Number(openingEntries?._sum?.credit || 0);

        for (const entry of entries) {
            const amount = Number(entry.debit) - Number(entry.credit);

            // Analyze the other side of the transaction to categorize
            const otherSide = (entry as any).transaction.entries[0];
            if (!otherSide) continue;

            const category = this.categorizeCashFlow(otherSide.account.type, otherSide.account.code);

            const group = (report as any)[category];
            const existing = group.items.find((i: any) => i.name === otherSide.account.name);
            if (existing) {
                existing.amount += amount;
            } else {
                group.items.push({ name: otherSide.account.name, amount });
            }
            group.total += amount;
        }

        report.netChange = report.operating.total + report.investing.total + report.financing.total;
        report.closingBalance = report.openingBalance + report.netChange;

        return report;
    }

    private static categorizeCashFlow(type: AccountType, code: string): 'operating' | 'investing' | 'financing' {
        if (type === 'REVENUE' || type === 'EXPENSE') return 'operating';
        if (code.startsWith('1-2')) return 'investing'; // Fixed Assets
        if (type === 'EQUITY' || code.startsWith('2-2')) return 'financing'; // Equity or Long-term Loans
        return 'operating'; // Default to operating for things like AR/AP shifts
    }

    /**
     * Generate Statement of Changes in Equity
     */
    static async getEquityStatement(brandId: string, range: DateRange) {
        // 1. Initial Balance (Sum all entries for Equity accounts before range)
        const accounts = await prisma.ledgerAccount.findMany({
            where: { brandId, type: 'EQUITY' }
        });
        const accountIds = accounts.map((a: any) => a.id);

        const initialRes = await prisma.journalEntry.aggregate({
            where: {
                account: { brandId }, // Nested for isolation
                accountId: { in: accountIds },
                createdAt: { lt: range.start }
            },
            _sum: { debit: true, credit: true }
        });
        const initialBalance = Number(initialRes?._sum?.credit || 0) - Number(initialRes?._sum?.debit || 0);

        // 2. Net Income for period
        const pl = await this.getProfitLoss(brandId, range);
        const netIncome = pl.netProfit;

        // 3. Transactions in period (Draws/Injections)
        const entries = await prisma.journalEntry.findMany({
            where: {
                account: { brandId }, // Nested for isolation
                accountId: { in: accountIds },
                createdAt: { gte: range.start, lte: range.end }
            },
            include: { account: true }
        });

        const injections = entries.filter((e: any) => Number(e.credit) > 0).reduce((sum: number, e: any) => sum + Number(e.credit), 0);
        const withdrawals = entries.filter((e: any) => Number(e.debit) > 0).reduce((sum: number, e: any) => sum + Number(e.debit), 0);

        return {
            period: range,
            initialBalance,
            netIncome,
            injections,
            withdrawals,
            closingBalance: initialBalance + netIncome + injections - withdrawals
        };
    }

    /**
     * Generate Tax Report
     */
    static async getTaxReport(brandId: string, range: DateRange) {
        const pl = await this.getProfitLoss(brandId, range);
        const taxableRevenue = pl.revenue.total;

        const brand = await prisma.brand.findUnique({
            where: { id: brandId },
            select: { paymentSettings: true }
        });
        const settings = (brand?.paymentSettings as any) || { taxRates: { PPN: 11, PPH: 0.5 } };
        const rates = settings.taxRates || { PPN: 11, PPH: 0.5 };

        const liabilities = [];
        let totalTaxDue = 0;

        if (rates.PPN > 0) {
            const amount = taxableRevenue * (rates.PPN / 100);
            liabilities.push({
                type: 'PPN / PB1',
                rate: rates.PPN,
                base: taxableRevenue,
                amount: amount,
                description: 'Pajak Penjualan/Restoran'
            });
            totalTaxDue += amount;
        }

        if (rates.PPH > 0) {
            const amount = taxableRevenue * (rates.PPH / 100);
            liabilities.push({
                type: 'PPh Final (UMKM)',
                rate: rates.PPH,
                base: taxableRevenue,
                amount: amount,
                description: 'Pajak Penghasilan (0.5% Bruto)'
            });
            totalTaxDue += amount;
        }

        return {
            period: range,
            grossRevenue: taxableRevenue,
            liabilities,
            totalTaxDue
        };
    }

    /**
     * Generate Notes to Financial Statements (CaLK)
     */
    static async getNotes(brandId: string, range: DateRange) {
        const pl = await this.getProfitLoss(brandId, range);
        const bs = await this.getBalanceSheet(brandId, range.end);

        // Dynamic analysis with zero-data guards
        const revenueTotal = pl.revenue.total || 0;
        const netProfit = pl.netProfit || 0;
        const margin = pl.margin || 0;
        const expenseToRevenue = revenueTotal > 0 ? ((pl.expenses.total / revenueTotal) * 100).toFixed(2) : "0.00";

        const notes = [
            {
                title: "Dasar Penyusunan",
                content: "Laporan keuangan disusun menggunakan basis akrual dan metode harga perolehan. Kebijakan akuntansi konsisten dengan standar pelaporan keuangan entitas mikro (EMKM)."
            },
            {
                title: "Pendapatan Usaha",
                content: revenueTotal > 0
                    ? `Total omset sebesar ${revenueTotal.toLocaleString('id-ID')} terkumpul dari ${pl.revenue.items.length} channel penjualan. Rata-rata margin bersih tercatat sebesar ${margin.toFixed(2)}%.`
                    : "Belum terdapat catatan pendapatan pada periode ini."
            },
            {
                title: "Biaya Operasional",
                content: pl.expenses.total > 0
                    ? `Beban operasional utama terdiri dari ${pl.expenses.items.slice(0, 3).map(i => i.name).join(', ')}. Kontribusi beban terhadap omset adalah ${expenseToRevenue}%.`
                    : "Belum terdapat catatan beban operasional pada periode ini."
            },
            {
                title: "Posisi Kas",
                content: `Total aset lancar dalam bentuk Kas & Bank per tanggal ${range.end.toLocaleDateString()} adalah ${bs.assets.total.toLocaleString('id-ID')}.`
            },
            {
                title: "Kewajiban & Pajak",
                content: `Estimasi kewajiban pajak PPh Final (0.5%) untuk periode ini adalah ${pl.taxAmount.toLocaleString('id-ID')}. Total liabilitas tercatat ${bs.liabilities.total.toLocaleString('id-ID')}.`
            }
        ];

        return {
            period: range,
            notes
        };
    }


}
