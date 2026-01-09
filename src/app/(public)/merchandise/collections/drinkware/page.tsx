import React from 'react';
import CollectionLayout from '@/components/CollectionLayout';

export default function DrinkwareCollectionPage() {
    // Gallery images for drinkware collection
    const drinkwareImages = [
        "/images/drinkware/tumbler-desk.jpg",
        "/images/drinkware/mug-morning.jpg",
        "/images/drinkware/bottle-gym.jpg",
        "/images/drinkware/flask-outdoor.jpg",
        "/images/drinkware/coffee-mug.jpg",
        "/images/drinkware/water-bottle.jpg",
    ];

    return (
        <CollectionLayout
            name="Drinkware Collection"
            gallery={drinkwareImages}
            intro="Tumblers and bottles designed for everyday use, built to carry your brand wherever they go. From sleek office hydration to rugged outdoor bottles, we have the perfect vessel for your logo."
            heroMeta={[
                "Premium Stainless Steel",
                "BPA Free",
                "Temperature Retention"
            ]}
            highlights={[
                "Double-wall vacuum insulation keeps drinks hot for 12h / cold for 24h",
                "Leak-proof lid designs for worry-free commuting",
                "Durable powder-coat finish that resists scratching",
                "Ergonomic designs that fit standard cup holders"
            ]}
            designOptions={[
                "Laser Engraving for a premium, permanent finish",
                "Full-color UV Printing for vibrant logos",
                "Screen Printing for cost-effective bulk orders",
                "Custom packaging sleeves or gift boxes"
            ]}
            qualityPoints={[
                "Food-grade 18/8 Stainless Steel",
                "Sweat-proof exterior",
                "Easy-to-clean wide mouth openings",
                "Lifetime durability guarantee"
            ]}
            useCases={[
                "Employee Onboarding Kits",
                "Corporate Event Giveaways",
                "Client Appreciation Gifts"
            ]}
            faq={[
                {
                    question: "What is the minimum order quantity?",
                    answer: "For custom branding, our MOQ starts at 50 units. For unbranded bulk orders, we can accommodate smaller quantities."
                },
                {
                    question: "Can I get a sample before ordering?",
                    answer: "Yes! We can send a pre-printed sample for quality check, or a custom proof with your logo for a small fee."
                },
                {
                    question: "How long does production take?",
                    answer: "Standard production time is 7-10 business days after artwork approval. Rush options are available."
                }
            ]}
        />
    );
}
