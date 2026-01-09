"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ThemeWrapper() {
    const pathname = usePathname();

    useEffect(() => {
        const body = document.body;

        if (pathname?.startsWith('/merchandise')) {
            body.setAttribute('data-theme', 'merchandise');
        } else if (pathname?.startsWith('/it-solutions')) {
            body.setAttribute('data-theme', 'it');
        } else {
            body.removeAttribute('data-theme'); // Default to root (Holding)
        }
    }, [pathname]);

    return null;
}
