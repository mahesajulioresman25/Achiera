'use client';

import React from 'react';
import { X, Search, Calendar, Filter, Terminal, AlertTriangle, Info, Clock, ExternalLink } from 'lucide-react';
import { getAppLogsAction } from '@/lib/actions/rasa-ibu/finance';

interface AppLogModalProps {
    brandId: string;
    onClose: () => void;
}

export default function AppLogModal({ brandId, onClose }: AppLogModalProps) {
    const [loading, setLoading] = React.useState(true);
    const [logs, setLogs] = React.useState<any[]>([]);
    const [filter, setFilter] = React.useState({
        type: 'EMAIL_PARSE' as string | 'ALL',
        search: ''
    });

    const loadData = React.useCallback(async () => {
        setLoading(true);
        const res = await getAppLogsAction(brandId, filter.type === 'ALL' ? undefined : filter.type, 100);
        if (res.success) {
            setLogs(res.logs);
        }
        setLoading(false);
    }, [brandId, filter.type]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.message?.toLowerCase().includes(filter.search.toLowerCase()) ||
            JSON.stringify(log.metadata || {}).toLowerCase().includes(filter.search.toLowerCase());
        return matchesSearch;
    });

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'ERROR': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'WARN': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'ERROR': return <AlertTriangle className="w-4 h-4" />;
            case 'WARN': return <AlertTriangle className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] rounded-[3rem] w-full max-w-4xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-[#E5E1D8] flex items-center justify-between bg-white/50">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A241A] tracking-tighter flex items-center gap-3">
                            <span className="bg-indigo-100 p-2 rounded-2xl shadow-inner">📡</span>
                            Log <span className="text-indigo-600">Aktivitas Sistem</span>
                        </h2>
                        <p className="text-[#8B7E66] text-sm mt-1 font-medium italic">Riwayat otomatisasi, email parsing, dan sinkronisasi laporan</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white hover:bg-stone-50 rounded-2xl transition-all shadow-sm border border-[#E5E1D8]"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari isi log atau metadata..."
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E5E1D8]">
                            {(['EMAIL_PARSE', 'EMAIL_SEND', 'CRON', 'ALL'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter({ ...filter, type: t })}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.type === t ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}
                                >
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={loadData}
                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                            <Clock className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Logs List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-40">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-black uppercase tracking-widest">Membaca Log...</p>
                                </div>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-[#E5E1D8]">
                                <div className="flex flex-col items-center gap-4 opacity-30">
                                    <Terminal className="w-12 h-12" />
                                    <p className="text-xs font-black uppercase tracking-widest">Tidak ada log ditemukan</p>
                                </div>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="bg-white rounded-[2rem] border border-[#E5E1D8] overflow-hidden hover:shadow-md transition-shadow group">
                                    <div className="p-6 flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl border ${getSeverityStyles(log.severity)} flex-shrink-0 shadow-sm`}>
                                            {getSeverityIcon(log.severity)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        {log.type}
                                                    </span>
                                                    <span className="text-[10px] text-[#8B7E66] font-bold">
                                                        {new Date(log.createdAt).toLocaleString('id-ID', {
                                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getSeverityStyles(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-[#2D3A2D] leading-snug group-hover:text-indigo-600 transition-colors">
                                                {log.message}
                                            </p>

                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="mt-4 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8] relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <ExternalLink className="w-10 h-10" />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        {Object.entries(log.metadata).map(([key, value]: [string, any]) => (
                                                            <div key={key}>
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66] mb-1">{key}</p>
                                                                <p className="text-[11px] font-bold text-[#1A241A] truncate">
                                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-[#E5E1D8] bg-[#F9F7F2]/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] text-[#8B7E66] font-bold uppercase tracking-widest">
                                Sistem Monitoring Aktif
                            </p>
                        </div>
                        <p className="text-[10px] text-[#8B7E66] font-bold italic">
                            Menampilkan {filteredLogs.length} entri terbaru
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
