import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // Using correct authOptions from src/auth.ts
import { redirect } from 'next/navigation';
import { unisolatedPrisma } from '@/lib/prisma';
import UserManagement from '@/components/dashboard/holding/UserManagement';

export const dynamic = 'force-dynamic';

export default async function OwnerUserManagementPage() {
    const session = await getServerSession(authOptions);

    if ((session?.user as any)?.globalRole !== 'OWNER') {
        redirect('/dashboard');
    }

    // Fetch initial data using raw SQL to definitive bypass brand isolation
    // Use quotes for tables if necessary (Postgres is case-sensitive with quotes)
    const users: any[] = await unisolatedPrisma.$queryRaw`
        SELECT 
            u.*,
            (
                SELECT json_agg(br_json)
                FROM (
                    SELECT br.*, row_to_json(b.*) as brand
                    FROM user_brand_roles br
                    LEFT JOIN brands b ON br."brandId" = b.id
                    WHERE br."userId" = u.id
                ) br_json
            ) as "brandRoles"
        FROM users u
        ORDER BY u."createdAt" DESC
    `;

    const brands = await unisolatedPrisma.$queryRaw`
        SELECT id, name, slug FROM brands ORDER BY name ASC
    `;

    return (
        <UserManagement
            initialUsers={JSON.parse(JSON.stringify(users))}
            availableBrands={brands as any}
        />
    );
}
