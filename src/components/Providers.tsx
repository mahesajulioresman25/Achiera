'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { BrandConfirmProvider } from '@/components/ui/BrandConfirm';
import { CartProvider } from '@/lib/contexts/CartContext';
import ThemeWrapper from '@/components/ThemeWrapper';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeWrapper />
            <CartProvider>
                <ToastProvider>
                    <BrandConfirmProvider>
                        {children}
                    </BrandConfirmProvider>
                </ToastProvider>
            </CartProvider>
        </QueryClientProvider>
    );
}
