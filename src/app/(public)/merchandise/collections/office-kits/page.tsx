import React from 'react';
import CollectionLayout from '@/components/CollectionLayout';

export default function OfficeKitsCollectionPage() {
    // Gallery images for office kits collection
    const officeKitsImages = [
        "/images/office-kits/desk-setup.jpg",
        "/images/office-kits/notebook-pen.jpg",
        "/images/office-kits/complete-kit.jpg",
        "/images/office-kits/unboxing.jpg",
        "/images/office-kits/stationery-set.jpg",
        "/images/office-kits/premium-kit.jpg",
    ];

    return (
        <CollectionLayout
            name="Office & Stationery Kits"
            gallery={officeKitsImages}
            intro="Elevate your workspace with premium stationery and office essentials. Perfect for welcoming new team members or equipping your office with branded tools that inspire productivity."
            heroMeta={[
                "Premium Paper Stock",
                "Soft-Touch Finishes",
                "Curated Sets"
            ]}
            highlights={[
                "Hardcover notebooks with custom debossing",
                "Premium metal pens with smooth ink flow",
                "Desk organizers and mouse pads",
                "Custom presentation folders and sticky notes"
            ]}
            designOptions={[
                "Blind Debossing for a subtle, elegant look",
                "Foil Stamping in gold, silver, or custom colors",
                "Full-color UV printing on hard surfaces",
                "Custom belly bands and packaging"
            ]}
            qualityPoints={[
                "Acid-free paper that preserves notes",
                "Durable binding that lays flat",
                "High-quality materials like PU leather and aluminum",
                "Attention to detail in every finish"
            ]}
            useCases={[
                "New Hire Welcome Kits",
                "Conference & Seminar Materials",
                "Executive Gift Sets"
            ]}
            faq={[
                {
                    question: "Can I customize the contents of a kit?",
                    answer: "Yes! You can mix and match items to create the perfect kit for your budget and needs."
                },
                {
                    question: "Do you offer eco-friendly options?",
                    answer: "We have a wide range of sustainable stationery made from recycled materials and bamboo."
                },
                {
                    question: "What is the minimum order for custom notebooks?",
                    answer: "MOQ for fully custom notebooks is typically 100 units, but we have stock options for smaller runs."
                }
            ]}
        />
    );
}
