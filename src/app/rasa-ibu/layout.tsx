import PublicNav from "@/components/commerce/PublicNav";
import Footer from "@/components/Footer";
import SeasonalDecorations from "@/components/ui/SeasonalDecorations";
import { unisolatedPrisma as prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function RasaIbuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Fetch Rasa Ibu brand configuration
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: { brandConfig: true }
    });

    const config = brand?.brandConfig as any;

    // 2. Prepare navigation links from config or defaults
    const navLinks = config?.navLinks || [
        { label: 'Home', href: '/rasa-ibu' },
        { label: 'Products', href: '/rasa-ibu/products' },
        { label: 'Subscription', href: '/rasa-ibu/subscribe' },
        { label: 'Recipes', href: '/rasa-ibu/recipes' },
        { label: 'About', href: '/rasa-ibu/about' },
        { label: 'Main Hub', href: '/' },
    ];

    return (
        <div className="bg-[#FDFBF7]">
            <SeasonalDecorations />
            <PublicNav
                navLinks={navLinks}
                whatsapp={config?.whatsapp}
                instagramHandle={config?.instagramHandle}
                socialLinks={config?.socialLinks}
                config={config}
            />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </div>
    );
}
