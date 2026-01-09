
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const cats = await prisma.frozenCategory.findMany();
    console.log('Categories found:', cats.length);
    cats.forEach(c => {
        console.log(`- ${c.name} (${c.slug}) ID: ${c.id}`);
    });
    await prisma.$disconnect();
}
main().catch(console.error);
