'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, Mail, Phone, MapPin, Lock, ShieldCheck, ArrowLeft, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProfileEditPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Profile data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [address, setAddress] = useState('');
    const [profileImage, setProfileImage] = useState('');

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // OTP for critical changes
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpToken, setOtpToken] = useState('');
    const [pendingChanges, setPendingChanges] = useState<any>(null);

    // Photo upload
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/rasa-ibu/profile/edit');
        } else if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.success) {
                setName(data.data.name || '');
                setEmail(data.data.email || '');
                setPhone(data.data.phone || '');
                setWhatsappNumber(data.data.whatsappNumber || '');
                setAddress(data.data.address || '');
                setProfileImage(data.data.profileImage || '');
            }
        } catch (err) {
            setError('Gagal memuat profil');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('Ukuran foto maksimal 2MB');
            return;
        }

        setUploadingPhoto(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setProfileImage(base64);

            // Auto-save profile image
            try {
                const res = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileImage: base64 })
                });
                const data = await res.json();
                if (data.success) {
                    setSuccess('Foto profil berhasil diperbarui!');
                    setTimeout(() => setSuccess(''), 3000);
                }
            } catch (err) {
                setError('Gagal menyimpan foto');
            } finally {
                setUploadingPhoto(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSendOTP = async () => {
        setOtpLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session?.user?.email, type: 'OTP_PROFILE_UPDATE' })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
            } else {
                setError(data.message || 'Gagal mengirim OTP');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat mengirim OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) return;
        setOtpLoading(true);
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session?.user?.email,
                    code: otpCode,
                    type: 'OTP_PROFILE_UPDATE'
                })
            });
            const data = await res.json();
            if (data.success) {
                setOtpToken(data.token);
                setShowOtpModal(false);
                // Now save with OTP token
                await saveProfileWithOTP(data.token);
            } else {
                setError(data.message || 'Kode OTP salah');
            }
        } catch (err) {
            setError('Terjadi kesalahan verifikasi');
        } finally {
            setOtpLoading(false);
        }
    };

    const saveProfileWithOTP = async (token: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...pendingChanges,
                    otpToken: token
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Profil berhasil diperbarui!');
                setShowPasswordSection(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPendingChanges(null);
                setTimeout(() => {
                    setSuccess('');
                    router.refresh();
                }, 2000);
            } else {
                setError(data.error || 'Gagal memperbarui profil');
            }
        } catch (err) {
            setError('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate password if changing
        if (showPasswordSection) {
            if (!currentPassword || !newPassword || !confirmPassword) {
                setError('Semua field password harus diisi');
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('Password baru tidak cocok');
                return;
            }
            if (newPassword.length < 6) {
                setError('Password minimal 6 karakter');
                return;
            }
        }

        const changes: any = {
            name,
            phone,
            whatsappNumber,
            address
        };

        if (showPasswordSection) {
            changes.currentPassword = currentPassword;
            changes.newPassword = newPassword;
        }

        // Check if critical changes require OTP
        const needsOTP = showPasswordSection;

        if (needsOTP) {
            setPendingChanges(changes);
            setShowOtpModal(true);
            handleSendOTP();
        } else {
            // Save directly
            setSaving(true);
            try {
                const res = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(changes)
                });
                const data = await res.json();
                if (data.success) {
                    setSuccess('Profil berhasil diperbarui!');
                    setTimeout(() => setSuccess(''), 3000);
                } else {
                    setError(data.error || 'Gagal memperbarui profil');
                }
            } catch (err) {
                setError('Terjadi kesalahan');
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B7E66]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/rasa-ibu/profile" className="inline-flex items-center text-xs text-gray-500 hover:text-[#2D3A2D] mb-6 gap-1 group">
                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                    Kembali ke Profil
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-[#E5E1D8] p-8">
                    <h1 className="text-3xl font-black text-[#2D3A2D] mb-2 font-serif">Edit Profil</h1>
                    <p className="text-sm text-[#8B7E66] mb-8">Perbarui informasi akun Anda</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-bold">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 font-bold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    {/* Profile Photo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-[#E5E1D8] flex items-center justify-center overflow-hidden">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl font-black text-[#8B7E66]">
                                        {name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#2D3A2D] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3d4d3d] transition-colors">
                                {uploadingPhoto ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5 text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={uploadingPhoto}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Klik ikon kamera untuk upload foto (Max 2MB)</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 border border-[#E5E1D8] text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-bold text-[#2D3A2D] mb-1">No. Telepon</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                    placeholder="0812XXXXXXXX"
                                />
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="mt-4">
                            <label className="block text-sm font-bold text-[#2D3A2D] mb-1">No. WhatsApp</label>
                            <div className="relative">
                                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                    placeholder="0812XXXXXXXX"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Alamat Lengkap</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                    placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan..."
                                />
                            </div>
                        </div>

                        {/* Password Change Section */}
                        <div className="pt-6 border-t border-[#E5E1D8]">
                            <button
                                type="button"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                                className="flex items-center gap-2 text-sm font-bold text-[#2D3A2D] hover:text-[#BD302D] transition-colors"
                            >
                                <Lock className="w-4 h-4" />
                                {showPasswordSection ? 'Batal Ubah Password' : 'Ubah Password'}
                            </button>

                            {showPasswordSection && (
                                <div className="mt-4 space-y-4 p-4 bg-[#F9F7F2] rounded-xl animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Password Saat Ini</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                            placeholder="********"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Password Baru</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                            placeholder="********"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#2D3A2D] mb-1">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2]"
                                            placeholder="********"
                                        />
                                    </div>
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        Perubahan password memerlukan verifikasi OTP
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-[#BD302D] hover:bg-[#a32826] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Perubahan
                        </button>
                    </form>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-in zoom-in duration-200">
                        <h3 className="text-xl font-black text-[#2D3A2D] mb-2">Verifikasi OTP</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Kode verifikasi telah dikirim ke email Anda
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.trim().replace(/\D/g, '').slice(0, 6))}
                            className="w-full text-center text-2xl font-black py-4 rounded-xl bg-[#F9F7F2] border border-[#E5E1D8] focus:ring-2 focus:ring-[#B2BCA2] tracking-[0.5em] mb-4"
                            placeholder="000000"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowOtpModal(false);
                                    setOtpCode('');
                                    setOtpSent(false);
                                }}
                                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otpCode.length !== 6 || otpLoading}
                                className="flex-1 py-3 bg-[#2D3A2D] text-white rounded-xl font-bold hover:bg-[#3d4d3d] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Verifikasi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
