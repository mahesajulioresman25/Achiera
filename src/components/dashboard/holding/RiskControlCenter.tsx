'use client';

import React from 'react';
import {
    ShieldAlert,
    AlertTriangle,
    Info,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { getAnomaliesAction, updateAnomalyStatusAction, triggerRiskScanAction } from '@/lib/actions/holding';

export default function RiskControlCenter() {
    const [anomalies, setAnomalies] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isScanning, setIsScanning] = React.useState(false);

    const loadAnomalies = React.useCallback(async () => {
        setIsLoading(true);
        const res = await getAnomaliesAction();
        if (res.success) {
            setAnomalies(res.anomalies);
        }
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        loadAnomalies();
    }, [loadAnomalies]);

    const handleRunScan = async () => {
        setIsScanning(true);
        const res = await triggerRiskScanAction();
        if (res.success) {
            await loadAnomalies();
        }
        setIsScanning(false);
    };

    const handleUpdateStatus = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
        const res = await updateAnomalyStatusAction(id, status);
        if (res.success) {
            setAnomalies(prev => prev.filter(a => a.id !== id));
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'WARNING': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            default: return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        Risk Control Center
                    </h2>
                    <p className="text-stone-500 text-sm font-medium">Anomaly detection & operational integrity logs</p>
                </div>
                <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50 shadow-xl shadow-stone-900/10"
                >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning...' : 'Run Security Scan'}
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <RefreshCw className="w-10 h-10 text-stone-200 animate-spin" />
                    <p className="mt-4 text-stone-400 font-bold uppercase tracking-widest text-[10px]">Verifying ecosystem health...</p>
                </div>
            ) : anomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm shadow-emerald-900/5">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-black text-stone-900">Ecosystem Secured</h3>
                    <p className="text-stone-500 text-sm max-w-xs text-center mt-2">No operational anomalies or suspicious activities detected in the last 48 hours.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {anomalies.map((anomaly) => (
                        <div
                            key={anomaly.id}
                            className={`p-6 bg-white rounded-[2rem] border border-stone-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative`}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform`}>
                                <ShieldAlert className="w-24 h-24" />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className={`p-4 rounded-2xl ${getSeverityStyles(anomaly.severity)} border shrink-0 h-fit`}>
                                        {getSeverityIcon(anomaly.severity)}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{anomaly.type.replace(/_/g, ' ')}</span>
                                            <span className="w-1 h-1 bg-stone-300 rounded-full" />
                                            <span className="text-[10px] font-bold text-stone-500">{new Date(anomaly.createdAt).toLocaleString()}</span>
                                        </div>
                                        <h4 className="text-lg font-black text-stone-900 leading-tight">{anomaly.description}</h4>
                                        <p className="text-stone-500 text-xs font-medium italic">Brand Source: {anomaly.brand?.name || 'Holding/Platform'}</p>

                                        {anomaly.metadata && (
                                            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Technical Metadata</p>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {Object.entries(anomaly.metadata as any).map(([k, v]: [string, any]) => (
                                                        <div key={k}>
                                                            <p className="text-[8px] font-bold text-stone-400 uppercase">{k}</p>
                                                            <p className="text-[10px] font-black text-stone-700 truncate min-w-0" title={String(v)}>
                                                                {String(v)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end md:self-start">
                                    <button
                                        onClick={() => handleUpdateStatus(anomaly.id, 'RESOLVED')}
                                        className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                        title="Resolve Anomaly"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(anomaly.id, 'DISMISSED')}
                                        className="p-3 text-stone-400 hover:bg-stone-100 rounded-xl transition-all"
                                        title="Dismiss Anomaly"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
