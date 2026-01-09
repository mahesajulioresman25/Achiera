import React from 'react';
import CollectionLayout from '@/components/CollectionLayout';

export default function HampersCollectionPage() {
    // Gallery images for hampers collection
    const hampersImages = [
        "/images/hampers/luxury-hamper.jpg",
        "/images/hampers/corporate-gift.jpg",
        "/images/hampers/festive-box.jpg",
        "/images/hampers/premium-basket.jpg",
        "/images/hampers/custom-hamper.jpg",
        "/images/hampers/gift-packaging.jpg",
    ];

    return (
        <CollectionLayout
            name="Corporate & Event Hampers"
            gallery={hampersImages}
            intro="Curated gift sets that deliver a premium unboxing experience. Whether for holidays, milestones, or VIP clients, our hampers leave a lasting impression of thoughtfulness and quality."
            heroMeta={[
                "Premium Packaging",
                "Curated Selection",
                "Custom Branding"
            ]}
            highlights={[
                "Themed hampers for holidays (Eid, Christmas, New Year)",
                "Wellness kits with spa and relaxation items",
                "Gourmet food and drink selections",
                "Tech-focused gift sets"
            ]}
            designOptions={[
                "Custom printed rigid boxes with magnetic closure",
                "Branded ribbon and tissue paper",
                "Personalized greeting cards",
                "Custom foam inserts for secure product placement"
            ]}
            qualityPoints={[
                "Hand-packed with care and attention to detail",
                "Premium products from trusted brands",
                "Sturdy packaging that survives shipping",
                "Quality control check on every item"
            ]}
            useCases={[
                "Client Appreciation Gifts",
                "Employee Milestones & Anniversaries",
                "Holiday Gifting"
            ]}
            faq={[
                {
                    question: "Can you handle shipping to individual addresses?",
                    answer: "Yes, we offer fulfillment services to ship hampers directly to your recipients' doorsteps."
                },
                {
                    question: "Can I include my own items in the hamper?",
                    answer: "Yes, we can incorporate your own marketing materials or products into the hampers."
                },
                {
                    question: "What is the lead time for custom hampers?",
                    answer: "We recommend starting the process 3-4 weeks in advance, especially for large holiday orders."
                }
            ]}
        />
    );
}
