'use client';

import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                position="top-center"
                expand={false}
                richColors={false}
                closeButton
                toastOptions={{
                    style: {
                        background: '#2D3A2D', // Deep Sage Green
                        color: '#FDFBF7',      // Warm Cream
                        border: '1px solid rgba(178, 188, 162, 0.2)',
                        borderRadius: '1.25rem',
                        padding: '1rem 1.5rem',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                        fontSize: '13px',
                        fontWeight: '600',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    },
                    className: 'font-sans',
                    duration: 4000,
                }}
            />
        </>
    );
}

// Legacy compatibility - export useToast hook that uses sonner
export function useToast() {
    const { toast } = require('sonner');
    return {
        showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
            if (type === 'success') toast.success(message);
            else if (type === 'error') toast.error(message);
            else toast(message);
        },
        success: (message: string) => toast.success(message),
        error: (message: string) => toast.error(message),
        info: (message: string) => toast(message),
    };
}
