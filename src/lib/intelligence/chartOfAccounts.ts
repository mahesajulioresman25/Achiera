import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';

export const DEFAULT_CHART_OF_ACCOUNTS = [
    // ASSETS (1-xxxx)
    { code: '1-1001', name: 'Kas Besar', type: 'ASSET' as AccountType },
    { code: '1-1002', name: 'Kas Kecil (Petty Cash)', type: 'ASSET' as AccountType },
    { code: '1-1100', name: 'Bank BCA', type: 'ASSET' as AccountType },
    { code: '1-1101', name: 'Bank Mandiri', type: 'ASSET' as AccountType },
    { code: '1-1102', name: 'Bank BRI', type: 'ASSET' as AccountType },
    { code: '1-1103', name: 'Bank BNI', type: 'ASSET' as AccountType },
    { code: '1-1200', name: 'Piutang Usaha', type: 'ASSET' as AccountType },
    { code: '1-1201', name: 'Piutang Karyawan', type: 'ASSET' as AccountType },
    { code: '1-1300', name: 'Persediaan Bahan Baku', type: 'ASSET' as AccountType },
    { code: '1-1301', name: 'Persediaan Barang Jadi', type: 'ASSET' as AccountType },
    { code: '1-1400', name: 'Perlengkapan (Supplies)', type: 'ASSET' as AccountType },
    { code: '1-1500', name: 'Sewa Dibayar Dimuka', type: 'ASSET' as AccountType },
    { code: '1-2000', name: 'Peralatan Dapur & Resto', type: 'ASSET' as AccountType },
    { code: '1-2001', name: 'Akum. Peny. Peralatan', type: 'ASSET' as AccountType },
    { code: '1-2100', name: 'Inventaris Kantor', type: 'ASSET' as AccountType },
    { code: '1-2101', name: 'Akum. Peny. Inventaris', type: 'ASSET' as AccountType },
    { code: '1-2200', name: 'Renovasi Bangunan', type: 'ASSET' as AccountType },

    // LIABILITIES (2-xxxx)
    { code: '2-1000', name: 'Hutang Usaha', type: 'LIABILITY' as AccountType },
    { code: '2-1100', name: 'Hutang Gaji', type: 'LIABILITY' as AccountType },
    { code: '2-1200', name: 'Hutang PB1 (Tax)', type: 'LIABILITY' as AccountType },
    { code: '2-1201', name: 'Hutang PPh 21', type: 'LIABILITY' as AccountType },
    { code: '2-1202', name: 'Hutang PPh 23', type: 'LIABILITY' as AccountType },
    { code: '2-2000', name: 'Pinjaman Bank Jangka Panjang', type: 'LIABILITY' as AccountType },

    // EQUITY (3-xxxx)
    { code: '3-1000', name: 'Modal Disetor', type: 'EQUITY' as AccountType },
    { code: '3-1100', name: 'Prive Pemilik', type: 'EQUITY' as AccountType },
    { code: '3-2000', name: 'Laba Ditahan', type: 'EQUITY' as AccountType },
    { code: '3-3000', name: 'Ikhtisar Laba Rugi', type: 'EQUITY' as AccountType },

    // REVENUE (4-xxxx)
    { code: '4-1000', name: 'Pendapatan Makanan', type: 'REVENUE' as AccountType },
    { code: '4-1001', name: 'Pendapatan Minuman', type: 'REVENUE' as AccountType },
    { code: '4-2000', name: 'Pendapatan Service Charge', type: 'REVENUE' as AccountType },
    { code: '4-3000', name: 'Diskon Penjualan & Promosi', type: 'REVENUE' as AccountType },
    { code: '4-4000', name: 'Pendapatan Lain-lain', type: 'REVENUE' as AccountType },

    // EXPENSES & COGS (5-xxxx)
    { code: '5-1000', name: 'Harga Pokok Penjualan (COGS)', type: 'EXPENSE' as AccountType },
    { code: '5-1100', name: 'Biaya Kemasan (Packaging)', type: 'EXPENSE' as AccountType },
    { code: '5-7000', name: 'Beban Penyusutan Aset', type: 'EXPENSE' as AccountType },
    { code: '5-2000', name: 'Biaya Gaji & Tunjangan', type: 'EXPENSE' as AccountType },
    { code: '5-2100', name: 'Biaya Lembur', type: 'EXPENSE' as AccountType },
    { code: '5-2200', name: 'THR & Bonus', type: 'EXPENSE' as AccountType },
    { code: '5-3000', name: 'Biaya Listrik, Air, Internet', type: 'EXPENSE' as AccountType },
    { code: '5-3100', name: 'Biaya Gas Dapur', type: 'EXPENSE' as AccountType },
    { code: '5-3200', name: 'Biaya Kebersihan & Keamanan', type: 'EXPENSE' as AccountType },
    { code: '5-3300', name: 'Biaya Perbaikan & Pemeliharaan', type: 'EXPENSE' as AccountType },
    { code: '5-4000', name: 'Biaya Sewa Tempat', type: 'EXPENSE' as AccountType },
    { code: '5-5000', name: 'Biaya Marketing & Iklan', type: 'EXPENSE' as AccountType },
    { code: '5-6000', name: 'Biaya Adm. Bank & Marketplace', type: 'EXPENSE' as AccountType },
    { code: '5-6100', name: 'Biaya Pajak & Perijinan', type: 'EXPENSE' as AccountType },
    { code: '5-7000', name: 'Biaya Penyusutan Aset', type: 'EXPENSE' as AccountType },
    { code: '5-8000', name: 'Biaya Dibuang (Waste)', type: 'EXPENSE' as AccountType },
    { code: '5-7200', name: 'Biaya Loyalty & Reward', type: 'EXPENSE' as AccountType },
    { code: '5-9000', name: 'Biaya Lain-lain', type: 'EXPENSE' as AccountType },
];

/**
 * Initialize chart of accounts for a brand
 */
export async function initializeChartOfAccounts(brandId: string) {
    try {
        console.log(`Initializing Chart of Accounts for brand ${brandId}...`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
            // Check if account already exists
            const existing = await prisma.ledgerAccount.findUnique({
                where: {
                    brandId_code: {
                        brandId,
                        code: account.code
                    }
                }
            });

            if (!existing) {
                await prisma.ledgerAccount.create({
                    data: {
                        brandId,
                        code: account.code,
                        name: account.name,
                        type: account.type,
                        balance: 0
                    }
                });
                createdCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`CoA Initialization Complete. Created: ${createdCount}, Skipped: ${skippedCount}`);
        return { success: true, createdCount, skippedCount };
    } catch (error: any) {
        console.error('Failed to initialize CoA:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get account by code helper
 */
export async function getAccountByCode(brandId: string, code: string) {
    return prisma.ledgerAccount.findUnique({
        where: {
            brandId_code: {
                brandId,
                code
            }
        }
    });
}
