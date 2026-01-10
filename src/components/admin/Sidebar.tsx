'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    LayoutDashboard,
    FileText,
    Sparkles,
    Package,
    Palette,
    Mail,
    LogOut,
    Building2,
    Briefcase,
    FileCode,
    BarChart3,
    Image as ImageIcon,
    DollarSign,
    Megaphone,
    Zap,
    ShieldAlert,
    Users,
} from 'lucide-react';

interface SidebarProps {
    brandSlug: string;
}

export default function Sidebar({ brandSlug }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const brandRoles = (session?.user as any)?.brandRoles || [];
    const currentBrand = brandRoles.find((br: any) => br.brandSlug === brandSlug);

    const merchMenuItems = [
        {
            title: 'Dashboard',
            href: `/dashboard/${brandSlug}`,
            icon: LayoutDashboard,
        },
        {
            title: 'Content',
            items: [
                { title: 'Hero & Highlight', href: `/dashboard/${brandSlug}/hero`, icon: FileText },
                { title: 'Hero Slides', href: `/dashboard/${brandSlug}/hero-slides`, icon: ImageIcon },
            ],
        },
        {
            title: 'Collections',
            href: `/dashboard/${brandSlug}/collections`,
            icon: Package,
        },
        {
            title: 'Catalogue Requests',
            href: `/dashboard/${brandSlug}/catalogue-requests`,
            icon: Mail,
        },
        {
            title: 'Orders',
            href: `/dashboard/${brandSlug}/orders`,
            icon: Package,
        },
        {
            title: 'Pricing Engine',
            items: [
                { title: 'Price Rules', href: `/dashboard/${brandSlug}/pricing/rules`, icon: DollarSign },
                { title: 'Components', href: `/dashboard/${brandSlug}/pricing/components`, icon: Package },
            ],
        },
        {
            title: 'Marketing',
            items: [
                { title: 'Overview', href: `/dashboard/${brandSlug}/marketing`, icon: Sparkles },
                { title: 'Campaigns', href: `/dashboard/${brandSlug}/marketing/campaigns`, icon: Megaphone },
                { title: 'Flash Sale', href: `/dashboard/${brandSlug}/marketing/flash-sale`, icon: Zap },
            ],
        },
        {
            title: 'Analytics',
            href: `/dashboard/${brandSlug}/analytics`,
            icon: BarChart3,
        },
        {
            title: 'Settings',
            href: `/dashboard/${brandSlug}/settings`,
            icon: Palette,
        },
    ];

    const itMenuItems = [
        {
            title: 'Dashboard',
            href: `/dashboard/${brandSlug}`,
            icon: LayoutDashboard,
        },
        {
            title: 'Content',
            items: [
                { title: 'Hero Section', href: `/dashboard/${brandSlug}/content/hero`, icon: FileText },
                { title: 'Hero Slides', href: `/dashboard/${brandSlug}/content/hero-slides`, icon: ImageIcon },
            ],
        },
        {
            title: 'Services',
            href: `/dashboard/${brandSlug}/services`,
            icon: Briefcase,
        },
        {
            title: 'Case Studies',
            href: `/dashboard/${brandSlug}/case-studies`,
            icon: FileCode,
        },
        {
            title: 'Analytics',
            href: `/dashboard/${brandSlug}/analytics`,
            icon: BarChart3,
        },
        {
            title: 'Settings',
            href: `/dashboard/${brandSlug}/settings`,
            icon: Palette,
        },
    ];

    const rasaIbuMenuItems = [
        {
            title: 'Dashboard',
            href: `/dashboard/${brandSlug}`,
            icon: LayoutDashboard,
        },
        {
            title: 'Operations',
            items: [
                { title: 'Inventory Control', href: `/dashboard/${brandSlug}/inventory`, icon: Package },
                { title: 'Financial Pulse', href: `/dashboard/${brandSlug}/finance`, icon: DollarSign },
            ],
        },
        {
            title: 'CMS',
            items: [
                { title: 'Hero & Highlights', href: `/dashboard/${brandSlug}/content`, icon: FileText },
            ],
        },
        {
            title: 'Settings',
            href: `/dashboard/${brandSlug}/settings`,
            icon: Palette,
        },
    ];

    const holdingMenuItems = [
        {
            title: 'Executive Dashboard',
            href: `/dashboard/owner`,
            icon: LayoutDashboard,
        },
        {
            title: 'Governance',
            items: [
                { title: 'User Management', href: `/dashboard/owner/users`, icon: Users },
                { title: 'Audit & Compliance', href: `/dashboard/owner/audit-compliance`, icon: ShieldAlert },
            ],
        },
        {
            title: 'Intelligence',
            items: [
                { title: 'Autonomous Center', href: `/autonomous/overview?brandId=rasa-ibu`, icon: Zap },
                { title: 'Strategic Reports', href: `/dashboard/owner/reports`, icon: FileText },
            ],
        },
    ];

    const isMerch = brandSlug === 'merch';
    const isIT = brandSlug === 'it-solutions';
    const isRasaIbu = brandSlug === 'rasa-ibu';
    const isHolding = brandSlug === 'achiera';

    const menuItems = isMerch ? merchMenuItems
        : isIT ? itMenuItems
            : isRasaIbu ? rasaIbuMenuItems
                : holdingMenuItems;

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="w-64 bg-white border-r border-stone-200 min-h-screen flex flex-col" suppressHydrationWarning>
            {/* Logo & Brand */}
            <div className="p-6 border-b border-stone-200" suppressHydrationWarning>
                <div className="flex items-center gap-3 mb-2" suppressHydrationWarning>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center" suppressHydrationWarning>
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div suppressHydrationWarning>
                        <h1 className="text-lg font-bold text-stone-900" suppressHydrationWarning>
                            {currentBrand?.brandName || 'ACHIERA'}
                        </h1>
                    </div>
                </div>
                <p className="text-xs text-stone-500" suppressHydrationWarning>Admin Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1" suppressHydrationWarning>
                {menuItems.map((item, idx) => {
                    if ('items' in item) {
                        // Section with submenu
                        return (
                            <div key={idx} className="mb-4" suppressHydrationWarning>
                                <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider" suppressHydrationWarning>
                                    {item.title}
                                </div>
                                <div className="space-y-1" suppressHydrationWarning>
                                    {item.items?.map((subItem) => {
                                        const Icon = subItem.icon;
                                        const isActive = pathname === subItem.href;
                                        return (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'text-stone-700 hover:bg-stone-100'
                                                    }`}
                                                suppressHydrationWarning
                                            >
                                                <Icon className="w-4 h-4" />
                                                {subItem.title}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    } else {
                        // Single menu item
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'text-stone-700 hover:bg-stone-100'
                                    }`}
                                suppressHydrationWarning
                            >
                                <Icon className="w-4 h-4" />
                                {item.title}
                            </Link>
                        );
                    }
                })}
            </nav>

            {/* Brand Switcher (if user has multiple brands) */}
            {brandRoles.length > 1 && (
                <div className="p-4 border-t border-stone-200" suppressHydrationWarning>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                        suppressHydrationWarning
                    >
                        <Building2 className="w-4 h-4" />
                        Switch Brand
                    </Link>
                </div>
            )}

            {/* Sign Out */}
            <div className="p-4 border-t border-stone-200" suppressHydrationWarning>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 w-full transition-colors"
                    suppressHydrationWarning
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
