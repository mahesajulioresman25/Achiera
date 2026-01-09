import { prisma } from './src/lib/prisma';

async function checkCOA() {
    const brandId = 'cmjfzw4890001cpfuc6434i22';
    const accounts = await prisma.ledgerAccount.findMany({
        where: { brandId }
    });
    console.log(`Accounts for Rasa Ibu (${brandId}):`, accounts.length);
    accounts.forEach(a => {
        console.log(`${a.code}: ${a.name}`);
    });
}

checkCOA();
