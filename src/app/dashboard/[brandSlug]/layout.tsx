import Sidebar from '@/components/admin/Sidebar';
import DashboardProviders from '@/components/admin/DashboardProviders';

export default async function BrandDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ brandSlug: string }>;
}) {
    const { brandSlug } = await params;

    return (
        <DashboardProviders>
            <div className="flex min-h-screen bg-stone-50" suppressHydrationWarning>
                <Sidebar brandSlug={brandSlug} />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </DashboardProviders>
    );
}
