'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { createSubscriptionAction } from '@/lib/actions/commerce/subscriptions';
import { CheckCircle, ShieldCheck, CreditCard, Loader2, ArrowRight, ArrowLeft, User, MapPin, Lock, Utensils, Package, Clock, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SubscribePageContent({ user, plans, initialData, isAuthenticated }: { user: any, plans: any[], initialData?: any, isAuthenticated: boolean }) {
    const router = useRouter();

    // Form Data State
    const [formData, setFormData] = useState({
        name: initialData?.name || user?.name || '',
        email: initialData?.email || user?.email || '',
        phone: initialData?.phone || user?.phone || '',
        address: initialData?.address || user?.address || '',
        customerNote: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER'>('BANK_TRANSFER');

    // OTP State
    const [otpCode, setOtpCode] = useState('');
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpType, setOtpType] = useState<'OTP_REGISTER' | 'OTP_LOGIN'>('OTP_REGISTER');

    // Check if customer data is complete
    const isCustomerDataComplete = formData.name && formData.phone && formData.address && formData.email;

    // Start with DATA step if customer data is incomplete, otherwise PLAN
    const [step, setStep] = useState<'DATA' | 'PLAN' | 'PRODUCTS' | 'DAYS'>(
        isCustomerDataComplete ? 'PLAN' : 'DATA'
    );

    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [selectedProducts, setSelectedProducts] = useState<{ variantId: string, quantity: number, note?: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedDays, setSelectedDays] = useState<{ day: string, timeSlot: string }[]>([]);
    const daysOfWeek = [
        { id: 'SUNDAY', label: 'Minggu' },
        { id: 'MONDAY', label: 'Senin' },
        { id: 'TUESDAY', label: 'Selasa' },
        { id: 'WEDNESDAY', label: 'Rabu' },
        { id: 'THURSDAY', label: 'Kamis' },
        { id: 'FRIDAY', label: 'Jumat' },
        { id: 'SATURDAY', label: 'Sabtu' },
    ];

    const timeSlots = [
        "06:00 - 08:00",
        "10:00 - 12:00",
        "13:00 - 15:00",
        "19:00 - 21:00"
    ];

    const toggleDay = (dayId: string) => {
        setSelectedDays(prev => {
            const exists = prev.find(d => d.day === dayId);
            if (exists) {
                return prev.filter(d => d.day !== dayId);
            } else {
                return [...prev, { day: dayId, timeSlot: timeSlots[0] }];
            }
        });
    };

    const updateTimeSlot = (dayId: string, timeSlot: string) => {
        setSelectedDays(prev => prev.map(d => d.day === dayId ? { ...d, timeSlot } : d));
    };

    // Handle authentication redirect manually if needed
    const handleAuthRedirect = (type: 'signin' | 'register') => {
        router.push(`/auth/${type}?callbackUrl=/rasa-ibu/subscribe`);
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            toast.error("Mohon masukkan email untuk verifikasi.");
            return;
        }
        setOtpLoading(true);
        try {
            const sendType = 'OTP_REGISTER';
            let res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: sendType })
            });
            let result = await res.json();

            // If already registered, try OTP_LOGIN
            if (!result.success && res.status === 409) {
                setOtpType('OTP_LOGIN');
                res = await fetch('/api/auth/otp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, type: 'OTP_LOGIN' })
                });
                result = await res.json();
            } else {
                setOtpType('OTP_REGISTER');
            }

            if (result.success) {
                setOtpSent(true);
                setShowOtpModal(true);
            } else {
                toast.error(result.message || "Gagal mengirim OTP.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengirim OTP.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length !== 6) return;
        setOtpLoading(true);
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    code: otpCode,
                    type: otpType,
                    name: formData.name
                })
            });
            const result = await res.json();
            if (result.success) {
                // Auto login after verification
                await signIn('credentials', {
                    redirect: false,
                    email: formData.email,
                    otpToken: result.token
                });

                setIsOtpVerified(true);
                setShowOtpModal(false);
                setStep('PLAN');
                router.refresh();
                toast.success("Email berhasil diverifikasi!");
            } else {
                toast.error(result.message || result.error || "Kode OTP salah.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat verifikasi OTP.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple Validation
        if (!formData.name || !formData.phone || !formData.address || !formData.email) {
            toast.error("Mohon lengkapi semua data pengiriman.");
            return;
        }

        if (!isAuthenticated && !isOtpVerified) {
            handleSendOTP();
            return;
        }

        setStep('PLAN');
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) return;
        if (!selectedPlan) return;

        setLoading(true);

        const data = {
            userId: user?.id || user?.uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            customerNote: formData.customerNote || undefined,
            interval: selectedPlan.interval,
            deliveryDays: (selectedPlan.interval === 'WEEKLY' || selectedPlan.isScheduleFlexible) ? selectedDays : undefined,
            planId: selectedPlan.id,
            selectedProducts: selectedProducts.length > 0 ? selectedProducts : undefined,
            paymentMethod: paymentMethod
        };

        const res = await createSubscriptionAction(data as any);

        if (res.success) {
            toast.success(`Berhasil! Langganan ${selectedPlan.name} Anda kini aktif.`);
            router.push('/rasa-ibu/profile?tab=subscription');
        } else {
            toast.error("Gagal: " + res.error);
            setLoading(false);
        }
    };

    // Progress Bar Component
    const StepsHeader = () => {
        const showSchedule = selectedPlan?.isScheduleFlexible;
        const showProducts = selectedPlan?.planProducts?.length > 0;

        const allSteps = [
            { id: 'DATA', label: 'Tujuan Antar', icon: MapPin },
            { id: 'PLAN', label: 'Pilih Menu', icon: Utensils },
            ...(showProducts ? [{ id: 'PRODUCTS' as const, label: 'Isi Sajian', icon: Package }] : []),
            ...(showSchedule ? [{ id: 'DAYS' as const, label: 'Jadwal Ibu', icon: Clock }] : []),
        ];

        return (
            <div className="flex items-center justify-center mb-16 gap-4">
                {allSteps.map((s, idx) => {
                    const isActive = step === s.id;
                    const isDone = allSteps.findIndex(x => x.id === step) > idx;

                    return (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-3 relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 scale-110 ${isActive ? 'border-[#2D3A2D] bg-[#2D3A2D] text-white shadow-xl rotate-[360deg]' : isDone ? 'border-[#B2BCA2] bg-[#B2BCA2] text-white' : 'border-[#E5E1D8] bg-white text-gray-400'}`}>
                                    {isDone ? <CheckCircle className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] absolute -bottom-8 whitespace-nowrap ${isActive ? 'text-[#2D3A2D]' : 'text-[#8B7E66]/40'}`}>{s.label}</span>
                            </div>
                            {idx < allSteps.length - 1 && (
                                <div className={`w-12 h-[2px] rounded-full transition-all duration-700 ${isDone ? 'bg-[#B2BCA2]' : 'bg-[#E5E1D8]'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20">
            <div className="max-w-6xl mx-auto px-6">
                <header className="mb-10 text-center">
                    <h1 className="text-5xl font-black text-[#2D3A2D] mb-4 font-serif italic">Mulai Tradisi Baru</h1>
                    <p className="text-[#8B7E66] font-medium max-w-lg mx-auto">Sajikan kasih sayang di meja makan setiap hari dengan paket katering pilihan Ibu.</p>
                </header>

                <StepsHeader />

                <AnimatePresence mode="wait">
                    {step === 'DATA' ? (
                        <motion.div
                            key="step-data"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-xl mx-auto"
                        >
                            <div className="bg-white p-10 rounded-[3rem] shadow-[0_30px_80px_rgba(45,58,45,0.08)] border border-[#E5E1D8]/50">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-2xl font-black flex items-center gap-3 text-[#2D3A2D] font-serif italic">
                                        <MapPin className="w-6 h-6 text-[#8B7E66]" />
                                        Tujuan Antar
                                    </h2>
                                    {!isAuthenticated && (
                                        <button
                                            onClick={() => handleAuthRedirect('signin')}
                                            className="text-[10px] font-black text-[#8B7E66] hover:text-[#2D3A2D] uppercase tracking-widest border-b border-[#E5E1D8] pb-1"
                                        >
                                            Sudah Punya Akun?
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleNext} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Email Utama</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                disabled={isAuthenticated}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all disabled:opacity-60 font-bold text-[#2D3A2D]"
                                                placeholder="email@anda.com"
                                            />
                                            <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7E66]" />
                                        </div>
                                        {!isAuthenticated && <p className="text-[10px] text-[#8B7E66]/60 mt-2 ml-2 italic">Kode verifikasi akan dikirimkan ke email ini.</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Nama Lengkap</label>
                                            <input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all font-bold text-[#2D3A2D]"
                                                placeholder="Nama Anda"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">No. WhatsApp</label>
                                            <input
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                                className="w-full px-6 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all font-bold text-[#2D3A2D]"
                                                placeholder="0812XXXXXXXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Alamat Lengkap</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            required
                                            rows={3}
                                            className="w-full px-6 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all font-bold text-[#2D3A2D] resize-none"
                                            placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Kecamatan..."
                                        ></textarea>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Catatan Khusus (Opsional)</label>
                                        <textarea
                                            value={formData.customerNote}
                                            onChange={e => setFormData({ ...formData, customerNote: e.target.value })}
                                            rows={2}
                                            className="w-full px-6 py-4 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all font-bold text-[#2D3A2D] resize-none"
                                            placeholder="Alergi, preferensi menu, atau instruksi pengiriman..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={otpLoading}
                                        className="w-full py-5 bg-[#2D3A2D] hover:bg-[#1a231a] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl hover:shadow-[0_20px_40px_rgba(45,58,45,0.3)] flex items-center justify-center gap-4 mt-10 active:scale-95 disabled:opacity-50"
                                    >
                                        {otpLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                {(!isAuthenticated && !isOtpVerified) ? 'Kirim Verifikasi' : 'Lanjut Pilih Menu'}
                                                <ArrowRight className="w-6 h-6" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Plan List / Day Selection */}
                            <div className="md:col-span-7 space-y-4">
                                {step === 'PLAN' ? (
                                    <>
                                        <div className="flex items-center gap-4 mb-8">
                                            <button onClick={() => setStep('DATA')} className="w-10 h-10 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#2D3A2D] hover:bg-[#2D3A2D] hover:text-white transition-all shadow-sm">
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <div>
                                                <h2 className="text-2xl font-black text-[#2D3A2D] font-serif italic">Paket Harian</h2>
                                                <p className="text-xs text-[#8B7E66] font-medium tracking-widest uppercase">Pilih langganan yang cocok untuk Anda</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-hide py-2">
                                            {plans.map((plan) => (
                                                <motion.div
                                                    key={plan.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    onClick={() => {
                                                        setSelectedPlan(plan);
                                                        if (plan.planProducts?.length > 0) {
                                                            setStep('PRODUCTS');
                                                            if (plan.type === 'FIXED') {
                                                                setSelectedProducts(plan.planProducts.map((pp: any) => ({
                                                                    variantId: pp.variantId,
                                                                    quantity: pp.quantity
                                                                })));
                                                            } else {
                                                                setSelectedProducts([]);
                                                            }
                                                        } else if (plan.isScheduleFlexible) {
                                                            setStep('DAYS');
                                                        }
                                                    }}
                                                    className={`cursor-pointer group p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${selectedPlan?.id === plan.id ? 'border-[#2D3A2D] bg-white shadow-[0_20px_50px_rgba(45,58,45,0.1)]' : 'border-[#E5E1D8]/50 bg-white/50 hover:bg-white hover:border-[#2D3A2D]/30'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-black text-[#2D3A2D] text-xl font-serif italic">{plan.name}</h3>
                                                                {plan.type === 'FIXED' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                                            </div>
                                                            <span className="text-[10px] bg-[#F9F7F2] text-[#8B7E66] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-[#E5E1D8]/50">
                                                                {plan.interval === 'WEEKLY' ? 'Tagihan Mingguan' : 'Tagihan Bulanan'}
                                                            </span>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan?.id === plan.id ? 'bg-[#2D3A2D] border-[#2D3A2D]' : 'border-[#E5E1D8]'}`}>
                                                            {selectedPlan?.id === plan.id && <CheckCircle className="w-5 h-5 text-white" />}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-[#8B7E66] mb-8 font-medium leading-relaxed">{plan.description}</p>

                                                    <div className="flex items-baseline gap-2 mb-8">
                                                        <span className="text-3xl font-black text-[#2D3A2D]">Rp {Number(plan.price).toLocaleString('id-ID')}</span>
                                                        <span className="text-xs text-[#8B7E66] font-black uppercase tracking-widest">/ {plan.interval === 'WEEKLY' ? 'minggu' : 'bulan'}</span>
                                                    </div>

                                                    {plan.features && Array.isArray(plan.features) && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[#E5E1D8]/50">
                                                            {plan.features.map((feat: string, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-3 text-xs text-[#2D3A2D] font-bold">
                                                                    <div className="w-5 h-5 rounded-full bg-[#B2BCA2]/20 flex items-center justify-center flex-shrink-0">
                                                                        <Heart className="w-3 h-3 text-[#2D3A2D]" />
                                                                    </div>
                                                                    {feat}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedPlan?.id === plan.id && (
                                                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F9F7F2] rounded-full -z-10 blur-2xl" />
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    step === 'PRODUCTS' ? (
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-4 mb-8">
                                                <button onClick={() => setStep('PLAN')} className="w-10 h-10 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#2D3A2D] hover:bg-[#2D3A2D] hover:text-white transition-all shadow-sm">
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <div>
                                                    <h2 className="text-2xl font-black text-[#2D3A2D] font-serif italic">
                                                        {selectedPlan.type === 'FIXED' ? 'Isi Paket' : 'Pilih Lauk'}
                                                    </h2>
                                                    <p className="text-xs text-[#8B7E66] font-medium tracking-widest uppercase">Tentukan hidangan favorit Anda</p>
                                                </div>
                                            </div>

                                            <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8]/50 shadow-[0_30px_80px_rgba(45,58,45,0.05)]">
                                                <p className="text-sm text-[#8B7E66] mb-10 font-medium">
                                                    {selectedPlan.type === 'FIXED'
                                                        ? 'Paket ini sudah termasuk menu tetap pilihan Ibu:'
                                                        : `Silakan pilih hingga ${selectedPlan.limitItems} hidangan yang Anda inginkan untuk minggu ini:`}
                                                </p>

                                                <div className="space-y-4">
                                                    {selectedPlan.planProducts?.map((pp: any) => {
                                                        const isSelected = selectedProducts.some(p => p.variantId === pp.variantId);
                                                        const currentQty = selectedProducts.find(p => p.variantId === pp.variantId)?.quantity || 0;

                                                        return (
                                                            <motion.div
                                                                key={pp.variantId}
                                                                layout
                                                                className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-6 ${isSelected ? 'border-[#2D3A2D] bg-[#F9F7F2]' : 'border-[#E5E1D8]/30 bg-white'}`}
                                                            >
                                                                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-[#FDFBF7] border border-[#E5E1D8]/50 flex items-center justify-center">
                                                                    {pp.variant?.product?.image ? (
                                                                        <img src={pp.variant.product.image} alt={pp.variant?.product?.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Utensils className="w-8 h-8 text-[#B2BCA2]" />
                                                                    )}
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="font-black text-[#2D3A2D] text-lg font-serif italic">{pp.variant?.product?.name || 'Produk'}</div>
                                                                    <div className="text-[10px] text-[#8B7E66] font-black uppercase tracking-widest mt-1">{pp.variant?.name}</div>

                                                                    {(isSelected || selectedPlan.type === 'FIXED') && (
                                                                        <div className="mt-4">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Ada catatan khusus untuk menu ini?"
                                                                                value={selectedProducts.find(p => p.variantId === pp.variantId)?.note || ''}
                                                                                onChange={(e) => {
                                                                                    setSelectedProducts(prev => {
                                                                                        const existing = prev.find(p => p.variantId === pp.variantId);
                                                                                        if (existing) return prev.map(p => p.variantId === pp.variantId ? { ...p, note: e.target.value } : p);
                                                                                        if (selectedPlan.type === 'FIXED') return [...prev, { variantId: pp.variantId, quantity: pp.quantity, note: e.target.value }];
                                                                                        return prev;
                                                                                    });
                                                                                }}
                                                                                className="w-full px-4 py-2 text-xs rounded-xl border border-[#E5E1D8] focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all bg-white font-medium"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {selectedPlan.type === 'FIXED' ? (
                                                                    <div className="px-5 py-3 bg-[#2D3A2D] text-white rounded-xl font-black text-sm shadow-lg">
                                                                        {pp.quantity} pcs
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#E5E1D8]">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedProducts(prev => {
                                                                                    const existing = prev.find(p => p.variantId === pp.variantId);
                                                                                    if (!existing) return prev;
                                                                                    if (existing.quantity === 1) return prev.filter(p => p.variantId !== pp.variantId);
                                                                                    return prev.map(p => p.variantId === pp.variantId ? { ...p, quantity: p.quantity - 1 } : p);
                                                                                });
                                                                            }}
                                                                            className="w-8 h-8 rounded-full bg-[#F9F7F2] text-[#2D3A2D] flex items-center justify-center font-black hover:bg-[#2D3A2D] hover:text-white transition-all"
                                                                        >-</button>
                                                                        <span className="w-4 text-center font-black text-[#2D3A2D]">{currentQty}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
                                                                                if (totalItems >= (selectedPlan.limitItems || 0)) return;
                                                                                setSelectedProducts(prev => {
                                                                                    const existing = prev.find(p => p.variantId === pp.variantId);
                                                                                    if (existing) return prev.map(p => p.variantId === pp.variantId ? { ...p, quantity: p.quantity + 1 } : p);
                                                                                    return [...prev, { variantId: pp.variantId, quantity: 1 }];
                                                                                });
                                                                            }}
                                                                            className="w-8 h-8 rounded-full bg-[#B2BCA2] text-[#2D3A2D] flex items-center justify-center font-black hover:bg-[#2D3A2D] hover:text-white transition-all"
                                                                        >+</button>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-12">
                                                    <button
                                                        onClick={() => {
                                                            if (selectedPlan.type === 'CUSTOMIZABLE') {
                                                                const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
                                                                if (totalItems === 0) {
                                                                    toast.error("Silakan pilih hidangan terlebih dahulu.");
                                                                    return;
                                                                }
                                                            }
                                                            setStep('DAYS');
                                                        }}
                                                        className="w-full py-5 bg-[#2D3A2D] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl hover:shadow-[0_20px_40px_rgba(45,58,45,0.3)] flex items-center justify-center gap-4"
                                                    >
                                                        Lanjut {selectedPlan.interval === 'WEEKLY' ? 'Pilih Jadwal' : 'Checkout'}
                                                        <ArrowRight className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center gap-4 mb-8">
                                                <button
                                                    onClick={() => {
                                                        if (selectedPlan.planProducts?.length > 0) setStep('PRODUCTS');
                                                        else setStep('PLAN');
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#2D3A2D] hover:bg-[#2D3A2D] hover:text-white transition-all shadow-sm"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </button>
                                                <div>
                                                    <h2 className="text-2xl font-black text-[#2D3A2D] font-serif italic">Waktu Antar</h2>
                                                    <p className="text-xs text-[#8B7E66] font-medium tracking-widest uppercase">Atur jadwal pengiriman Ibu</p>
                                                </div>
                                            </div>

                                            <div className="bg-white p-10 rounded-[3rem] border border-[#E5E1D8]/50 shadow-[0_30px_80px_rgba(45,58,45,0.05)]">
                                                <div className="flex flex-col items-center text-center mb-10">
                                                    <div className="w-20 h-20 bg-[#B2BCA2]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                                        <Clock className="w-10 h-10 text-[#2D3A2D]" />
                                                    </div>
                                                    <h3 className="text-xl font-serif italic text-[#2D3A2D] mb-2">Pilih Hari Penuh Kasih</h3>
                                                    <p className="text-xs text-[#8B7E66] max-w-sm leading-relaxed font-medium">
                                                        Pilih hari apa saja paket katering ingin dikirimkan ke rumah Anda dalam satu minggu.
                                                    </p>
                                                </div>

                                                {!selectedPlan.isScheduleFlexible ? (
                                                    <div className="flex flex-col items-center text-center py-16 px-8 bg-[#F9F7F2] rounded-[3rem] border border-[#E5E1D8]/50 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D3A2D]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                                                            <ShieldCheck className="w-12 h-12 text-[#2D3A2D]" />
                                                        </div>
                                                        <h3 className="text-2xl font-serif italic text-[#2D3A2D] mb-4">Jadwal Ditentukan Ibu</h3>
                                                        <p className="text-sm text-[#8B7E66] max-w-sm leading-relaxed mb-10 font-medium">
                                                            Untuk menjaga kesegaran maksimal, jadwal pengiriman diatur sepenuhnya oleh tim Rasa Ibu setiap harinya.
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs font-black text-white bg-[#2D3A2D] px-6 py-3 rounded-full tracking-widest shadow-xl">
                                                            <CheckCircle className="w-4 h-4 text-amber-500" />
                                                            SIAP DIANTAR KE MEJA MAKAN
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        {daysOfWeek.map((day) => {
                                                            const isSelected = selectedDays.some(d => d.day === day.id);
                                                            const selectedDayData = selectedDays.find(d => d.day === day.id);

                                                            return (
                                                                <div key={day.id} className={`p-6 rounded-[2rem] border-2 transition-all ${isSelected ? 'border-[#2D3A2D] bg-[#F9F7F2] shadow-xl' : 'border-[#E5E1D8]/30 bg-white h-auto'}`}>
                                                                    <button
                                                                        onClick={() => toggleDay(day.id)}
                                                                        className={`w-full flex items-center justify-between mb-4`}
                                                                    >
                                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-[#2D3A2D]' : 'text-[#8B7E66]/40'}`}>
                                                                            {day.label}
                                                                        </span>
                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#2D3A2D] border-[#2D3A2D] shadow-lg' : 'border-[#E5E1D8] bg-white'}`}>
                                                                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                                                        </div>
                                                                    </button>

                                                                    {isSelected && (
                                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Waktu Delivery</label>
                                                                            <select
                                                                                value={selectedDayData?.timeSlot}
                                                                                onChange={(e) => updateTimeSlot(day.id, e.target.value)}
                                                                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-xs font-black text-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 focus:border-[#2D3A2D] outline-none shadow-sm"
                                                                            >
                                                                                {timeSlots.map(slot => (
                                                                                    <option key={slot} value={slot}>{slot}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {selectedPlan.isScheduleFlexible && selectedDays.length === 0 && (
                                                    <div className="mt-10 p-6 bg-[#2D3A2D]/5 rounded-[2rem] flex items-center gap-4 border border-[#2D3A2D]/10">
                                                        <div className="w-3 h-3 rounded-full bg-[#2D3A2D] animate-pulse"></div>
                                                        <p className="text-[10px] text-[#2D3A2D] font-black uppercase tracking-widest">Pilih minimal satu hari untuk melanjutkan.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Summary Card */}
                            <div className="md:col-span-12 lg:col-span-5 xl:col-span-4">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-[#2D3A2D] p-10 rounded-[3rem] text-white shadow-[0_40px_100px_rgba(45,58,45,0.3)] sticky top-10 border border-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                                        <Utensils className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-xl font-serif italic">Ringkasan Ibu</h3>
                                    </div>

                                    <div className="space-y-8 mb-10">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Untuk</span>
                                                <span className="text-right font-black text-sm">{formData.name || <span className="text-white/20 italic">Belum diisi</span>}</span>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Alamat</span>
                                                <span className="text-right font-bold text-xs max-w-[150px] leading-relaxed">{formData.address || <span className="text-white/20 italic">Belum ada alamat</span>}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Paket</span>
                                                <span className="font-black text-amber-500 italic font-serif">{selectedPlan?.name || 'Tentukan Pilihan'}</span>
                                            </div>
                                        </div>

                                        {selectedDays.length > 0 && (
                                            <div className="space-y-3 pt-6 border-t border-white/5">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Jadwal Rindu</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {selectedDays.map(d => (
                                                        <div key={d.day} className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B2BCA2]">
                                                                {daysOfWeek.find(day => day.id === d.day)?.label}
                                                            </span>
                                                            <span className="text-[10px] text-white/80 font-bold">
                                                                {d.timeSlot}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedProducts.length > 0 && (
                                            <div className="space-y-3 pt-6 border-t border-white/5">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Daftar Sajian</span>
                                                <div className="space-y-2">
                                                    {selectedProducts.map(p => {
                                                        const pp = selectedPlan.planProducts?.find((apiPP: any) => apiPP.variantId === p.variantId);
                                                        return (
                                                            <div key={p.variantId} className="flex justify-between text-xs items-center group">
                                                                <span className="text-white/60 group-hover:text-white transition-colors">{pp?.variant?.product?.name}</span>
                                                                <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">{p.quantity}x</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Metode Pembayaran</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'BANK_TRANSFER' ? 'bg-white border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <CreditCard className={`w-6 h-6 ${paymentMethod === 'BANK_TRANSFER' ? 'text-[#2D3A2D]' : 'text-white'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'BANK_TRANSFER' ? 'text-[#2D3A2D]' : 'text-white'}`}>Transfer</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('QRIS')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'QRIS' ? 'bg-white border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs ${paymentMethod === 'QRIS' ? 'bg-[#2D3A2D] text-white' : 'bg-white text-[#2D3A2D]'}`}>QR</div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'QRIS' ? 'text-[#2D3A2D]' : 'text-white'}`}>QRIS</span>
                                            </button>
                                        </div>

                                        {/* Payment Details Section */}
                                        <AnimatePresence mode="wait">
                                            {paymentMethod === 'BANK_TRANSFER' && (
                                                <motion.div
                                                    key="bank-details"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 bg-white/5 p-5 rounded-2xl border border-white/10"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Bank BCA</span>
                                                        <div className="w-8 h-4 bg-blue-600 rounded"></div>
                                                    </div>
                                                    <div className="text-xl font-black text-white tracking-widest font-mono mb-1">123 456 7890</div>
                                                    <div className="text-xs text-white/60 font-medium">a.n. PT Rasa Ibu Indonesia</div>
                                                    <div className="mt-4 pt-4 border-t border-dashed border-white/10 text-[10px] text-amber-500 italic">
                                                        *Silakan transfer sesuai total tagihan. Unggah bukti di halaman profil.
                                                    </div>
                                                </motion.div>
                                            )}

                                            {paymentMethod === 'QRIS' && (
                                                <motion.div
                                                    key="qris-details"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 bg-white p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center"
                                                >
                                                    <img
                                                        src="/assets/qris-placeholder.png"
                                                        alt="Scan QRIS"
                                                        className="w-48 h-48 object-contain mix-blend-multiply mb-4"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=QRIS+CODE';
                                                        }}
                                                    />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] mb-1">Scan untuk Bayar</p>
                                                    <p className="text-xs text-[#8B7E66]">NMID: ID102003004005</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="space-y-6 pt-10 border-t border-white/20">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B2BCA2]">Total Investasi Kasih</span>
                                            <div className="text-right">
                                                <span className="block text-4xl font-black text-white font-serif italic">
                                                    Rp {selectedPlan ? Number(selectedPlan.price).toLocaleString('id-ID') : '0'}
                                                </span>
                                                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{selectedPlan?.interval === 'WEEKLY' ? 'per minggu' : 'per bulan'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={loading || !selectedPlan || (selectedPlan.isScheduleFlexible && selectedDays.length === 0)}
                                            className="w-full py-6 bg-[#B2BCA2] hover:bg-white text-[#2D3A2D] rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 group active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>
                                                    <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                                    AKTIFKAN SEKARANG
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-8 flex items-center justify-center gap-3 text-[10px] text-white/20 font-black tracking-widest uppercase text-center">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Transaksi Terenkripsi Ibu</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div >

            {/* OTP Verification Modal */}
            {
                showOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A2D]/40 backdrop-blur-xl animate-in fade-in duration-500">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] relative border border-[#E5E1D8]/50"
                        >
                            <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <ShieldCheck className="w-10 h-10 text-[#2D3A2D]" />
                            </div>
                            <h3 className="text-3xl font-black text-[#2D3A2D] text-center mb-3 font-serif italic">Ketuk Pintu</h3>
                            <p className="text-sm text-[#8B7E66] text-center mb-10 font-medium leading-relaxed px-4">
                                Satu langkah lagi! Masukkan 6 digit kode yang Ibu kirimkan ke <span className="text-[#2D3A2D] font-black">{formData.email}</span>.
                            </p>

                            <div className="space-y-8">
                                <input
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.trim().replace(/\D/g, '').slice(0, 6))}
                                    className="w-full text-center text-5xl font-black tracking-[0.3em] py-8 rounded-[2rem] bg-[#F9F7F2] border-2 border-[#E5E1D8]/50 focus:border-[#2D3A2D] focus:ring-4 focus:ring-[#2D3A2D]/5 transition-all outline-none text-[#2D3A2D] shadow-inner"
                                    placeholder="000000"
                                    maxLength={6}
                                />

                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={otpLoading || otpCode.length !== 6}
                                    className="w-full py-6 bg-[#2D3A2D] text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:shadow-[0_20px_40px_rgba(45,58,45,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-4 active:scale-95"
                                >
                                    {otpLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>BUKA PINTU <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <div className="text-center">
                                    <button
                                        onClick={handleSendOTP}
                                        disabled={otpLoading}
                                        className="text-[10px] font-black text-[#8B7E66] hover:text-[#2D3A2D] transition-colors uppercase tracking-[0.2em] border-b border-[#E5E1D8] pb-1"
                                    >
                                        Belum terima kode? <span className="text-[#2D3A2D]">Kirim Ulang</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowOtpModal(false)}
                                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-[#F9F7F2] flex items-center justify-center text-[#8B7E66] hover:text-[#2D3A2D] transition-all"
                            >
                                <span className="text-2xl font-black">&times;</span>
                            </button>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
