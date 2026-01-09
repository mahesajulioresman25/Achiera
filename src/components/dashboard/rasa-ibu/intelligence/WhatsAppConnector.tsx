'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Using SVG for better rendering
import { MessageCircle, Zap, Loader2, CheckCircle2, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getWhatsAppStatusAction, logoutWhatsAppAction } from '@/lib/actions/rasa-ibu/whatsapp';
import { useConfirm } from '@/components/ui/BrandConfirm';

export default function WhatsAppConnector() {
    const [status, setStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const confirm = useConfirm();

    const loadStatus = async () => {
        setIsRefreshing(true);
        const res = await getWhatsAppStatusAction();
        if (res.success) {
            setStatus(res);
        } else {
            toast.error('Gagal mengambil status WhatsApp: ' + res.error);
        }
        setIsLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        loadStatus();
        // Poll status every 5 seconds if not connected
        const interval = setInterval(() => {
            if (status?.state !== 'CONNECTED') {
                loadStatus();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [status?.state]);

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: 'Putuskan Koneksi WhatsApp?',
            message: 'Robot Achiera tidak akan bisa mengirim pesan otomatis sampai Bunda menghubungkannya kembali. Lanjutkan?',
            confirmText: 'Ya, Putuskan',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsLoading(true);
        const res = await logoutWhatsAppAction();
        if (res.success) {
            toast.success('Berhasil logout dari WhatsApp');
            loadStatus();
        } else {
            toast.error('Gagal logout: ' + res.error);
        }
        setIsLoading(false);
    };

    if (isLoading && !status) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-[#E5E1D8]">
                <Loader2 className="w-10 h-10 text-[#2D3A2D] animate-spin mb-4" />
                <p className="text-sm font-bold text-[#8B7E66]">Menghubungkan ke Engine...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-[3rem] border border-[#E5E1D8] shadow-sm space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-[1.5rem] shadow-inner ${status?.state === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.3em]">Hardware Sync</h3>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">WhatsApp Connector</h2>
                    </div>
                </div>
                {status?.state === 'CONNECTED' && (
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Status Card */}
                <div className={`p-8 rounded-[2.5rem] border ${status?.state === 'CONNECTED' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'
                    } space-y-6`}>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Connection Status</p>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${status?.state === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`} />
                            <span className="text-xl font-black text-[#2D3A2D]">
                                {status?.state === 'CONNECTED' ? 'TERHUBUNG' : 'SIAP SCAN'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            {status?.state === 'CONNECTED' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                            ) : (
                                <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                            )}
                            <p className="text-sm font-medium text-[#2D3A2D] leading-relaxed">
                                {status?.state === 'CONNECTED'
                                    ? 'Achiera sekarang bisa mengirim nota dan campaign promosi secara otomatis melalui nomor WhatsApp Bunda.'
                                    : 'Scan QR Code di samping menggunakan fitur "Perangkat Tertaut" di aplikasi WhatsApp Bunda untuk mengaktifkan robot pengirim.'}
                            </p>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                onClick={loadStatus}
                                disabled={isRefreshing}
                                className="p-3 bg-white border border-[#E5E1D8] rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                <RefreshCw className={`w-5 h-5 text-[#8B7E66] ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <p className="text-[10px] font-bold text-[#8B7E66]">Terakhir cek: {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* QR / Success Display */}
                <div className="flex flex-col items-center justify-center p-8 bg-[#F9F7F2] rounded-[2.5rem] border border-[#E5E1D8] min-h-[300px]">
                    {status?.state === 'CONNECTED' ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#2D3A2D]">Robot Siap Bekerja!</p>
                                <p className="text-[10px] font-bold text-[#8B7E66]">Sesi aktif terdeteksi.</p>
                            </div>
                        </div>
                    ) : status?.qr ? (
                        <div className="space-y-6 text-center">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border border-white">
                                <QRCodeSVG value={status.qr} size={200} />
                            </div>
                            <div className="flex items-center gap-2 text-amber-600 justify-center">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">QR Code Aktif</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-[#8B7E66]">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-xs font-bold text-center">Menunggu QR Code dari Engine...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
