'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Email atau password tidak valid. Silakan coba lagi.');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#2D3A2D]">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-amber-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Login Card Container */}
            <div className="w-full max-w-lg px-6 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="backdrop-blur-2xl bg-white/5 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="p-10 md:p-14">
                        {/* Header Section */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-3xl shadow-xl shadow-amber-600/20 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <ShieldCheck className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-3">
                                Achiera <span className="text-amber-500">OS</span>
                            </h1>
                            <p className="text-stone-400 text-sm font-medium tracking-wide">
                                Hub Manajemen Operasional & Inventaris
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200 text-sm animate-in slide-in-from-top-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70 ml-2">Identitas Admin</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-stone-500 group-focus-within:text-amber-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-stone-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="admin@achiera.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70">Kunci Akses</label>
                                    <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 hover:text-white transition-colors">Lupa?</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-stone-500 group-focus-within:text-amber-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-stone-600 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full relative h-[72px] bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-[1px] shadow-2xl shadow-amber-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <div className="h-full w-full bg-amber-600 rounded-[15px] flex items-center justify-center gap-3 transition-colors group-hover:bg-amber-500">
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <span className="text-white font-black uppercase tracking-widest text-sm">Masuk Sistem</span>
                                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>

                        {/* Footer Info */}
                        <div className="mt-12 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600">
                                Keamanan Terenkripsi &bull; Achiera Platform v2.5
                            </p>
                        </div>
                    </div>
                </div>

                {/* Secondary Background Hint */}
                <div className="mt-8 flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-stone-500/40">
                    <span>Infrastruktur Global</span>
                    <span>Protokol TLS 1.3</span>
                    <span>Audit Berlapis</span>
                </div>
            </div>
        </div>
    );
}
