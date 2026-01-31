'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrandAction } from '@/lib/actions/brands';
import { Building2, Rocket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BrandOnboardingFormProps {
    adminUserId: string;
}

export function BrandOnboardingForm({ adminUserId }: BrandOnboardingFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await createBrandAction({
                ...formData,
                adminUserId,
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/dashboard/owner`);
                }, 2000);
            } else {
                setError(result.error || 'Terjadi kesalahan saat membuat brand');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan sistem');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        setFormData({ name, slug });
    };

    if (success) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-emerald-100 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                    Brand <strong>{formData.name}</strong> telah berhasil dibuat. Anda akan dialihkan ke dashboard utama...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">Daftarkan Brand Baru</h1>
                        <p className="text-indigo-100 text-sm">Automasi onboarding untuk ekosistem Achiera</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 whitespace-nowrap">
                            Nama Brand
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Achiera Frozen Food"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                            value={formData.name}
                            onChange={handleNameChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 whitespace-nowrap">
                            Slug Brand (URL)
                        </label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                achiera.com/
                            </span>
                            <input
                                type="text"
                                required
                                placeholder="achiera-frozen"
                                className="w-full pl-[105px] pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                            * Slug akan digunakan sebagai link dashboard dan website brand Bunda.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-95 overflow-hidden"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <span>Daftarkan Sekarang</span>
                                <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full mt-4 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </form>
        </div>
    );
}
