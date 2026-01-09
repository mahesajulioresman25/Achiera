import { prisma } from '../lib/prisma';

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'it@achiera.com' },
        include: {
            brandRoles: {
                include: { brand: true }
            }
        }
    })

    if (user) {
        console.log('User found:', {
            email: user.email,
            globalRole: user.globalRole,
            brandRoles: user.brandRoles.map(br => ({
                brandName: br.brand.name,
                role: br.role
            }))
        })
    } else {
        console.log('User not found: it@achiera.com')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
