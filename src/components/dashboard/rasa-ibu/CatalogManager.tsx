'use client';

import React, { useState } from 'react';
import { createProduct, updateProduct, deleteProduct, getIbuCategories } from '@/lib/actions/rasa-ibu/catalog';
import { getRecipeHPPAction } from '@/lib/actions/rasa-ibu/production';
import { uploadProductImage, uploadMultipleProductImages } from '@/lib/actions/rasa-ibu/imageUpload';
import { ImagePlus, X, Zap, Tag, Percent, TrendingUp, Info, Scale, Activity, Star } from 'lucide-react';
import { toast } from 'sonner';
import CategoryManager from './inventory/CategoryManager';
import PublicProductPreview from './inventory/PublicProductPreview';
import { getPricingRecommendationAction, getPlatformSettingsAction } from '@/lib/actions/rasa-ibu/finance';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface CatalogManagerProps {
    brandId: string;
    products: any[];
    categories: any[];
    onClose: () => void;
}

export default function CatalogManager({ brandId, products, categories, onClose }: CatalogManagerProps) {
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [localCategories, setLocalCategories] = useState(categories);
    const [calculatedHPP, setCalculatedHPP] = useState<number | null>(null);
    const confirm = useConfirm();
    const [pricingRec, setPricingRec] = useState<any>(null);
    const [isLoadingPricing, setIsLoadingPricing] = useState(false);
    const [platformSettings, setPlatformSettings] = useState<any>(null);

    // Load Settings
    React.useEffect(() => {
        if (brandId) {
            getPlatformSettingsAction(brandId).then(res => {
                if (res.success) setPlatformSettings(res.settings);
            });
        }
    }, [brandId]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        costPrice: '',
        weight: '',
        categoryId: localCategories[0]?.id || '',
        slug: '',
        ingredients: '',
        nutritionCalories: '',
        nutritionProtein: '',
        nutritionCarbs: '',
        nutritionFat: '',
        storageType: 'FROZEN',
        shelfLife: '6',
        unit: 'pcs',
        isFeatured: false,
        featuredOrder: 0
    });

    // Image State
    const [primaryImage, setPrimaryImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [primaryImagePreview, setPrimaryImagePreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleEdit = (product: any) => {
        const variant = product.variants?.[0] || {};
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: variant.price?.toString() || '',
            costPrice: variant.costPrice?.toString() || '',
            weight: variant.weight?.toString() || '',
            categoryId: product.categoryId,
            slug: product.slug,
            ingredients: product.ingredients || '',
            nutritionCalories: product.nutrition?.calories?.toString() || '',
            nutritionProtein: product.nutrition?.protein?.toString() || '',
            nutritionCarbs: product.nutrition?.carbs?.toString() || '',
            nutritionFat: product.nutrition?.fat?.toString() || '',
            storageType: product.storageType || 'FROZEN',
            shelfLife: product.shelfLife?.toString() || '6',
            unit: variant.unit || 'pcs',
            isFeatured: product.isFeatured || false,
            featuredOrder: product.featuredOrder || 0
        });
        // Set existing image preview
        if (product.image) {
            setPrimaryImagePreview(product.image);
        }
        // Set existing gallery images
        if (product.images) {
            try {
                const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                setExistingGalleryImages(Array.isArray(imgs) ? imgs : []);
            } catch (e) {
                setExistingGalleryImages([]);
            }
        } else {
            setExistingGalleryImages([]);
        }
        setGalleryImages([]);
        setGalleryPreviews([]);
        setView('FORM');

        // Fetch calculated HPP if product has a variant and possibly a recipe
        const fetchHPP = async () => {
            if (variant.id) {
                const hppRes = await getRecipeHPPAction(brandId, variant.id);
                if (hppRes.success && typeof hppRes.totalHPP === 'number') {
                    setCalculatedHPP(hppRes.totalHPP);
                    // Automatically update costPrice in form if it's currently 0 or different
                    setFormData(prev => ({
                        ...prev,
                        costPrice: hppRes.totalHPP!.toString()
                    }));
                } else {
                    setCalculatedHPP(null);
                }
            }
        };
        fetchHPP();
    };

    // Dynamic Pricing Recommendation Fetcher
    React.useEffect(() => {
        const fetchPricing = async () => {
            const hpp = parseFloat(formData.costPrice);
            if (hpp > 0 && brandId) {
                setIsLoadingPricing(true);
                const res = await getPricingRecommendationAction(brandId, hpp);
                if (res.success) {
                    setPricingRec(res.data);
                }
                setIsLoadingPricing(false);
            } else {
                setPricingRec(null);
            }
        };

        const timer = setTimeout(fetchPricing, 500); // Debounce
        return () => clearTimeout(timer);
    }, [formData.costPrice, brandId]);

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            costPrice: '',
            weight: '',
            categoryId: localCategories[0]?.id || '',
            slug: '',
            ingredients: '',
            nutritionCalories: '',
            nutritionProtein: '',
            nutritionCarbs: '',
            nutritionFat: '',
            storageType: 'FROZEN',
            shelfLife: '6',
            unit: 'pcs',
            isFeatured: false,
            featuredOrder: 0
        });
        // Reset images
        setPrimaryImage(null);
        setGalleryImages([]);
        setPrimaryImagePreview('');
        setPrimaryImagePreview('');
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
        setView('FORM');
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus dari Katalog?',
            message: 'Produk ini akan dihapus dari daftar menu. Bunda yakin?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;
        const res = await deleteProduct(id, brandId);
        if (res.success) {
            toast.success('Produk berhasil dihapus.');
            onClose(); // Revalidate via server action will update page
        }
    };

    const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPrimaryImage(file);
            setPrimaryImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + galleryImages.length > 5) {
            toast.error('Maksimal 5 gambar untuk galeri');
            return;
        }
        setGalleryImages([...galleryImages, ...files]);
        const previews = files.map(f => URL.createObjectURL(f));
        setGalleryPreviews([...galleryPreviews, ...previews]);
    };

    const removeGalleryImage = (index: number) => {
        if (index < existingGalleryImages.length) {
            setExistingGalleryImages(existingGalleryImages.filter((_, i) => i !== index));
        } else {
            const newIndex = index - existingGalleryImages.length;
            setGalleryImages(galleryImages.filter((_, i) => i !== newIndex));
            setGalleryPreviews(galleryPreviews.filter((_, i) => i !== newIndex));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setIsUploading(true);

        try {
            let primaryImagePath = editingProduct?.image || '';
            let galleryImagePaths: string[] = [];

            // Upload primary image if new file selected
            if (primaryImage) {
                const formData = new FormData();
                formData.append('image', primaryImage);
                const uploadRes = await uploadProductImage(formData);
                if (uploadRes.success && uploadRes.path) {
                    primaryImagePath = uploadRes.path;
                } else {
                    toast.error(`Error upload gambar: ${uploadRes.error}`);
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            }

            // Combine existing images with uploaded ones
            galleryImagePaths = [...existingGalleryImages];

            // Upload gallery images if any
            if (galleryImages.length > 0) {
                const galleryFormData = new FormData();
                galleryImages.forEach(img => galleryFormData.append('images', img));
                const galleryRes = await uploadMultipleProductImages(galleryFormData);
                if (galleryRes.success && 'paths' in galleryRes && galleryRes.paths) {
                    galleryImagePaths.push(...galleryRes.paths);
                }
            }

            setIsUploading(false);

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                costPrice: parseFloat(formData.costPrice || '0'),
                weight: parseFloat(formData.weight),
                brandId: localCategories[0]?.brandId,
                image: primaryImagePath,
                images: galleryImagePaths,
                ingredients: formData.ingredients,
                nutrition: {
                    calories: formData.nutritionCalories ? parseInt(formData.nutritionCalories) : 0,
                    protein: formData.nutritionProtein ? parseInt(formData.nutritionProtein) : 0,
                    carbs: formData.nutritionCarbs ? parseInt(formData.nutritionCarbs) : 0,
                    fat: formData.nutritionFat ? parseInt(formData.nutritionFat) : 0
                },
                storageType: formData.storageType,
                shelfLife: parseInt(formData.shelfLife),
                unit: formData.unit,
                isFeatured: formData.isFeatured,
                featuredOrder: parseInt(formData.featuredOrder.toString()) || 0
            };

            let res;
            if (editingProduct) {
                res = await updateProduct({
                    id: editingProduct.id,
                    ...payload
                });
            } else {
                const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
                res = await createProduct({
                    ...payload,
                    slug,
                    brandId: payload.brandId
                });
            }

            if (res.success) {
                toast.success(editingProduct ? 'Perubahan berhasil disimpan.' : 'Produk baru berhasil ditambahkan.');
                onClose();
            } else {
                toast.error(`Error: ${res.error}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }

        setIsSubmitting(false);
    };

    const handleRefreshCategories = async () => {
        if (brandId) {
            const res = await getIbuCategories(brandId);
            setLocalCategories(res);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FDFBF7] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="px-12 py-10 border-b border-[#E5E1D8] bg-white flex justify-between items-center">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66]">Meja Pengelola</span>
                    <h2 className="text-3xl font-black text-[#2D3A2D]">Katalog Dapur RASA IBU</h2>
                </div>
                {view === 'LIST' ? (
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowCategoryManager(true)}
                            className="px-6 py-4 border border-[#E5E1D8] text-[#8B7E66] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/50 transition-all flex items-center gap-2"
                        >
                            <Tag className="w-3 h-3" /> Kelola Kategori
                        </button>
                        <button onClick={handleAddNew} className="px-8 py-4 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform">
                            Tambah Produk Baru
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setView('LIST')} className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D]">
                        Kembali ke Daftar
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-12">
                {view === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {products.map((p) => (
                            <div key={p.id} className="bg-white p-8 border border-[#E5E1D8] rounded-[2rem] space-y-6 group hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-[#1A241A] tracking-tight">{p.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category?.name || 'Frozen'}</p>
                                    </div>
                                    <span className="text-lg font-black text-[#2D3A2D]">
                                        Rp {(p.variants?.[0]?.price || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic line-clamp-2">
                                    "{p.description || 'Tidak ada deskripsi.'}"
                                </p>
                                <div className="flex gap-4 pt-4 pt-2 border-t border-[#F9F7F2]">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] border border-[#E5E1D8] rounded-xl hover:bg-[#FDFBF7] transition-colors"
                                    >
                                        Edit Detail
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-[1600px] mx-auto">
                        {/* Left Side: Form */}
                        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nama Masakan</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        placeholder="Contoh: Rendang Daging Mande"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Modal Bahan (HPP)</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="number"
                                                readOnly={calculatedHPP !== null}
                                                value={formData.costPrice}
                                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                                className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none ${calculatedHPP !== null
                                                    ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                                                    : 'bg-white border-[#E5E1D8] text-[#2D3A2D] focus:border-[#2D3A2D]'
                                                    }`}
                                                placeholder="50000"
                                            />
                                            {calculatedHPP !== null && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-emerald-100">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                                        <Zap className="w-3 h-3 fill-emerald-500" /> Auto-Recipe
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {pricingRec && (
                                        <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-rose-800">
                                                <span>ALOKASI OVERHEAD</span>
                                                <span>+ Rp {Math.round(pricingRec.overhead).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="h-px bg-rose-200/50" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-black text-rose-900 uppercase">MODAL DASAR TOTAL</span>
                                                <span className="text-sm font-black text-rose-900">Rp {Math.round(pricingRec.trueHpp).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Info size={10} className="text-rose-600" />
                                                <p className="text-[8px] font-bold text-rose-700 uppercase tracking-tight">Termasuk Biaya Operasional & Beban Dapur</p>
                                            </div>
                                        </div>
                                    )}

                                    {calculatedHPP !== null && (
                                        <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1.5 italic">
                                            <Info className="w-3 h-3" />
                                            Modal bahan dikunci otomatis sesuai kalkulasi resep.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Harga Jual (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#2D3A2D]"
                                        placeholder="85000"
                                    />
                                </div>

                                {/* Margin Analysis Section */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="p-8 bg-gradient-to-br from-[#FDFBF7] to-white border border-[#E5E1D8] rounded-[2.5rem] space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-[#2D3A2D] text-white rounded-[1.25rem]">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2D3A2D]">Analisis Profit Bersih</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold italic">Sudah Termasuk Potongan Biaya Operasional & Platform</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {(() => {
                                                    const rawHpp = parseFloat(formData.costPrice) || 0;
                                                    const overhead = pricingRec?.overhead || 0;
                                                    const totalModal = rawHpp + overhead;
                                                    const price = parseFloat(formData.price) || 0;

                                                    if (totalModal > 0 && price > 0) {
                                                        // Net Margin Calculation: (Price - Modal - PlatformFee) / Price
                                                        const platformFee = pricingRec?.marketplaceFee || (price * 0.15);
                                                        const netProfitNominal = price - totalModal - platformFee;
                                                        const netMarginPercent = (netProfitNominal / price) * 100;

                                                        return (
                                                            <>
                                                                <span className={`text-xl font-black ${netMarginPercent >= 25 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {netMarginPercent.toFixed(1)}%
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Margin Bersih (Net)</span>
                                                            </>
                                                        );
                                                    }
                                                    return <span className="text-xs font-bold text-slate-300 italic">Input Harga & Modal</span>;
                                                })()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Current Profit Summary */}
                                            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] border-dashed space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Keuntungan Bersih (est. per porsi)</p>
                                                <p className="text-lg font-black text-[#2D3A2D]">
                                                    {(() => {
                                                        const rawHpp = parseFloat(formData.costPrice) || 0;
                                                        const overhead = pricingRec?.overhead || 0;
                                                        const price = parseFloat(formData.price) || 0;
                                                        const platformFee = pricingRec?.marketplaceFee || (price * 0.15);
                                                        const netProfit = price - (rawHpp + overhead) - platformFee;
                                                        return `Rp ${Math.max(0, Math.round(netProfit)).toLocaleString('id-ID')}`;
                                                    })()}
                                                </p>
                                            </div>

                                            {/* Break-even Multiplier */}
                                            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] border-dashed space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Markup vs Modal Dasar</p>
                                                <p className="text-lg font-black text-[#2D3A2D]">
                                                    {(() => {
                                                        const rawHpp = parseFloat(formData.costPrice) || 0;
                                                        const overhead = pricingRec?.overhead || 0;
                                                        const totalModal = rawHpp + overhead;
                                                        const price = parseFloat(formData.price) || 0;
                                                        return totalModal > 0 ? (price / totalModal).toFixed(2) : '0';
                                                    })()}x <span className="text-[10px] text-slate-400">Lipat Modal Dasar</span>
                                                </p>
                                            </div>
                                        </div>


                                        {/* Platform Simulation Section */}
                                        {platformSettings && (
                                            <div className="space-y-4 pt-4 border-t border-[#E5E1D8]">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-slate-400" />
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Simulasi Laba Bersih per Platform</h5>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {Object.entries(platformSettings.marketplaceFees || {}).map(([platform, fee]: [string, any]) => {
                                                        const price = parseFloat(formData.price) || 0;
                                                        const rawHpp = parseFloat(formData.costPrice) || 0;
                                                        const overhead = pricingRec?.overhead || 0;
                                                        const feeAmount = price * (Number(fee) / 100);
                                                        const netProfit = price - (rawHpp + overhead) - feeAmount;

                                                        return (
                                                            <div key={platform} className="bg-white p-4 rounded-2xl border border-[#E5E1D8] flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D]">{platform.replace(/_/g, ' ')}</span>
                                                                    <p className="text-[9px] font-bold text-slate-400">Fee {fee}% (Rp {Math.round(feeAmount).toLocaleString('id-ID')})</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className={`text-sm font-black ${netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        Rp {Math.round(netProfit).toLocaleString('id-ID')}
                                                                    </span>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Profit Bersih</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comparative Recommendations */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3 h-3 text-emerald-600" />
                                                <h5 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Rekomendasi Strategi Harga (Net 30%)</h5>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                {isLoadingPricing ? (
                                                    <div className="col-span-1 h-32 bg-slate-50 animate-pulse rounded-3xl flex items-center justify-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mengkalkulasi Alokasi...</span>
                                                    </div>
                                                ) : pricingRec ? (
                                                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col gap-6 group hover:bg-blue-100/50 transition-all duration-300">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
                                                                    <Scale className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest block flex items-center gap-1.5">
                                                                        AI-Overhead Integrated
                                                                        {pricingRec.isDynamic && (
                                                                            <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-lg text-[7px] font-black flex items-center gap-1 animate-pulse">
                                                                                <Activity className="w-2 h-2" /> LIVE OPEX
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-blue-600 italic">
                                                                        {pricingRec.isDynamic
                                                                            ? `Alokasi otomatis dari total beban Rp ${Math.round(pricingRec.totalMonthlyOpex).toLocaleString('id-ID')} / bulan`
                                                                            : 'Target Profit Bersih 30% Setelah Operasional & Fee'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-black text-blue-900 tracking-tight block">
                                                                    Rp {Math.round(pricingRec.recommendedPrice).toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Breakdown List */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {pricingRec.breakdown?.map((item: any, i: number) => (
                                                                <div key={i} className="bg-white/60 p-3 rounded-2xl border border-blue-200/50 flex justify-between items-center group/item hover:bg-white transition-colors">
                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
                                                                    <div className="text-right">
                                                                        <span className="text-[11px] font-black text-slate-700 block">
                                                                            Rp {Math.round(item.value).toLocaleString('id-ID')}
                                                                        </span>
                                                                        <span className={`text-[9px] font-bold ${item.label.includes('Keuntungan') ? 'text-emerald-500' : 'text-blue-400'}`}>
                                                                            {item.percentage.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, price: pricingRec.recommendedPrice.toString() })}
                                                            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
                                                        >
                                                            Gunakan Rekomendasi Ini
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="col-span-1 p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
                                                        <TrendingUp className="w-8 h-8 text-slate-200" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Input Harga Modal untuk melihat analisis</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Berat (gram)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        placeholder="250"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Tipe Penyimpanan</label>
                                    <select
                                        value={formData.storageType}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                storageType: val,
                                                shelfLife: val === 'READY_TO_EAT' ? '0' : prev.shelfLife
                                            }));
                                        }}
                                        className="w-full px-4 py-3 bg-[#FDFBF7] rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#2D3A2D]/20"
                                    >
                                        <option value="FROZEN">Frozen</option>
                                        <option value="CHILLED">Chilled</option>
                                        <option value="AMBIENT">Suhu Ruang</option>
                                        <option value="READY_TO_EAT">Siap Saji (Langsung Makan)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Satuan Stok</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#FDFBF7] rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#2D3A2D]/20"
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="porsi">Porsi</option>
                                        <option value="gram">Gram (g)</option>
                                        <option value="ml">Mililiter (ml)</option>
                                        <option value="pack">Pack</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Umur Simpan (Bulan)</label>
                                    {formData.storageType === 'READY_TO_EAT' ? (
                                        <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Tanpa Umur Simpan (Konsumsi Langsung)</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            value={formData.shelfLife}
                                            onChange={(e) => setFormData({ ...formData, shelfLife: e.target.value })}
                                            placeholder="Bulan"
                                            className="w-full px-4 py-3 bg-[#FDFBF7] rounded-xl text-sm font-bold text-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#2D3A2D]/20"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Kategori</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                    >
                                        {localCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Slug URL (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        placeholder="rendang-mande"
                                    />
                                </div>
                            </div>

                            {/* Section: Promosi & Unggulan */}
                            <div className="p-8 bg-amber-50/30 border border-amber-100 rounded-[2.5rem] space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-500 text-white rounded-[1.25rem]">
                                        <Star className="w-5 h-5 fill-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-900">Promosi & Produk Unggulan</h4>
                                        <p className="text-[10px] text-amber-700/60 font-bold italic">Tampilkan masakan ini di bagian teratas homepage</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-black uppercase text-amber-900">Tampilkan sebagai Unggulan</span>
                                            <p className="text-[9px] text-slate-400 font-medium italic">Muncul di section "Favorit Keluarga"</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.isFeatured}
                                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Urutan Unggulan (Kecil = Atas)</label>
                                        <input
                                            type="number"
                                            value={formData.featuredOrder}
                                            onChange={(e) => setFormData({ ...formData, featuredOrder: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                            placeholder="0, 1, 2..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Cerita Masakan (Deskripsi)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm h-32 focus:outline-none focus:border-[#2D3A2D]"
                                    placeholder="Ceritakan sejarah atau keunikan rasa dari masakan ini..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Komposisi (Ingredients)</label>
                                <textarea
                                    rows={3}
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    placeholder="Daging sapi, santan, lengkuas..."
                                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Informasi Gizi (per sajian)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Kalori (kcal)</span>
                                        <input
                                            type="number"
                                            value={formData.nutritionCalories}
                                            onChange={(e) => setFormData({ ...formData, nutritionCalories: e.target.value })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Protein (g)</span>
                                        <input
                                            type="number"
                                            value={formData.nutritionProtein}
                                            onChange={(e) => setFormData({ ...formData, nutritionProtein: e.target.value })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Karbo (g)</span>
                                        <input
                                            type="number"
                                            value={formData.nutritionCarbs}
                                            onChange={(e) => setFormData({ ...formData, nutritionCarbs: e.target.value })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Lemak (g)</span>
                                        <input
                                            type="number"
                                            value={formData.nutritionFat}
                                            onChange={(e) => setFormData({ ...formData, nutritionFat: e.target.value })}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D3A2D]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-6 pt-6 border-t border-[#E5E1D8]">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Gambar Utama Produk</label>

                                    {primaryImagePreview ? (
                                        <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border-2 border-[#E5E1D8]">
                                            <img src={primaryImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPrimaryImage(null);
                                                    setPrimaryImagePreview('');
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#E5E1D8] rounded-2xl cursor-pointer hover:border-[#2D3A2D] transition-colors bg-white">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImagePlus className="w-12 h-12 text-[#8B7E66] mb-3" />
                                                <p className="text-xs font-bold text-[#8B7E66] uppercase tracking-wider">Klik untuk upload gambar</p>
                                                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP (Max 5MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handlePrimaryImageChange}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Gallery Images */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Galeri Produk (Opsional, Max 5)</label>

                                    <div className="grid grid-cols-5 gap-4">
                                        {[...existingGalleryImages, ...galleryPreviews].map((preview, index) => (
                                            <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-[#E5E1D8]">
                                                <img src={preview} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {galleryImages.length < 5 && (
                                            <label className="aspect-square border-2 border-dashed border-[#E5E1D8] rounded-xl cursor-pointer hover:border-[#2D3A2D] transition-colors flex items-center justify-center bg-white">
                                                <ImagePlus className="w-6 h-6 text-[#8B7E66]" />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    multiple
                                                    onChange={handleGalleryImagesChange}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {isUploading && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <p className="text-xs font-bold text-blue-700">📤 Mengupload gambar...</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-[#E5E1D8] flex justify-end gap-6">
                                <button type="button" onClick={() => setView('LIST')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                                    Batal
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className={`px-12 py-5 bg-[#2D3A2D] text-[#FDFBF7] text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${isSubmitting ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                                >
                                    {isSubmitting ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Terbitkan Produk')}
                                </button>
                            </div>
                        </form>

                        {/* Right Side: Live Preview */}
                        <div className="lg:col-span-2 hidden lg:block">
                            <div className="sticky top-8">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Live Website Preview</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Sinkron Otomatis</span>
                                    </div>
                                </div>
                                <PublicProductPreview
                                    data={formData}
                                    imagePreview={primaryImagePreview}
                                />
                            </div>
                        </div>
                    </div>
                )
                }
            </div >

            {/* Overlays */}
            {
                showCategoryManager && (
                    <CategoryManager
                        brandId={brandId}
                        categories={localCategories}
                        onClose={() => setShowCategoryManager(false)}
                        onRefresh={handleRefreshCategories}
                    />
                )
            }
        </div >
    );
}
