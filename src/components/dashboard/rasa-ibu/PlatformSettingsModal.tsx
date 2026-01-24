'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Info, Percent, DollarSign, Loader2, Plus, Trash2, Tag, CreditCard, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformSettingsAction, updatePlatformSettingsAction } from '@/lib/actions/rasa-ibu/finance';
import QRISSettingsPanel from './QRISSettingsPanel';
import BankSettingsPanel from './BankSettingsPanel';
import LoyaltySettingsPanel from './LoyaltySettingsPanel';
import PromptModal from '@/components/ui/PromptModal';

interface PlatformSettingsModalProps {
    brandId: string;
    onClose: () => void;
}

export default function PlatformSettingsModal({ brandId, onClose }: PlatformSettingsModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [settings, setSettings] = useState<any>({
        marketplaceFees: {
            WHATSAPP: 0,
            SHOPEE: 15,
            SHOPEE_FOOD: 20,
            GRAB_FOOD: 25,
            GO_FOOD: 25,
            TOKOPEDIA: 10,
            TIKTOK_SHOP: 12,
            GRAB_MART: 20
        },
        mdrFees: {
            WHATSAPP: 0,
            SHOPEE: 1.5,
            SHOPEE_FOOD: 0,
            GRAB_FOOD: 0,
            GO_FOOD: 0,
            TOKOPEDIA: 1.5,
            TIKTOK_SHOP: 0,
            GRAB_MART: 0
        },
        campaignFees: {},
        taxRates: {
            PPN: 11,
            PPH: 0.5
        },
        operationalOverhead: 5000,
        dailyKitchenOverhead: 0,
        qrisEnabled: false,
        qrisImageUrl: ''
    });

    useEffect(() => {
        async function load() {
            const res = await getPlatformSettingsAction(brandId);
            if (res.success && res.settings) {
                // Ensure mdrFees and marketplaceFees exist if loading from old data
                const loaded = res.settings;
                if (!loaded.mdrFees) {
                    loaded.mdrFees = {
                        WHATSAPP: 0,
                        SHOPEE: 1.5,
                        SHOPEE_FOOD: 0,
                        GRAB_FOOD: 0,
                        GO_FOOD: 0,
                        TOKOPEDIA: 1.5,
                        TIKTOK_SHOP: 0,
                        GRAB_MART: 0
                    };
                }
                if (!loaded.marketplaceFees.SHOPEE_FOOD) loaded.marketplaceFees.SHOPEE_FOOD = 20;
                if (!loaded.marketplaceFees.TOKOPEDIA) loaded.marketplaceFees.TOKOPEDIA = 10;
                if (!loaded.marketplaceFees.GRAB_MART) loaded.marketplaceFees.GRAB_MART = 20;

                setSettings(loaded);
            }
            setIsLoading(false);
        }
        load();
    }, [brandId]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updatePlatformSettingsAction(brandId, settings);
        if (res.success) {
            toast.success('Pengaturan berhasil disimpan. Kalkulasi profit akan otomatis diperbarui.');
            onClose();
        } else {
            toast.error('Gagal menyimpan: ' + res.error);
        }
        setIsSaving(false);
    };

    const updateFee = (channel: string, val: string) => {
        setSettings({
            ...settings,
            marketplaceFees: {
                ...settings.marketplaceFees,
                [channel]: parseFloat(val) || 0
            }
        });
    };

    const updateMdr = (channel: string, val: string) => {
        setSettings({
            ...settings,
            mdrFees: {
                ...settings.mdrFees,
                [channel]: parseFloat(val) || 0
            }
        });
    };

    const updateCampaignFee = (tag: string, val: string) => {
        setSettings({
            ...settings,
            campaignFees: {
                ...settings.campaignFees,
                [tag.toUpperCase()]: parseFloat(val) || 0
            }
        });
    };

    const addCampaignFee = () => {
        setIsPromptOpen(true);
    };

    const handleAddCampaignFee = (tag: string) => {
        if (tag) {
            const cleanTag = tag.toUpperCase().startsWith('#') ? tag.toUpperCase() : '#' + tag.toUpperCase();
            setSettings({
                ...settings,
                campaignFees: {
                    ...settings.campaignFees,
                    [cleanTag]: 0
                }
            });
        }
    };

    const removeCampaignFee = (tag: string) => {
        const newCampaignFees = { ...settings.campaignFees };
        delete newCampaignFees[tag];
        setSettings({ ...settings, campaignFees: newCampaignFees });
    };

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 md:p-3 bg-emerald-600 text-white rounded-2xl">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Konfigurasi Sistem</span>
                            <h2 className="text-xl md:text-2xl font-black text-[#2D3A2D]">Pengaturan Finansial</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 md:p-3 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">
                    {/* Bank Transfer Settings - NEW */}
                    <BankSettingsPanel brandId={brandId} />

                    {/* QRIS Settings Configuration */}
                    <section className="space-y-6">
                        <QRISSettingsPanel
                            brandId={brandId}
                            settings={settings}
                            onSettingsUpdate={(newSettings) => {
                                setSettings(newSettings);
                                // The component itself handles server update, but we update local state
                                // Actually, verify if onSettingsUpdate in component purely updates parent state or assumes server is updated.
                                // Component calls upload/toggle actions, then calls onSettingsUpdate.
                                // So we just need to update local state.
                            }}
                        />
                    </section>

                    {/* Marketplace Fees & MDR Configuration */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-[#F9F7F2] pb-4">
                            <Percent className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Struktur Biaya Marketplace</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(settings.marketplaceFees).map(([channel, fee]: [string, any]) => (
                                <div key={channel} className="bg-white border border-[#E5E1D8] p-5 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="text-[11px] font-black text-[#2D3A2D] uppercase tracking-wider flex items-center gap-2">
                                        {(() => {
                                            const SOURCE_LOGOS: Record<string, string> = {
                                                'WHATSAPP': '/images/platforms/shopee.png',
                                                'WEBSITE': '/globe.svg',
                                                'SHOPEE': '/images/platforms/shopee-ecomerce.png',
                                                'SHOPEE_FOOD': '/images/platforms/shopee.png',
                                                'GRAB_FOOD': '/images/platforms/grabfood.png',
                                                'GO_FOOD': '/images/platforms/gofood.webp',
                                                'TOKOPEDIA': '/images/platforms/tokopedia.png',
                                                'TIKTOK_SHOP': '/images/platforms/TikTok.png',
                                                'GRAB_MART': '/images/platforms/grabamart.png',
                                                'MANUAL': '/file.svg'
                                            };
                                            const logo = SOURCE_LOGOS[channel.toUpperCase()];
                                            return logo ? (
                                                <div className="w-4 h-4 rounded bg-slate-50 border border-slate-100 p-0.5 flex items-center justify-center">
                                                    <img src={logo} alt={channel} className="w-full h-full object-contain" />
                                                </div>
                                            ) : null;
                                        })()}
                                        {channel.replace('_', ' ')}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Commission Cost */}
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#8B7E66] uppercase">Komisi (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={fee}
                                                    onChange={(e) => updateFee(channel, e.target.value)}
                                                    className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:border-emerald-600 pr-8"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#8B7E66]">%</span>
                                            </div>
                                        </div>

                                        {/* MDR Cost */}
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-[#8B7E66] uppercase flex items-center gap-1">
                                                MDR <CreditCard className="w-2 h-2 text-slate-400" />
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={settings.mdrFees?.[channel] || 0}
                                                    onChange={(e) => updateMdr(channel, e.target.value)}
                                                    className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:border-emerald-600 pr-8"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#8B7E66]">%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium">
                                        Total Fee: <span className="text-emerald-600 font-bold">{Number(fee) + Number(settings.mdrFees?.[channel] || 0)}%</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Campaign Fees */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[#F9F7F2] pb-4">
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-purple-600" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Biaya Kampanye Khusus</h3>
                            </div>
                            <button
                                onClick={addCampaignFee}
                                className="flex items-center gap-1 text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> TAMBAH TAG
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(settings.campaignFees || {}).map(([tag, fee]: [string, any]) => (
                                <div key={tag} className="bg-white border border-[#E5E1D8] rounded-2xl p-4 flex items-center gap-4 group">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-wider">{tag}</label>
                                        <div className="relative mt-1">
                                            <input
                                                type="number"
                                                value={fee}
                                                onChange={(e) => updateCampaignFee(tag, e.target.value)}
                                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-2 text-xs font-black focus:outline-none focus:border-purple-600 pr-10"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8B7E66]">%</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeCampaignFee(tag)}
                                        className="p-2 text-rose-200 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {Object.keys(settings.campaignFees || {}).length === 0 && (
                                <div className="col-span-2 py-4 text-center bg-[#F9F7F2]/50 rounded-2xl border border-dashed border-[#E5E1D8]">
                                    <p className="text-[10px] text-[#8B7E66] italic">Belum ada kampanye terdaftar. Gunakan hashtag di catatan pesanan untuk memicu biaya kampanye.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <LoyaltySettingsPanel
                        settings={settings}
                        onSettingsUpdate={(newSettings) => setSettings(newSettings)}
                    />


                    {/* Operational Overhead Moved Notice */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-2 border-b border-[#F9F7F2] pb-4">
                            <DollarSign className="w-4 h-4 text-rose-600" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Biaya Operasional & Overhead</h3>
                        </div>

                        <div className="p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] space-y-6 text-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                                <Zap size={32} />
                            </div>
                            <div className="max-w-md mx-auto space-y-2">
                                <h4 className="text-sm font-black text-[#2D3A2D] uppercase tracking-wider">Pengaturan Telah Berpindah</h4>
                                <p className="text-xs text-[#8B7E66] leading-relaxed">
                                    Konfigurasi biaya operasional harian (Listrik, Gaji, dll) sekarang terintegrasi langsung di <b>Pricing Advantage Hub</b> untuk memberikan analisis <i>True HPP</i> yang lebih akurat.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    if ((window as any).showPricingAdvantage) {
                                        (window as any).showPricingAdvantage();
                                    }
                                }}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-900/10"
                            >
                                Buka Pricing Advantage Hub
                            </button>
                        </div>
                    </section>
                </div>

                <div className="px-10 py-8 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-between items-center">
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-rose-600 transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 py-4 bg-[#2D3A2D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-green-900/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Konfigurasi
                    </button>
                </div>
            </div>

            <PromptModal
                isOpen={isPromptOpen}
                onClose={() => setIsPromptOpen(false)}
                onConfirm={handleAddCampaignFee}
                title="Tambah Tag Kampanye"
                message="Masukkan nama kampanye (hashtag) untuk melacak biaya operasional khusus (contoh: #PROMO12)."
                placeholder="#PROMO..."
            />
        </div>
    );
}
