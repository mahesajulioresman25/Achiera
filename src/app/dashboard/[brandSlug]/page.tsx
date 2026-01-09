import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Package, FileText, Sparkles, Mail } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HoldingExecutiveView from '@/components/dashboard/holding/HoldingExecutiveView';
import MerchDashboard from '@/components/dashboard/merch/MerchDashboard';
import ITDashboard from '@/components/dashboard/it/ITDashboard';

export default async function BrandDashboardPage({
    params
}: {
    params: Promise<{ brandSlug: string }>
}) {
    const { brandSlug } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const user = session.user as any;
    const brandsInSession = user.brands || [];
    let currentBrand = brandsInSession.find((br: any) => br.brandSlug === brandSlug);

    // If not in session (e.g., OWNER with empty array), try finding in DB
    if (!currentBrand && user.globalRole === 'OWNER') {
        const dbSlugMap: Record<string, string> = {
            'achiera-merch': 'merch',
            'achiera-it-solution': 'it-solutions'
        };

        const brandFromDb = await prisma.brand.findFirst({
            where: {
                OR: [
                    { slug: brandSlug },
                    { slug: dbSlugMap[brandSlug] || brandSlug }
                ]
            }
        });

        if (brandFromDb) {
            currentBrand = {
                brandId: brandFromDb.id,
                brandSlug: brandFromDb.slug,
                brandName: brandFromDb.name,
                role: 'OWNER'
            };
        }
    }

    if (!currentBrand) {
        redirect('/dashboard');
    }

    // SPECIAL CASE: Holding Dashboard (Achiera Induk)
    if (brandSlug === 'achiera') {
        // Fetch all brands for holding dashboard
        const allBrands = await prisma.brand.findMany({
            select: {
                id: true,
                name: true,
                slug: true
            },
            orderBy: { name: 'asc' }
        });

        // Fetch all orders across all brands
        const allOrders = await prisma.order.findMany({
            select: { total: true, brandId: true }
        });

        const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const activeOrders = allOrders.length;

        const stats = {
            totalRevenue: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalRevenue),
            activeOrders: activeOrders,
            activeProduction: 0, // Can be calculated if needed
            itProjectHealth: 'Stable'
        };

        const brandSummary = allBrands.map((b) => ({
            name: b.name,
            slug: b.slug,
            role: 'OWNER',
            status: 'Online'
        }));

        return <HoldingExecutiveView stats={stats} brandSummary={brandSummary} />;
    }

    // SPECIAL CASE: Merch Dashboard
    if (brandSlug === 'achiera-merch' || brandSlug === 'merch') {
        return <MerchDashboard brandName={currentBrand.brandName} brandSlug={brandSlug} brandId={currentBrand.brandId} />;
    }

    // SPECIAL CASE: IT Dashboard
    if (brandSlug === 'achiera-it-solution' || brandSlug === 'it-solutions') {
        return <ITDashboard brandName={currentBrand.brandName} brandSlug={brandSlug} brandId={currentBrand.brandId} />;
    }

    // FALLBACK for other brands (like rasa-ibu if not using its own page or others)

    const stats = [
        {
            title: 'Content Sections',
            value: '1',
            icon: Sparkles,
            href: `/dashboard/${brandSlug}/content/hero`,
            color: 'bg-purple-100 text-purple-600',
        },
    ];

    return (
        <div className="p-8" suppressHydrationWarning>
            {/* Header */}
            <div className="mb-8" suppressHydrationWarning>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                    {currentBrand.brandName} Dashboard
                </h1>
                <p className="text-stone-600">
                    Welcome back, {session.user?.name}! Manage your content and settings.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" suppressHydrationWarning>
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.title}
                            href={stat.href}
                            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-lg transition-shadow"
                            suppressHydrationWarning
                        >
                            <div className="flex items-center justify-between mb-4" suppressHydrationWarning>
                                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`} suppressHydrationWarning>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-stone-900 mb-1" suppressHydrationWarning>{stat.value}</div>
                            <div className="text-sm text-stone-600" suppressHydrationWarning>{stat.title}</div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-stone-200 p-6" suppressHydrationWarning>
                <h2 className="text-lg font-bold text-stone-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href={`/dashboard/${brandSlug}/content/hero`}
                        className="p-4 border border-stone-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors"
                        suppressHydrationWarning
                    >
                        <h3 className="font-semibold text-stone-900 mb-1">Edit Hero Section</h3>
                        <p className="text-sm text-stone-600">Update homepage headline and CTA</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
