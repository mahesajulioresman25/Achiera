'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppSettingsProps {
    brandSlug: string;
}

export function WhatsAppSettings({ brandSlug }: WhatsAppSettingsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [config, setConfig] = useState<any>({
        whatsappProvider: 'LOCAL',
        whatsappQuikwaToken: '',
        whatsappQuikwaDeviceId: '',
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`/api/admin/brands/${brandSlug}/whatsapp-config`);
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Failed to load WA config', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [brandSlug]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/brands/${brandSlug}/whatsapp-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast.success('WhatsApp SaaS settings updated!');
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        const phone = prompt('Masukkan nomor WhatsApp tujuan (dengan kode negara, misal: 62812...):');
        if (!phone) return;

        setIsTesting(true);
        try {
            const res = await fetch(`/api/admin/brands/${brandSlug}/whatsapp-config/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, config })
            });

            if (res.ok) {
                toast.success('Pesan test berhasil dikirim ke antrean!');
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Test failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengirim pesan test');
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-stone-900">WhatsApp SaaS (QuikWA)</h2>
                </div>
                <p className="text-sm text-stone-500 mt-1">
                    Konfigurasi gerbang WhatsApp untuk notifikasi otomatis.
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Provider Toggle */}
                <div>
                    <label className="block text-sm font-bold text-stone-900 mb-3">Metode Pengiriman</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setConfig({ ...config, whatsappProvider: 'LOCAL' })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${config.whatsappProvider === 'LOCAL'
                                ? 'border-green-600 bg-green-50'
                                : 'border-stone-100 bg-white hover:border-stone-200'
                                }`}
                        >
                            <Smartphone className={`w-6 h-6 mb-2 ${config.whatsappProvider === 'LOCAL' ? 'text-green-600' : 'text-stone-400'}`} />
                            <div className="font-bold text-sm">Local Engine</div>
                            <div className="text-xs text-stone-500 mt-1 text-balance">Gunakan server lokal (Baileys/QR).</div>
                        </button>

                        <button
                            onClick={() => setConfig({ ...config, whatsappProvider: 'QUIKWA' })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${config.whatsappProvider === 'QUIKWA'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-stone-100 bg-white hover:border-stone-200'
                                }`}
                        >
                            <ShieldCheck className={`w-6 h-6 mb-2 ${config.whatsappProvider === 'QUIKWA' ? 'text-blue-600' : 'text-stone-400'}`} />
                            <div className="font-bold text-sm">QuikWA SaaS</div>
                            <div className="text-xs text-stone-500 mt-1 text-balance">Gunakan API QuikWA (Lebih stabil).</div>
                        </button>
                    </div>
                </div>

                {config.whatsappProvider === 'QUIKWA' && (
                    <div className="space-y-4 pt-4 border-t border-dotted border-stone-200 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                                QuikWA API Token
                            </label>
                            <input
                                type="password"
                                placeholder="Masukkan Token API QuikWA Anda"
                                value={config.whatsappQuikwaToken || ''}
                                onChange={(e) => setConfig({ ...config, whatsappQuikwaToken: e.target.value })}
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                                QuikWA Device ID
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: 12345"
                                value={config.whatsappQuikwaDeviceId || ''}
                                onChange={(e) => setConfig({ ...config, whatsappQuikwaDeviceId: e.target.value })}
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg text-xs text-blue-800 leading-relaxed">
                            <strong>Note:</strong> Pastikan device Anda sudah ter-scan dan aktif di dashboard QuikWA sebelum menggunakan layanan ini.
                        </div>
                    </div>
                )}

                <div className="pt-4 flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Konfigurasi WA
                    </button>

                    <button
                        onClick={handleTest}
                        disabled={isTesting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg font-bold hover:bg-stone-50 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Test Kirim Pesan
                    </button>
                </div>
            </div>
        </div>
    );
}
