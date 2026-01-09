import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    let brands = (session.user as any).brands || [];
    const user = session.user as any;
    const params = await searchParams;
    const manualSelect = params?.select === 'manual';

    // If user is OWNER with empty brands array, fetch all brands from database
    if (user.globalRole === 'OWNER' && brands.length === 0) {
        const allBrands = await prisma.brand.findMany({
            select: {
                id: true,
                name: true,
                slug: true
            },
            orderBy: { name: 'asc' }
        });

        brands = allBrands.map(brand => ({
            brandId: brand.id,
            brandSlug: brand.slug,
            brandName: brand.name,
            role: 'OWNER'
        }));
    }

    // If user has only one brand AND not manually selecting, redirect directly
    if (brands.length === 1 && !manualSelect) {
        redirect(`/dashboard/${brands[0].brandSlug}`);
    }

    // Show brand selector for users with multiple brands
    return (
        <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 p-8">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-stone-900 mb-4">
                        Welcome, {session.user?.name}!
                    </h1>
                    <p className="text-lg text-stone-600">
                        Select a brand to manage
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Global Holding Dashboard for Owners */}
                    {user.globalRole === 'OWNER' && (
                        <Link
                            href="/dashboard/owner"
                            className="group bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 border-2 border-transparent hover:shadow-2xl hover:shadow-indigo-200 transition-all duration-300 text-white md:col-span-2"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-full">
                                    Global Executive
                                </span>
                            </div>

                            <h2 className="text-3xl font-black mb-2 tracking-tight">
                                Achiera Holding
                            </h2>

                            <p className="text-indigo-100 mb-6 font-medium">
                                Executive Oversight: Consolidated analytics, risk management, and global financial health.
                            </p>

                            <div className="flex items-center gap-2 text-white font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                                Enter Command Center
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </Link>
                    )}

                    {brands.map((brand: any) => (
                        <Link
                            key={brand.brandId}
                            href={`/dashboard/${brand.brandSlug}`}
                            className="group bg-white rounded-2xl border-2 border-stone-200 p-8 hover:border-amber-500 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                    {brand.role}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors">
                                {brand.brandName}
                            </h2>

                            <p className="text-stone-600 mb-6">
                                Manage branch-specific operations, stock, and local reports.
                            </p>

                            <div className="flex items-center gap-2 text-amber-600 font-medium group-hover:gap-3 transition-all">
                                Open Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </Link>
                    ))}
                </div>

                {brands.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-stone-600">
                            You don't have access to any brands. Please contact your administrator.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
