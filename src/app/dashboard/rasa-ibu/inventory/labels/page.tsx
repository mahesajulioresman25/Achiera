import React from 'react';
import { prisma } from '@/lib/prisma';
import LabelPrinter from '@/components/dashboard/rasa-ibu/inventory/LabelPrinter';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Label Printing Station | Rasa Ibu',
};

export default async function LabelPrintingPage({ searchParams }: { searchParams: { brandId?: string } }) {
    // Default to 'rasa-ibu' if not specified (for now, in a real multi-tenant app we'd get this from session/params)
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true }
    });

    if (!brand) return <div>Brand not found</div>;

    // Fetch Products. We need to normalize them to a common structure for the printer
    // 1. Regular Merch Products
    const regularVariants = await prisma.mockupVariant.findMany({
        where: {
            product: {
                collection: { brandId: brand.id },
                status: 'active'
            }
        },
        include: {
            product: true
        },
        orderBy: { product: { name: 'asc' } },
        take: 50 // Limit for performance, search will be client-side filtered on this batch
    });

    // 2. Frozen Products
    const frozenVariants = await prisma.frozenVariant.findMany({
        where: {
            product: {
                category: { brandId: brand.id }
            }
        },
        include: {
            product: true
        },
        orderBy: { product: { name: 'asc' } },
        take: 50
    });

    // Normalize
    const products = [
        ...regularVariants.map(v => ({
            id: v.id,
            name: `${v.product.name} - ${v.name}`,
            sku: v.sku,
            price: Number(v.price),
            slug: v.product.slug, // Added Slug
            type: 'MERCH'
        })),
        ...frozenVariants.map(v => ({
            id: v.id,
            name: `${v.product.name} - ${v.name}`,
            sku: v.sku,
            price: Number(v.price),
            slug: v.product.slug, // Added Slug
            type: 'FROZEN'
        }))
    ];

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-[#2D3A2D] tracking-tight">Smart Labeling</h1>
                <p className="text-[#8B7E66] font-medium">Generate and print standardized barcodes for your inventory.</p>
            </div>

            <LabelPrinter brandId={brand.id} products={products} />
        </div>
    );
}
