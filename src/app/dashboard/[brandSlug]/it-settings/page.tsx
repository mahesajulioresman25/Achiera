'use client';

import { use, useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ItSettingsData {
    heroMode: string;
    heroTitle: string;
    heroSubtitle: string;
    heroTagline?: string;
    heroCtaLabel?: string;
    heroCtaLink?: string;
    aboutTitle?: string;
    aboutContent?: string;
}

export default function ItSettingsPage({ params }: { params: Promise<{ brandSlug: string }> }) {
    const { brandSlug } = use(params);
    const [settings, setSettings] = useState<ItSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [brandSlug]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/it-settings`);
            const data = await res.json();
            if (data) {
                setSettings(data);
            } else {
                // Set defaults
                setSettings({
                    heroMode: 'SINGLE',
                    heroTitle: '',
                    heroSubtitle: '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/${brandSlug}/it-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success('Pengaturan berhasil disimpan!');
            } else {
                toast.error('Gagal menyimpan pengaturan');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Loading settings...</div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-stone-600">Failed to load settings</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        IT Solutions Settings
                    </h1>
                    <p className="text-stone-600">Configure your IT Solutions page content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Settings Form */}
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-4">Hero Section</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Hero Mode
                            </label>
                            <select
                                value={settings.heroMode}
                                onChange={(e) => setSettings({ ...settings, heroMode: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="SINGLE">Single Hero</option>
                                <option value="SLIDER">Hero Slider</option>
                                <option value="VIDEO">Video Hero</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Hero Title *
                            </label>
                            <input
                                type="text"
                                value={settings.heroTitle}
                                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Transform Your Business with Technology"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Hero Subtitle *
                            </label>
                            <textarea
                                value={settings.heroSubtitle}
                                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Custom software solutions designed to drive innovation and efficiency"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Hero Tagline
                            </label>
                            <input
                                type="text"
                                value={settings.heroTagline || ''}
                                onChange={(e) => setSettings({ ...settings, heroTagline: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Your Technology Partner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    CTA Button Label
                                </label>
                                <input
                                    type="text"
                                    value={settings.heroCtaLabel || ''}
                                    onChange={(e) => setSettings({ ...settings, heroCtaLabel: e.target.value })}
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Get Started"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    CTA Button Link
                                </label>
                                <input
                                    type="text"
                                    value={settings.heroCtaLink || ''}
                                    onChange={(e) => setSettings({ ...settings, heroCtaLink: e.target.value })}
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="/contact"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-900 mb-4">About Section</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                About Title
                            </label>
                            <input
                                type="text"
                                value={settings.aboutTitle || ''}
                                onChange={(e) => setSettings({ ...settings, aboutTitle: e.target.value })}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="About Our IT Solutions"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                About Content
                            </label>
                            <textarea
                                value={settings.aboutContent || ''}
                                onChange={(e) => setSettings({ ...settings, aboutContent: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Describe your IT solutions and services..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
