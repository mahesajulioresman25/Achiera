
import React from 'react';
import CheckoutFlow from '@/components/commerce/CheckoutFlow';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuCheckoutPage() {
    // Fetch Brand Config
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { paymentSettings: true }
    });

    const settings = brand?.paymentSettings as any;
    const links = settings?.links;

    return <CheckoutFlow platformLinks={links} />;
}
