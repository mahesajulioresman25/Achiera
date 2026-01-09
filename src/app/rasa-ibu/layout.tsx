import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SeasonalDecorations from "@/components/ui/SeasonalDecorations";

export default function RasaIbuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SeasonalDecorations />
            <Header />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </>
    );
}
