import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function simulateAuth() {
    const email = 'mahesajulioresman@achier.com';
    console.log(`--- Simulating Auth for ${email} ---`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            brandRoles: {
                include: { brand: { select: { name: true, slug: true } } }
            }
        }
    });

    if (!user) {
        console.log('User not found in DB');
        return;
    }

    const authResult = {
        id: user.id,
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        brandRoles: user.brandRoles.map(br => ({
            brandId: br.brandId,
            brandSlug: (br.brand as any).slug,
            brandName: (br.brand as any).name,
            role: br.role
        }))
    };

    console.log('Simulated Authorize result:');
    console.log(JSON.stringify(authResult, null, 2));

    await prisma.$disconnect();
}

simulateAuth().catch(console.error);
