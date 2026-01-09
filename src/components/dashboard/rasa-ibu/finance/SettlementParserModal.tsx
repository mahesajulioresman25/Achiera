'use client';

import React, { useState, useRef } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, ArrowRight, Wallet, Receipt, FileText, Upload, Info as InfoIcon, BrainCircuit as BrainCircuitIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
    parseSettlementEmailAction,
    parseSettlementCSVAction,
    parseSettlementPDFAction,
    executeSettlementReconciliationAction
} from '@/lib/actions/rasa-ibu/settlement';

interface SettlementParserModalProps {
    brandId: string;
    onClose: () => void;
}

export default function SettlementParserModal({ brandId, onClose }: SettlementParserModalProps) {
    const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'SUCCESS'>('INPUT');
    const [inputMode, setInputMode] = useState<'AI' | 'MANUAL' | 'CSV'>('AI');

    // Manual Input State
    const [manualPlatform, setManualPlatform] = useState('SHOPEE');
    const [manualOrders, setManualOrders] = useState<Array<{ id: string, netFn: string }>>([{ id: '', netFn: '' }]);

    const [rawContent, setRawContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseResult, setParseResult] = useState<any>(null);
    const [reconciliationResults, setReconciliationResults] = useState<any[]>([]);

    // CSV State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const addManualRow = () => {
        setManualOrders([...manualOrders, { id: '', netFn: '' }]);
    };

    const removeManualRow = (idx: number) => {
        const newRows = [...manualOrders];
        newRows.splice(idx, 1);
        setManualOrders(newRows);
    };

    const handleManualSubmit = () => {
        // Validation
        const validOrders = manualOrders.filter(o => o.id && o.netFn);
        if (validOrders.length === 0) {
            toast.error("Minimal satu pesanan harus diisi.");
            return;
        }

        const totalNet = validOrders.reduce((sum, o) => sum + Number(o.netFn), 0);

        setParseResult({
            platform: manualPlatform,
            settlementDate: new Date().toISOString().split('T')[0],
            currency: 'IDR',
            orders: validOrders.map(o => ({
                externalOrderId: o.id,
                grossAmount: 0, // Manual doesn't track gross/fees separately for simplicity
                fees: 0,
                netAmount: Number(o.netFn),
                description: 'Manual Entry'
            })),
            totalNetPayout: totalNet,
            confidence: 1.0
        });
        setStep('PREVIEW');
    };

    const handleParse = async () => {
        setIsProcessing(true);
        try {
            if (inputMode === 'CSV') {
                if (!selectedFile) {
                    toast.error("Pilih file CSV atau PDF dulu ya");
                    setIsProcessing(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', selectedFile);

                let res;
                if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
                    // PDF Parsing (Grab/GoFood)
                    res = await parseSettlementPDFAction(brandId, formData);
                } else {
                    // CSV Parsing (Shopee)
                    res = await parseSettlementCSVAction(brandId, formData);
                }

                if (res.success) {
                    setParseResult(res.data);
                    setStep('PREVIEW');
                } else {
                    toast.error("Gagal membaca file: " + res.error);
                }

            } else {
                // AI EMAIL PARSING
                if (!rawContent.trim()) {
                    toast.error("Mohon tempelkan konten email terlebih dahulu.");
                    setIsProcessing(false);
                    return;
                }

                const res = await parseSettlementEmailAction(brandId, rawContent);
                if (res.success) {
                    setParseResult(res.data);
                    setStep('PREVIEW');
                } else {
                    toast.error("Gagal memproses email: " + res.error);
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            const res = await executeSettlementReconciliationAction(brandId, parseResult);
            if (res.success) {
                setReconciliationResults(res.results || []);
                setStep('SUCCESS');
                toast.success("Settlement berhasil diproses!");
            } else {
                toast.error("Gagal melakukan rekonsiliasi: " + res.error);
            }
        } catch (error) {
            toast.error("Gagal menyimpan data.");
        } finally {
            setIsProcessing(false);
        }
    };

    const currency = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800">AI Settlement Parser</h3>
                            <p className="text-xs text-gray-500 font-medium">Otomatisasi Rekonsiliasi Payout Marketplace</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'INPUT' && (
                        <div className="space-y-4">
                            {/* Toggle Mode */}
                            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setInputMode('AI')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode === 'AI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    AI Parser
                                </button>
                                <button
                                    onClick={() => setInputMode('CSV')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode === 'CSV' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Upload CSV
                                </button>
                                <button
                                    onClick={() => setInputMode('MANUAL')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${inputMode === 'MANUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Input Manual
                                </button>
                            </div>

                            {inputMode === 'AI' ? (
                                <>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                        <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="text-xs text-blue-800 leading-relaxed">
                                            <p className="font-bold mb-1">Cara Penggunaan:</p>
                                            <ol className="list-decimal pl-4 space-y-1">
                                                <li>Buka email notifikasi payout/settlement (Shopee/Tokopedia/dll).</li>
                                                <li>Copy seluruh teks isi email (Ctrl+A, Ctrl+C).</li>
                                                <li>Paste ke kolom di bawah ini. AI akan mengekstrak datanya.</li>
                                            </ol>
                                        </div>
                                    </div>

                                    <textarea
                                        value={rawContent}
                                        onChange={(e) => setRawContent(e.target.value)}
                                        placeholder="Paste konten email di sini..."
                                        className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono resize-none bg-gray-50 transition-all placeholder:text-gray-400"
                                    />
                                </>
                            ) : inputMode === 'CSV' ? (
                                <div className="space-y-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center hover:bg-gray-50 transition-all cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                            {selectedFile ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-800 text-center">
                                            {selectedFile ? selectedFile.name : "Klik untuk Upload File Laporan"}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-2 text-center max-w-xs">
                                            Format yang didukung: <strong>.CSV</strong> (Shopee) & <strong>.PDF</strong> (GrabFood/GoFood).
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".csv,.pdf,application/pdf"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                                        />
                                    </div>
                                    {selectedFile && (
                                        <div className="flex justify-center">
                                            <button onClick={() => setSelectedFile(null)} className="text-xs text-rose-500 font-bold hover:underline">
                                                Hapus File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 mb-4">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <div className="text-xs text-amber-800 leading-relaxed">
                                            <p className="font-bold">Mode Manual</p>
                                            <p>Gunakan mode ini jika AI gagal membaca email. Masukkan Order ID dan Jumlah Bersih (Net) yang diterima.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 block mb-2">Platform</label>
                                        <select
                                            value={manualPlatform}
                                            onChange={(e) => setManualPlatform(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="SHOPEE">SHOPEE</option>
                                            <option value="TOKOPEDIA">TOKOPEDIA</option>
                                            <option value="GRABFOOD">GRABFOOD</option>
                                            <option value="GO_FOOD">GOFOOD</option>
                                            <option value="TIKTOK_SHOP">TIKTOK SHOP</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 block">Daftar Pesanan</label>
                                        {manualOrders.map((row, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Order ID / No. Invoice"
                                                    value={row.id}
                                                    onChange={(e) => {
                                                        const newRows = [...manualOrders];
                                                        newRows[idx].id = e.target.value;
                                                        setManualOrders(newRows);
                                                    }}
                                                    className="flex-1 p-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Net Amount"
                                                    value={row.netFn}
                                                    onChange={(e) => {
                                                        const newRows = [...manualOrders];
                                                        newRows[idx].netFn = e.target.value;
                                                        setManualOrders(newRows);
                                                    }}
                                                    className="w-32 p-2.5 rounded-xl border border-gray-200 text-xs font-bold"
                                                />
                                                <button onClick={() => removeManualRow(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={addManualRow} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2">
                                            + Tambah Baris
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'PREVIEW' && parseResult && (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Net Payout</p>
                                    <h3 className="text-2xl font-black text-emerald-700">{currency.format(parseResult.totalNetPayout)}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1 bg-white rounded-full border border-emerald-200 text-xs font-bold text-emerald-800 inline-flex items-center gap-2">
                                        {parseResult.platform}
                                    </div>
                                    <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                                        Confidence: {Math.round(parseResult.confidence * 100)}%
                                    </p>
                                </div>
                            </div>

                            {/* Orders List */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rincian Pesanan ({parseResult.orders.length})</h4>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {parseResult.orders.map((order: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                    <Receipt className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{order.externalOrderId}</p>
                                                    <p className="text-[10px] text-gray-400">Total Fee: {currency.format(order.fees)}</p>
                                                    {order.feeDetails && (
                                                        <div className="mt-1 text-[9px] text-gray-400 space-y-0.5 border-l-2 border-gray-100 pl-2">
                                                            {order.feeDetails.commission > 0 && <p>Komisi Marketplace: {currency.format(order.feeDetails.commission)}</p>}
                                                            {order.feeDetails.serviceFee > 0 && <p>Biaya Layanan: {currency.format(order.feeDetails.serviceFee)}</p>}
                                                            {order.feeDetails.transactionFee > 0 && <p>Biaya Transaksi: {currency.format(order.feeDetails.transactionFee)}</p>}
                                                            {order.feeDetails.voucherSubsidy > 0 && <p>Subsidi Voucher Makanan: {currency.format(order.feeDetails.voucherSubsidy)}</p>}
                                                            {order.feeDetails.directDiscount > 0 && <p>Diskon Langsung Makanan: {currency.format(order.feeDetails.directDiscount)}</p>}
                                                            {order.feeDetails.pb1 > 0 && <p>Pajak PB1: {currency.format(order.feeDetails.pb1)}</p>}
                                                            {order.feeDetails.shippingSubsidy > 0 && <p>Subsidi Ongkir: {currency.format(order.feeDetails.shippingSubsidy)}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-800">{currency.format(order.netAmount)}</p>
                                                <p className="text-[10px] text-gray-400 line-through decoration-rose-400">{currency.format(order.grossAmount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Warnings if low confidence */}
                            {parseResult.confidence < 0.8 && (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                    <p className="text-xs text-amber-800 font-medium">Confidence Score rendah. Mohon periksa kembali angka-angka di atas sebelum konfirmasi.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-800">Settlement Berhasil!</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                                    Dana telah dipindahkan dari Piutang ke Bank. Laporan keuangan telah diperbarui.
                                </p>
                            </div>
                            <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 text-left space-y-2 border border-gray-100">
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>Sukses:</span>
                                    <span className="text-green-600 font-bold">{reconciliationResults.filter(r => r.success).length} Pesanan</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>Gagal/Skip:</span>
                                    <span className="text-rose-600 font-bold">{reconciliationResults.filter(r => !r.success).length} Pesanan</span>
                                </div>
                            </div>

                            {/* Failure Details */}
                            {reconciliationResults.filter(r => !r.success).length > 0 && (
                                <div className="max-w-md mx-auto bg-rose-50 rounded-xl p-4 border border-rose-100 text-left">
                                    <h5 className="text-xs font-bold text-rose-700 mb-2">Rincian Gagal:</h5>
                                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {reconciliationResults.filter(r => !r.success).map((r, idx) => (
                                            <div key={idx} className="text-[10px] text-rose-600 flex justify-between">
                                                <span className="font-medium">{r.externalOrderId}:</span>
                                                <span>{r.reason || 'Sistem error'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warning Details */}
                            {reconciliationResults.filter(r => r.warning).length > 0 && (
                                <div className="max-w-md mx-auto bg-amber-50 rounded-xl p-4 border border-amber-100 text-left mt-2">
                                    <h5 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> Perbedaan Data (Mismatch):
                                    </h5>
                                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {reconciliationResults.filter(r => r.warning).map((r, idx) => (
                                            <div key={idx} className="text-[10px] text-amber-800 flex justify-between">
                                                <span className="font-medium">{r.externalOrderId}:</span>
                                                <span>{r.warning.replace('[MISMATCH: ', '').replace(']', '')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    {step === 'INPUT' && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Batal
                            </button>

                            {inputMode === 'MANUAL' ? (
                                <button
                                    onClick={handleManualSubmit}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                    Lanjut ke Preview
                                </button>
                            ) : (
                                <button
                                    onClick={handleParse}
                                    disabled={isProcessing || (inputMode === 'AI' && !rawContent.trim()) || (inputMode === 'CSV' && !selectedFile)}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            {inputMode === 'AI' ? 'Menganalisa...' : 'Membaca CSV...'}
                                        </>
                                    ) : (
                                        <>
                                            {inputMode === 'AI' ? <BrainCircuitIcon className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                                            {inputMode === 'AI' ? 'Analisa Settlement' : 'Proses CSV'}
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {step === 'PREVIEW' && (
                        <>
                            <button
                                onClick={() => setStep('INPUT')}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                disabled={isProcessing}
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Konfirmasi & Transfer Dana
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === 'SUCCESS' && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                        >
                            Tutup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}




