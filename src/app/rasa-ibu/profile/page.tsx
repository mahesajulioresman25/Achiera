
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileContent from '@/components/commerce/ProfileContent';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/auth/signin?callbackUrl=/rasa-ibu/profile');
    }

    // Fetch User with fresh data
    // Fetch Brand "rasa-ibu" to get the correct absolute ID
    const [user, brand] = await Promise.all([
        prisma.user.findUnique({
            where: { email: session.user.email }
        }),
        prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' }
        })
    ]);

    if (!user) {
        redirect('/auth/signin');
    }

    return <ProfileContent user={user} brandId={brand?.id} />;
}
