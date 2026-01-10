import PublicNav from "@/components/commerce/PublicNav";
import RasaIbuFooter from "@/components/RasaIbuFooter";
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

    // 2. Custom navigation links per user request
    const navLinks = [
        { label: 'HOME', href: '/rasa-ibu' },
        { label: 'PRODUK', href: '/rasa-ibu/products' },
        { label: 'CARA PESAN', href: '/rasa-ibu/subscribe' },
        { label: 'TENTANG KAMI', href: '/rasa-ibu/about' },
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
            <RasaIbuFooter />
        </div>
    );
}
