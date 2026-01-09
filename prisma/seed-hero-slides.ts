import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createHeroSlides() {
    console.log('Creating hero slides for testing...');

    // Get the merch brand
    const merchBrand = await prisma.brand.findUnique({
        where: { slug: 'merch' }
    });

    if (!merchBrand) {
        console.error('Merch brand not found!');
        return;
    }

    // Create hero slides for merch
    const merchSlides = [
        {
            brandId: merchBrand.id,
            title: 'Modern Brands Deserve Thoughtful Merchandise',
            subtitle: 'ACHIERA Merchandise helps companies create lasting impressions with high-quality, functional products crafted to reflect your brand identity.',
            ctaLabel: 'Request Catalogue',
            ctaLink: '/contact',
            mediaType: 'IMAGE' as const,
            imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1920&h=1080&fit=crop',
            videoUrl: null,
            sortOrder: 1,
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            title: 'Premium Corporate Gifts',
            subtitle: 'Elevate your brand with custom merchandise that leaves a lasting impression on clients and employees.',
            ctaLabel: 'View Collections',
            ctaLink: '/merchandise',
            mediaType: 'IMAGE' as const,
            imageUrl: 'https://images.unsplash.com/photo-1607827448387-a67db1383b59?w=1920&h=1080&fit=crop',
            videoUrl: null,
            sortOrder: 2,
            isActive: true,
        },
        {
            brandId: merchBrand.id,
            title: 'Try Live Mockup Builder',
            subtitle: 'Upload your logo and instantly preview how it looks on our premium merchandise—before you place an order.',
            ctaLabel: 'Try Now',
            ctaLink: '/merchandise#mockup',
            mediaType: 'IMAGE' as const,
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop',
            videoUrl: null,
            sortOrder: 3,
            isActive: true,
        },
    ];

    // Get IT Solutions brand
    const itBrand = await prisma.brand.findUnique({
        where: { slug: 'it-solutions' }
    });

    if (itBrand) {
        const itSlides = [
            {
                brandId: itBrand.id,
                title: 'Smart IT Solutions for Growing Businesses',
                subtitle: 'We engineer scalable, future-proof technology solutions that transform your business operations and drive sustainable growth.',
                ctaLabel: 'Start Your Transformation',
                ctaLink: '/contact',
                mediaType: 'IMAGE' as const,
                imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop',
                videoUrl: null,
                sortOrder: 1,
                isActive: true,
            },
            {
                brandId: itBrand.id,
                title: 'Custom Software Development',
                subtitle: 'Build powerful, scalable applications tailored to your unique business needs with our expert development team.',
                ctaLabel: 'Learn More',
                ctaLink: '/it-solutions',
                mediaType: 'IMAGE' as const,
                imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&h=1080&fit=crop',
                videoUrl: null,
                sortOrder: 2,
                isActive: true,
            },
        ];

        // Create IT slides
        for (const slide of itSlides) {
            await prisma.heroSlide.create({ data: slide });
            console.log(`✓ Created IT slide: ${slide.title}`);
        }
    }

    // Create merch slides
    for (const slide of merchSlides) {
        await prisma.heroSlide.create({ data: slide });
        console.log(`✓ Created merch slide: ${slide.title}`);
    }

    console.log('\n✅ Hero slides created successfully!');
}

createHeroSlides()
    .catch((e) => {
        console.error('Error creating hero slides:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
