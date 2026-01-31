import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, Smartphone, ExternalLink, Activity } from 'lucide-react';
import { waEngine } from '@/lib/whatsapp/engine';

export const dynamic = 'force-dynamic';

export default async function WhatsappMonitoringPage() {
    const session = await auth();
    if (session?.user?.globalRole !== 'OWNER') {
        redirect('/dashboard');
    }

    // Fetch Analytics
    const [stats, recentQueue, brandConfigs] = await Promise.all([
        prisma.$transaction([
            (prisma as any).whatsAppQueue.count({ where: { status: 'SENT' } }),
            (prisma as any).whatsAppQueue.count({ where: { status: 'PENDING' } }),
            (prisma as any).whatsAppQueue.count({ where: { status: 'FAILED' } }),
        ]),
        (prisma as any).whatsAppQueue.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { brand: { select: { name: true } } }
        }),
        prisma.brandConfig.findMany({
            include: { brand: { select: { name: true, slug: true } } }
        })
    ]);

    const [sent, pending, failed] = stats;

    // Check Local Engine Status
    let localStatus: any = { isInitialized: false, state: 'OFFLINE' };
    try {
        localStatus = waEngine.getStatus();
    } catch (e) { }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                        WhatsApp Central Command
                    </h1>
                    <p className="text-stone-500 mt-1 font-medium">Monitoring WhatsApp SaaS & Antrean Pesan Platform Achiera</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Engine Status</div>
                        <div className={`p-1.5 rounded-full ${localStatus.state === 'CONNECTED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <Smartphone size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-stone-900 uppercase">{localStatus.state || 'OFFLINE'}</div>
                    <div className="text-[10px] text-stone-400 mt-1 uppercase font-bold">LOCAL DRIVER</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Total Sent</div>
                        <div className="p-1.5 bg-green-50 rounded-full text-green-600">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-stone-900">{sent.toLocaleString()}</div>
                    <div className="text-[10px] text-stone-400 mt-1 uppercase font-bold">ALL TIME SUCCESS</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">In Queue</div>
                        <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 animate-pulse">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-stone-900">{pending.toLocaleString()}</div>
                    <div className="text-[10px] text-stone-400 mt-1 uppercase font-bold">PENDING / PROCESSING</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Failed</div>
                        <div className="p-1.5 bg-red-50 rounded-full text-red-600">
                            <AlertCircle size={16} />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-red-600">{failed.toLocaleString()}</div>
                    <div className="text-[10px] text-red-400 mt-1 uppercase font-bold">ATTENTION REQUIRED</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Queue */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                Real-time Queue Monitor
                            </h3>
                            <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-1 rounded border border-stone-200 uppercase tracking-widest">Last 20 items</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-stone-400 font-bold uppercase text-[10px] tracking-widest border-b border-stone-100">
                                    <tr>
                                        <th className="px-6 py-4">Tenant</th>
                                        <th className="px-6 py-4">Destination</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {recentQueue.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-stone-900">{item.brand?.name || 'SYSTEM'}</td>
                                            <td className="px-6 py-4 font-mono text-stone-500 text-xs">{item.phone}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'SENT' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700 animate-pulse'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-stone-400 text-xs">{new Date(item.createdAt).toLocaleTimeString()}</td>
                                        </tr>
                                    ))}
                                    {recentQueue.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic">No messages in queue yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Tenant Driver Config */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                            <h3 className="font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight">
                                <ExternalLink className="w-5 h-5 text-stone-400" />
                                Custom Drivers
                            </h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {brandConfigs.map((config: any) => (
                                <div key={config.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                                    <div>
                                        <div className="font-bold text-sm text-stone-900">{config.brand.name}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                                            {config.whatsappProvider}
                                        </div>
                                    </div>
                                    {config.whatsappProvider === 'QUIKWA' && (
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                            <CheckCircle2 size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {brandConfigs.filter((c: any) => c.whatsappProvider === 'QUIKWA').length === 0 && (
                                <div className="p-4 text-center text-xs text-stone-400 italic">
                                    No tenants using SaaS driver yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-stone-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquare size={80} />
                        </div>
                        <h4 className="font-black text-xl mb-2">Platform Health</h4>
                        <p className="text-stone-400 text-xs leading-relaxed mb-6">
                            Semua notifikasi transaksi (Order Created, Status Update, Admin Alerts) diproses melalui antrean pusat untuk menghindari limitasi WhatsApp.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Processor: Active</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Anti-Ban Flow: Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
