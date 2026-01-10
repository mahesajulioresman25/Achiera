import Header from "@/components/Header";
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

    return (
        <div className="bg-[#FDFBF7]">
            <SeasonalDecorations />
            <Header />
            <main className="min-h-screen">
                {children}
            </main>
            <RasaIbuFooter />
        </div>
    );
}
