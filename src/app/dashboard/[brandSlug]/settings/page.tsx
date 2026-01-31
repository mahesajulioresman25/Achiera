'use client';

import { useState, useEffect, use } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppSettings } from '@/components/dashboard/settings/WhatsAppSettings';

export default function BrandSettingsPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const resolvedParams = use(params);
    const { brandSlug } = resolvedParams;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<any>({ downPaymentPercentage: 50 });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/admin/brands/${brandSlug}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data.paymentSettings);
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [brandSlug]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/brands/${brandSlug}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success('Settings verified! New orders will use this logic.');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-stone-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading Settings...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-stone-900">Brand Settings</h1>

            {/* WhatsApp Integration Section */}
            <WhatsAppSettings brandSlug={brandSlug} />

            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        These settings allow you to control the Down Payment percentage for your customers.
                        Changes apply immediately to <strong>new orders</strong>.
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Down Payment Section */}
                    <div>
                        <label className="block text-sm font-bold text-stone-900 mb-2">
                            Down Payment Percentage (%)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.downPaymentPercentage}
                                onChange={(e) => setSettings({ ...settings, downPaymentPercentage: Number(e.target.value) })}
                                className="w-32 p-3 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-xl text-center focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <span className="text-stone-500 font-medium">%</span>
                        </div>
                        <p className="text-sm text-stone-500 mt-2">
                            Example: If 30%, customer pays 30% first, then 70% later.
                        </p>
                    </div>

                    {/* Platform Links Section */}
                    <div className="pt-6 border-t border-stone-100">
                        <h3 className="text-lg font-bold text-stone-900 mb-4">Platform Integrations</h3>
                        <div className="grid gap-4">
                            {[
                                { key: 'shopeeFood', label: 'Shopee Food URL', placeholder: 'https://shopee.co.id/...' },
                                { key: 'grabFood', label: 'GrabFood URL', placeholder: 'https://grab.com/...' },
                                { key: 'goFood', label: 'GoFood URL', placeholder: 'https://gofood.link/...' },
                                { key: 'shopee', label: 'Shopee Ecommerce URL', placeholder: 'https://shopee.co.id/shop/...' },
                                { key: 'tokopedia', label: 'Tokopedia URL', placeholder: 'https://tokopedia.com/...' },
                                { key: 'tiktok', label: 'TikTok Shop URL', placeholder: 'https://tiktok.com/...' },
                                { key: 'grabMart', label: 'GrabMart URL', placeholder: 'https://grab.com/...' },
                            ].map((platform) => (
                                <div key={platform.key}>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                                        {platform.label}
                                    </label>
                                    <input
                                        type="url"
                                        placeholder={platform.placeholder}
                                        value={settings.links?.[platform.key] || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            links: { ...settings.links, [platform.key]: e.target.value }
                                        })}
                                        className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
