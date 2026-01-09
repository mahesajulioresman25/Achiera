'use client';

import React, { useState, useEffect } from 'react';
import CollectionLayout from '@/components/CollectionLayout';
import { Loader2 } from 'lucide-react';

export default function ApparelCollectionPage() {
    const [collection, setCollection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCollection();
    }, []);

    const fetchCollection = async () => {
        try {
            const res = await fetch('/api/public/collections/apparel');
            if (res.ok) {
                const data = await res.json();
                setCollection(data);
            }
        } catch (error) {
            console.error('Failed to fetch collection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    // Fallback data if collection not found in database
    const galleryImages = collection?.galleryImages && Array.isArray(collection.galleryImages)
        ? collection.galleryImages
        : [];

    return (
        <CollectionLayout
            name={collection?.name || "Apparel Collection"}
            gallery={galleryImages}
            intro={collection?.heroSubtitle || "High-quality custom apparel that your team will actually want to wear. From premium cotton tees to professional polos and cozy hoodies, we blend comfort with your brand identity."}
            heroMeta={[
                "Premium Cotton Blends",
                "Retail-Quality Fit",
                "Sustainable Options"
            ]}
            highlights={
                Array.isArray(collection?.highlights) && collection.highlights.length > 0
                    ? collection.highlights
                    : [
                        "Wide range of fabrics: 100% Cotton, Tri-blend, Performance Dri-Fit",
                        "Modern cuts and fits for men, women, and unisex",
                        "Durable stitching and reinforced seams",
                        "Tagless options for maximum comfort"
                    ]
            }
            designOptions={
                Array.isArray(collection?.designOptions) && collection.designOptions.length > 0
                    ? collection.designOptions
                    : [
                        "Screen Printing for bold, vibrant graphics",
                        "High-quality Embroidery for a professional look",
                        "Direct-to-Garment (DTG) for detailed, full-color designs",
                        "Custom woven labels and hem tags"
                    ]
            }
            qualityPoints={
                Array.isArray(collection?.materialPoints) && collection.materialPoints.length > 0
                    ? collection.materialPoints
                    : [
                        "Pre-shrunk fabrics to minimize shrinkage",
                        "Color-fast dyes that resist fading",
                        "Soft-hand feel prints",
                        "Ethically sourced materials"
                    ]
            }
            useCases={
                Array.isArray(collection?.useCases) && collection.useCases.length > 0
                    ? collection.useCases
                    : [
                        "Company Uniforms & Culture Wear",
                        "Event & Conference T-Shirts",
                        "Client Merchandise Stores"
                    ]
            }
            faq={
                Array.isArray(collection?.faq) && collection.faq.length > 0
                    ? collection.faq
                    : [
                        {
                            question: "Can I mix sizes and colors?",
                            answer: "Yes, you can mix sizes and colors within the same order, as long as the print design remains the same."
                        },
                        {
                            question: "What is the turnaround time?",
                            answer: "Standard turnaround is 10-14 business days. Rush orders are available upon request."
                        },
                        {
                            question: "Do you offer design assistance?",
                            answer: "Absolutely. Our design team can help you place your logo, choose colors, and even create custom artwork."
                        }
                    ]
            }
        />
    );
}
