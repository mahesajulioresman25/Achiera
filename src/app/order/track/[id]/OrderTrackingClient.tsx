'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, Package, Truck, CreditCard, Upload, Utensils, Box } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { safeFormatDate, safeFormatTime } from '@/utils/date-safe';

const STATUS_STEPS_ID = [
    { key: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran', icon: CreditCard },
    { key: 'PAYMENT_VERIFIED', label: 'Pembayaran Diverifikasi', icon: CheckCircle },
    { key: 'IN_PRODUCTION', label: 'Sedang Disiapkan', icon: Package },
    { key: 'SHIPPED', label: 'Dalam Pengiriman', icon: Truck },
    { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
];

interface OrderTrackingClientProps {
    id: string;
}

export default function OrderTrackingResultClient({ id }: OrderTrackingClientProps) {
    const invoice = id;
    const router = useRouter();

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Bank State
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [sourceBankName, setSourceBankName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'QRIS'>('BANK');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (invoice) fetchOrder();
    }, [invoice]);

    useEffect(() => {
        if (order?.brandId) {
            fetchBanks(order.brandId);
        }
    }, [order]);

    const fetchBanks = async (brandId?: string) => {
        try {
            const url = brandId ? `/api/public/banks?brandId=${brandId}` : '/api/public/banks';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setBanks(data);
                if (data.length > 0) setSelectedBankId(data[0].id);
            }
        } catch (e) { }
    };

    const fetchOrder = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/public/orders/${invoice}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                // Set initial payment method from order data if available
                if (data.paymentMethod === 'QRIS') {
                    setPaymentMethod('QRIS');
                } else if (data.paymentMethod === 'WHATSAPP' || data.paymentMethod === 'BANK') {
                    setPaymentMethod('BANK');
                }
            } else {
                setError('Pesanan tidak ditemukan atau nomor invoice tidak valid');
            }
        } catch (err) {
            setError('Gagal memuat data pesanan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleUploadProof = async () => {
        if (!uploadFile || !order) return;

        if (paymentMethod === 'BANK') {
            if (!selectedBankId || !sourceBankName) {
                toast.error('Pilih bank tujuan dan masukkan bank pengirim Anda.');
                return;
            }
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('proof', uploadFile);
            formData.append('destinationBankId', selectedBankId);
            formData.append('sourceBankName', sourceBankName);
            formData.append('paymentType', paymentMethod);

            const res = await fetch(`/api/public/orders/${order.id}/proof`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast.success('Bukti pembayaran berhasil diunggah! Kami akan segera memverifikasinya.');
                setUploadFile(null);
                setSourceBankName('');
                fetchOrder();
            } else {
                const err = await res.json();
                toast.error('Gagal mengunggah: ' + (err.error || 'Terjadi kesalahan sistem'));
            }
        } catch (e: any) {
            toast.error('Gagal mengunggah: ' + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        const confirm = window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.');
        if (!confirm) return;

        setIsCancelling(true);
        try {
            const res = await fetch(`/api/public/orders/${order.id}/cancel`, {
                method: 'POST'
            });

            if (res.ok) {
                toast.success('Pesanan berhasil dibatalkan.');
                fetchOrder();
            } else {
                const err = await res.json();
                toast.error('Gagal membatalkan pesanan: ' + (err.error || 'Terjadi kesalahan'));
            }
        } catch (e: any) {
            toast.error('Gagal membatalkan pesanan: ' + e.message);
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="w-10 h-10 animate-spin text-[#2D3A2D]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-6">
                        <div className="text-[#2D3A2D] font-black text-2xl uppercase tracking-widest">{error}</div>
                        <button onClick={() => router.push('/order/track')} className="text-[#8B7E66] font-bold underline hover:text-[#2D3A2D] transition-colors">
                            Kembali ke Pencarian
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const total = order.total || 0;
    const items = order.items || [];

    // Payment Calculations
    const payments = order.payments || [];
    const verifiedPayments = payments.filter((p: any) => p.isVerified);
    const totalPaid = verifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remainingBalance = total - totalPaid;

    // Dynamic DP Logic
    const dpPercentage = order.paymentSettings?.downPaymentPercentage || 50;
    const dpDecimal = dpPercentage / 100;
    const dpAmount = total * dpDecimal;

    // Determine what to pay next
    let nextPaymentAmount = 0;
    let paymentLabel = '';

    if (order.status === 'WAITING_PAYMENT' || order.status === 'DIPESAN') {
        nextPaymentAmount = order.status === 'DIPESAN' ? total : dpAmount;
        paymentLabel = order.status === 'DIPESAN' ? 'Pembayaran Penuh' : `Uang Muka (${dpPercentage}%)`;
    } else if (order.status === 'WAITING_FINAL_PAYMENT') {
        nextPaymentAmount = remainingBalance;
        paymentLabel = 'Sisa Pembayaran';
    }

    const qrisEnabled = order.paymentSettings?.qrisEnabled;
    const qrisImageUrl = order.paymentSettings?.qrisImageUrl;

    // Unified Status Mapping (Bridge Admin status to Tracking status)
    const statusMap: Record<string, string> = {
        'DIBAYAR': 'PAYMENT_VERIFIED',
        'DISIAPKAN': 'IN_PRODUCTION',
        'DIKIRIM': 'SHIPPED',
        'SELESAI': 'COMPLETED'
    };
    const displayStatus = statusMap[order.status] || order.status;

    // Dynamic Workflow Logic
    const hasReadyToEat = items.some((item: any) => item.categorySlug === 'siap-saji');

    let extendedStatusSteps = [];
    if (hasReadyToEat) {
        extendedStatusSteps = [
            { key: 'DIPESAN', label: 'Diterima', icon: Package },
            { key: 'PAYMENT_VERIFIED', label: 'Bayar OK', icon: CheckCircle },
            { key: 'IN_SYSTEM', label: 'Diproses', icon: Loader2 },
            { key: 'IN_PRODUCTION', label: 'Dimasak', icon: Utensils },
            { key: 'PACKING', label: 'Dikemas', icon: Box },
            { key: 'SHIPPED', label: 'Dikirim', icon: Truck },
            { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
        ];
    } else {
        extendedStatusSteps = [
            { key: 'DIPESAN', label: 'Diterima', icon: Package },
            { key: 'PAYMENT_VERIFIED', label: 'Bayar OK', icon: CheckCircle },
            { key: 'IN_PRODUCTION', label: 'Dikemas', icon: Box },
            { key: 'SHIPPED', label: 'Dikirim', icon: Truck },
            { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
        ];
    }

    // Determine current step index with fallback mapping
    const stepHighlightMap: Record<string, string> = {
        'MENUNGGU_VERIFIKASI_QRIS': 'DIPESAN',
        'WAITING_PAYMENT': 'DIPESAN',
        'DISIAPKAN': 'IN_PRODUCTION'
    };
    const effectiveStatus = stepHighlightMap[order.status] || displayStatus;
    const currentStepIndex = extendedStatusSteps.findIndex(s => s.key === effectiveStatus);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FDFBF7] to-white">
            <header className="fixed top-0 inset-x-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-[#E5E1D8]/50 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" className="h-14 w-auto transition-transform hover:scale-105 duration-300" />
                        <div className="h-10 w-px bg-[#E5E1D8] hidden sm:block" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#8B7E66] font-black uppercase tracking-[0.2em]">Pelacakan Pesanan</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
                <button onClick={() => router.push('/order/track')} className="flex items-center gap-2 text-[#8B7E66] hover:text-[#2D3A2D] mb-8 font-bold transition-all group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Pencarian
                </button>

                <div className="flex flex-col lg:flex-row gap-10 pt-20">
                    {/* Left: Order Info */}
                    <div className="flex-1 space-y-8">
                        <div className="bg-gradient-to-br from-white to-[#FDFBF7] rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-[#8B7E66]/5 border border-[#E5E1D8]/60 relative overflow-hidden">
                            {/* Decorative blur */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B7E66]/5 rounded-full blur-3xl -z-10"></div>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                <div>
                                    <h1 className="text-2xl font-black text-[#2D3A2D] uppercase tracking-tight">Pesanan #{order.invoiceNo}</h1>
                                    <p className="text-sm text-[#8B7E66] font-medium mt-1">Dipesan pada {safeFormatDate(order.createdAt)}</p>
                                </div>
                                <span className="px-5 py-2 bg-[#F9F7F2] text-[#2D3A2D] text-[10px] font-black rounded-full border border-[#E5E1D8] uppercase tracking-widest">
                                    {(order.status || '').replace('_', ' ')}
                                </span>
                            </div>

                            {/* Products List */}
                            <div className="space-y-6 mb-10">
                                <h3 className="text-xs font-black text-[#2D3A2D] uppercase tracking-[0.2em] mb-4">Daftar Menu</h3>
                                {items.length > 0 ? (
                                    items.map((item: any) => (
                                        <div key={item.id} className="flex gap-6 p-5 bg-[#FDFBF7] rounded-[2rem] border border-[#F9F7F2] hover:shadow-md transition-shadow">
                                            <div className="w-24 h-24 bg-stone-200 rounded-[1.5rem] overflow-hidden flex-shrink-0 flex items-center justify-center text-xs text-stone-400">
                                                {item.mockupResultPath ? (
                                                    <img src={item.mockupResultPath} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <Package className="w-10 h-10 opacity-20" />
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h3 className="font-black text-[#2D3A2D] text-lg leading-tight uppercase tracking-tight">{item.name}</h3>
                                                <div className="text-sm text-[#8B7E66] font-bold mt-1 uppercase tracking-wide">
                                                    {item.variantName || '-'} <span className="text-stone-300 mx-2">|</span> x{item.quantity}
                                                </div>
                                                <div className="text-[#2D3A2D] font-black mt-2 text-md">Rp {Number(item.subtotal).toLocaleString('id-ID')}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Single Item Fallback */
                                    <div className="flex gap-6 p-5 bg-[#FDFBF7] rounded-[2rem] border border-[#F9F7F2]">
                                        <div className="w-24 h-24 bg-stone-200 rounded-[1.5rem] overflow-hidden flex-shrink-0">
                                            {order.variantImage ? (
                                                <img src={order.variantImage} alt="Product" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-bold uppercase">No Image</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="font-black text-[#2D3A2D] text-lg uppercase tracking-tight">{order.productName || 'Unknown Product'}</h3>
                                            <div className="text-sm text-[#8B7E66] font-bold">{order.variantName} x{order.quantity}</div>
                                            <div className="text-[#2D3A2D] font-black mt-2">Rp {order.total.toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="border-t border-[#F9F7F2] pt-8 mb-10">
                                <h3 className="text-xs font-black text-[#2D3A2D] uppercase tracking-[0.2em] mb-6">Ringkasan Pembayaran</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#8B7E66] font-bold uppercase tracking-widest text-[10px]">Total Tagihan</span>
                                        <span className="font-black text-[#2D3A2D]">Rp {total.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#8B7E66] font-bold uppercase tracking-widest text-[10px]">Telah Dibayar</span>
                                        <span className="font-black text-emerald-600">- Rp {totalPaid.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-t border-dashed border-[#E5E1D8] mt-4">
                                        <span className="text-[#2D3A2D] font-black uppercase tracking-widest text-xs">Sisa Pelunasan</span>
                                        <span className="text-xl font-black text-[#2D3A2D]">Rp {remainingBalance.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-[#2D3A2D] uppercase tracking-[0.2em] mb-4">Status Perjalanan</h3>
                                <div className="ml-4 pl-10 border-l-[3px] border-[#F9F7F2] space-y-10 py-6">
                                    {extendedStatusSteps.map((step, idx) => {
                                        const isCompleted = idx <= currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.key} className={`relative ${isCompleted ? 'opacity-100' : 'opacity-20'}`}>
                                                <div className={`absolute -left-[58px] w-12 h-12 rounded-full flex items-center justify-center border-8 border-[#FDFBF7] shadow-sm transition-all duration-500 ${isCompleted ? 'bg-[#2D3A2D] text-white scale-110' : 'bg-stone-100 text-stone-300'}`}>
                                                    <Icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                                </div>
                                                <div className={`text-sm font-black uppercase tracking-widest ${isCurrent ? 'text-[#2D3A2D]' : 'text-[#8B7E66]'}`}>{step.label}</div>
                                                {(() => {
                                                    const log = order.logs?.find((l: any) => l.status === step.key);
                                                    return (log && log.createdAt) ? <div className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-tighter">{safeFormatTime(log.createdAt)} • {safeFormatDate(log.createdAt)}</div> : null;
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment & Actions */}
                    <div className="w-full lg:w-96 space-y-6">
                        {/* Payment Card */}
                        <div className="bg-gradient-to-b from-[#2D3A2D] to-[#1A241A] rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-green-900/20 sticky top-28 text-white relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-[#FDFBF7]/60">
                                <CreditCard className="w-4 h-4" /> Aksi Pembayaran
                            </h3>

                            {(order.status === 'WAITING_PAYMENT' || order.status === 'WAITING_FINAL_PAYMENT' || order.status === 'DIPESAN') ? (
                                <div className="space-y-8">
                                    <div className="p-8 bg-[#FDFBF7]/10 rounded-[2rem] text-center border border-[#FDFBF7]/10 backdrop-blur-sm">
                                        <div className="text-[10px] text-[#FDFBF7]/60 mb-2 font-black uppercase tracking-[0.2em]">{paymentLabel}</div>
                                        <div className="text-3xl font-black text-[#FDFBF7]">Rp {nextPaymentAmount.toLocaleString('id-ID')}</div>
                                    </div>

                                    {qrisEnabled && (
                                        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl">
                                            <button
                                                onClick={() => setPaymentMethod('BANK')}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'BANK' ? 'bg-[#FDFBF7] text-[#2D3A2D] shadow-lg' : 'text-[#FDFBF7]/40 hover:text-[#FDFBF7]'}`}
                                            >
                                                Transfer Bank
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('QRIS')}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'QRIS' ? 'bg-[#FDFBF7] text-[#2D3A2D] shadow-lg' : 'text-[#FDFBF7]/40 hover:text-[#FDFBF7]'}`}
                                            >
                                                Scan QRIS
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-sm">
                                        {paymentMethod === 'BANK' ? (
                                            <>
                                                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 text-[#FDFBF7]/60 ml-2">Tujuan Transfer:</label>
                                                <select
                                                    value={selectedBankId}
                                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                                    className="w-full p-4 bg-black/10 border border-[#FDFBF7]/20 rounded-2xl mb-4 text-[#FDFBF7] font-bold focus:ring-2 ring-white/20 outline-none"
                                                >
                                                    {banks.map(bank => (
                                                        <option key={bank.id} value={bank.id} className="text-stone-900">{bank.bankName} - {bank.accountHolder}</option>
                                                    ))}
                                                </select>

                                                {(() => {
                                                    const bank = banks.find(b => b.id === selectedBankId);
                                                    return bank ? (
                                                        <div className="font-black block bg-[#FDFBF7] p-5 rounded-2xl text-center mb-6 text-[#2D3A2D] shadow-inner">
                                                            <div className="text-[10px] text-[#8B7E66] uppercase tracking-widest mb-1">{bank.bankName}</div>
                                                            <div className="text-xl tracking-tighter">{bank.accountNumber}</div>
                                                            <div className="text-[10px] font-bold mt-2 opacity-60 uppercase">a.n {bank.accountHolder}</div>
                                                        </div>
                                                    ) : <div className="text-center text-[10px] font-black text-[#FDFBF7]/40 uppercase tracking-widest mb-6">Pilih bank tujuan</div>;
                                                })()}

                                                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 text-[#FDFBF7]/60 ml-2">Bank Pengirim:</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: BCA / Mandiri / GoPay"
                                                    value={sourceBankName}
                                                    onChange={(e) => setSourceBankName(e.target.value)}
                                                    className="w-full p-4 bg-black/10 border border-[#FDFBF7]/20 rounded-2xl mb-2 text-[#FDFBF7] placeholder:text-[#FDFBF7]/30 font-bold outline-none"
                                                />
                                            </>
                                        ) : (
                                            <div className="space-y-6 mb-8">
                                                <div className="bg-white rounded-[2rem] p-6 flex flex-col items-center shadow-2xl">
                                                    {qrisImageUrl ? (
                                                        <img src={qrisImageUrl} alt="QRIS" className="w-full max-w-[220px] aspect-square object-contain" />
                                                    ) : (
                                                        <div className="w-48 h-48 bg-stone-50 flex items-center justify-center text-stone-300 italic text-[10px] font-black uppercase tracking-widest">QRIS Belum Tersedia</div>
                                                    )}
                                                    <p className="mt-5 text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] text-center px-4 leading-relaxed">Scan QR di atas dengan aplikasi mobile banking atau e-wallet (GoPay, OVO, ShopeePay) Anda</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-[#FDFBF7]/10 pt-8">
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-4 text-[#FDFBF7]/60 ml-2 text-center">Unggah Bukti Pembayaran</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full text-[10px] font-black text-[#FDFBF7]/40 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#FDFBF7] file:text-[#2D3A2D] hover:file:bg-[#F9F7F2] transition-all cursor-pointer"
                                        />
                                        <button
                                            onClick={handleUploadProof}
                                            disabled={isUploading || !uploadFile}
                                            className="mt-6 w-full py-4 bg-[#FDFBF7] text-[#2D3A2D] rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                        >
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {uploadFile ? 'Kirim Konfirmasi' : 'Pilih File Bukti'}
                                        </button>

                                        <button
                                            onClick={handleCancelOrder}
                                            disabled={isCancelling}
                                            className="mt-6 w-full py-2 text-[#FDFBF7]/40 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                            Batalkan Pesanan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 bg-[#FDFBF7]/10 rounded-[2.5rem] text-center border border-[#FDFBF7]/10 backdrop-blur-sm">
                                    <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                        <CheckCircle className="w-8 h-8 text-[#2D3A2D]" />
                                    </div>
                                    <div className="font-black text-lg uppercase tracking-tight mb-2">Terima Kasih!</div>
                                    <p className="text-xs font-bold text-[#FDFBF7]/60 leading-relaxed uppercase tracking-wide">
                                        Pesanan Anda sedang kami proses. Kami akan memberikan kabar selanjutnya melalui email Bunda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
