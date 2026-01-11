import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Search, Book, Info, ChevronRight, Calculator, Pencil, X } from 'lucide-react';
import { upsertRecipeAction } from '@/lib/actions/rasa-ibu/production';
import { getStockAction, updateIngredientAction } from '@/lib/actions/rasa-ibu/stock';
import { toast } from 'sonner';

interface RecipeManagerProps {
    brandId: string;
    recipes: any[];
    onRefresh: () => void;
}

export default function RecipeManager({ brandId, recipes, onRefresh }: RecipeManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<any>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frozenVariantId: '',
        outputQuantity: 1,
        items: [] as { ingredientId: string; quantity: number; unit: string; note: string }[]
    });

    // Helper: Unit Conversion
    const convertToMatchStockUnit = (qty: number, fromUnit: string, toUnit: string): number => {
        const normalize = (u: string) => u?.toLowerCase() || '';
        const f = normalize(fromUnit);
        const t = normalize(toUnit);

        if (f === t) return qty;

        // Base Conversion factors to "Small" units (gram/ml)
        const isSmallFrom = f === 'gram' || f === 'ml';
        const isLargeFrom = f === 'kg' || f === 'liter';
        const isSmallTo = t === 'gram' || t === 'ml';
        const isLargeTo = t === 'kg' || t === 'liter';

        // 1. Large to Small (kg/liter -> gram/ml)
        if (isLargeFrom && isSmallTo) return qty * 1000;

        // 2. Small to Large (gram/ml -> kg/liter)
        if (isSmallFrom && isLargeTo) return qty / 1000;

        // Fallback for cases like 'pcs' or unknown units
        return qty;
    };

    // Cost Editor State
    const [editingCostItem, setEditingCostItem] = useState<any>(null);
    const [calcData, setCalcData] = useState({ packPrice: '', packSize: '' });
    const [isUpdatingCost, setIsUpdatingCost] = useState(false);

    // Real-time HPP Calculation with Conversion
    const estimatedHPP = React.useMemo(() => {
        let total = 0;
        formData.items.forEach(item => {
            const ingredient = inventory.find(inv => inv.id === item.ingredientId);
            if (ingredient) {
                const convertedQty = convertToMatchStockUnit(item.quantity || 0, item.unit, ingredient.unit);
                total += Number(ingredient.costPrice || 0) * convertedQty;
            }
        });
        return {
            total,
            perUnit: formData.outputQuantity > 0 ? total / formData.outputQuantity : 0
        };
    }, [formData.items, formData.outputQuantity, inventory]);

    const loadInventory = async () => {
        const res = await getStockAction(brandId);
        if (res.success) setInventory(res.data);
    };

    useEffect(() => {
        loadInventory();
    }, [brandId]);

    const handleUpdateCost = async () => {
        if (!editingCostItem || !calcData.packPrice || !calcData.packSize) return;

        const price = parseFloat(calcData.packPrice);
        const size = parseFloat(calcData.packSize);

        if (isNaN(price) || isNaN(size) || size <= 0) {
            toast.error('Mohon masukkan angka yang valid');
            return;
        }

        const newUnitCost = parseFloat((price / size).toFixed(2));

        setIsUpdatingCost(true);
        try {
            const res = await updateIngredientAction({
                variantId: editingCostItem.id,
                productName: editingCostItem.product.name,
                inventoryCategoryId: editingCostItem.product.inventoryCategoryId,
                storageType: editingCostItem.product.storageType,
                shelfLife: editingCostItem.product.shelfLife || 0,
                unitName: editingCostItem.unit,
                costPrice: newUnitCost,
                inventoryType: editingCostItem.product.inventoryType
            });

            if (res.success) {
                toast.success(`Harga ${editingCostItem.product.name} berhasil diperbarui jadi Rp ${newUnitCost}/${editingCostItem.unit}`);
                setEditingCostItem(null);
                setCalcData({ packPrice: '', packSize: '' });
                await loadInventory(); // Refresh Master Data
            } else {
                toast.error('Gagal update: ' + res.error);
            }
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        } finally {
            setIsUpdatingCost(false);
        }
    };

    const handleSave = async () => {
        // Precise Validation
        if (!formData.name) {
            toast.error('Mohon masukkan nama resep');
            return;
        }
        if (!formData.frozenVariantId) {
            toast.error('Mohon pilih produk hasil (Finished Good)');
            return;
        }
        if (formData.items.length === 0) {
            toast.error('Mohon tambahkan minimal 1 bahan');
            return;
        }

        // Check if all items are fully specified
        const hasEmptyItems = formData.items.some(item => !item.ingredientId || item.quantity <= 0);
        if (hasEmptyItems) {
            toast.error('Pastikan semua bahan sudah dipilih dan memiliki takaran yang valid');
            return;
        }

        const res = await upsertRecipeAction({
            ...formData,
            id: editingRecipe?.id,
            brandId
        });

        if (res.success) {
            setIsAdding(false);
            setEditingRecipe(null);
            onRefresh();
        } else {
            toast.error('Gagal menyimpan resep: ' + res.error);
        }
    };

    const addIngredient = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { ingredientId: '', quantity: 0, unit: 'gram', note: '' }]
        });
    };

    const removeIngredient = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isAdding || editingRecipe) {
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#2D3A2D]">{editingRecipe ? 'Edit Resep' : 'Tambah Resep Baru'}</h3>
                        <p className="text-xs text-slate-400 font-medium">Definisikan bahan-bahan untuk setiap menu.</p>
                    </div>
                    <button
                        onClick={() => { setIsAdding(false); setEditingRecipe(null); }}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Batal
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nama Resep</label>
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Misal: Risol Mayo Mamah"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Produk Hasil (Output)</label>
                            <select
                                value={formData.frozenVariantId}
                                onChange={e => setFormData({ ...formData, frozenVariantId: e.target.value })}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">Pilih Produk Finished Good</option>
                                {inventory.filter(item => item.product.inventoryType === 'FINISHED_GOOD').map(item => (
                                    <option key={item.id} value={item.id}>{item.product.name} ({item.sku})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Jumlah PCS per Masak</label>
                            <input
                                type="number"
                                value={formData.outputQuantity}
                                onChange={e => setFormData({ ...formData, outputQuantity: parseInt(e.target.value) })}
                                className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* HPP Preview Card */}
                    <div className="lg:col-span-2 bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-rose-900">Estimasi HPP Otomatis</h4>
                                <p className="text-[10px] text-rose-700 font-bold">Kalkulasi berdasarkan harga beli bahan baku terbaru.</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-right">HPP per Porsi</p>
                            <p className="text-3xl font-black text-rose-950">
                                Rp {estimatedHPP.perUnit.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[9px] font-bold text-rose-600">Total Modal Masak: Rp {estimatedHPP.total.toLocaleString('id-ID')}</p>
                            <p className="text-[8px] text-rose-400 font-medium italic mt-1">
                                (Total Modal ÷ {formData.outputQuantity} pcs)
                            </p>
                        </div>
                    </div>

                    {/* Ingredients List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Bahan-bahan & Takaran</label>
                            <button
                                onClick={addIngredient}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
                            >
                                <Plus className="w-3 h-3" /> Tambah Bahan
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="flex gap-3 group">
                                        <select
                                            value={item.ingredientId}
                                            onChange={e => updateIngredient(idx, 'ingredientId', e.target.value)}
                                            className="flex-1 bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm font-bold text-[#2D3A2D]"
                                        >
                                            <option value="">Pilih Bahan/Kemasan</option>
                                            {inventory.filter(inv => ['RAW_MATERIAL', 'PACKAGING', 'SUPPLY'].includes(inv.product.inventoryType)).map(inv => (
                                                <option key={inv.id} value={inv.id}>
                                                    [{inv.product.inventoryType === 'RAW_MATERIAL' ? 'Bahan' : inv.product.inventoryType === 'PACKAGING' ? 'Kemasan' : 'Alat'}] {inv.product.name} {inv.name !== 'Default' ? `- ${inv.name}` : ''}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Cost Correction Button */}
                                        {item.ingredientId && (
                                            <button
                                                onClick={() => {
                                                    const inv = inventory.find(i => i.id === item.ingredientId);
                                                    if (inv) {
                                                        setEditingCostItem(inv);
                                                        setCalcData({ packPrice: '', packSize: '' });
                                                    }
                                                }}
                                                className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                                                title="Koreksi Harga (Jika Salah)"
                                            >
                                                <Calculator className="w-4 h-4" />
                                            </button>
                                        )}

                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value))}
                                            className="w-20 bg-white border border-[#E5E1D8] rounded-xl px-4 py-2 text-sm font-bold text-[#2D3A2D]"
                                        />
                                        <select
                                            value={item.unit}
                                            onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                                            className="w-24 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2 text-sm font-bold text-[#2D3A2D]"
                                        >
                                            <option value="gram">gram</option>
                                            <option value="ml">ml</option>
                                            <option value="pcs">pcs</option>
                                            <option value="kg">kg</option>
                                            <option value="liter">liter</option>
                                        </select>
                                        <button
                                            onClick={() => removeIngredient(idx)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Cost Breakdown for this item */}
                                    {item.ingredientId && (() => {
                                        const inv = inventory.find(i => i.id === item.ingredientId);
                                        if (inv) {
                                            const originalQty = Number(item.quantity || 0);
                                            const convertedQty = convertToMatchStockUnit(originalQty, item.unit, inv.unit);
                                            const cost = Number(inv.costPrice || 0) * convertedQty;

                                            const showConversion = item.unit !== inv.unit && originalQty !== convertedQty;

                                            return (
                                                <div className="flex justify-end -mt-2 mb-2 px-11">
                                                    <p className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        {showConversion && (
                                                            <span className="text-amber-600 bg-amber-50 px-1 rounded mr-1" title={`Konversi: ${item.unit} ke ${inv.unit}`}>
                                                                ({convertedQty} {inv.unit})
                                                            </span>
                                                        )}
                                                        {originalQty} {item.unit} x <span className="text-[#2D3A2D] font-bold">Rp {Number(inv.costPrice).toLocaleString('id-ID')} / {inv.unit}</span>
                                                        <span className="opacity-50 mx-1">=</span>
                                                        <span className="font-bold text-slate-600 underline decoration-slate-200">Rp {cost.toLocaleString('id-ID')}</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                    })()}
                                </React.Fragment>
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-[#2D3A2D] text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1A241A] transition-all shadow-lg shadow-[#2D3A2D]/20 active:scale-95 mt-4"
                        >
                            <Save className="w-4 h-4" /> Simpan Resep
                        </button>
                    </div>
                </div>

                {/* Cost Editor Modal */}
                {editingCostItem && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] w-full max-w-md p-8 space-y-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-black text-[#2D3A2D]">Koreksi Harga Bahan</h4>
                                    <p className="text-sm font-bold text-emerald-600">{editingCostItem.product.name}</p>
                                </div>
                                <button onClick={() => setEditingCostItem(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Harga Saat Ini (Salah)</p>
                                <p className="text-2xl font-black text-amber-900">
                                    Rp {Number(editingCostItem.costPrice).toLocaleString('id-ID')} <span className="text-sm font-medium opacity-50">/ {editingCostItem.unit}</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Biaya Total Beli (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-white border border-[#E5E1D8] rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Contoh: 50800"
                                        value={calcData.packPrice}
                                        onChange={e => setCalcData({ ...calcData, packPrice: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Berat atau Total Stock (Isi)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-white border border-[#E5E1D8] rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Contoh: 1000"
                                        value={calcData.packSize}
                                        onChange={e => setCalcData({ ...calcData, packSize: e.target.value })}
                                    />
                                </div>
                            </div>

                            {calcData.packPrice && calcData.packSize && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center animate-in slide-in-from-top-2">
                                    <span className="text-xs font-bold text-emerald-700 uppercase">Harga Baru:</span>
                                    <span className="text-xl font-black text-emerald-600">
                                        Rp {(parseFloat(calcData.packPrice) / parseFloat(calcData.packSize)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs opacity-50">/{editingCostItem.unit}</span>
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={handleUpdateCost}
                                disabled={isUpdatingCost || !calcData.packPrice || !calcData.packSize}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingCost ? 'Menyimpan...' : 'Simpan Harga Baru'}
                            </button>
                        </div>
                    </div>
                )
                }
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cari resep..."
                        className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-[#2D3A2D] focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => {
                        setFormData({ name: '', description: '', frozenVariantId: '', outputQuantity: 1, items: [] });
                        setIsAdding(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Buat Resep Baru
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {filteredRecipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        className="p-6 rounded-[2rem] border border-[#E5E1D8] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group bg-white"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-[#2D3A2D] group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{recipe.name}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase text-slate-500 tracking-wider">
                                        Hasil: {recipe.outputQuantity} {recipe.frozenVariant?.unit || 'pcs'}
                                    </div>
                                    <div className="px-2 py-0.5 bg-emerald-50 rounded text-[8px] font-black uppercase text-emerald-600 tracking-wider">
                                        {recipe.items.length} Bahan
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingRecipe(recipe);
                                    setFormData({
                                        name: recipe.name,
                                        description: recipe.description || '',
                                        frozenVariantId: recipe.frozenVariantId,
                                        outputQuantity: recipe.outputQuantity,
                                        items: recipe.items.map((i: any) => ({
                                            ingredientId: i.ingredientId,
                                            quantity: Number(i.quantity),
                                            unit: i.unit || 'gram',
                                            note: i.note || ''
                                        }))
                                    });
                                }}
                                className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-50">
                            {recipe.items.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-bold">{item.ingredient.product.name}</span>
                                    <span className="text-[#8B7E66] font-black">{item.quantity} {item.unit || 'gram'}</span>
                                </div>
                            ))}
                            {recipe.items.length > 3 && (
                                <p className="text-[8px] text-slate-400 font-bold text-center pt-2">+{recipe.items.length - 3} bahan lainnya</p>
                            )}
                        </div>
                    </div>
                ))}

                {filteredRecipes.length === 0 && (
                    <div className="col-span-2 py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                        <Book className="w-12 h-12 text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Belum ada resep yang terdaftar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
