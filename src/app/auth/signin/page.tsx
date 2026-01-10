'use client';

import React, { useState } from 'react';
import Link from 'next/navigation'; // Using next/navigation but keeping Link as name for simplicity, actually it should be next/link
import LinkNext from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, Heart, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-[700px] flex items-center justify-center bg-[#FDFBF7] rounded-[3rem] border border-[#E5E1D8]">
                <Loader2 className="w-10 h-10 animate-spin text-[#2D3A2D]" />
            </div>
        }>
            <SignInContent />
        </React.Suspense>
    );
}

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/rasa-ibu/profile';
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [email, setEmail] = useState('');
    const [timer, setTimer] = useState(0);

    // Timer Effect
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async () => {
        if (!email) {
            setError('Masukkan email Anda.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'OTP_LOGIN' })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                setTimer(60);
            } else {
                setError(data.error || 'Gagal mengirim OTP.');
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length !== 6) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode, type: 'OTP_LOGIN' })
            });
            const data = await res.json();
            if (data.success) {
                const result = await signIn('credentials', {
                    redirect: false,
                    email,
                    otpToken: data.token,
                });

                if (result?.error) {
                    setError('Gagal masuk setelah verifikasi.');
                } else {
                    router.push(callbackUrl);
                    router.refresh();
                }
            } else {
                setError(data.message || 'OTP tidak valid.');
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            setError('Terjadi kesalahan verifikasi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loginMethod === 'OTP') return;

        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const loginEmail = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: loginEmail,
                password,
            });

            if (res?.error) {
                console.error('[LOGIN] Error:', res.error);
                setError('Email atau password salah.');
                setLoading(false);
            } else if (res?.ok) {
                router.push(callbackUrl);
                router.refresh();
            } else {
                setError('Terjadi kesalahan saat login.');
                setLoading(false);
            }
        } catch (err) {
            console.error('[LOGIN] Exception:', err);
            setError('Terjadi kesalahan jaringan.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[700px] flex flex-col md:flex-row bg-[#FDFBF7] rounded-[3rem] overflow-hidden shadow-2xl border border-[#E5E1D8]">
            {/* Left side: Brand Message (Desktop Only) */}
            <div className="hidden md:flex md:w-1/2 bg-[#2D3A2D] p-16 flex-col justify-between relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B2BCA2]/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B7E66]/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <LinkNext href="/rasa-ibu">
                        <img src="/images/brand/logo.png" alt="Rasa Ibu" className="h-16 w-auto brightness-0 invert mb-20" />
                    </LinkNext>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-xs">Kembali ke Kehangatan</span>
                            <h1 className="text-5xl font-black text-white leading-tight font-serif italic mt-4">
                                Kejujuran <br /> Dari Dapur Ibu.
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-[#FDFBF7]/70 text-lg max-w-sm leading-relaxed"
                        >
                            Setiap hidangan disiapkan dengan bahan segar pilihan, tanpa pengawet, dan penuh kasih sayang.
                        </motion.p>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
                    <div>
                        <div className="flex gap-1 mb-2">
                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-white text-sm font-bold">100% Alami</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Tanpa Pengawet</p>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                            <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                        <p className="text-white text-sm font-bold">Resep Asli Ibu</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Kasih Sayang Tulus</p>
                    </div>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white">
                <div className="max-w-md mx-auto w-full">
                    {/* Mobile Logo */}
                    <div className="md:hidden flex justify-center mb-12">
                        <img src="/images/brand/logo.png" alt="Rasa Ibu" className="h-12 w-auto" />
                    </div>

                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-[#2D3A2D] font-serif">Masuk Akun</h2>
                        <p className="text-[#8B7E66] mt-3 font-medium">Selamat datang kembali di Dapur Rasa Ibu.</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 font-bold text-center border border-red-100"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Method Toggle */}
                    <div className="flex bg-[#F9F7F2] p-1.5 rounded-2xl mb-8 border border-[#E5E1D8]/50">
                        <button
                            onClick={() => { setLoginMethod('PASSWORD'); setError(''); }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'PASSWORD' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Password
                        </button>
                        <button
                            onClick={() => { setLoginMethod('OTP'); setError(''); }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'OTP' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Email OTP
                        </button>
                    </div>

                    {loginMethod === 'PASSWORD' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-[#2D3A2D] ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                        placeholder="email@contoh.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Password</label>
                                    <LinkNext href="/auth/forgot-password" title="Atur ulang password" className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest hover:text-[#2D3A2D] transition-colors">Lupa?</LinkNext>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                        placeholder="********"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-5 bg-[#2D3A2D] hover:bg-[#1A241A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(45,58,45,0.2)] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Masuk Sekarang</span>}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {!otpSent ? (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-[#2D3A2D] ml-1">Email Akun</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                            <input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                type="email"
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                                placeholder="email@contoh.com"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">Kami akan mengirimkan kode verifikasi 6-digit.</p>
                                    </div>
                                    <button
                                        onClick={handleSendOTP}
                                        disabled={loading || !email}
                                        className="w-full py-5 bg-[#8B7E66] hover:bg-[#6D6351] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Kirim Kode OTP</span>}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black uppercase tracking-widest text-[#2D3A2D] text-center">Masukkan Kode Verifikasi</label>
                                        <input
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.trim().replace(/\D/g, '').slice(0, 6))}
                                            className="w-full text-center text-3xl font-black py-5 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white tracking-[0.5em] outline-none text-[#2D3A2D]"
                                            placeholder="000000"
                                            maxLength={6}
                                        />
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] text-gray-400">
                                                Kode terkirim ke <span className="font-bold text-[#2D3A2D]">{email}</span>.
                                                <button onClick={() => setOtpSent(false)} className="ml-2 text-[#8B7E66] hover:underline font-bold">Ubah?</button>
                                            </p>
                                            <div className="h-6 flex items-center justify-center">
                                                {timer > 0 ? (
                                                    <p className="text-[10px] text-gray-400 italic">Kirim ulang dalam {timer} detik</p>
                                                ) : (
                                                    <button
                                                        onClick={handleSendOTP}
                                                        disabled={loading}
                                                        className="text-[10px] font-black text-[#8B7E66] hover:text-[#2D3A2D] uppercase tracking-widest"
                                                    >
                                                        Kirim Ulang OTP
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otpCode.length !== 6}
                                        className="w-full py-5 bg-[#2D3A2D] hover:bg-[#1A241A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verifikasi & Masuk</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-[#E5E1D8]/50 text-center">
                        <p className="text-sm text-gray-500">
                            Belum memiliki akun? {' '}
                            <LinkNext href="/auth/register" className="font-black text-[#8B7E66] hover:text-[#2D3A2D] transition-colors uppercase text-xs tracking-widest">
                                Daftar Sekarang
                            </LinkNext>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

