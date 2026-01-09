'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
    heroTitle: string;
    heroSubtitle: string;
    heroTagline: string;
    heroCtaLabel: string;
    heroCtaLink: string;
    highlightLine: string;
}

export default function HeroHighlightPage() {
    const [settings, setSettings] = useState<Settings>({
        heroTitle: '',
        heroSubtitle: '',
        heroTagline: '',
        heroCtaLabel: '',
        heroCtaLink: '',
        highlightLine: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/merch-settings');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setSettings({
                        heroTitle: data.heroTitle || '',
                        heroSubtitle: data.heroSubtitle || '',
                        heroTagline: data.heroTagline || '',
                        heroCtaLabel: data.heroCtaLabel || '',
                        heroCtaLink: data.heroCtaLink || '',
                        highlightLine: data.highlightLine || ''
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/merch-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) {
                const error = await res.json();
                console.error('Save failed:', error);
                toast.error(`Error: ${error.error || 'Failed to save settings'}`);
                return;
            }

            toast.success('Pengaturan berhasil disimpan!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Hero & Highlight</h1>
                    <p className="text-stone-600">Manage hero section and highlight line for ACHIERA Merch</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
                {/* Hero Section */}
                <div className="border-b border-stone-200 pb-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Hero Section</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Hero Title
                            </label>
                            <input
                                type="text"
                                value={settings.heroTitle}
                                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="e.g. Modern Brands Deserve Thoughtful Merchandise"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Hero Subtitle
                            </label>
                            <textarea
                                value={settings.heroSubtitle}
                                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                rows={3}
                                placeholder="e.g. ACHIERA Merchandise helps companies create lasting impressions with high-quality products."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Hero Tagline
                            </label>
                            <input
                                type="text"
                                value={settings.heroTagline}
                                onChange={(e) => setSettings({ ...settings, heroTagline: e.target.value })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="e.g. Premium Quality, Customizable for Your Brand"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    CTA Button Label
                                </label>
                                <input
                                    type="text"
                                    value={settings.heroCtaLabel}
                                    onChange={(e) => setSettings({ ...settings, heroCtaLabel: e.target.value })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. Request Catalogue"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    CTA Button Link
                                </label>
                                <input
                                    type="text"
                                    value={settings.heroCtaLink}
                                    onChange={(e) => setSettings({ ...settings, heroCtaLink: e.target.value })}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="e.g. /contact"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Highlight Line */}
                <div>
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Highlight Line</h2>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Highlight Text
                        </label>
                        <input
                            type="text"
                            value={settings.highlightLine}
                            onChange={(e) => setSettings({ ...settings, highlightLine: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="e.g. Trusted by 500+ companies across Indonesia"
                        />
                        <p className="text-xs text-stone-500 mt-1">
                            This text appears below the hero section as a highlight badge
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="mt-8 bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="text-sm font-semibold text-stone-900 mb-4">Preview</h3>
                <div className="bg-white rounded-lg p-8 text-center">
                    <h1 className="text-4xl font-bold text-stone-900 mb-4">
                        {settings.heroTitle || 'Hero Title'}
                    </h1>
                    <p className="text-lg text-stone-600 mb-2">
                        {settings.heroSubtitle || 'Hero Subtitle'}
                    </p>
                    {settings.heroTagline && (
                        <p className="text-sm text-amber-700 mb-6">
                            {settings.heroTagline}
                        </p>
                    )}
                    {settings.heroCtaLabel && (
                        <button className="px-6 py-2 bg-amber-600 text-white rounded-lg">
                            {settings.heroCtaLabel}
                        </button>
                    )}
                    {settings.highlightLine && (
                        <div className="mt-6 pt-6 border-t border-stone-200">
                            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-900 rounded-full text-sm">
                                {settings.highlightLine}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
