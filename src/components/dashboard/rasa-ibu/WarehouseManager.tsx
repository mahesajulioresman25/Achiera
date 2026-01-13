'use client';

import { useState, useEffect } from 'react';
import {
    Warehouse, Package, Plus, History, ArrowDownToLine,
    AlertCircle, CheckCircle2, Search, Calendar, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getWarehousesAction, createWarehouseAction,
    getWarehouseInventoryAction, addStockAction,
    getStockMutationsAction, WarehouseData
} from '@/lib/actions/rasa-ibu/warehouse';
import { getFrozenProducts } from '@/lib/actions/rasa-ibu/catalog';

interface WarehouseManagerProps {
    brandId: string;
    onClose: () => void;
}

export default function WarehouseManager({ brandId, onClose }: WarehouseManagerProps) {
    const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mutations, setMutations] = useState<any[]>([]);
    const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inventory' | 'stock-in' | 'mutations'>('inventory');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Stock In Form State
    const [products, setProducts] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState('');
    const [stockInQty, setStockInQty] = useState(0);
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        loadWarehouses();
        loadProducts();
    }, [brandId]);

    useEffect(() => {
        if (selectedWarehouse) {
            loadInventory(selectedWarehouse);
            if (activeTab === 'mutations') {
                loadMutations(selectedWarehouse);
            }
        }
    }, [selectedWarehouse, activeTab]);

    async function loadWarehouses() {
        const res = await getWarehousesAction(brandId);
        if (res.success && res.data) {
            setWarehouses(res.data);
            if (res.data.length > 0 && !selectedWarehouse) {
                setSelectedWarehouse(res.data[0].id);
            }
        }
    }

    async function loadInventory(warehouseId: string) {
        setLoading(true);
        const res = await getWarehouseInventoryAction(brandId, warehouseId);
        if (res.success && res.data) {
            setInventory(res.data);
        }
        setLoading(false);
    }

    async function loadMutations(warehouseId: string) {
        setLoading(true);
        const res = await getStockMutationsAction(brandId, warehouseId);
        if (res.success && res.data) {
            setMutations(res.data);
        }
        setLoading(false);
    }

    async function loadProducts() {
        const res = await getFrozenProducts(brandId);
        if (res.success && res.data) {
            setProducts(res.data);
        }
    }

    async function handleCreateWarehouse(e: React.FormEvent) {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const address = (form.elements.namedItem('address') as HTMLInputElement).value;

        const res = await createWarehouseAction(brandId, name, address);
        if (res.success) {
            setShowCreateModal(false);
            loadWarehouses();
        }
    }

    async function handleStockIn(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWarehouse || !selectedVariant) return;

        const res = await addStockAction(
            brandId,
            selectedWarehouse,
            selectedVariant,
            Number(stockInQty),
            new Date(expiryDate),
            'USER_ID_PLACEHOLDER' // In real app, get from session
        );

        if (res.success) {
            toast.success('Stok berhasil ditambahkan!');
            loadInventory(selectedWarehouse);
            setActiveTab('inventory');
            setStockInQty(0);
            setExpiryDate('');
        } else {
            toast.error('Gagal menambahkan stok.');
        }
    }

    const filteredInventory = Array.isArray(inventory) ? inventory.filter(item =>
        (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.variantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-[#E5E1D8]">

                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-[#E5E1D8] p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-[#2D3A2D] rounded-xl">
                            <Warehouse className="w-5 h-5 text-[#FDFBF7]" />
                        </div>
                        <h2 className="font-black text-[#1A241A] tracking-tight">Gudang</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-3">Daftar Gudang</p>
                        {warehouses.map(w => (
                            <button
                                key={w.id}
                                onClick={() => setSelectedWarehouse(w.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all ${selectedWarehouse === w.id
                                    ? 'bg-[#2D3A2D] text-[#FDFBF7] shadow-lg shadow-green-900/20'
                                    : 'hover:bg-[#F9F7F2] text-[#1A241A]'
                                    }`}
                            >
                                <div className="font-bold text-sm">{w.name}</div>
                                <div className="text-[10px] opacity-70 truncate">{w.address || 'No address'}</div>
                            </button>
                        ))}

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full flex items-center gap-2 p-3 mt-4 border border-dashed border-[#8B7E66] rounded-xl text-[#8B7E66] hover:bg-[#F9F7F2] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-xs font-bold">Buat Gudang Baru</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-4 w-full py-4 text-xs font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-100 rounded-2xl transition-all"
                    >
                        Tutup Panel
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="h-20 border-b border-[#E5E1D8] flex items-center justify-between px-8 bg-white">
                        <div className="flex bg-[#F9F7F2] p-1.5 rounded-2xl border border-[#E5E1D8]">
                            {[
                                { id: 'inventory', label: 'Stok Saat Ini', icon: Package },
                                { id: 'stock-in', label: 'Terima Barang', icon: ArrowDownToLine },
                                { id: 'mutations', label: 'Riwayat Log', icon: History }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'bg-[#2D3A2D] text-white shadow-md'
                                        : 'text-[#8B7E66] hover:bg-white/50'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[#FDFBF7]">

                        {/* INVENTORY TAB */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-[#2D3A2D]">Ringkasan Inventaris</h3>
                                        <p className="text-xs text-[#8B7E66]">Status stok real-time di {(warehouses && warehouses.find(w => w.id === selectedWarehouse)?.name) || 'Gudang'}</p>
                                    </div>
                                    <div className="p-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl flex items-center gap-3 px-5 focus-within:ring-2 focus-within:ring-[#B2BCA2] transition-all">
                                        <Search className="w-4 h-4 text-[#8B7E66]" />
                                        <input
                                            placeholder="Cari SKU / Nama Produk..."
                                            className="bg-transparent text-sm font-medium outline-none w-64"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] shadow-sm border border-[#E5E1D8] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#F9F7F2] border-b border-[#E5E1D8]">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Produk & Varian</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">SKU</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Total Stok</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Status Batch</th>
                                                <th className="px-8 py-5 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-50">
                                            {loading ? (
                                                <tr><td colSpan={5} className="p-20 text-center"><div className="animate-pulse font-black text-[#8B7E66] uppercase tracking-widest text-xs">Pemuatan Data...</div></td></tr>
                                            ) : filteredInventory.length === 0 ? (
                                                <tr><td colSpan={5} className="p-20 text-center text-sm text-[#8B7E66] italic font-medium">Belum ada stok yang terdaftar di area ini.</td></tr>
                                            ) : (
                                                filteredInventory.map((item: any) => (
                                                    <React.Fragment key={item.variantId}>
                                                        <tr className={`hover:bg-[#FDFBF7] transition-colors cursor-pointer ${expandedVariant === item.variantId ? 'bg-stone-50' : ''}`}
                                                            onClick={() => setExpandedVariant(expandedVariant === item.variantId ? null : item.variantId)}>
                                                            <td className="px-8 py-6">
                                                                <div className="font-black text-[#2D3A2D] text-sm uppercase tracking-tight">{item.productName}</div>
                                                                <div className="text-[10px] text-[#8B7E66] font-bold uppercase tracking-widest">{item.variantName}</div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <code className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500">{item.sku}</code>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-sm font-black text-[#2D3A2D]">
                                                                    {item.totalStock} <span className="text-[10px] font-bold text-[#8B7E66] uppercase">{item.unit || 'Unit'}</span>
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.totalStock > 20 ? 'bg-emerald-400' : item.totalStock > 0 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8B7E66]">
                                                                        {Array.isArray(item.batches) ? item.batches.length : 0} Batch(es)
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D] hover:underline">Detail Batch</button>
                                                            </td>
                                                        </tr>
                                                        {expandedVariant === item.variantId && (
                                                            <tr>
                                                                <td colSpan={5} className="px-8 py-0 bg-stone-50/50">
                                                                    <div className="py-6 border-l-2 border-[#2D3A2D] ml-4 pl-4 space-y-4 animate-in slide-in-from-top-2">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D]">Rincian Batch (FIFO Order)</p>
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            {Array.isArray(item.batches) && item.batches.map((batch: any) => {
                                                                                const expiry = batch.expiry ? new Date(batch.expiry) : new Date();
                                                                                const isExpired = expiry < new Date();
                                                                                const isExpiringSoon = !isExpired && expiry < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                                                                return (
                                                                                    <div key={batch.id} className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-sm relative overflow-hidden">
                                                                                        {isExpired && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl uppercase">Expired</div>}
                                                                                        {isExpiringSoon && <div className="absolute top-0 right-0 bg-amber-400 text-[#2D3A2D] text-[8px] font-black px-2 py-1 rounded-bl-xl uppercase">Expiring Soon</div>}

                                                                                        <div className="flex justify-between items-start mb-2">
                                                                                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{batch.code}</span>
                                                                                            <span className="text-sm font-black text-[#2D3A2D]">{batch.qty} {item.unit}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-[#8B7E66] uppercase">
                                                                                            <Calendar size={10} />
                                                                                            Expire: {batch.expiry ? new Date(batch.expiry).toLocaleDateString('id-ID') : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* STOCK IN TAB */}
                        {activeTab === 'stock-in' && (
                            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-[#E5E1D8]">
                                    <div className="flex items-center gap-6 mb-12">
                                        <div className="p-5 bg-emerald-50 rounded-3xl">
                                            <ArrowDownToLine className="w-8 h-8 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[#2D3A2D]">Penerimaan Stok Baru</h3>
                                            <p className="text-sm text-[#8B7E66] font-medium italic">"Pastikan kualitas produk terjaga sebelum dimasukkan ke dalam Cold Storage."</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleStockIn} className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Identitas Produk</label>
                                            <select
                                                className="w-full p-5 bg-[#F9F7F2] rounded-2xl border border-transparent focus:border-[#B2BCA2] focus:bg-white outline-none font-black text-[#2D3A2D] text-sm transition-all"
                                                value={selectedVariant}
                                                onChange={(e) => setSelectedVariant(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Pilih Varian Produk --</option>
                                                {products.map(p => (
                                                    <optgroup key={p.id} label={p.name}>
                                                        {p.variants.map((v: any) => (
                                                            <option key={v.id} value={v.id}>{p.name} - {v.name} ({v.sku})</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Jumlah Kuantitas</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full p-5 bg-[#F9F7F2] rounded-2xl border border-transparent focus:border-[#B2BCA2] focus:bg-white outline-none font-black text-[#2D3A2D] text-lg transition-all"
                                                        placeholder="0"
                                                        value={stockInQty}
                                                        onChange={e => setStockInQty(Number(e.target.value))}
                                                        required
                                                    />
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Unit</div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] ml-2">Tanggal Kadaluarsa</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        className="w-full p-5 bg-[#F9F7F2] rounded-2xl border border-transparent focus:border-[#B2BCA2] focus:bg-white outline-none font-black text-[#2D3A2D] text-sm transition-all"
                                                        value={expiryDate}
                                                        onChange={e => setExpiryDate(e.target.value)}
                                                        required
                                                    />
                                                    <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-[#FDFBF7] rounded-[2rem] border border-dashed border-[#B2BCA2] flex items-center gap-4">
                                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><AlertCircle size={20} /></div>
                                            <p className="text-[9px] font-medium text-[#8B7E66] leading-relaxed">
                                                Sistem akan secara otomatis menghasilkan **Batch Code** unik dan mendaftarkan mutasi stok dengan tipe **IN**.
                                                Stok ini akan diprioritaskan keluar berdasarkan prinsip FIFO.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-6 bg-[#2D3A2D] text-[#FDFBF7] rounded-3xl text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-green-950/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                        >
                                            Verifikasi & Simpan Stok
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* MUTATIONS TAB */}
                        {activeTab === 'mutations' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] shadow-sm flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-[#2D3A2D]">Log Mutasi Stok</h3>
                                        <p className="text-xs text-[#8B7E66]">Rekam jejak setiap unit yang masuk dan keluar dari gudang ini.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                            <CheckCircle2 size={12} /> Terverifikasi
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] shadow-sm border border-[#E5E1D8] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#F9F7F2] border-b border-[#E5E1D8]">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Waktu & Ref</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Aktivitas</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Produk</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Jumlah</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Operator</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-50">
                                            {mutations.length === 0 ? (
                                                <tr><td colSpan={5} className="p-20 text-center text-sm text-[#8B7E66] italic">Belum ada aktivitas mutasi yang tercatat.</td></tr>
                                            ) : (
                                                mutations.map((m) => (
                                                    <tr key={m.id} className="hover:bg-stone-50/50 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <div className="text-xs font-black text-[#2D3A2D]">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                                            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}</div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] ${m.type === 'IN' ? 'bg-emerald-50 text-emerald-700' :
                                                                m.type === 'OUT' ? 'bg-rose-50 text-rose-700' :
                                                                    'bg-amber-50 text-amber-700'
                                                                }`}>
                                                                {m.type === 'IN' ? 'Penerimaan' : m.type === 'OUT' ? 'Pengeluaran' : m.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="text-[10px] font-black text-[#2D3A2D] uppercase">{m.productName || '-'}</div>
                                                            <div className="text-[9px] font-bold text-[#8B7E66] uppercase tracking-widest">{m.variantName || '-'}</div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className={`text-sm font-black ${(m.quantity || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {(m.quantity || 0) > 0 ? '+' : ''}{m.quantity || 0}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-500 uppercase">
                                                                    {(m.createdBy || '?').charAt(0)}
                                                                </div>
                                                                <div className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{m.createdBy || 'System'}</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Create Warehouse Modal */}
            {showCreateModal && (
                <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-black text-[#1A241A] mb-6">Buat Gudang Baru</h3>
                        <form onSubmit={handleCreateWarehouse} className="space-y-4">
                            <input
                                name="name"
                                placeholder="Nama Gudang (e.g. Gudang Pusat)"
                                className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none outline-none"
                                required
                            />
                            <input
                                name="address"
                                placeholder="Alamat Lengkap"
                                className="w-full p-4 bg-[#F9F7F2] rounded-xl border-none outline-none"
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-bold text-[#8B7E66]">Batal</button>
                                <button type="submit" className="px-6 py-2 bg-[#2D3A2D] text-white rounded-xl text-sm font-bold">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
