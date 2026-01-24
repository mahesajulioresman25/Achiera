'use client';

import React, { useState, useEffect } from 'react';
import { createManualOrder, getUnlinkedAutoOrdersAction } from '@/lib/actions/rasa-ibu/orders';
import { getWarehousesAction } from '@/lib/actions/rasa-ibu/warehouse';
import { getCustomerProfileByPhoneAction } from '@/lib/actions/commerce/customers';
import { getPlatformSettingsAction } from '@/lib/actions/rasa-ibu/finance';
import { X, Loader2, UserCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderEntryModal({ brandId, products, onClose }: { brandId: string; products: any[]; onClose: () => void }) {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [source, setSource] = useState('WHATSAPP');
    const [manualRef, setManualRef] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
    const [pointValue, setPointValue] = useState<number>(100);
    const [deliveryOption, setDeliveryOption] = useState('Ambil di Dapur');
    const [courierType, setCourierType] = useState('');

    // Cart state
    const [cart, setCart] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState<string>('1');
    const [usePoints, setUsePoints] = useState(false);

    // Linking state
    const [unlinkedOrders, setUnlinkedOrders] = useState<any[]>([]);
    const [selectedSkeletonId, setSelectedSkeletonId] = useState('');

    useEffect(() => {
        async function fetchWarehouses() {
            const res = await getWarehousesAction(brandId);
            if (res.success && res.data) {
                setWarehouses(res.data);
                const defaultWh = res.data.find((w: any) => w.isDefault);
                if (defaultWh) setSelectedWarehouseId(defaultWh.id);
            }
        }
        fetchWarehouses();

        async function fetchConfig() {
            const res = await getPlatformSettingsAction(brandId);
            if (res.success && res.settings?.loyalty) {
                setPointValue(res.settings.loyalty.pointValueInRupiah || 100);
            }
        }
        fetchConfig();
    }, [brandId]);

    // AUTOFILL Logic
    const handlePhoneBlur = async () => {
        if (customerPhone.length >= 10 && !customerName) {
            setIsAutofilling(true);
            const res = await getCustomerProfileByPhoneAction(brandId, customerPhone);
            setIsAutofilling(false);

            if (res.success && res.data?.isRepeatCustomer) {
                if (!customerName) setCustomerName(res.data.name);
                if (!customerAddress) setCustomerAddress(res.data.address);
                if (!customerEmail) setCustomerEmail(res.data.email);
                if (res.data.loyalty) {
                    setLoyaltyInfo(res.data.loyalty);
                    if (res.data.loyalty.availablePoints > 0) {
                        setUsePoints(true);
                    }
                }
                toast.success('Data pelanggan ditemukan otomatis!');
            }
        }
    };

    // Fetch unlinked skeleton orders when channel changes
    useEffect(() => {
        async function fetchUnlinked() {
            if (['SHOPEE', 'GRABFOOD', 'GOFOOD'].includes(source)) {
                const res = await getUnlinkedAutoOrdersAction(brandId, source);
                if (res.success && res.data) {
                    setUnlinkedOrders(res.data);
                } else {
                    setUnlinkedOrders([]);
                }
            } else {
                setUnlinkedOrders([]);
            }
            setSelectedSkeletonId(''); // Reset selection
        }
        fetchUnlinked();
    }, [source, brandId]);

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const stockOnHand = selectedProduct?.variants?.[0]?.stockOnHand || 0;
    const isLowStock = stockOnHand < Number(quantity);

    const handleAddToCart = () => {
        if (!selectedProduct || isLowStock) return;

        const variant = selectedProduct.variants?.[0];
        if (!variant) return;

        const newItem = {
            productId: selectedProduct.id,
            variantId: variant.id,
            name: selectedProduct.name,
            quantity: Number(quantity),
            price: Number(variant.price),
            subtotal: Number(variant.price) * Number(quantity)
        };

        setCart([...cart, newItem]);
        // Reset selection
        setSelectedProductId('');
        setQuantity('1');
    };

    const handleRemoveFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const availableToUse = loyaltyInfo?.availablePoints || 0;
    const discountValue = usePoints ? availableToUse * pointValue : 0;
    const finalTotal = Math.max(0, cartTotal - discountValue);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error('Mohon tambah minimal 1 produk ke pesanan.');
            return;
        }

        setIsSubmitting(true);
        const res = await createManualOrder({
            brandId,
            customerName,
            customerPhone: customerPhone || undefined,
            items: cart,
            channel: source,
            customerEmail: customerEmail || undefined,
            internalNotes: internalNotes || undefined,
            manualRef: manualRef || undefined,
            warehouseId: selectedWarehouseId || undefined,
            totalAmount: finalTotal,
            existingOrderId: selectedSkeletonId || undefined,
            // @ts-ignore
            redeemedPoints: usePoints ? availableToUse : 0,
            deliveryOption,
            courierType: deliveryOption !== 'Ambil di Dapur' ? courierType : undefined
        });

        if (res.success) {
            toast.success('✅ Pesanan berhasil disimpan!');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            toast.error(`❌ Error: ${res.error}`);
            console.error('Order creation failed:', res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D3A2D]/40 backdrop-blur-sm p-6">
            <div className="bg-[#FDFBF7] w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white shrink-0">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Pencatatan Manual</span>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Tambah Pesanan Baru</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8 custom-scrollbar">
                        {/* Customer Info */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor WhatsApp</label>
                                    <input
                                        value={customerPhone}
                                        onBlur={handlePhoneBlur}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                        placeholder="081234..."
                                    />
                                    {loyaltyInfo && (
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600">
                                            <Sparkles className="w-3 h-3" /> Pelanggan Setia: {loyaltyInfo.availablePoints} Poin
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Pelanggan</label>
                                    <div className="relative">
                                        <input
                                            required
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2]"
                                            placeholder="Contoh: Bunda Sarah"
                                        />
                                        {isAutofilling && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alamat Lengkap</label>
                                <textarea
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B2BCA2] h-20"
                                    placeholder="Alamat pengiriman Bunda..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alamat Email (PENTING)</label>
                                    <input
                                        required
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        placeholder="bunda@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sumber Pesanan</label>
                                    <select
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none"
                                    >
                                        <option value="WHATSAPP">WhatsApp / Manual</option>
                                        <option value="WEBSITE">Website</option>
                                        <option value="SHOPEE">Shopee Ecommerce</option>
                                        <option value="SHOPEE_FOOD">Shopee Food</option>
                                        <option value="TOKOPEDIA">Tokopedia</option>
                                        <option value="GRAB_FOOD">GrabFood</option>
                                        <option value="GO_FOOD">GoFood</option>
                                        <option value="GRAB_MART">GrabMart</option>
                                        <option value="TIKTOK_SHOP">TikTok Shop</option>
                                        <option value="QRIS">QRIS Direct</option>
                                    </select>
                                </div>
                            </div>

                            {/* Delivery System Section */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sistem Pengiriman</label>
                                    <div className="flex gap-2">
                                        {['Ambil di Dapur', 'Kurir Instan', 'Ekspedisi'].map((pref) => (
                                            <button
                                                key={pref}
                                                type="button"
                                                onClick={() => {
                                                    setDeliveryOption(pref);
                                                    if (pref === 'Kurir Instan') setCourierType('GrabExpress');
                                                    if (pref === 'Ekspedisi') setCourierType('JNE');
                                                    if (pref === 'Ambil di Dapur') setCourierType('');
                                                }}
                                                className={`flex-1 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${deliveryOption === pref
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {pref === 'Ekspedisi' ? '📦 Ekspedisi' : pref === 'Kurir Instan' ? '🚀 Instan' : '🏠 Ambil'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {deliveryOption === 'Kurir Instan' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2]">Pilih Kurir Instan</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['GrabExpress', 'GoSend', 'Shopee Express'].map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setCourierType(c)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${courierType === c
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:border-amber-300'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {deliveryOption === 'Ekspedisi' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#B2BCA2]">Pilih Jasa Ekspedisi</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['JNE', 'J&T', 'SiCepat'].map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setCourierType(c)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${courierType === c
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. Ref (Opsional)</label>
                            <input
                                value={manualRef}
                                onChange={(e) => setManualRef(e.target.value)}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none"
                                placeholder="Ref marketplace..."
                            />
                        </div>

                        {unlinkedOrders.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 animate-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                        <Loader2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div>
                                            <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide">Hubungkan dengan Pending Order?</h4>
                                            <p className="text-[10px] text-amber-700 leading-relaxed">
                                                Ditemukan {unlinkedOrders.length} order dari Settlement {source} yang belum memiliki detail item.
                                                Pilih salah satu jika Anda sedang menginput detail untuk order tersebut.
                                            </p>
                                        </div>

                                        <select
                                            value={selectedSkeletonId}
                                            onChange={(e) => {
                                                setSelectedSkeletonId(e.target.value);
                                                const sel = unlinkedOrders.find(o => o.id === e.target.value);
                                                if (sel) {
                                                    setManualRef(sel.externalOrderId || '');
                                                }
                                            }}
                                            className="w-full bg-white border border-amber-300 text-amber-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        >
                                            <option value="">-- Buat Order Baru (Jangan Hubungkan) --</option>
                                            {unlinkedOrders.map(Order => (
                                                <option key={Order.id} value={Order.id}>
                                                    {Order.externalOrderId} — Rp {Order.total.toLocaleString()} — {new Date(Order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {warehouses.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outlet Fulfillment (Dapur)</label>
                                <select
                                    required
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none"
                                >
                                    <option value="">Pilih Dapur...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <hr className="border-dashed border-gray-200" />

                        <div className="space-y-4">
                            <h4 className="font-bold text-[#2D3A2D] text-sm flex items-center gap-2">
                                Items
                                <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cart.length} item</span>
                            </h4>

                            <div className="flex gap-2 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Produk</label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            setSelectedProductId(e.target.value);
                                            setQuantity('1');
                                        }}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                                    >
                                        <option value="">Pilih Produk...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Stok: {p.variants?.[0]?.stockOnHand || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-20 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={!selectedProductId || isLowStock}
                                    className="px-4 py-2 bg-[#2D3A2D] text-white text-xs font-bold rounded-xl hover:bg-[#1A241A] disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
                                >
                                    + Tambah
                                </button>
                            </div>

                            {cart.length > 0 ? (
                                <div className="space-y-2">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                <p className="text-[10px] text-gray-500">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-[#2D3A2D]">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFromCart(idx)}
                                                    className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-lg"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-sm font-bold text-gray-500">Subtotal</span>
                                        <span className="text-sm font-bold text-gray-800">Rp {cartTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    {usePoints && (
                                        <div className="flex justify-between items-center text-indigo-600">
                                            <span className="text-xs font-medium italic">Diskon Poin ({availableToUse} Poin)</span>
                                            <span className="text-sm font-bold">- Rp {discountValue.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-[#2D3A2D]/10">
                                        <span className="text-sm font-bold text-gray-500">Total Akhir</span>
                                        <span className="text-xl font-black text-[#2D3A2D]">Rp {finalTotal.toLocaleString('id-ID')}</span>
                                    </div>

                                    {loyaltyInfo && loyaltyInfo.availablePoints > 0 && (
                                        <label className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all select-none group mt-4">
                                            <input
                                                type="checkbox"
                                                checked={usePoints}
                                                onChange={(e) => setUsePoints(e.target.checked)}
                                                className="w-5 h-5 rounded-lg border-2 border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-indigo-900 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-500" /> Gunakan Poin Loyalitas
                                                </p>
                                                <p className="text-[10px] text-indigo-700 font-medium">
                                                    Potong saldo *Rp {discountValue.toLocaleString('id-ID')}* dari *{availableToUse}* poin Bunda.
                                                </p>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    Belum ada item ditambahkan.
                                </div>
                            )}
                        </div>

                        {isLowStock && selectedProductId && (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-pulse">
                                <p className="text-[10px] font-black text-amber-700 uppercase">⚠️ Stok Tidak Cukup</p>
                                <p className="text-xs text-amber-600 italic">Maaf Bunda, stok di dapur hanya sisa {stockOnHand}.</p>
                            </div>
                        )}

                        <div className="space-y-2 px-10 pb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catatan Internal</label>
                            <textarea
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none h-20"
                                placeholder="Catatan tambahan..."
                            />
                        </div>
                    </div>

                    <div className="px-10 py-6 border-t border-[#E5E1D8] flex justify-between items-center bg-white shrink-0">
                        <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                            Batal
                        </button>
                        <button
                            disabled={isSubmitting || cart.length === 0}
                            type="submit"
                            className={`px-10 py-4 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${isSubmitting || cart.length === 0 ? 'opacity-30' : 'hover:scale-105 active:scale-95'}`}
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
