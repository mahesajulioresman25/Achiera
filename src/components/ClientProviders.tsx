'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import GlobalBirthdayBanner from '@/components/commerce/GlobalBirthdayBanner';
import SeasonalDecorations from '@/components/ui/SeasonalDecorations';
import Providers from '@/components/Providers';
import CartDrawer from '@/components/cart/CartDrawer';

export default function ClientProviders({
    children,
    session
}: {
    children: React.ReactNode;
    session: any;
}) {
    return (
        <SessionProvider session={session}>
            <GlobalBirthdayBanner />
            <SeasonalDecorations />
            <Providers>
                {children}
                <CartDrawer />
            </Providers>
            <Toaster position="top-center" richColors />
        </SessionProvider>
    );
}
