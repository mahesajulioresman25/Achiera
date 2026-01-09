'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import SubscribePageContent from './SubscribeContent';
import { Lock } from 'lucide-react';

interface SubscribeAuthWrapperProps {
    plans: any[];
    existingData?: any;
}

export default function SubscribeAuthWrapper({ plans, existingData }: SubscribeAuthWrapperProps) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">Loading...</div>;
    }

    // Simplified: Authentication will be handled via OTP inside the content if not logged in
    return <SubscribePageContent user={session?.user} plans={plans} initialData={existingData} isAuthenticated={!!session} />;
}
