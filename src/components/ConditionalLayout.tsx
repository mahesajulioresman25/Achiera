'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Don't show Header/Footer on dashboard and login pages
    const isDashboard = pathname?.startsWith('/dashboard');
    const isLogin = pathname === '/login';
    const hideLayout = isDashboard || isLogin;

    if (hideLayout) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </>
    );
}
