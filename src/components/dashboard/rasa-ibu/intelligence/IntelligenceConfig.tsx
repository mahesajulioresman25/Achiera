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
        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden group">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                        className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Terapkan Konfigurasi
                    </button>
                </div>
            </div>
        </div>
    );
}
