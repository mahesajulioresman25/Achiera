
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileContent from '@/components/commerce/ProfileContent';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/rasa-ibu/profile');
    }

    return <ProfileContent user={session.user} />;
}
