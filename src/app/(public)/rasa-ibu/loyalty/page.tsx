'use client';

import React, { useState } from 'react';
import { getMemberInfoAction, updateMemberBirthdayAction } from '@/lib/actions/commerce/loyalty';
import { getPublicBrandConfigAction } from '@/lib/actions/rasa-ibu/intelligence';
import { Coins, Loader2, Sparkles, Trophy, Wallet, ArrowLeft, CheckCircle2, Cake, ArrowRight, Star, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function PublicLoyaltyPage() {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmittingBirthday, setIsSubmittingBirthday] = useState(false);
    const [memberData, setMemberData] = useState<any>(null);
    const [brandConfig, setBrandConfig] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [birthday, setBirthday] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    React.useEffect(() => {
        async function loadConfig() {
            const res = await getPublicBrandConfigAction('rasa-ibu');
            if (res.success) {
                setBrandConfig(res.data);
            }
        }
        loadConfig();
    }, []);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return;

        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);
        setMemberData(null);

        try {
            const res = await getMemberInfoAction('rasa-ibu', phone);
            if (res.success) {
                setMemberData(res.data);
            } else {
                setError(res.error || 'Gagal memeriksa poin.');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBirthdaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!birthday || !memberData) return;

        setIsSubmittingBirthday(true);
        try {
            const res = await updateMemberBirthdayAction('rasa-ibu', phone, birthday, memberData.customerName);
            if (res.success) {
                setMemberData({ ...memberData, birthday: new Date(birthday) });
                setSuccessMessage('Tanggal lahir berhasil disimpan! 🎉');
            } else {
                setError(res.error || 'Gagal menyimpan tanggal lahir.');
            }
        } catch (err) {
            setError('Gagal menyimpan data.');
        } finally {
            setIsSubmittingBirthday(false);
        }
    };

    const pointMultiplier = brandConfig?.loyalty?.pointValueInRupiah || 100;
    const rupiahValue = memberData ? (memberData.availablePoints || 0) * pointMultiplier : 0;

    // Tier Progress Logic
    const tierThresholds = {
        BRONZE: 0,
        SILVER: 1000000,
        GOLD: 5000000,
        PLATINUM: 10000000
    };

    const currentSpent = Number(memberData?.totalSpent || 0);
    const currentTier = memberData?.tier || 'BRONZE';

    let nextTier = 'SILVER';
    let nextThreshold = tierThresholds.SILVER;

    if (currentTier === 'SILVER') { nextTier = 'GOLD'; nextThreshold = tierThresholds.GOLD; }
    else if (currentTier === 'GOLD') { nextTier = 'PLATINUM'; nextThreshold = tierThresholds.PLATINUM; }
    else if (currentTier === 'PLATINUM') { nextTier = 'MAX'; nextThreshold = currentSpent; }

    const progress = Math.min(100, (currentSpent / nextThreshold) * 100);
    const remaining = nextThreshold - currentSpent;

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header / Nav */}
            <div className="max-w-4xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
                <Link href="/rasa-ibu" className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center group-hover:bg-[#2D3A2D] group-hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Kembali ke Beranda</span>
                </Link>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Loyalty Program</span>
                    <h1 className="text-xl font-black text-[#2D3A2D]">Cek Poin Rasa Ibu</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Search & Profile */}
                    <div className="lg:col-span-12">
                        <div className="bg-white border border-[#E5E1D8] rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                <Sparkles className="w-32 h-32 text-[#2D3A2D]" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-[#2D3A2D] leading-tight mb-2">Halo Bunda! ✨</h2>
                                <p className="text-sm text-[#8B7E66] mb-8 leading-relaxed">
                                    Masukkan nomor WhatsApp Bunda untuk melihat saldo poin dan keuntungan membership.
                                </p>

                                <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Contoh: 08123456789"
                                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl px-6 py-4 text-lg font-bold placeholder:text-[#B2BCA2] focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !phone}
                                        className="px-10 py-4 bg-[#2D3A2D] text-[#FDFBF7] text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#3d4d3d] disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-950/20"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                        Cek Sekarang
                                    </button>
                                </form>

                                {error && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                                        <div className="text-red-500 font-bold text-sm">⚠️</div>
                                        <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                                        <div className="text-emerald-500 font-bold text-sm">✅</div>
                                        <p className="text-xs text-emerald-700 font-bold leading-relaxed">{successMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {memberData && (
                        <>
                            {/* Middle: Stats & Progress */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Main Point Card */}
                                <div className="bg-[#2D3A2D] text-[#FDFBF7] p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                                        <Trophy className="w-40 h-40" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">Saldo Poin Saat Ini</span>
                                            <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                Tier: {memberData.tier || 'BRONZE'}
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-3 mb-4">
                                            <span className="text-6xl font-black tabular-nums">{(memberData.availablePoints || 0).toLocaleString()}</span>
                                            <span className="text-sm font-bold opacity-60 uppercase tracking-widest">Poin</span>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm inline-block">
                                            <p className="text-xs font-bold opacity-90">Setara Nilai Belanja: <span className="text-xl ml-2 tracking-tight">Rp {rupiahValue.toLocaleString('id-ID')}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tier Progress Card */}
                                <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2.5rem] shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-[#2D3A2D]">Progres Tier Bunda</h3>
                                        <span className="text-[10px] font-black uppercase text-[#8B7E66]">{progress.toFixed(0)}%</span>
                                    </div>

                                    <div className="w-full h-4 bg-[#FDFBF7] border border-[#E5E1D8] rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {nextTier !== 'MAX' ? (
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold text-[#8B7E66]">
                                                Butuh <span className="text-[#2D3A2D]">Rp {remaining.toLocaleString()}</span> lagi untuk jadi <span className="text-emerald-600 font-black uppercase tracking-tighter">{nextTier}</span>
                                            </p>
                                            <ArrowRight className="w-4 h-4 text-[#B2BCA2]" />
                                        </div>
                                    ) : (
                                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Bunda sudah berada di Tier Tertinggi! 🎉</p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Birthday & Quick Tasks */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Birthday Collection */}
                                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                                        <Cake className="w-24 h-24 text-amber-900" />
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black text-amber-900 mb-2">🎁 Double Point Birthday</h3>
                                        {!memberData.birthday ? (
                                            <>
                                                <p className="text-[11px] text-amber-800 leading-relaxed mb-6 font-medium">
                                                    Dapatkan 2x Poin di setiap transaksi <strong className="text-amber-600">tepat di hari ulang tahun Bunda</strong>! Lengkapilah tanggal lahir Bunda:
                                                </p>
                                                <form onSubmit={handleBirthdaySubmit} className="space-y-3">
                                                    <input
                                                        type="date"
                                                        value={birthday}
                                                        onChange={(e) => setBirthday(e.target.value)}
                                                        disabled={!!memberData?.birthday}
                                                        className="w-full bg-white/50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmittingBirthday || !birthday}
                                                        className="w-full py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {isSubmittingBirthday ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                        Simpan & Aktifkan Bonus
                                                    </button>
                                                </form>
                                            </>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Check if today is birthday */}
                                                {(new Date().getDate() === new Date(memberData.birthday).getDate() &&
                                                    new Date().getMonth() === new Date(memberData.birthday).getMonth()) ? (
                                                    <div className="p-5 bg-[#2D3A2D] text-white rounded-3xl border-2 border-amber-400 animate-pulse">
                                                        <h4 className="text-sm font-black uppercase tracking-widest mb-1 text-amber-400">Selamat Ulang Tahun Bunda! 🎂</h4>
                                                        <p className="text-[10px] font-medium opacity-90">Bonus 2x Poin aktif otomatis untuk seluruh pesanan hari ini!</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-white/40 border border-amber-200 rounded-2xl flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center">
                                                            <Star className="w-5 h-5 fill-current" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-amber-900">Bonus Terdaftar!</p>
                                                            <p className="text-xs font-bold text-amber-800">Ulang Tahun: {new Date(memberData.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-amber-800/60 font-bold uppercase tracking-tighter text-center italic">
                                                    *Bonus 2x Poin hanya berlaku di hari H sesuai tanggal di atas.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Global Wallet Note - Hidden as per brand-specific requirement */}
                                {/* 
                                <div className="bg-white border border-[#E5E1D8] p-6 rounded-[2rem] flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center flex-shrink-0">
                                        <Wallet className="w-4 h-4 text-[#2D3A2D]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] mb-1">Global Wallet</p>
                                        <p className="text-[11px] text-[#8B7E66] leading-relaxed">Poin Bunda juga terekam secara global di jaringan Achiera. Bunda dapat {(memberData.globalPoints || 0).toLocaleString()} poin tambahan lintas brand.</p>
                                    </div>
                                </div>
                                */}
                            </div>
                        </>
                    )}

                    {/* Full Width: Education Section */}
                    {/* Global Benefits - Grid Layout (Moved to Top) */}
                    <div className="lg:col-span-12 mt-12 mb-12">
                        <div className="text-center mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] bg-[#FDFBF7] px-4">Member Benefits</span>
                            <h3 className="text-2xl font-black text-[#2D3A2D] mt-2">Keuntungan Spesial</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Benefit 1 */}
                            <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2rem] hover:shadow-lg transition-all group text-center hover:-translate-y-1 duration-300">
                                <div className="w-16 h-16 bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:bg-[#2D3A2D] group-hover:text-white transition-all duration-300">
                                    <Coins className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-[#2D3A2D] text-lg uppercase tracking-tight mb-3">Konversi Poin Mudah</h3>
                                <p className="text-sm text-[#8B7E66] leading-relaxed font-medium">
                                    Setiap Rp 10.000 belanja dapat 1 poin. 1 poin bernilai <strong className="text-[#2D3A2D]">Rp {pointMultiplier}</strong> diskon belanja.
                                </p>
                            </div>

                            {/* Benefit 2 */}
                            <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2rem] hover:shadow-lg transition-all group text-center hover:-translate-y-1 duration-300">
                                <div className="w-16 h-16 bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-[#2D3A2D] text-lg uppercase tracking-tight mb-3">Double Point Birthday</h3>
                                <p className="text-sm text-[#8B7E66] leading-relaxed font-medium">
                                    Rayakan ulang tahun Bunda dengan <strong className="text-pink-600">2x poin</strong> untuk semua pesanan selama bulan kelahiran.
                                </p>
                            </div>

                            {/* Benefit 3 */}
                            <div className="bg-white border border-[#E5E1D8] p-8 rounded-[2rem] hover:shadow-lg transition-all group text-center hover:-translate-y-1 duration-300">
                                <div className="w-16 h-16 bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                    <Wallet className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-[#2D3A2D] text-lg uppercase tracking-tight mb-3">Bebas Tukar Kapan Saja</h3>
                                <p className="text-sm text-[#8B7E66] leading-relaxed font-medium">
                                    Tidak ada batas minimum penukaran. Bunda bisa potong saldo poin berapapun di setiap transaksi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Education Section */}
                    <div className="lg:col-span-12 mt-20 pt-20 border-t border-[#E5E1D8] space-y-16">
                        <div className="text-center space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] border-b-2 border-[#E5E1D8] pb-2">Level Up Your Rewards</span>
                            <h2 className="text-3xl font-black text-[#2D3A2D]">Cara Naik Tier Member</h2>
                            <p className="text-sm text-[#8B7E66] max-w-xl mx-auto leading-relaxed">
                                Keanggotaan Bunda dihitung berdasarkan total belanja bersih (Lifetime Spend). Makin tinggi levelnya, makin besar bonus poin di tiap pesanan!
                            </p>
                        </div>

                        {/* Tier Comparison Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {(brandConfig?.loyaltyTiers || [
                                { name: 'BRONZE', spend: 'Member Baru', multiplier: '1.0x Poin', perk: 'Standard Rewards', color: 'bg-[#FDFBF7] text-[#8B7E66] border-[#E5E1D8]' },
                                { name: 'SILVER', spend: 'Rp 1 Juta', multiplier: '1.25x Poin', perk: 'Extra 25% Points', color: 'bg-white text-slate-700 border-[#E5E1D8] shadow-sm' },
                                { name: 'GOLD', spend: 'Rp 5 Juta', multiplier: '1.5x Poin', perk: 'Extra 50% Points', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' },
                                { name: 'PLATINUM', spend: 'Rp 10 Juta', multiplier: '2.0x Poin', perk: 'Double Every Point!', color: 'bg-[#2D3A2D] text-[#FDFBF7] border-transparent shadow-xl' }
                            ]).map((tier: any, i: number) => (
                                <div key={i} className={`p-8 rounded-[2.5rem] border ${tier.color || 'bg-white'} flex flex-col justify-between min-h-[280px] hover:-translate-y-2 transition-transform duration-500`}>
                                    <div className={tier.name === 'PLATINUM' ? 'text-white' : ''}>
                                        <div className="inline-flex items-center gap-2 mb-6">
                                            <div className="w-2 h-2 rounded-full bg-current" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tier.name}</span>
                                        </div>
                                        <h4 className="text-2xl font-black mb-1">{tier.spend}</h4>
                                        <p className="text-[10px] font-black uppercase opacity-60">Minimal Belanja</p>
                                    </div>
                                    <div className={`pt-6 border-t ${tier.name === 'PLATINUM' ? 'border-white/20 text-white' : 'border-current/10'}`}>
                                        <p className="text-lg font-black mb-1">{tier.multiplier}</p>
                                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-70">{tier.perk}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* How it works grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
                            {(brandConfig?.loyaltySteps || [
                                { step: '01', title: 'Belanja Enak', desc: 'Setiap pesanan yang lunas akan otomatis menambah poin dan progress tier Bunda secara real-time.' },
                                { step: '02', title: 'Kumpulkan Poin', desc: `Gunakan poin untuk potongan diskon di pesanan berikutnya. 1 Poin setara Rp ${pointMultiplier} diskon belanja.` },
                                { step: '03', title: 'Nikmati Benefit', desc: 'Makin tinggi tier, makin cepat poin terkumpul. Nikmati juga bonus 2x poin di bulan ulang tahun Bunda!' }
                            ]).map((step: any, i: number) => (
                                <div key={i} className="space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center text-xl font-black text-[#2D3A2D]">{step.step}</div>
                                    <h5 className="font-black text-[#2D3A2D] uppercase text-xs tracking-widest">{step.title}</h5>
                                    <p className="text-xs text-[#8B7E66] leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>

                {/* Footer Section */}
                <div className="mt-20 pt-10 border-t border-[#E5E1D8] text-center space-y-6">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-8 py-3 bg-white border border-[#E5E1D8] rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#2D3A2D] hover:text-white transition-all shadow-sm"
                    >
                        Kembali ke Atas
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B2BCA2]">
                        © 2026 Achiera Rasa Ibu — Transparansi Penuh untuk Member Setia.
                    </p>
                </div>
            </main>
        </div>
    );
}
