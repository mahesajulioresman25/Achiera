
import React from 'react';
import CheckoutFlow from '@/components/commerce/CheckoutFlow';
import { prisma } from '@/lib/prisma';
import { getBestSellers } from '@/lib/actions/rasa-ibu/public-products';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RasaIbuCheckoutPage() {
    // Fetch Brand Config
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { id: true, paymentSettings: true }
    });

    if (!brand) return <div className="py-24 text-center">Brand not found</div>;

    // Fetch Best Sellers for UPSell (limit 2 for compact view)
    const bestSellers = await getBestSellers(brand.id, 2);

    const settings = brand?.paymentSettings as any;
    const links = settings?.links;

    return <CheckoutFlow platformLinks={links} upsellProducts={bestSellers} />;
}
