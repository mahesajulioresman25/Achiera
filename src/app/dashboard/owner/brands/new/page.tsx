import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BrandOnboardingForm } from '@/components/dashboard/owner/BrandOnboardingForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewBrandPage() {
    const session = await auth();

    // Only allow Global OWNER (Bunda) to access this page
    if (!session || session.user.globalRole !== 'OWNER') {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
            <div className="max-w-xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/dashboard/owner"
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Dashboard Holding
                    </Link>
                </div>

                <BrandOnboardingForm adminUserId={session.user.id} />

                <div className="mt-12 text-center text-slate-400">
                    <p className="text-xs font-medium uppercase tracking-[0.2em]">Achiera SaaS Infrastructure</p>
                    <div className="flex justify-center gap-4 mt-4 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>
                </div>
            </div>
        </div>
    );
}
