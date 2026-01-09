import React from 'react';
import CollectionLayout from '@/components/CollectionLayout';

export default function BagsCollectionPage() {
    // Gallery images for bags collection
    const bagsImages = [
        "/images/bags/tote-lifestyle.jpg",
        "/images/bags/backpack-office.jpg",
        "/images/bags/drawstring-sports.jpg",
        "/images/bags/duffle-travel.jpg",
        "/images/bags/laptop-bag.jpg",
        "/images/bags/canvas-tote.jpg",
    ];

    return (
        <CollectionLayout
            name="Bags Collection"
            gallery={bagsImages}
            intro="Functional, stylish, and durable bags that carry your brand everywhere. From daily commute backpacks to event tote bags, we offer solutions for every need."
            heroMeta={[
                "Durable Materials",
                "Ergonomic Design",
                "Custom Branding"
            ]}
            highlights={[
                "Canvas Tote Bags for events and retail",
                "Premium Laptop Backpacks for employees",
                "Drawstring bags for sports and giveaways",
                "Travel duffels and weekenders"
            ]}
            designOptions={[
                "Screen Printing for large logos on totes",
                "Embroidery for premium backpacks",
                "Heat Transfer for complex, colorful designs",
                "Custom zipper pulls and lining options"
            ]}
            qualityPoints={[
                "Heavy-duty stitching and reinforced handles",
                "Water-resistant materials available",
                "YKK zippers for longevity",
                "Comfortable padded straps"
            ]}
            useCases={[
                "Conference Swag Bags",
                "Employee Laptop Bags",
                "Retail Merchandise"
            ]}
            faq={[
                {
                    question: "What materials are available for tote bags?",
                    answer: "We offer cotton canvas, jute, polyester, and non-woven polypropylene."
                },
                {
                    question: "Can I customize the interior lining?",
                    answer: "Yes, for bulk orders of backpacks and premium bags, we can customize the interior lining with your brand pattern."
                },
                {
                    question: "Is there a warranty on bags?",
                    answer: "We stand by the quality of our products. If there are any manufacturing defects, we will replace the items."
                }
            ]}
        />
    );
}
