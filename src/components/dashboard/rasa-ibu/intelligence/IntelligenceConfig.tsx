'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Smartphone, MessageSquare, Loader2, Info, ShoppingBag, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformSettingsAction, updatePlatformSettingsAction } from '@/lib/actions/rasa-ibu/finance';

interface IntelligenceConfigProps {
    brandId: string;
}

export default function IntelligenceConfig({ brandId }: IntelligenceConfigProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getPlatformSettingsAction(brandId);
            if (res.success) {
                setSettings(res.settings);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updatePlatformSettingsAction(brandId, settings);
        if (res.success) {
            toast.success('Konfigurasi berhasil disimpan! AI kini menggunakan parameter terbaru.');
        }
        setIsSaving(false);
    };

    if (isLoading || !settings) return null;

    return (
        <div className="bg-slate-900 rounded-2xl sm:rounded-[3.5rem] p-4 sm:p-6 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-indigo-500/20"></div>

            <div className="relative z-10 space-y-12">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/10">
                            <Settings className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Intelligence Config</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Metadata Brand</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest">CRM & Contact info</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor WhatsApp Admin (CRM)</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Contoh: 085862005917"
                                        value={settings.whatsappCrm || ''}
                                        onChange={(e) => setSettings({ ...settings, whatsappCrm: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-sm font-black focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Resmi Brand</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="Contoh: achiera25.id@gmail.com"
                                        value={settings.contactEmail || ''}
                                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-sm font-black focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic mt-2">
                                    Digunakan untuk menerima notifikasi pesan tulus dari pelanggan.
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Info className="w-3 h-3 text-indigo-400" />
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Parameters</label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Penjualan Bulanan (Unit)</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={settings.targetMonthlyVolume || ''}
                                        onChange={(e) => setSettings({ ...settings, targetMonthlyVolume: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <p className="text-[8px] text-slate-500 leading-relaxed uppercase tracking-tighter">Digunakan AI untuk menghitung alokasi biaya tetap per produk.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Channels */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <ShoppingBag className="w-4 h-4 text-amber-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Sales Channels</h4>
                        </div>
                        <div className="space-y-4">
                            {[
                                { key: 'shopeeFood', label: 'Shopee Food' },
                                { key: 'grabFood', label: 'GrabFood' },
                                { key: 'goFood', label: 'GoFood' },
                                { key: 'tokopedia', label: 'Tokopedia' },
                                { key: 'shopee', label: 'Shopee (Ecommerce)' }
                            ].map((channel) => (
                                <div key={channel.key} className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{channel.label}</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={settings.links?.[channel.key] || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            links: { ...settings.links, [channel.key]: e.target.value }
                                        })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors placeholder:text-slate-700"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-8 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base uppercase tracking-widest hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl min-h-[44px]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Terapkan Konfigurasi
                    </button>
                </div>
            </div>
        </div>
    );
}
