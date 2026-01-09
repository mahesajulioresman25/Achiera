import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding IT Solutions data...');

    // Find IT Solutions brand
    const itBrand = await prisma.brand.findUnique({
        where: { slug: 'it-solutions' },
    });

    if (!itBrand) {
        console.error('❌ IT Solutions brand not found');
        return;
    }

    console.log(`✅ Found brand: ${itBrand.name}`);

    // Create IT Settings
    const settings = await prisma.itSettings.upsert({
        where: { brandId: itBrand.id },
        update: {},
        create: {
            brandId: itBrand.id,
            heroMode: 'SINGLE',
            heroTitle: 'Transform Your Business with Technology',
            heroSubtitle: 'Custom software solutions designed to drive innovation and efficiency',
            heroTagline: 'Your Technology Partner',
            heroCtaLabel: 'Get Started',
            heroCtaLink: '/contact',
            aboutTitle: 'About ACHIERA IT Solutions',
            aboutContent: 'We deliver cutting-edge technology solutions that empower businesses to thrive in the digital age.',
        },
    });
    console.log('✅ Created IT Settings');

    // Create Services
    const services = [
        {
            slug: 'web-development',
            name: 'Web Development',
            description: 'Custom web applications built with modern technologies for scalability and performance',
            icon: 'Code',
            features: ['Responsive Design', 'API Integration', 'Database Management', 'Cloud Deployment'],
            sortOrder: 1,
        },
        {
            slug: 'mobile-apps',
            name: 'Mobile Applications',
            description: 'Native and cross-platform mobile apps for iOS and Android',
            icon: 'Smartphone',
            features: ['iOS Development', 'Android Development', 'React Native', 'Flutter'],
            sortOrder: 2,
        },
        {
            slug: 'cloud-solutions',
            name: 'Cloud Solutions',
            description: 'Scalable cloud infrastructure and migration services',
            icon: 'Cloud',
            features: ['AWS', 'Azure', 'Google Cloud', 'DevOps'],
            sortOrder: 3,
        },
        {
            slug: 'consulting',
            name: 'IT Consulting',
            description: 'Strategic technology consulting to optimize your digital transformation',
            icon: 'Lightbulb',
            features: ['Digital Strategy', 'Technology Audit', 'Process Optimization', 'Training'],
            sortOrder: 4,
        },
    ];

    for (const service of services) {
        await prisma.itService.upsert({
            where: { brandId_slug: { brandId: itBrand.id, slug: service.slug } },
            update: {},
            create: {
                brandId: itBrand.id,
                ...service,
            },
        });
    }
    console.log(`✅ Created ${services.length} services`);

    // Create Lifecycle Steps
    const lifecycleSteps = [
        {
            title: 'Discovery & Planning',
            description: 'We analyze your requirements and create a detailed project roadmap',
            icon: 'Search',
            sortOrder: 1,
        },
        {
            title: 'Design & Prototyping',
            description: 'Creating wireframes and interactive prototypes for validation',
            icon: 'Palette',
            sortOrder: 2,
        },
        {
            title: 'Development',
            description: 'Building your solution with agile methodologies and best practices',
            icon: 'Code',
            sortOrder: 3,
        },
        {
            title: 'Testing & QA',
            description: 'Comprehensive testing to ensure quality and reliability',
            icon: 'CheckCircle',
            sortOrder: 4,
        },
        {
            title: 'Deployment',
            description: 'Launching your solution with zero downtime',
            icon: 'Rocket',
            sortOrder: 5,
        },
        {
            title: 'Support & Maintenance',
            description: 'Ongoing support and continuous improvement',
            icon: 'Wrench',
            sortOrder: 6,
        },
    ];

    for (const step of lifecycleSteps) {
        await prisma.developmentLifecycleStep.create({
            data: {
                brandId: itBrand.id,
                ...step,
            },
        });
    }
    console.log(`✅ Created ${lifecycleSteps.length} lifecycle steps`);

    // Create Case Studies
    const caseStudies = [
        {
            slug: 'e-commerce-platform',
            title: 'E-Commerce Platform Modernization',
            subtitle: 'Transforming a legacy system into a modern, scalable solution',
            client: 'RetailCo Inc.',
            industry: 'Retail',
            duration: '6 months',
            teamSize: '8 developers',
            context: 'A major retailer needed to modernize their aging e-commerce platform to handle increased traffic and provide better user experience.',
            challenge: 'The legacy system was slow, difficult to maintain, and couldn\'t scale during peak shopping seasons. Customer abandonment rates were high.',
            solution: 'We rebuilt the platform using a microservices architecture with React frontend, Node.js backend, and AWS cloud infrastructure. Implemented CDN, caching, and auto-scaling.',
            results: '300% improvement in page load times, 99.99% uptime during Black Friday, 45% reduction in cart abandonment, and 2x increase in conversion rate.',
            techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
            images: [],
            sortOrder: 1,
            isPublished: true,
        },
        {
            slug: 'healthcare-management-system',
            title: 'Healthcare Management System',
            subtitle: 'HIPAA-compliant patient management platform',
            client: 'MedCare Health',
            industry: 'Healthcare',
            duration: '9 months',
            teamSize: '12 developers',
            context: 'A healthcare provider needed a comprehensive system to manage patient records, appointments, and billing while ensuring HIPAA compliance.',
            challenge: 'Multiple disconnected systems, manual processes, and compliance concerns. Staff spent hours on administrative tasks instead of patient care.',
            solution: 'Developed an integrated platform with patient portal, appointment scheduling, electronic health records, and automated billing. Implemented end-to-end encryption and audit logging.',
            results: '60% reduction in administrative time, 95% patient satisfaction score, zero compliance violations, and $2M annual cost savings.',
            techStack: ['Next.js', 'Python', 'MySQL', 'Azure', 'Redis', 'Elasticsearch'],
            images: [],
            sortOrder: 2,
            isPublished: true,
        },
    ];

    for (const caseStudy of caseStudies) {
        await prisma.itCaseStudy.upsert({
            where: { brandId_slug: { brandId: itBrand.id, slug: caseStudy.slug } },
            update: {},
            create: {
                brandId: itBrand.id,
                ...caseStudy,
            },
        });
    }
    console.log(`✅ Created ${caseStudies.length} case studies`);

    console.log('🎉 IT Solutions seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding IT Solutions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
