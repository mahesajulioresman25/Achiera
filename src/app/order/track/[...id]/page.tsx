
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, Package, Truck, CreditCard, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STATUS_STEPS = [
    { key: 'WAITING_PAYMENT', label: 'Waiting Payment', icon: CreditCard },
    { key: 'PAYMENT_VERIFIED', label: 'Payment Verified', icon: CheckCircle },
    { key: 'IN_PRODUCTION', label: 'In Production', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
];

export default function OrderTrackingResultPage({ params }: { params: Promise<{ id: string[] }> }) {
    const resolvedParams = use(params);
    // Join segments back to "INV/YYYYMMDD/XXXX" and decode just in case
    const invoice = decodeURIComponent(resolvedParams.id.join('/'));

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

    useEffect(() => {
        if (invoice) fetchOrder();
        fetchBanks();
    }, [invoice]);

    const fetchBanks = async () => {
        try {
            const res = await fetch('/api/public/banks');
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
            // API now accepts ID or Invoice. We pass whatever is in URL.
            // encodeURIComponent is crucial here because of the slashes in invoice ID
            const res = await fetch(`/api/public/orders/${encodeURIComponent(invoice)}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            } else {
                setError('Order not found or invalid invoice');
            }
        } catch (err) {
            setError('Failed to load order');
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

        if (!selectedBankId || !sourceBankName) {
            toast.error('Please select the destination bank and enter your source bank.');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('proof', uploadFile);
            formData.append('destinationBankId', selectedBankId);
            formData.append('sourceBankName', sourceBankName);

            const res = await fetch(`/api/public/orders/${order.id}/proof`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toast.success('Payment proof uploaded successfully! We will verify it shortly.');
                setUploadFile(null);
                setSourceBankName('');
                fetchOrder(); // Refresh status
            } else {
                const err = await res.json();
                toast.error('Upload failed: ' + (err.error || 'Unknown error'));
            }
        } catch (e: any) {
            toast.error('Upload failed: ' + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col bg-stone-50">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="text-red-500 font-bold text-lg">{error}</div>
                        <button onClick={() => router.push('/order/track')} className="text-stone-500 underline hover:text-stone-900">
                            Back to Search
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

    if (order.status === 'WAITING_PAYMENT') {
        nextPaymentAmount = dpAmount;
        paymentLabel = `Down Payment (${dpPercentage}%)`;
    } else if (order.status === 'WAITING_FINAL_PAYMENT') {
        nextPaymentAmount = remainingBalance;
        paymentLabel = 'Remaining Balance';
    }

    // Update Status Steps to include Final Payment
    const extendedStatusSteps = [
        { key: 'WAITING_PAYMENT', label: 'Waiting DP', icon: CreditCard },
        { key: 'PAYMENT_VERIFIED', label: 'DP Verified', icon: CheckCircle },
        { key: 'IN_PRODUCTION', label: 'In Production', icon: Package },
        { key: 'WAITING_FINAL_PAYMENT', label: 'Final Payment', icon: CreditCard }, // New Step
        { key: 'SHIPPED', label: 'Shipped', icon: Truck },
        { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    ];

    const currentStepIndex = extendedStatusSteps.findIndex(s => s.key === order.status) ?? 0;

    return (
        <div className="min-h-screen flex flex-col bg-stone-50">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <button onClick={() => router.push('/order/track')} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Search
                </button>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Order Info */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-stone-900">Order #{order.invoiceNo}</h1>
                                    <p className="text-sm text-stone-500">Placed on {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Products List */}
                            <div className="space-y-4 mb-6">
                                <h3 className="font-bold text-stone-900">Items Ordered</h3>
                                {items.length > 0 ? (
                                    items.map((item: any) => (
                                        <div key={item.id} className="flex gap-4 p-4 bg-stone-50 rounded-xl">
                                            <div className="w-20 h-20 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xs text-stone-400">
                                                {item.mockupResultPath ? (
                                                    <img src={item.mockupResultPath} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <Package className="w-8 h-8 opacity-20" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-stone-900">{item.name}</h3>
                                                <div className="text-sm text-stone-600">
                                                    {item.variantName || '-'} <span className="text-stone-400 mx-1">|</span> x{item.quantity}
                                                </div>
                                                <div className="text-amber-600 font-bold mt-1">Rp {Number(item.subtotal).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Single Item Fallback */
                                    <div className="flex gap-4 p-4 bg-stone-50 rounded-xl">
                                        <div className="w-20 h-20 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {order.variantImage ? (
                                                <img src={order.variantImage} alt="Product" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">No Image</div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-stone-900">{order.productName || 'Unknown Product'}</h3>
                                            <div className="text-sm text-stone-600">{order.variantName} x{order.quantity}</div>
                                            <div className="text-amber-600 font-bold mt-1">Rp {order.total.toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="border-t border-stone-100 pt-4 mb-6">
                                <h3 className="font-bold text-stone-900 mb-2">Payment Summary</h3>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-stone-600">Total Amount</span>
                                    <span className="font-bold">Rp {total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-green-600">Paid Amount</span>
                                    <span className="font-bold text-green-700">- Rp {totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1 border-t border-dashed border-stone-200 mt-2 pt-2">
                                    <span className="text-stone-900 font-bold">Remaining Balance</span>
                                    <span className="font-bold text-amber-600">Rp {remainingBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-stone-900">Order Status</h3>
                                <div className="ml-2 pl-6 border-l-2 border-stone-200 space-y-8 py-2">
                                    {extendedStatusSteps.map((step, idx) => {
                                        const isCompleted = idx <= currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.key} className={`relative ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                                                <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-stone-50 ${isCompleted ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm font-bold text-stone-900">{step.label}</div>
                                                {/* Find matching log date if available */}
                                                {(() => {
                                                    // Loose matching for logs
                                                    const log = order.logs?.find((l: any) => l.status === step.key);
                                                    return (log && log.createdAt) ? <div className="text-xs text-stone-500">{new Date(log.createdAt).toLocaleDateString()}</div> : null;
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment & Actions */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* Payment Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-24">
                            <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Payment Action
                            </h3>

                            {(order.status === 'WAITING_PAYMENT' || order.status === 'WAITING_FINAL_PAYMENT') ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                                        <div className="text-xs text-amber-800 mb-1 font-bold uppercase">{paymentLabel}</div>
                                        <div className="text-2xl font-bold text-amber-900">Rp {nextPaymentAmount.toLocaleString()}</div>
                                    </div>

                                    <div className="text-sm text-stone-600">
                                        <label className="block font-bold mb-2">Transfer Destination:</label>
                                        <select
                                            value={selectedBankId}
                                            onChange={(e) => setSelectedBankId(e.target.value)}
                                            className="w-full p-2 border border-stone-200 rounded-lg mb-3"
                                        >
                                            {banks.map(bank => (
                                                <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountHolder}</option>
                                            ))}
                                        </select>

                                        {/* Selected Bank Details */}
                                        {(() => {
                                            const bank = banks.find(b => b.id === selectedBankId);
                                            return bank ? (
                                                <div className="font-mono font-bold block bg-stone-100 p-3 rounded text-center mb-4">
                                                    {bank.bankName} {bank.accountNumber}
                                                    <div className="text-xs font-normal mt-1 text-stone-500">a.n {bank.accountHolder}</div>
                                                </div>
                                            ) : <div className="text-center text-xs text-stone-400 italic mb-4">Select a bank</div>;
                                        })()}

                                        <label className="block font-bold mb-2">Payment Source:</label>
                                        <input
                                            type="text"
                                            placeholder="Your Bank (e.g., BCA / GoPay)"
                                            value={sourceBankName}
                                            onChange={(e) => setSourceBankName(e.target.value)}
                                            className="w-full p-2 border border-stone-200 rounded-lg mb-1"
                                        />
                                        <div className="text-xs text-stone-400 mb-4">Enter the bank/wallet name you transferred from.</div>
                                    </div>

                                    <div className="border-t border-stone-100 pt-4">
                                        <label className="block text-sm font-bold text-stone-900 mb-2">Upload Payment Proof</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                                        />
                                        {uploadFile && (
                                            <button
                                                onClick={handleUploadProof}
                                                disabled={isUploading}
                                                className="mt-3 w-full py-2 bg-stone-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-stone-800 transition-colors"
                                            >
                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                Upload Proof
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-green-50 text-green-800 rounded-xl text-center">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-3" />
                                    <div className="font-bold mb-1">No Action Needed</div>
                                    <p className="text-sm opacity-80">
                                        Your order is being processed. We will notify you when payment is needed.
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
