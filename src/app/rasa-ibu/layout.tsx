import PublicNav from "@/components/commerce/PublicNav";
import RasaIbuFooter from "@/components/RasaIbuFooter";
import SeasonalDecorations from "@/components/ui/SeasonalDecorations";
import { unisolatedPrisma as prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // 2. Custom navigation links from CMS (prioritize CMS over hardcoded)
    let navLinks = [
        { label: 'HOME', href: '/rasa-ibu' },
        { label: 'PRODUK', href: '/rasa-ibu/products' },
        { label: 'CARA PESAN', href: '/rasa-ibu/subscribe' },
        { label: 'TENTANG KAMI', href: '/rasa-ibu/about' },
    ];

    // Check specifically for 'publicNavLinks' as defined in schema (NOT 'navLinks')
    // Also handle potential JSON-stringified data from DB
    let cmsLinks = config?.publicNavLinks || config?.navLinks; // Fallback to old name just in case

    if (cmsLinks) {
        if (typeof cmsLinks === 'string') {
            try {
                cmsLinks = JSON.parse(cmsLinks);
            } catch (e) {
                // Invalid JSON, ignore
            }
        }

        if (Array.isArray(cmsLinks) && cmsLinks.length > 0) {
            navLinks = cmsLinks;
        }
    }

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
            <RasaIbuFooter config={config} paymentSettings={brand?.paymentSettings} />
        </div>
    );
}
