import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Merch Collections...');

    // Get Merch brand
    const merchBrand = await prisma.brand.findUnique({
        where: { slug: 'merch' }
    });

    if (!merchBrand) {
        console.error('❌ Merch brand not found. Please run main seed first.');
        return;
    }

    console.log(`✅ Found Merch brand: ${merchBrand.name}`);

    // Create Collections
    const collections = [
        {
            slug: 'apparel',
            name: 'Apparel',
            heroTitle: 'Elevate Your Brand with Premium Apparel',
            heroSubtitle: 'High-quality T-shirts, Hoodies, and Jackets that make lasting impressions',
            highlights: ['Premium Cotton', 'Custom Embroidery', 'Eco-Friendly Options'],
            whatsInside: [
                'Premium T-Shirts (100% Cotton)',
                'Polo Shirts (Pique Fabric)',
                'Hoodies & Sweatshirts',
                'Jackets & Windbreakers',
                'Long Sleeve Shirts'
            ],
            designOptions: [
                'Screen Printing',
                'Embroidery',
                'DTG (Direct-to-Garment)',
                'Heat Transfer',
                'Sublimation'
            ],
            materialPoints: [
                '100% Premium Cotton',
                'Breathable & Comfortable',
                'Pre-shrunk Fabric',
                'Colorfast Dyes',
                'Eco-friendly Options Available'
            ],
            useCases: [
                { title: 'Corporate Uniforms', description: 'Professional branded apparel for your team' },
                { title: 'Event Merchandise', description: 'Custom shirts for conferences and events' },
                { title: 'Employee Gifts', description: 'Welcome kits and anniversary gifts' }
            ],
            packagingOptions: [
                'Individual Poly Bags',
                'Gift Boxes',
                'Bulk Packaging',
                'Custom Branded Packaging'
            ],
            faq: [
                {
                    question: 'What sizes are available?',
                    answer: 'We offer sizes from XS to 3XL. Custom sizes available upon request.'
                },
                {
                    question: 'What is the minimum order quantity?',
                    answer: 'Minimum order is 50 pieces per design. Lower quantities available with setup fee.'
                },
                {
                    question: 'How long does production take?',
                    answer: 'Standard production time is 10-14 business days after artwork approval.'
                }
            ],
            galleryImages: [
                '/images/collections/apparel/tshirt-1.jpg',
                '/images/collections/apparel/hoodie-1.jpg',
                '/images/collections/apparel/polo-1.jpg',
                '/images/collections/apparel/jacket-1.jpg'
            ]
        },
        {
            slug: 'drinkware',
            name: 'Drinkware',
            heroTitle: 'Stay Hydrated in Style',
            heroSubtitle: 'Premium Tumblers, Bottles, and Mugs for everyday use',
            highlights: ['Stainless Steel', 'Temperature Control', 'Leak-Proof Design'],
            whatsInside: [
                'Stainless Steel Tumblers (20oz, 30oz)',
                'Vacuum Insulated Bottles',
                'Ceramic Mugs',
                'Glass Water Bottles',
                'Travel Mugs'
            ],
            designOptions: [
                'Laser Engraving',
                'Full-Color Printing',
                'Vinyl Decals',
                'Etching',
                'UV Printing'
            ],
            materialPoints: [
                '18/8 Stainless Steel',
                'Double-Wall Vacuum Insulation',
                'BPA-Free Materials',
                'Keeps Hot 12hrs / Cold 24hrs',
                'Dishwasher Safe'
            ],
            useCases: [
                { title: 'Corporate Gifts', description: 'Premium drinkware for clients and partners' },
                { title: 'Employee Wellness', description: 'Promote healthy hydration at work' },
                { title: 'Event Giveaways', description: 'Memorable branded merchandise' }
            ],
            packagingOptions: [
                'Individual Gift Boxes',
                'Bulk Cartons',
                'Premium Gift Sets',
                'Custom Branded Boxes'
            ],
            faq: [
                {
                    question: 'Are the tumblers dishwasher safe?',
                    answer: 'Yes, all our stainless steel drinkware is dishwasher safe. However, hand washing is recommended to preserve the print quality.'
                },
                {
                    question: 'How long do they keep drinks hot/cold?',
                    answer: 'Our vacuum-insulated tumblers keep drinks hot for up to 12 hours and cold for up to 24 hours.'
                },
                {
                    question: 'Can I mix different colors in one order?',
                    answer: 'Yes! You can mix colors within the same product type with no additional charge.'
                }
            ],
            galleryImages: [
                '/images/collections/drinkware/tumbler-1.jpg',
                '/images/collections/drinkware/bottle-1.jpg',
                '/images/collections/drinkware/mug-1.jpg'
            ]
        },
        {
            slug: 'office-kits',
            name: 'Office',
            heroTitle: 'Professional Office & Stationery Kits',
            heroSubtitle: 'Everything your team needs to stay organized and productive',
            highlights: ['Premium Quality', 'Customizable', 'Complete Sets'],
            whatsInside: [
                'Branded Notebooks (A5, A4)',
                'Premium Pens & Pencils',
                'Desk Organizers',
                'Sticky Notes & Notepads',
                'USB Drives',
                'Mouse Pads',
                'Calendars & Planners'
            ],
            designOptions: [
                'Foil Stamping',
                'Embossing',
                'Full-Color Printing',
                'Laser Engraving (USB)',
                'Custom Inserts'
            ],
            materialPoints: [
                'Premium Paper Stock',
                'Durable Covers',
                'Eco-Friendly Options',
                'Quality Binding',
                'Archival Quality Ink'
            ],
            useCases: [
                { title: 'New Hire Kits', description: 'Welcome packages for new employees' },
                { title: 'Conference Kits', description: 'Professional sets for events and seminars' },
                { title: 'Client Gifts', description: 'Thoughtful gifts for business partners' }
            ],
            packagingOptions: [
                'Custom Gift Boxes',
                'Branded Pouches',
                'Presentation Boxes',
                'Bulk Packaging'
            ],
            faq: [
                {
                    question: 'Can I create a custom kit?',
                    answer: 'Absolutely! We can customize any combination of items to fit your needs and budget.'
                },
                {
                    question: 'Do you offer eco-friendly options?',
                    answer: 'Yes, we have recycled paper notebooks, bamboo pens, and other sustainable options.'
                },
                {
                    question: 'What is the lead time for office kits?',
                    answer: 'Standard kits: 7-10 days. Custom kits: 14-21 days depending on complexity.'
                }
            ],
            galleryImages: [
                '/images/collections/office/notebook-1.jpg',
                '/images/collections/office/pen-set-1.jpg',
                '/images/collections/office/organizer-1.jpg'
            ]
        }
    ];

    for (const collectionData of collections) {
        const existing = await prisma.merchCollection.findFirst({
            where: {
                brandId: merchBrand.id,
                slug: collectionData.slug
            }
        });

        if (existing) {
            console.log(`⏭️  Collection "${collectionData.name}" already exists, skipping...`);
            continue;
        }

        await prisma.merchCollection.create({
            data: {
                brandId: merchBrand.id,
                ...collectionData
            }
        });

        console.log(`✅ Created collection: ${collectionData.name}`);
    }

    console.log('🎉 Merch Collections seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding Merch Collections:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
