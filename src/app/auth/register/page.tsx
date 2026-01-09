'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, Heart, Utensils, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'DATA' | 'OTP'>('DATA');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [otpCode, setOtpCode] = useState('');

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: 'OTP_REGISTER' })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStep('OTP');
                setResendCooldown(60);
            } else {
                setError(data.error || 'Gagal mengirim kode OTP.');
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    code: otpCode,
                    type: 'OTP_REGISTER',
                    newPassword: formData.password,
                    name: formData.name
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Get callbackUrl if present
                const params = new URLSearchParams(window.location.search);
                const callbackUrl = params.get('callbackUrl');

                if (callbackUrl) {
                    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&registered=true`);
                } else {
                    router.push('/auth/signin?registered=true');
                }
            } else {
                setError(data.error || 'Kode OTP tidak valid.');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memverifikasi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: 'OTP_REGISTER' })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setResendCooldown(60);
            } else {
                setError(data.error || 'Gagal mengirim ulang kode OTP.');
            }
        } catch (err) {
            setError('Gagal menghubungi server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[700px] flex flex-col md:flex-row bg-[#FDFBF7] rounded-[3rem] overflow-hidden shadow-2xl border border-[#E5E1D8]">
            {/* Left side: Brand Message (Desktop Only) */}
            <div className="hidden md:flex md:w-1/2 bg-[#2D3A2D] p-16 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B2BCA2]/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B7E66]/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <Link href="/rasa-ibu">
                        <img src="/images/brand/logo.png" alt="Rasa Ibu" className="h-16 w-auto brightness-0 invert mb-20" />
                    </Link>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-amber-500 font-black uppercase tracking-[0.4em] text-xs">Awal Baru Kehangatan</span>
                            <h1 className="text-5xl font-black text-white leading-tight font-serif italic mt-4">
                                {step === 'DATA' ? 'Bergabunglah Bersama Kami.' : 'Verifikasi Akun Anda.'}
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-[#FDFBF7]/70 text-lg max-w-sm leading-relaxed"
                        >
                            {step === 'DATA'
                                ? 'Dapatkan akses ke menu harian Ibu, program loyalitas, dan penawaran spesial untuk keluarga tercinta.'
                                : `Kami telah mengirimkan kode 6-digit ke email ${formData.email}. Masukkan kode tersebut untuk melanjutkan.`
                            }
                        </motion.p>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
                    <div>
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                            <Utensils className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-white text-sm font-bold">Variasi Menu</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Selalu Segar Setiap Hari</p>
                    </div>
                    <div>
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                            <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                        <p className="text-white text-sm font-bold">Resep Warisan</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">100% Bahan Alami</p>
                    </div>
                </div>
            </div>

            {/* Right side: Register Form */}
            <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white">
                <div className="max-w-md mx-auto w-full overflow-hidden">
                    {/* Mobile Logo */}
                    <div className="md:hidden flex justify-center mb-12">
                        <img src="/images/brand/logo.png" alt="Rasa Ibu" className="h-12 w-auto" />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'DATA' ? (
                            <motion.div
                                key="data-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="mb-10 text-center md:text-left">
                                    <h2 className="text-3xl font-black text-[#2D3A2D] font-serif">Ayo Bergabung</h2>
                                    <p className="text-[#8B7E66] mt-3 font-medium text-sm">Lengkapi data Anda untuk mulai menikmati kehangatan.</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] ml-1">Nama Lengkap</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                                placeholder="Nama Bunda"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] ml-1">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                                placeholder="bunda@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D3A2D] transition-colors" />
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white transition-all outline-none font-medium text-[#2D3A2D]"
                                                placeholder="********"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={loading}
                                        className="w-full py-5 bg-[#8B7E66] hover:bg-[#6D6351] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-[0_20px_40px_rgba(139,126,102,0.2)] disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lanjut ke Verifikasi <ArrowRight className="w-4 h-4" /></span>}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="mb-6 text-center md:text-left">
                                    <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                        <ShieldCheck className="w-8 h-8 text-amber-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-[#2D3A2D] font-serif">Verifikasi Email</h2>
                                    <p className="text-[#8B7E66] mt-3 font-medium text-sm leading-relaxed">
                                        Masukkan kode 6 digit yang kami kirimkan ke <strong>{formData.email}</strong>
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold text-center border border-rose-100">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleVerifyAndRegister} className="space-y-8">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#F9F7F2] border border-[#E5E1D8] text-4xl font-black tracking-[1em] text-center py-6 rounded-3xl focus:ring-2 focus:ring-[#2D3A2D] focus:bg-white outline-none transition-all placeholder:text-gray-200"
                                            placeholder="000000"
                                        />
                                    </div>

                                    <button
                                        disabled={loading || otpCode.length < 6}
                                        className="w-full py-5 bg-[#2D3A2D] hover:bg-[#1A231A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Daftar Sekarang</span>}
                                    </button>

                                    <div className="flex flex-col items-center gap-4 pt-4">
                                        <button
                                            type="button"
                                            disabled={loading || resendCooldown > 0}
                                            onClick={handleResendOTP}
                                            className="text-xs font-bold text-[#8B7E66] hover:text-[#2D3A2D] flex items-center gap-2 disabled:opacity-40 transition-colors"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                            {resendCooldown > 0 ? `Kirim ulang dlm ${resendCooldown}s` : 'Kirim Ulang Kode'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep('DATA')}
                                            className="text-xs font-black text-[#2D3A2D] uppercase tracking-widest hover:underline"
                                        >
                                            Ganti Email
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {step === 'DATA' && (
                        <div className="mt-12 pt-8 border-t border-[#E5E1D8]/50 text-center">
                            <p className="text-sm text-gray-500 font-medium">
                                Sudah memiliki akun? {' '}
                                <Link href="/auth/signin" className="font-black text-[#2D3A2D] hover:text-[#8B7E66] transition-colors uppercase text-[10px] tracking-widest">
                                    Masuk di Sini
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

