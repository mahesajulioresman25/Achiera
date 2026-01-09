'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Loader2, Camera, UploadCloud, ChevronRight, CheckCircle2 } from 'lucide-react';
import { recordExpenseAction, getLedgerAccountsAction } from '@/lib/actions/rasa-ibu/finance';
import { scanReceiptAction } from '@/lib/actions/rasa-ibu/finance/receipt-scanning';
import { toast } from 'sonner';

interface ExpenseEntryModalProps {
    brandId: string;
    onClose: () => void;
}

const EXPENSE_TYPES = [
    { value: 'SALARY', label: 'Gaji & Upah', icon: '👥' },
    { value: 'RENT', label: 'Sewa Tempat', icon: '🏠' },
    { value: 'UTILITIES', label: 'Listrik & Air', icon: '⚡' },
    { value: 'MARKETING', label: 'Iklan & Promo', icon: '📣' },
    { value: 'ADMIN', label: 'Admin & Kantor', icon: '📁' },
    { value: 'OTHER', label: 'Lain-lain', icon: '📦' },
];

export default function ExpenseEntryModal({ brandId, onClose }: ExpenseEntryModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [expenseAccountCode, setExpenseAccountCode] = useState('');
    const [description, setDescription] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [assetAccounts, setAssetAccounts] = useState<any[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Scanning State
    const [mode, setMode] = useState<'MANUAL' | 'SCAN'>('MANUAL');
    const [scanFile, setScanFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanPreview, setScanPreview] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await getLedgerAccountsAction(brandId);
            if (res.success) {
                const assets = res.data.filter((a: any) => a.type === 'ASSET');
                // Allow EXPENSE (Cost) and LIABILITY (Debt Repayment)
                const expenses = res.data.filter((a: any) => a.type === 'EXPENSE' || a.type === 'LIABILITY');

                setAssetAccounts(assets);
                setExpenseAccounts(expenses);

                if (assets.length > 0) setSourceAccountId(assets[0].code);
                if (expenses.length > 0) setExpenseAccountCode(expenses[0].code);
            }
        }
        load();
    }, [brandId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || Number(amount) <= 0) {
            setError('Jumlah nominal harus valid');
            return;
        }

        if (!expenseAccountCode) {
            setError('Silakan pilih kategori biaya');
            return;
        }

        setIsLoading(true);
        try {
            const res = await recordExpenseAction({
                brandId,
                amount: Number(amount),
                expenseAccountCode,
                description: description || `Biaya ${expenseAccountCode}`,
                date: new Date(),
                sourceAccountId
            });

            if (res.success) {
                onClose();
            } else {
                setError(res.error || 'Gagal menyimpan biaya');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScanFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setScanPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleScanUpload = async () => {
        if (!scanFile) return;
        setIsScanning(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', scanFile);

            const res = await scanReceiptAction(formData);
            if (res.success) {
                setScanResult(res.data);
                toast.success('Struk berhasil dipindai!');
            } else {
                setError(res.error || 'Gagal memindai struk');
            }
        } catch (err) {
            setError('Terjadi kesalahan sistem');
        } finally {
            setIsScanning(false);
        }
    };

    const applyScanResult = () => {
        if (!scanResult) return;

        if (scanResult.totalAmount) setAmount(scanResult.totalAmount.toString());

        const itemsSummary = scanResult.items?.map((i: any) => `${i.name} (${i.qty})`).join(', ');
        setDescription(`[SCAN] ${scanResult.merchant || 'Merchant'} - ${itemsSummary || 'Items'}`);

        setMode('MANUAL');
    };

    const updateScanResult = (field: string, value: any) => {
        setScanResult((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const updateScanItem = (idx: number, field: string, value: any) => {
        setScanResult((prev: any) => {
            const newItems = [...(prev.items || [])];
            newItems[idx] = { ...newItems[idx], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A241A]/60 backdrop-blur-md p-6">
            <div className="bg-[#FDFBF7] w-full max-w-xl max-h-[85vh] md:max-h-[90vh] flex flex-col rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="px-10 py-8 border-b border-[#E5E1D8] flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <Receipt className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#2D3A2D]">Catat Beban</h2>
                            <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-widest">Input Pengeluaran Operasional</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-3 hover:bg-rose-50 rounded-full transition-colors group border border-transparent hover:border-rose-100"
                    >
                        <X className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>

                {/* Mode Toggler */}
                <div className="px-10 py-4 bg-gray-50 border-b border-[#E5E1D8] flex gap-2">
                    <button
                        onClick={() => setMode('MANUAL')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'MANUAL' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}
                    >
                        Input Manual
                    </button>
                    <button
                        onClick={() => setMode('SCAN')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'SCAN' ? 'bg-[#2D3A2D] text-white shadow-lg' : 'text-[#8B7E66] hover:bg-white'}`}
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Scan Struk (AI)
                    </button>
                </div>

                {mode === 'SCAN' ? (
                    <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar h-full">
                        {!scanResult ? (
                            <div className="flex flex-col items-center justify-center space-y-6 h-full">
                                <div className="w-full max-w-sm border-3 border-dashed border-[#E5E1D8] rounded-[2rem] p-8 text-center bg-white hover:bg-[#faf9f6] transition-colors relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {scanPreview ? (
                                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                                            <img src={scanPreview} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white font-bold text-sm">Ganti Foto</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300">
                                                <Camera className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-[#2D3A2D]">Ambil / Upload Foto Struk</p>
                                                <p className="text-xs text-[#8B7E66] mt-1">Kami akan membaca detailnya otomatis</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {scanFile && (
                                    <button
                                        onClick={handleScanUpload}
                                        disabled={isScanning}
                                        className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 hover:-translate-y-1 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {isScanning ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Menganalisis Struk...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <UploadCloud className="w-4 h-4" />
                                                Proses dengan AI
                                            </div>
                                        )}
                                    </button>
                                )}

                                {error && <p className="text-rose-600 text-xs font-bold bg-rose-50 px-4 py-2 rounded-lg">{error}</p>}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-start gap-4">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black text-emerald-800">Analisis Berhasil!</h3>
                                        <p className="text-xs text-emerald-600 leading-relaxed">AI menemukan data transaksi. Silakan review sebelum dimasukkan ke form.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-[#E5E1D8] shadow-sm space-y-2">
                                        <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-wider">Merchant / Toko</p>
                                        <input
                                            type="text"
                                            value={scanResult.merchant || ''}
                                            onChange={(e) => updateScanResult('merchant', e.target.value)}
                                            className="w-full bg-transparent border-0 p-0 text-lg font-black text-[#2D3A2D] focus:ring-0 outline-none"
                                        />
                                    </div>
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-[#E5E1D8] shadow-sm space-y-2">
                                        <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-wider">Total Nominal</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-rose-500">Rp</span>
                                            <input
                                                type="number"
                                                value={scanResult.totalAmount || ''}
                                                onChange={(e) => updateScanResult('totalAmount', e.target.value)}
                                                className="w-full bg-transparent border-0 p-0 text-lg font-black text-[#2D3A2D] focus:ring-0 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-[1.5rem] border border-[#E5E1D8] shadow-sm col-span-1 md:col-span-2 space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                            <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-wider">Rincian Barang (Klik untuk edit)</p>
                                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full">AUTO-CAPTURED</span>
                                        </div>
                                        <div className="space-y-4">
                                            {scanResult.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 group">
                                                    <input
                                                        type="text"
                                                        value={item.name || ''}
                                                        onChange={(e) => updateScanItem(idx, 'name', e.target.value)}
                                                        className="flex-1 bg-gray-50/50 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 border-0 focus:bg-white focus:ring-1 focus:ring-rose-200 transition-all outline-none"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 group/qty">
                                                            <span className="text-[10px] font-bold text-gray-400">x</span>
                                                            <input
                                                                type="number"
                                                                value={item.qty || 1}
                                                                onChange={(e) => updateScanItem(idx, 'qty', e.target.value)}
                                                                className="w-12 bg-gray-50/50 px-2 py-2 rounded-lg text-xs font-black text-center text-gray-700 border-0 focus:bg-white focus:ring-1 focus:ring-rose-200 transition-all outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1 group/price">
                                                            <span className="text-[10px] font-bold text-gray-400">Rp</span>
                                                            <input
                                                                type="number"
                                                                value={item.total || 0}
                                                                onChange={(e) => updateScanItem(idx, 'total', e.target.value)}
                                                                className="w-24 bg-gray-50/50 px-3 py-2 rounded-lg text-xs font-mono font-bold text-right text-emerald-600 border-0 focus:bg-white focus:ring-1 focus:ring-rose-200 transition-all outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setScanResult(null); setScanFile(null); setScanPreview(null); }}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase hover:bg-gray-200 transition-colors"
                                    >
                                        Scan Ulang
                                    </button>
                                    <button
                                        onClick={applyScanResult}
                                        className="flex-[2] py-4 bg-[#2D3A2D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a241a] transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        Gunakan Data Ini <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Nominal (IDR)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <span className="text-lg font-black text-rose-600">Rp</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="block w-full pl-16 pr-5 py-5 bg-white border-2 border-[#E5E1D8] rounded-[2rem] text-2xl font-black text-[#2D3A2D] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Type Choice */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Kategori Biaya (Dari Chart of Accounts)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {expenseAccounts.map((acc: any) => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => setExpenseAccountCode(acc.code)}
                                        className={`px-6 py-4 rounded-2xl border-2 transition-all flex justify-between items-center group ${expenseAccountCode === acc.code
                                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md'
                                            : 'bg-white border-[#E5E1D8] text-[#8B7E66] hover:border-[#8B7E66]'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-tight">{acc.name}</p>
                                            <p className="text-[8px] opacity-60 font-bold">{acc.code}</p>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${expenseAccountCode === acc.code ? 'border-rose-500 bg-rose-500' : 'border-[#E5E1D8]'}`}>
                                            {expenseAccountCode === acc.code && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                ))}
                                {expenseAccounts.length === 0 && <p className="text-[10px] font-bold text-[#8B7E66] italic col-span-2">Belum ada akun biaya di CoA.</p>}
                            </div>
                        </div>

                        {/* Source & Desc */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Sumber Dana (Bank/Kas)</label>
                                <select
                                    value={sourceAccountId}
                                    onChange={(e) => setSourceAccountId(e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-[#E5E1D8] rounded-2xl text-xs font-bold text-[#2D3A2D] focus:border-rose-500 outline-none"
                                >
                                    {assetAccounts.map((acc: any) => (
                                        <option key={acc.code} value={acc.code}>{acc.name} ({acc.code})</option>
                                    ))}
                                    {assetAccounts.length === 0 && <option value="">Belum ada akun bank/kas</option>}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Keterangan</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detail biaya..."
                                    className="w-full p-4 bg-white border-2 border-[#E5E1D8] rounded-2xl text-xs font-bold text-[#2D3A2D] focus:border-rose-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-rose-900/20 hover:bg-rose-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Biaya'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
