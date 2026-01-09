'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'NEW_PASSWORD'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'OTP_FORGOT_PASSWORD' })
            });
            const data = await res.json();
            if (data.success) {
                setStep('OTP');
            } else {
                setError(data.message || data.error || 'Gagal mengirim kode OTP.');
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode, type: 'OTP_FORGOT_PASSWORD' })
            });
            const data = await res.json();
            if (data.success) {
                setToken(data.token);
                setStep('NEW_PASSWORD');
            } else {
                setError(data.message || data.error || 'Kode OTP tidak valid.');
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            setError('Terjadi kesalahan verifikasi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Password berhasil diperbarui! Silakan masuk kembali.');
                setTimeout(() => router.push('/auth/signin'), 3000);
            } else {
                setError(data.error || 'Gagal memperbarui password.');
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-[#E5E1D8]">
            <Link href="/auth/signin" className="inline-flex items-center text-xs text-gray-500 hover:text-[#2D3A2D] mb-6 gap-1 group">
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Kembali ke Login
            </Link>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#2D3A2D] font-serif">Lupa Password</h2>
                <p className="text-[#8B7E66] mt-2">
                    {step === 'EMAIL' && "Masukkan email akun Anda untuk menerima kode verifikasi."}
                    {step === 'OTP' && "Masukkan 6-digit kode yang kami kirim ke email Anda."}
                    {step === 'NEW_PASSWORD' && "Buat password baru yang aman untuk akun Anda."}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-bold text-center">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 font-bold text-center">
                    {success}
                </div>
            )}

            {step === 'EMAIL' && (
                <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                placeholder="email@contoh.com"
                            />
                        </div>
                    </div>
                    <button
                        disabled={loading || !email}
                        className="w-full py-4 bg-[#2D3A2D] hover:bg-[#1f281f] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Kirim Kode Verifikasi
                    </button>
                </form>
            )}

            {step === 'OTP' && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#2D3A2D] mb-2 text-center">Kode 6-Digit</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.trim().replace(/\D/g, '').slice(0, 6))}
                            className="w-full text-center text-2xl font-black py-4 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2] tracking-[0.5em]"
                            placeholder="000000"
                        />
                    </div>
                    <button
                        disabled={loading || otpCode.length !== 6}
                        className="w-full py-4 bg-[#2D3A2D] hover:bg-[#1f281f] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Verifikasi Kode
                    </button>
                    <p className="text-center text-xs text-gray-500">
                        Tidak menerima kode? <button type="button" onClick={handleSendOTP} className="text-[#BD302D] font-bold hover:underline">Kirim Ulang</button>
                    </p>
                </form>
            )}

            {step === 'NEW_PASSWORD' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Password Baru</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                placeholder="********"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Konfirmasi Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                placeholder="********"
                            />
                        </div>
                    </div>
                    <button
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full py-4 bg-[#BD302D] hover:bg-[#a32826] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Simpan Password Baru
                    </button>
                </form>
            )}
        </div>
    );
}
