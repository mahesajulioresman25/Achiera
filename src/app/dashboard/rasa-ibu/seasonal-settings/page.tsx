'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Palette, Eye, Save, Loader2 } from 'lucide-react';
import { getCurrentSeason, SEASONAL_THEMES, SeasonType } from '@/lib/services/SeasonalService';

export default function SeasonalSettingsPage() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const brandId = 'rasa-ibu'; // Hardcoded for MVP

    const currentSeason = getCurrentSeason();

    // All available celebrations
    const allCelebrations: SeasonType[] = [
        'IMLEK', 'RAMADAN', 'LEBARAN', 'INDEPENDENCE',
        'WAISAK', 'NYEPI', 'KARTINI', 'HARI_IBU',
        'CHRISTMAS', 'NEW_YEAR'
    ];

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch(`/api/seasonal-config?brandId=${brandId}`);
            const data = await res.json();
            if (data.success) {
                setConfigs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCelebration = async (seasonType: string, currentlyEnabled: boolean) => {
        setSaving(seasonType);
        try {
            const res = await fetch('/api/seasonal-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    seasonType,
                    isEnabled: !currentlyEnabled
                })
            });

            if (res.ok) {
                await fetchConfigs();
            }
        } catch (error) {
            console.error('Failed to toggle celebration:', error);
        } finally {
            setSaving(null);
        }
    };

    const getConfig = (seasonType: string) => {
        return configs.find(c => c.seasonType === seasonType);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B7E66]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-[#2D3A2D] font-serif italic mb-2">
                        Pengaturan Perayaan
                    </h1>
                    <p className="text-[#8B7E66] font-medium">
                        Kelola tampilan perayaan musiman di website Rasa Ibu
                    </p>
                </div>

                {/* Current Active Celebration */}
                {currentSeason.type !== 'NONE' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 rounded-[2rem] border-2"
                        style={{
                            backgroundColor: `${currentSeason.colors.primary}15`,
                            borderColor: currentSeason.colors.primary
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-8 h-8" style={{ color: currentSeason.colors.primary }} />
                            <div>
                                <h3 className="text-lg font-black" style={{ color: currentSeason.colors.primary }}>
                                    Perayaan Aktif: {currentSeason.name}
                                </h3>
                                <p className="text-sm text-[#8B7E66]">
                                    Ornamen dan dekorasi sedang ditampilkan di seluruh website
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Celebration Toggle Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allCelebrations.map((seasonType) => {
                        const theme = SEASONAL_THEMES[seasonType];
                        const config = getConfig(seasonType);
                        const isEnabled = config?.isEnabled ?? true;
                        const isActive = currentSeason.type === seasonType;

                        return (
                            <motion.div
                                key={seasonType}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-6 rounded-[2rem] border-2 transition-all ${isActive
                                        ? 'border-amber-500 bg-amber-50 shadow-xl'
                                        : 'border-[#E5E1D8] bg-white hover:shadow-lg'
                                    }`}
                            >
                                {/* Color Preview */}
                                <div className="flex gap-2 mb-4">
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                    <div
                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: theme.colors.secondary }}
                                    />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black text-[#2D3A2D] mb-1">
                                    {theme.name}
                                </h3>
                                <p className="text-xs text-[#8B7E66] mb-4">
                                    Icon: {theme.iconTheme}
                                </p>

                                {/* Toggle Switch */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#8B7E66]">
                                        {isEnabled ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    <button
                                        onClick={() => toggleCelebration(seasonType, isEnabled)}
                                        disabled={saving === seasonType}
                                        className={`relative w-14 h-7 rounded-full transition-all ${isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                                            } ${saving === seasonType ? 'opacity-50' : ''}`}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                            animate={{ left: isEnabled ? '30px' : '4px' }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>

                                {/* Active Badge */}
                                {isActive && (
                                    <div className="mt-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full inline-block">
                                        Sedang Aktif
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Info Box */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-[2rem]">
                    <h4 className="text-sm font-black text-blue-900 mb-2">ℹ️ Informasi</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Perayaan akan otomatis aktif sesuai tanggal yang sudah dikonfigurasi</li>
                        <li>• Anda bisa menonaktifkan perayaan tertentu dengan toggle di atas</li>
                        <li>• Perubahan akan langsung terlihat di seluruh website</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
