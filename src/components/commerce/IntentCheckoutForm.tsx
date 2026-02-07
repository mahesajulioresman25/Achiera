'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/contexts/CartContext';
import { getPublicBrandConfigAction } from '@/lib/actions/rasa-ibu/intelligence';

import { createWebsiteOrderAction } from '@/lib/actions/commerce/orders';
import { getMemberInfoAction } from '@/lib/actions/commerce/loyalty';
import { getCustomerProfileByPhoneAction } from '@/lib/actions/commerce/customers';
import { validateVoucherAction } from '@/lib/actions/rasa-ibu/voucher';
import { Check, Coins, Loader2, Sparkles, UserCheck, TicketPercent, X } from 'lucide-react';

import { toast } from 'sonner';

export default function IntentCheckoutForm() {
    const { items, cartTotal, clearCart, addToCart: addItem } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [delivery, setDelivery] = useState('Ambil di Dapur');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [whatsapp, setWhatsapp] = useState('628123456789');
    const [error, setError] = useState<string | null>(null);
    const [memberInfo, setMemberInfo] = useState<any>(null);
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [showAutofillBadge, setShowAutofillBadge] = useState(false);
    const [usePoints, setUsePoints] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'QRIS'>('TRANSFER');
    const [courierType, setCourierType] = useState<string>('GrabExpress');
    const [isGift, setIsGift] = useState(false);
    const [giftMessage, setGiftMessage] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [brandConfig, setBrandConfig] = useState<any>(null);
    const [isMarketingAllowed, setIsMarketingAllowed] = useState(true);

    // Voucher State
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState('');
    const [isValidVoucher, setIsValidVoucher] = useState(false);
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    // ---------------------------------------------------------
    // Note: Bundle logic is now handled by Cart Sidebar flow
    // ---------------------------------------------------------

    React.useEffect(() => {
        async function load() {
            const res = await getPublicBrandConfigAction('rasa-ibu');
            if (res.success) {
                if (res.data?.whatsapp) setWhatsapp(res.data.whatsapp);
                setBrandConfig(res.data);
            }
        }
        load();
    }, []);

    // AUTOFILL Logic
    const handlePhoneBlur = async () => {
        if (customerPhone.length >= 10 && !customerName) {
            setIsAutofilling(true);
            const res = await getCustomerProfileByPhoneAction(brandConfig?.id || 'rasa-ibu', customerPhone);
            setIsAutofilling(false);

            if (res.success && res.data?.isRepeatCustomer) {
                if (!customerName) setCustomerName(res.data.name);
                if (!customerAddress) setCustomerAddress(res.data.address);
                setShowAutofillBadge(true);
                // Also auto-load member/points info if available
                if (res.data.loyalty) {
                    setMemberInfo({
                        ...res.data.loyalty,
                        customerName: res.data.name
                    });
                }
                setTimeout(() => setShowAutofillBadge(false), 3000);
            }
        }
    };

    const checkPoints = async () => {
        if (!customerPhone) {
            setError('Masukkan nomor telpon untuk cek poin.');
            return;
        }
        setError(null);
        setIsLoadingPoints(true);
        const res = await getMemberInfoAction('rasa-ibu', customerPhone);
        setIsLoadingPoints(false);

        if (res.success && res.data) {
            setMemberInfo(res.data);
            if ((res.data.availablePoints || 0) > 0) {
                setUsePoints(true);
            }
        } else {
            setError(res.error || 'Gagal mengecek poin.');
            setMemberInfo(null);
        }
    };

    const handleApplyVoucher = async () => {
        // If already valid, this button acts as "Remove"
        if (isValidVoucher) {
            setVoucherCode('');
            setVoucherDiscount(0);
            setIsValidVoucher(false);
            setVoucherMessage('');
            return;
        }

        if (!voucherCode) return;

        setIsCheckingVoucher(true);
        setVoucherMessage('');

        const res = await validateVoucherAction(brandConfig?.id || 'rasa-ibu', voucherCode, cartTotal);

        setIsCheckingVoucher(false);

        if (res.success) {
            setVoucherDiscount(res.discount);
            setIsValidVoucher(true);
            setVoucherMessage(res.message);
            toast.success('Voucher berhasil dipasang!');
        } else {
            setVoucherDiscount(0);
            setIsValidVoucher(false);
            setVoucherMessage(res.message);
            toast.error(res.message);
        }
    };

    if (items.length === 0) return null;

    // Calculate points to use (Strictly Brand Specific)
    const availableToUse = memberInfo?.availablePoints || 0;
    const isUsingGlobal = false; // Isolated loyalty for Rasa Ibu

    const pointMultiplier = brandConfig?.loyalty?.pointValueInRupiah || 100;
    const discountValue = usePoints && memberInfo ? availableToUse * pointMultiplier : 0;
    const finalTotal = Math.max(0, cartTotal - discountValue - voucherDiscount);

    const handleHandoff = async () => {
        setError(null);
        setIsRedirecting(true);

        const orderResult = await createWebsiteOrderAction({
            brandId: brandConfig?.id || 'rasa-ibu',
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            items: items.map(i => ({
                productId: i.productId,
                variantId: i.variantId,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                variantName: i.variantName,
                note: i.note
            })),
            totalAmount: cartTotal,
            redeemedPoints: usePoints ? availableToUse : 0,
            deliveryOption: delivery,
            courierType: delivery === 'Kurir Instan' ? courierType : undefined,
            paymentMethod: paymentMethod,
            isGift,
            giftMessage,
            recipientName,
            recipientEmail,
            isMarketingAllowed,
            voucherCode: isValidVoucher ? voucherCode : undefined
        });

        if (!orderResult.success) {
            setError(orderResult.error || 'Gagal menyimpan pesanan.');
            setIsRedirecting(false);
            return;
        }

        if (orderResult.orderId) {
            clearCart();
            window.location.href = `/order/track/${orderResult.orderId}`;
            return;
        }

        setIsRedirecting(false);
    };

    return (
        <div className="bg-white border border-[#E5E1D8] rounded-[2rem] p-4 md:p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom duration-500 max-w-2xl mx-auto">
            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Satu Langkah Lagi</span>
                    {showAutofillBadge && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full border border-emerald-100 animate-bounce">
                            <UserCheck className="w-3 h-3" /> Data Otomatis Terisi
                        </span>
                    )}
                </div>
                <h2 className="text-xl font-black text-[#2D3A2D] tracking-tight">Checkout</h2>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold">
                    ⚠️ {error}
                </div>
            )}

            <div className="space-y-6">
                {/* 1. Informasi Kontak */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2] border-b border-[#F0EEE9] pb-1">1. Kontak</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Nama Lengkap</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all"
                                    placeholder="Nama Bunda..."
                                />
                                {isAutofilling && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Alamat Email</label>
                            <input
                                required
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all"
                                placeholder="bunda@email.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">WhatsApp</label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={customerPhone}
                                onBlur={handlePhoneBlur}
                                onChange={(e) => {
                                    setCustomerPhone(e.target.value);
                                    if (memberInfo) setMemberInfo(null);
                                }}
                                className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all"
                                placeholder="0812..."
                                autoComplete="tel"
                            />
                            <button
                                onClick={checkPoints}
                                disabled={isLoadingPoints || !customerPhone}
                                className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-[#2D3A2D] text-[#FDFBF7] text-[9px] font-black uppercase rounded-lg hover:bg-[#3d4d3d] disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {isLoadingPoints ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                                {memberInfo ? 'Cek Lagi' : 'Cek Poin'}
                            </button>
                        </div>

                        {/* WhatsApp Marketing Opt-In */}
                        <div className={`flex items-center gap-3 p-3 border rounded-2xl transition-all duration-300 ${isMarketingAllowed ? 'bg-amber-50 border-amber-200' : 'bg-[#FDFBF7] border-[#E5E1D8]'}`}>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMarketingAllowed}
                                    onChange={(e) => setIsMarketingAllowed(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                            </label>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#2D3A2D]">Notifikasi & Promo</p>
                                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[7px] font-black rounded uppercase">Bonus Poin ⚡</span>
                                </div>
                                <p className="text-[8px] text-[#8B7E66]">Dapatkan info promo & 2x Poin Loyalty.</p>
                            </div>
                        </div>

                        {/* Point Check Feedback */}
                        {memberInfo && (
                            <div className="mt-2 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Poin: <span className="text-sm">{availableToUse.toLocaleString()}</span></p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Gifting Section (Optional) */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2] border-b border-[#F0EEE9] pb-1">2. Hadiah</h3>
                    <div className="bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isGift ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D]">Kirim Hadiah?</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                            </label>
                        </div>

                        {isGift && (
                            <div className="space-y-3 pt-4 border-t border-[#E5E1D8] animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-pink-800">Nama Penerima</label>
                                        <input
                                            type="text"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                                            placeholder="Nama Penerima..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-pink-800">Email Penerima (Opsional)</label>
                                        <input
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                                            placeholder="email@penerima.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-pink-800">Pesan Spesial</label>
                                    <textarea
                                        value={giftMessage}
                                        onChange={(e) => setGiftMessage(e.target.value)}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 min-h-[80px]"
                                        placeholder="Tulis ucapan hangat untuk mereka..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Pengiriman */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2] border-b border-[#F0EEE9] pb-1">3. Pengiriman</h3>
                    <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-[#8B7E66]">Metode</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {['Ambil di Dapur', 'Kurir Instan', 'Ekspedisi'].map((pref) => (
                                <button
                                    key={pref}
                                    type="button"
                                    onClick={() => {
                                        setDelivery(pref);
                                        if (pref === 'Kurir Instan') setCourierType('GrabExpress');
                                        if (pref === 'Ekspedisi') setCourierType('JNE');
                                    }}
                                    className={`flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${delivery === pref
                                        ? 'bg-[#2D3A2D] text-[#FDFBF7] border-[#2D3A2D] shadow-lg'
                                        : 'bg-white text-[#8B7E66] border-[#E5E1D8] hover:bg-slate-50'
                                        }`}
                                >
                                    {pref === 'Ekspedisi' ? '📦 Ekspedisi' : pref === 'Kurir Instan' ? '🚀 Instan' : '🏠 Ambil'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {delivery === 'Kurir Instan' && (
                        <div className="space-y-3 p-5 bg-[#FDFBF7] rounded-2xl border border-[#E5E1D8] animate-in fade-in slide-in-from-top-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66]">Pilih Kurir Instan Favorit Bunda</label>
                            <div className="flex flex-wrap gap-2">
                                {['GrabExpress', 'GoSend', 'Shopee Express'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCourierType(c)}
                                        className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${courierType === c
                                            ? 'bg-orange-600 text-white border-orange-600'
                                            : 'bg-white text-[#8B7E66] border-[#E5E1D8]'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[8px] text-[#8B7E66] italic leading-tight">*Ongkir dibayar ke driver saat pesanan tiba.</p>
                        </div>
                    )}

                    {delivery === 'Ekspedisi' && (
                        <div className="space-y-3 p-5 bg-[#FDFBF7] rounded-2xl border border-[#E5E1D8] animate-in fade-in slide-in-from-top-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66]">Pilih Jasa Ekspedisi</label>
                            <div className="flex flex-wrap gap-2">
                                {['JNE', 'J&T', 'SiCepat'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCourierType(c)}
                                        className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${courierType === c
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-[#8B7E66] border-[#E5E1D8]'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[8px] text-[#8B7E66] italic leading-tight">*Pilih jasa kirim regular terbaik untuk daerah Bunda.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66]">Alamat Lengkap</label>
                        <textarea
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] transition-all min-h-[50px]"
                            placeholder="Tuliskan alamat lengkap pengiriman Bunda di sini..."
                        />
                    </div>
                </div>

                {/* 4. Pembayaran */}
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2] border-b border-[#F0EEE9] pb-1">4. Pembayaran</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className={`p-4 rounded-2xl border text-left transition-all relative ${paymentMethod === 'TRANSFER'
                                ? 'bg-[#2D3A2D] text-[#FDFBF7] border-[#2D3A2D] shadow-lg shadow-green-950/20'
                                : 'bg-white text-[#8B7E66] border-[#E5E1D8] hover:bg-slate-50'
                                }`}
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest">Transfer Bank</p>
                        </button>

                        {brandConfig?.qrisEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('QRIS')}
                                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${paymentMethod === 'QRIS'
                                    ? 'bg-emerald-800 text-[#FDFBF7] border-emerald-800 shadow-lg shadow-emerald-950/20'
                                    : 'bg-white text-emerald-800 border-[#E5E1D8] hover:bg-emerald-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Bayar Instan (QRIS)</p>
                                    <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded font-black">REKOMENDASI</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Loyalty & Voucher & Summary Section */}
                <div className="space-y-6 pt-6 border-t border-[#F0EEE9]">

                    {/* Voucher Input */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${isValidVoucher ? 'bg-emerald-50 border-emerald-100' : 'bg-[#FDFBF7] border-[#E5E1D8]'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${isValidVoucher ? 'bg-emerald-500 text-white' : 'bg-[#E5E1D8] text-[#8B7E66]'}`}>
                                <TicketPercent className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D]">
                                {isValidVoucher ? 'Voucher Terpasang!' : 'Punya Kode Voucher?'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    placeholder="Masukkan kode..."
                                    disabled={isValidVoucher || isCheckingVoucher}
                                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] disabled:opacity-70 disabled:bg-slate-50 uppercase placeholder:normal-case"
                                />
                            </div>
                            <button
                                onClick={handleApplyVoucher}
                                disabled={isCheckingVoucher || (!voucherCode && !isValidVoucher)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isValidVoucher
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                        : 'bg-[#2D3A2D] text-[#FDFBF7] hover:bg-[#3d4d3d] disabled:opacity-50'
                                    }`}
                            >
                                {isCheckingVoucher ? <Loader2 className="w-3 h-3 animate-spin" /> : isValidVoucher ? <X className="w-3 h-3" /> : 'Pakai'}
                                {isValidVoucher && 'Hapus'}
                            </button>
                        </div>
                        {voucherMessage && (
                            <p className={`text-[10px] mt-2 font-medium ${isValidVoucher ? 'text-emerald-600' : 'text-red-500'}`}>
                                {voucherMessage}
                            </p>
                        )}
                    </div>

                    {/* Points Section */}
                    {memberInfo && (
                        <div className={`p-4 rounded-2xl border transition-all duration-300 ${usePoints ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-xl ${usePoints ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-900">Bunda punya <span className="text-indigo-600 font-black">{availableToUse} Poin</span></p>
                                </div>
                                <button
                                    onClick={() => setUsePoints(!usePoints)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${usePoints
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {usePoints ? 'Dipakai' : 'Gunakan'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="p-6 bg-[#FDFBF7] rounded-[1.5rem] border border-dashed border-[#E5E1D8] space-y-4">
                        <div className="flex justify-between items-baseline">
                            <p className="text-[10px] font-black text-[#8B7E66] uppercase">Subtotal {items.length} Menu</p>
                            <p className="text-lg font-black text-[#2D3A2D]">Rp {cartTotal.toLocaleString('id-ID')}</p>
                        </div>

                        {usePoints && discountValue > 0 && (
                            <div className="flex justify-between items-baseline text-indigo-600">
                                <p className="text-[10px] font-black uppercase">Potongan Poin</p>
                                <p className="text-lg font-black">- Rp {discountValue.toLocaleString('id-ID')}</p>
                            </div>
                        )}

                        {isValidVoucher && voucherDiscount > 0 && (
                            <div className="flex justify-between items-baseline text-emerald-600 animate-in slide-in-from-right-2">
                                <p className="text-[10px] font-black uppercase flex items-center gap-1"><TicketPercent className="w-3 h-3" /> Diskon Voucher</p>
                                <p className="text-lg font-black">- Rp {voucherDiscount.toLocaleString('id-ID')}</p>
                            </div>
                        )}

                        <div className="pt-3 border-t border-[#E5E1D8] flex justify-between items-baseline">
                            <p className="text-[11px] font-black text-[#2D3A2D] uppercase tracking-wider">Total Akhir</p>
                            <p className="text-2xl font-black text-[#2D3A2D]">Rp {finalTotal.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Membership Perks Nudge */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 space-y-2 shadow-inner">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800">Benefit Member Rasa Ibu</h4>
                        </div>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <li className="flex items-center gap-1.5 text-[8px] font-medium text-amber-900/70">
                                <span className="text-amber-500">✨</span> 2x Poin Loyalty
                            </li>
                            <li className="flex items-center gap-1.5 text-[8px] font-medium text-amber-900/70">
                                <span className="text-amber-500">🚚</span> Prioritas Pengiriman
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handleHandoff}
                        disabled={!customerName || !customerPhone || !customerEmail || !customerAddress || isRedirecting}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${!customerName || !customerPhone || !customerEmail || !customerAddress || isRedirecting
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-[#2D3A2D] text-[#FDFBF7] hover:scale-[1.01] active:scale-[0.99] shadow-green-950/20'
                            }`}
                    >
                        {isRedirecting ? 'Memproses...' : paymentMethod === 'QRIS' ? 'Bayar Sekarang ⚡' : 'Selesaikan Pesanan 🥘'}
                    </button>

                    {/* Security & Privacy Badge */}
                    <div className="pt-2 border-t border-[#F0EEE9] space-y-3">
                        <div className="flex items-center justify-center gap-4 text-[8px] font-black text-[#8B7E66] uppercase tracking-widest opacity-60">
                            <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> 256-bit SSL</span>
                            <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> Data Protected</span>
                            <span className="flex items-center gap-1"><Check className="w-2.5 h-2.5 text-emerald-500" /> Secure Payment</span>
                        </div>
                        <p className="text-[8px] text-center text-slate-400 italic leading-relaxed px-4">
                            Dengan klik tombol di atas, Bunda menyetujui Kebijakan Privasi Rasa Ibu. Data Bunda terenkripsi aman dan hanya digunakan untuk keperluan pesanan.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
