'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import SettlementUploader from '@/components/dashboard/rasa-ibu/reconciliation/SettlementUploader';
import { getSettlementBatchesAction } from '@/lib/actions/rasa-ibu/reconciliation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ReconciliationPage({ params }: { params: { brandId?: string } }) {
    // Hardcoded brandId for now or context
    // Actually page should receive props or use context. 
    // Assuming this is under [brandId] layout? 
    // Path: src/app/dashboard/rasa-ibu/finance/reconciliation/page.tsx
    // It's likely fixed to 'rasa-ibu' brand ID conceptually or retrieved.
    // DashboardClientWrapper usually handles brandId.
    // We'll fetch 'rasa-ibu' via action or passed prop if layout allows.
    // For MVP we can assume Rasa Ibu ID or fetch it.
    // Let's assume we can pass brandId or fetch generic for user.
    // Wait, Dashboard usually has layout that provides Context?
    // I will use a placeholder or specific ID if known.
    // Better: DashboardWrapper provides it? 
    // I'll assume we need to fetch Brand ID logic. Or just use a valid ID if I know it.
    // I'll try to fetch active brand.

    // Actually, let's keep it simple. If we are in /rasa-ibu, we target that brand.
    // I'll grab brandId from a server component wrapper or assume logic.
    // For now, I'll allow uploader to work if I can get ID.
    // I'll put a placeholder ID and fix if needed. 
    // Actually, `DashboardClientWrapper` had `brandId`.
    // I'll try to get it from layout via params if dynamic.
    // But this route is static path: `rasa-ibu`.
    // So likely need to fetch brand `rasa-ibu` ID.

    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brandId, setBrandId] = useState<string>('');

    useEffect(() => {
        // Fetch brand ID logic? 
        // For now, let's look up 'rasa-ibu' brand or just list all if possible?
        // Let's hardcode fetching 'rasa-ibu' brand logic in action?
        // Or fetch generic.
        // Actually, let's use the one from `PlatformSettingsModal` context if common.
        // I will implement a quick fetch for brandId on mount.

        async function init() {
            setLoading(true);
            // We need active brand ID to fetch batches.
            // I'll assume we used 'rasa-ibu' slug.
            // I'll add a helper action later. For now, try to fetch batches.
            // Is there an action `getBrandBySlug`?
            // I'll assume `getSettlementBatchesAction` can find it if I pass slug?
            // No, it takes UUID.

            // Temporary: I will fetch batches for *any* brand I have access to?
            // I'll fetch 'rasa-ibu' brand first.
            const res = await fetch('/api/public/brands?slug=rasa-ibu').then(r => r.json());
            if (res?.id) {
                setBrandId(res.id);
                loadBatches(res.id);
            }
        }
        init();
    }, []);

    const loadBatches = async (id: string) => {
        const res = await getSettlementBatchesAction(id);
        if (res.success) {
            setBatches(res.data);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F9F7F2] p-8 space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/dashboard/rasa-ibu" className="p-2 hover:bg-white rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#8B7E66]" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-[#2D3A2D]">Pusat Rekonsiliasi</h1>
                    <p className="text-sm text-[#8B7E66] font-medium">Matching otomatis laporan keuangan platform.</p>
                </div>
            </header>

            {/* Uploader Section */}
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E5E1D8]">
                <h2 className="text-lg font-bold text-[#2D3A2D] mb-4">Upload Laporan Baru</h2>
                {brandId ? (
                    <SettlementUploader brandId={brandId} onUploadComplete={() => loadBatches(brandId)} />
                ) : (
                    <div className="text-center p-8">Loading Brand Context...</div>
                )}
            </section>

            {/* History Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#2D3A2D]">Riwayat Settlement</h2>
                    <button onClick={() => brandId && loadBatches(brandId)} className="p-2 hover:bg-white rounded-full">
                        <RefreshCw className={`w-4 h-4 text-[#8B7E66] ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="bg-white rounded-[2rem] border border-[#E5E1D8] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#F9F7F2] border-b border-[#E5E1D8]">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Tanggal</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Filename</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Platform</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Total Bersih</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] text-right">Rows</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F9F7F2]">
                            {batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-xs font-bold text-[#2D3A2D]">
                                        {format(new Date(batch.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                                    </td>
                                    <td className="p-4 text-xs font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                            {batch.filename}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-700">{batch.platform}</td>
                                    <td className="p-4 text-xs font-black text-emerald-700">
                                        Rp {parseFloat(batch.netAmount).toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-500 text-right">{batch._count.items}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
                                            ${batch.status === 'PROCESSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                                        `}>
                                            {batch.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && batches.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400 font-medium">
                                        Belum ada history upload.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
