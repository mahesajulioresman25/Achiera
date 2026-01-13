
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileContent from '@/components/commerce/ProfileContent';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/auth/signin?callbackUrl=/rasa-ibu/profile');
    }

    // Fetch fresh data from database to ensure ProfileContent shows updated info
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        redirect('/auth/signin');
    }

    return <ProfileContent user={user} />;
}
