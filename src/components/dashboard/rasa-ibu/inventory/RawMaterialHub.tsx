'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Package,
    ArrowUpCircle,
    History,
    Search,
    Plus,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    UtensilsCrossed,
    ArrowDownCircle,
    ShoppingBasket,
    Trash2,
    Pencil,
    Calculator
} from 'lucide-react';
import {
    adjustStock,
    getStockAction,
    registerIngredientAction,
    getStockMutationsAction,
    deleteIngredientAction,
    updateIngredientAction
} from '@/lib/actions/rasa-ibu/stock';
import { getInventoryCategories, upsertInventoryCategory } from '@/lib/actions/rasa-ibu/catalog';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface RawMaterialHubProps {
    brandId: string;
    onClose: () => void;
}

export default function RawMaterialHub({ brandId, onClose }: RawMaterialHubProps) {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const confirm = useConfirm();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mutations, setMutations] = useState<any[]>([]);
    const [isRestocking, setIsRestocking] = useState(false);
    const [isLoadingRestock, setIsLoadingRestock] = useState(false);
    const [restockAmount, setRestockAmount] = useState<string>('0');
    const [unitCost, setUnitCost] = useState<string>('0');
    const [restockReason, setRestockReason] = useState('Restock Harian / Belanja Pasar');
    const [expiryDate, setExpiryDate] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState('1-1000');
    const [assetAccounts, setAssetAccounts] = useState<any[]>([]);

    const currentMaterial = materials.find(m => m.id === selectedId);

    const [isRegistering, setIsRegistering] = useState(false);
    const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        inventoryCategoryId: '',
        storageType: 'AMBIENT',
        shelfLife: 0,
        expiryDate: '', // UI state for date picker
        initialStock: 0,
        unitName: 'pcs',
        costPrice: 0,
        inventoryType: 'RAW_MATERIAL' as 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'SUPPLY' | 'PACKAGING'
    });

    const [activeTab, setActiveTab] = useState<'RAW_MATERIAL' | 'PACKAGING' | 'SUPPLY'>('RAW_MATERIAL');

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isEditing, setIsEditing] = useState(false);


    // Calculator State (Default Active Mode)
    // We remove 'showCalculator' toggle and make it the standard input
    const [packPrice, setPackPrice] = useState('');
    const [packSize, setPackSize] = useState('');

    // Auto-calculate Unit Price when Pack Price/Size changes
    useEffect(() => {
        if (packPrice && packSize) {
            const price = parseFloat(packPrice);
            const size = parseFloat(packSize);
            if (!isNaN(price) && !isNaN(size) && size > 0) {
                const unitPrice = price / size;
                // Round up to 2 decimal places
                setNewIngredient(prev => ({ ...prev, costPrice: parseFloat(unitPrice.toFixed(2)) }));
            }
        }
    }, [packPrice, packSize]);

    // When editing, populate Pack Price/Size based on existing data?
    // Hard because we don't store pack size. We can only allow them to re-input it.
    // So we reset pack inputs when editing standardly, or maybe populate costPrice directly if needed?
    // Let's just leave them blank so user forces re-entry for clarity, OR show current unit price.
    const handleEditClick = () => {
        if (currentMaterial) {
            setNewIngredient({
                name: currentMaterial.product.name,
                unitName: currentMaterial.unit,
                costPrice: Number(currentMaterial.costPrice),
                inventoryCategoryId: currentMaterial.product.inventoryCategoryId || '',
                inventoryType: currentMaterial.product.inventoryType,
                storageType: currentMaterial.product.storageType,
                shelfLife: currentMaterial.product.shelfLife || 0,
                expiryDate: new Date().toISOString().split('T')[0], // Default to today, or user picks
                initialStock: currentMaterial.stockOnHand || 0
            });
            // Check if we can reverse engineer pack size? No.
            setPackPrice('');
            setPackSize('1'); // Default to 1 to show unit price match
            setPackPrice(String(currentMaterial.costPrice)); // Pre-fill treating as 1 unit
            setIsEditing(true);
            setIsRegistering(true);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        const [stockRes, catRes] = await Promise.all([
            getStockAction(brandId),
            getInventoryCategories(brandId) // Fetch internal categories
        ]);

        if (stockRes.success) setMaterials(stockRes.data);
        if (Array.isArray(catRes)) setCategories(catRes);

        // Fetch asset accounts for restock payment
        const { getLedgerAccountsAction } = await import('@/lib/actions/rasa-ibu/finance');
        const accRes = await getLedgerAccountsAction(brandId);
        if (accRes.success) {
            const assets = accRes.data.filter((a: any) => a.type === 'ASSET');
            setAssetAccounts(assets);
            if (assets.length > 0) setSourceAccountId(assets[0].code);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    useEffect(() => {
        if (selectedId) {
            loadMutations(selectedId);
        }
    }, [selectedId]);

    const loadMutations = async (variantId: string) => {
        const mutRes = await getStockMutationsAction(brandId, variantId);
        if (mutRes.success) setMutations(mutRes.data);
    };

    const handleRestock = async () => {
        const amount = parseFloat(restockAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Jumlah harus lebih dari 0');
            return;
        }

        setIsLoadingRestock(true);
        try {
            // Calculate Unit Cost: Total Bill / Amount
            const totalBill = parseFloat(unitCost);
            const calculatedUnitPrice = amount > 0 ? parseFloat((totalBill / amount).toFixed(2)) : 0;

            const res = await adjustStock({
                variantId: selectedId!,
                adjustment: amount,
                reason: restockReason || `Restock bahan baku ${currentMaterial?.product.name} - ${currentMaterial?.name}`,
                type: 'IN',
                operatorId: 'SYSTEM',
                expiryDate: expiryDate || undefined,
                unitCost: calculatedUnitPrice,
                sourceAccountId,
                brandId
            });

            if (res.success) {
                toast.success(`Berhasil menambah ${restockAmount} ${currentMaterial?.unit || 'gram'} ke ${currentMaterial?.name}`);
                setIsRestocking(false);
                setRestockAmount('0');
                setUnitCost('0');
                setExpiryDate('');
                await loadData();
                await loadMutations(selectedId!);
            } else {
                toast.error('Gagal melakukan restock: ' + res.error);
            }
        } catch (error: any) {
            toast.error('Terjadi kesalahan: ' + error.message);
        } finally {
            setIsLoadingRestock(false);
        }
    };

    const handleRegister = async () => {
        if (!newIngredient.name || !newIngredient.inventoryCategoryId) {
            toast.error('Nama dan Kategori wajib diisi');
            return;
        }

        // Calculate shelf life logic
        let calculatedShelfLife = 0;
        if (newIngredient.expiryDate) {
            const start = new Date();
            const end = new Date(newIngredient.expiryDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            calculatedShelfLife = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        setIsSubmittingRegister(true);
        try {
            if (isEditing && selectedId) {
                // UPDATE LOGIC
                const res = await updateIngredientAction({
                    brandId, // ADDED
                    variantId: selectedId,
                    productName: newIngredient.name,
                    inventoryCategoryId: newIngredient.inventoryCategoryId,
                    storageType: newIngredient.storageType,
                    shelfLife: calculatedShelfLife || Number(newIngredient.shelfLife),
                    unitName: newIngredient.unitName,
                    costPrice: Number(newIngredient.costPrice),
                    inventoryType: newIngredient.inventoryType as any
                });

                if (res.success) {
                    toast.success('Bahan baku berhasil diperbarui');
                    setIsRegistering(false); // Close form
                    setIsEditing(false);
                    resetForm();
                    await loadData();
                    // Keep detail view open but refresh data? Or close it? 
                    // Let's close form but keep detail view if possible. 
                    // Actually loadData refreshes 'materials', so 'currentMaterial' updates automatically.
                } else {
                    toast.error('Gagal update: ' + res.error);
                }
            } else {
                // CREATE LOGIC
                const res = await registerIngredientAction({
                    brandId,
                    ...newIngredient,
                    shelfLife: calculatedShelfLife,
                    inventoryType: newIngredient.inventoryType as 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'SUPPLY'
                });

                if (res.success) {
                    toast.success('Bahan baku berhasil didaftarkan');
                    setIsRegistering(false);
                    resetForm();
                    loadData();
                } else {
                    toast.error('Gagal mendaftarkan bahan: ' + res.error);
                }
            }
        } catch (err: any) {
            toast.error('Sistem error: ' + err.message);
        } finally {
            setIsSubmittingRegister(false);
        }
    };

    const resetForm = () => {
        setNewIngredient({
            name: '',
            inventoryCategoryId: '',
            storageType: 'AMBIENT',
            shelfLife: 0,
            expiryDate: '',
            initialStock: 0,
            unitName: activeTab === 'RAW_MATERIAL' ? 'gram' : 'pcs',
            costPrice: 0,
            inventoryType: activeTab
        });
        setPackPrice('');
        setPackSize('');
    };



    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        const type = newIngredient.inventoryType === 'PACKAGING' ? 'PACKAGING' :
            newIngredient.inventoryType === 'SUPPLY' ? 'SUPPLY' : 'RAW_MATERIAL';

        const res = await upsertInventoryCategory({
            brandId,
            name: newCategoryName,
            type: type as any
        });

        if (res.success) {
            toast.success('Kategori baru dibuat!');
            setNewCategoryName('');
            setIsCreatingCategory(false);
            // Reload categories
            const createdCat = res.data;
            setCategories(prev => [...prev, createdCat]);
            // Auto select
            setNewIngredient(prev => ({ ...prev, inventoryCategoryId: createdCat.id }));
        } else {
            toast.error(res.error);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;

        const confirmed = await confirm({
            title: 'Hapus Bahan Baku?',
            message: 'Tindakan ini permanen. Bahan baku ini akan dihapus dari inventaris dapur Bunda.',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const res = await deleteIngredientAction(brandId, selectedId); // UPDATED
            if (res.success) {
                toast.success('Bahan baku berhasil dihapus');
                setSelectedId(null); // Close detail view
                await loadData(); // Reload list
            } else {
                toast.error('Gagal menghapus: ' + res.error);
            }
        } catch (error: any) {
            toast.error('Gagal menghapus: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const getStockStatus = (qty: number) => {
        if (qty <= 0) return { label: 'Habis', color: 'text-red-600', bg: 'bg-red-50', icon: <X className="w-3 h-3" /> };
        if (qty <= 10) return { label: 'Menipis', color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertTriangle className="w-3 h-3" /> };
        return { label: 'Cukup', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" /> };
    };

    const filteredMaterials = materials.filter(m =>
        m.product.inventoryType === activeTab && (
            m.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    const isMobileDetailOpen = isRegistering || !!selectedId;

    return (
        <div className="flex flex-col h-full bg-[#FDFBF7] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className={`px-5 md:px-10 py-6 border-b border-[#E5E1D8] bg-white flex justify-between items-center ${isMobileDetailOpen ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <ShoppingBasket className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">Inventory Hub</span>
                        <h2 className="text-2xl font-black text-[#2D3A2D]">Management Bahan Baku</h2>
                    </div>
                </div>
                <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 group">
                    <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Sidebar: List */}
                <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E5E1D8] flex-col bg-[#F9F7F2]/50 md:h-auto shrink-0 ${isMobileDetailOpen ? 'hidden md:flex' : 'flex h-full'}`}>
                    <div className="p-4 border-b border-[#E5E1D8] space-y-3">
                        <div className="flex p-1 bg-slate-100/50 rounded-xl">
                            {[
                                { id: 'RAW_MATERIAL', label: 'Bahan', icon: <UtensilsCrossed className="w-3 h-3" /> },
                                { id: 'PACKAGING', label: 'Kemasan', icon: <Package className="w-3 h-3" /> },
                                { id: 'SUPPLY', label: 'Alat/Stiker', icon: <ShoppingBasket className="w-3 h-3" /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        setSelectedId(null);
                                        setNewIngredient(prev => ({ ...prev, inventoryType: tab.id as any, unitName: tab.id === 'RAW_MATERIAL' ? 'gram' : 'pcs' }));
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={`Cari ${activeTab.toLowerCase()}...`}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E1D8] rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                setIsRegistering(true);
                                setSelectedId(null);
                                resetForm();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-3 h-3" /> Tambah {
                                activeTab === 'RAW_MATERIAL' ? 'Bahan' :
                                    activeTab === 'PACKAGING' ? 'Kemasan' : 'Alat/Stiker'
                            }
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : filteredMaterials.map(m => {
                            const status = getStockStatus(m.stockOnHand);
                            const isSelected = selectedId === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedId(m.id);
                                        setIsRestocking(false);
                                        setIsRegistering(false);
                                    }}
                                    className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center group ${isSelected ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-[#FDFBF7] border-transparent hover:border-slate-200'
                                        }`}
                                >
                                    <div className="space-y-1 overflow-hidden">
                                        <p className="text-[11px] font-black text-[#2D3A2D] truncate">{m.product.name} {m.name !== 'Default' ? `- ${m.name}` : ''}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${m.product.storageType === 'FROZEN' ? 'text-blue-500' : m.product.storageType === 'CHILLED' ? 'text-cyan-500' : 'text-amber-600'}`}>
                                                [{m.product.storageType}]
                                            </span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1`}>
                                                {status.icon} {status.label}
                                            </span>
                                            <span className="text-[10px] font-black text-[#8B7E66]">{m.stockOnHand} {m.unit || 'gram'}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                            Rp {Number(m.costPrice || 0).toLocaleString('id-ID')} / {m.unit || 'gram'}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-500' : 'text-slate-300 group-hover:translate-x-1'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`bg-white overflow-y-auto ${isMobileDetailOpen ? 'flex-1 w-full h-full' : 'hidden md:flex md:flex-1'}`}>
                    {isRegistering ? (
                        <div className="p-6 md:p-10 space-y-8 animate-in slide-in-from-left-4 w-full">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsRegistering(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-full">
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <h3 className="text-xl font-black text-[#2D3A2D] uppercase tracking-wider">
                                        {isEditing ? 'Edit Bahan Baku' : 'Bahan Baku Baru'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsRegistering(false);
                                        setIsEditing(false);
                                        resetForm();
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden md:block"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-emerald-900 uppercase">Nama Bahan Baku</label>
                                    <input
                                        type="text"
                                        className="w-full p-5 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] text-xl font-black focus:bg-white transition-all outline-none"
                                        placeholder="Contoh: Ayam Fillet, Bawang Merah..."
                                        value={newIngredient.name}
                                        onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Kategori</label>
                                        {!isCreatingCategory ? (
                                            <div className="flex gap-2">
                                                <select
                                                    className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold active:ring-2 focus:ring-emerald-500 outline-none"
                                                    value={newIngredient.inventoryCategoryId}
                                                    onChange={e => setNewIngredient({ ...newIngredient, inventoryCategoryId: e.target.value })}
                                                >
                                                    <option value="">Pilih Kategori</option>
                                                    {categories
                                                        // Optional filter depending on logic, or show all
                                                        .filter(c => {
                                                            if (newIngredient.inventoryType === 'PACKAGING') return c.type === 'PACKAGING';
                                                            if (newIngredient.inventoryType === 'SUPPLY') return c.type === 'SUPPLY';
                                                            return c.type === 'RAW_MATERIAL';
                                                        })
                                                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                                    }
                                                </select>
                                                <button
                                                    onClick={() => setIsCreatingCategory(true)}
                                                    className="px-4 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-emerald-500 outline-none"
                                                    placeholder="Nama Kategori Baru..."
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleCreateCategory}
                                                    className="px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-[10px] font-black uppercase"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() => setIsCreatingCategory(false)}
                                                    className="px-3 text-slate-400 hover:bg-slate-100 rounded-xl"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Penyimpanan</label>
                                        <select
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold active:ring-2 focus:ring-emerald-500 outline-none"
                                            value={newIngredient.storageType}
                                            onChange={e => setNewIngredient({ ...newIngredient, storageType: e.target.value })}
                                        >
                                            <option value="AMBIENT">Suhu Ruang (Ambient)</option>
                                            <option value="CHILLED">Kulkas (Chilled)</option>
                                            <option value="FROZEN">Freezer (Frozen)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Tipe Inventaris</label>
                                        <select
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold active:ring-2 focus:ring-emerald-500 outline-none"
                                            value={newIngredient.inventoryType}
                                            onChange={e => setNewIngredient({ ...newIngredient, inventoryType: e.target.value as any })}
                                        >
                                            <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
                                            <option value="SUPPLY">Perlengkapan (Supply)</option>
                                            <option value="PACKAGING">Kemasan (Packaging)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Unit Ukuran</label>
                                        <select
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={newIngredient.unitName}
                                            onChange={e => setNewIngredient({ ...newIngredient, unitName: e.target.value })}
                                        >
                                            <option value="gram">Gram (g)</option>
                                            <option value="ml">Mililiter (ml)</option>
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="liter">Liter (L)</option>
                                            <option value="pack">Pack</option>
                                            <option value="box">Box</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Exp Date (Stok Awal)</label>
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-emerald-500 outline-none"
                                            value={newIngredient.expiryDate}
                                            onChange={e => setNewIngredient({ ...newIngredient, expiryDate: e.target.value })}
                                        />
                                    </div>

                                    {/* Pricing Block */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Biaya Total Beli (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-emerald-500 outline-none"
                                            placeholder="Contoh: 50800"
                                            value={packPrice}
                                            onChange={e => setPackPrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-emerald-900 uppercase">Berat atau Total Stock (Isi)</label>
                                        <input
                                            type="number"
                                            className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-sm font-bold focus:ring-emerald-500 outline-none"
                                            placeholder="Contoh: 1000"
                                            value={packSize}
                                            onChange={e => setPackSize(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {packPrice && packSize && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-2">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase">Harga Satuan Terhitung:</span>
                                        <span className="text-xl font-black text-emerald-600">
                                            Rp {newIngredient.costPrice.toLocaleString('id-ID')} <span className="text-xs opacity-50">/{newIngredient.unitName}</span>
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={handleRegister}
                                    disabled={isSubmittingRegister}
                                    className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingRegister ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Daftarkan Bahan Ke Dapur')}
                                </button>
                            </div>
                        </div>
                    ) : currentMaterial ? (
                        <div className="p-10 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black text-[#2D3A2D] tracking-tight">{currentMaterial.product.name}</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{currentMaterial.name !== 'Default' ? currentMaterial.name : 'Varian Utama'}</p>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setIsRestocking(!isRestocking)}
                                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                    >
                                        {isRestocking ? 'Batal Restock' : 'Restock Bahan'}
                                    </button>
                                    <button
                                        onClick={handleEditClick}
                                        disabled={isDeleting}
                                        className="px-4 py-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all ml-2"
                                        title="Edit Bahan Baku"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all ml-2"
                                        title="Hapus Bahan Baku"
                                    >
                                        {isDeleting ? <span className="text-[10px] uppercase font-bold">Menghapus...</span> : <Trash2 className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {isRestocking && (
                                <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Input Mutasi Masuk
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-blue-900 uppercase">Berat atau Total Stock (Isi)</label>
                                            <input
                                                type="number"
                                                className="w-full p-5 bg-white border border-blue-200 rounded-[1.5rem] text-3xl font-black text-blue-900 outline-none focus:border-blue-500 transition-all"
                                                value={restockAmount}
                                                onChange={e => setRestockAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-blue-900 uppercase">Total Harga Belanja (Rp)</label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-blue-400 opacity-40">Rp</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-14 pr-5 py-5 bg-white border border-blue-200 rounded-[1.5rem] text-xl font-black text-blue-900 outline-none focus:border-blue-500 transition-all"
                                                    value={unitCost}
                                                    onChange={e => setUnitCost(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 col-span-2">
                                            <label className="text-[10px] font-black text-blue-900 uppercase">Bayar Menggunakan (Bank/Kas)</label>
                                            <select
                                                className="w-full p-4 bg-white border border-blue-200 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={sourceAccountId}
                                                onChange={e => setSourceAccountId(e.target.value)}
                                            >
                                                {assetAccounts.map((acc: any) => (
                                                    <option key={acc.code} value={acc.code}>{acc.name} ({acc.code})</option>
                                                ))}
                                                {assetAccounts.length === 0 && <option value="">Belum ada akun bank/kas</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRestock}
                                        disabled={isLoadingRestock}
                                        className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingRestock ? 'Sedang Menyimpan...' : 'Simpan Penambahan Stok'}
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.3em] flex items-center gap-2">
                                        <History className="w-4 h-4" /> Riwayat Mutasi
                                    </h4>
                                    <div className="space-y-3">
                                        {mutations.length > 0 ? mutations.map((mut: any) => (
                                            <div key={mut.id} className="p-5 bg-[#F9F7F2] rounded-2xl flex justify-between items-center border border-[#E5E1D8]/50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${mut.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {mut.type === 'IN' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-[#2D3A2D]">{mut.notes || 'Tanpa Catatan'}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(mut.createdAt).toLocaleString('id-ID')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${mut.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {mut.type === 'IN' ? '+' : '-'}{mut.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-12 border-2 border-dashed border-[#E5E1D8] rounded-[2rem] flex flex-col items-center justify-center space-y-3 text-slate-300">
                                                <History className="w-8 h-8 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Belum ada riwayat</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#E5E1D8] rounded-[2.5rem] space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400">Harga Satuan (HPP)</span>
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                                <Calculator className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-3xl font-black text-amber-900">
                                                Rp {Number(currentMaterial.costPrice || 0).toLocaleString('id-ID')}
                                                <span className="text-sm font-bold text-amber-600/50"> / {currentMaterial.unit || 'gram'}</span>
                                            </p>
                                            <p className="text-[9px] text-amber-700/60 font-medium italic">Digunakan untuk hitungan HPP otomatis di resep.</p>
                                        </div>
                                    </div>

                                    <h4 className="text-[10px] font-black text-[#8B7E66] uppercase tracking-[0.3em] flex items-center gap-2 pt-4">
                                        <Package className="w-4 h-4" /> Info Stok
                                    </h4>
                                    <div className="p-8 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#E5E1D8] rounded-[2.5rem] space-y-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400">Status Saat Ini</span>
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${getStockStatus(currentMaterial.stockOnHand).bg} ${getStockStatus(currentMaterial.stockOnHand).color} border border-current opacity-70`}>
                                                {getStockStatus(currentMaterial.stockOnHand).label}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-4xl font-black text-[#2D3A2D]">{currentMaterial.stockOnHand} <span className="text-lg font-bold text-slate-300">{currentMaterial.unit || 'gram'}</span></p>
                                            <p className="text-[10px] font-medium text-slate-400 italic">Update terakhir: {new Date(currentMaterial.updatedAt).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                            <ShoppingBasket className="w-20 h-20 text-[#8B7E66]" />
                            <div className="space-y-2">
                                <p className="font-black text-lg uppercase tracking-widest text-[#8B7E66]">Lab. Bahan Baku</p>
                                <p className="text-xs font-bold text-[#8B7E66]">Pilih bahan di sebelah kiri untuk melihat detail</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-10 py-4 bg-[#F9F7F2] border-t border-[#E5E1D8] flex justify-between items-center opacity-70">
                <span className="text-[9px] font-black text-[#8B7E66] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Raw Material Intelligence v2.0
                </span>
                <p className="text-[9px] font-medium text-[#8B7E66] italic">Powered by Achiera Stock Engine</p>
            </div>
        </div>
    );
}
