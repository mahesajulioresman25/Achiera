import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt'

async function main() {
    const email = 'admin@achiera.com'
    const password = 'achiera123'
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            globalRole: 'OWNER'
        },
        create: {
            email,
            name: 'System Admin',
            passwordHash,
            globalRole: 'OWNER'
        }
    })

    console.log('User synced:', user.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
