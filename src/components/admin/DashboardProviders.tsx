'use client';

import { ToastProvider } from '@/components/ui/ToastProvider';
import { ReactNode } from 'react';

export default function DashboardProviders({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
