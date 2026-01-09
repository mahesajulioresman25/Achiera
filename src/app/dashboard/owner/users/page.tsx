import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // Using correct authOptions from src/auth.ts
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/dashboard/holding/UserManagement';

export default async function OwnerUserManagementPage() {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.globalRole !== 'OWNER') {
        redirect('/dashboard');
    }

    // Fetch initial data
    const users = await prisma.user.findMany({
        include: {
            brandRoles: {
                include: {
                    brand: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const brands = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <UserManagement
            initialUsers={JSON.parse(JSON.stringify(users))}
            availableBrands={brands}
        />
    );
}
