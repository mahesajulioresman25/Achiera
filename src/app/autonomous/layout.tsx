// Main Navigation Layout - Dashboard navigation wrapper
// Provides consistent navigation across all autonomous pages

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAutonomousBrandAction } from '@/lib/actions/rasa-ibu/businessIntelligence';
import { LoadingSpinner } from '@/components/autonomous/ui/CoreComponents';

interface AutonomousLayoutProps {
    children: React.ReactNode;
}

export default function AutonomousLayout({ children }: AutonomousLayoutProps) {
    return (
        <React.Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        }>
            <AutonomousLayoutContent children={children} />
        </React.Suspense>
    );
}

function AutonomousLayoutContent({ children }: AutonomousLayoutProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const brandId = searchParams.get('brandId') || '';

    // Fetch Brand Info
    const { data: brandRes } = useQuery({
        queryKey: ['brand-info', brandId],
        queryFn: () => getAutonomousBrandAction(brandId),
        enabled: !!brandId
    });

    const brandName = (brandRes as any)?.data?.name || (brandId === 'test_brand_001' ? 'TEST BRAND' : brandId);

    const navItems = [
        { href: '/autonomous/overview', label: 'Overview', icon: '📊' },
        { href: '/autonomous/rules', label: 'Rules', icon: '📋' },
        { href: '/autonomous/executions', label: 'Executions', icon: '⚡' },
        { href: '/autonomous/approvals', label: 'Approvals', icon: '✓' },
        { href: '/autonomous/trust', label: 'Trust', icon: '🎯' },
        { href: '/autonomous/budget', label: 'Budget', icon: '💰' },
        { href: '/autonomous/audit', label: 'Audit', icon: '📝' },
        { href: '/autonomous/settings', label: 'Settings', icon: '⚙️' }
    ];

    const isActive = (href: string) => pathname?.startsWith(href);

    return (
        <>
            {/* Global Safety Banner */}
            <div className="bg-emerald-500 text-white py-2 px-4 shadow-inner text-center">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                    <span className="text-sm font-black tracking-tighter uppercase whitespace-nowrap flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
                        SYSTEM STATUS: ACTIVE. EXECUTION ENABLED.
                    </span>
                    <span className="hidden md:inline-block h-4 w-px bg-white opacity-20"></span>
                    <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest opacity-80">
                        CFO INTERLOCK VERIFIED • DETERMINISTIC AUDIT ACTIVE • ALL MUTATIONS PERMITTED
                    </p>
                </div>
            </div>

            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-blue-600 text-white p-1 rounded font-black text-xs">A</span>
                                ACHIERA Autonomous
                            </h1>

                            <div className="hidden md:flex space-x-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={`${item.href}?brandId=${brandId}`}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className="mr-1">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-gray-600 font-bold uppercase truncate max-w-[150px]">BRAND: {brandName || 'UNSELECTED'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden bg-white border-b border-gray-200">
                <div className="px-4 py-2 overflow-x-auto">
                    <div className="flex space-x-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={`${item.href}?brandId=${brandId}`}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${isActive(item.href)
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon} {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {brandId ? children : (
                    <div className="bg-white rounded-xl shadow p-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Brand ID Provided</h2>
                        <p className="text-gray-500 max-w-sm mx-auto">Please select a valid brand from the main account menu to access its Autonomous Analytics cockpit.</p>
                    </div>
                )}
            </main>
        </>
    );
}
