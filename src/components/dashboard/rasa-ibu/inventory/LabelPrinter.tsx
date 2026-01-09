'use client';

import React, { useState, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Search, Settings2, Tag, ArrowRight, RefreshCw, Barcode, CheckSquare, Square, Download, Trash2, ListChecks } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';
import { generateSkuAction } from '@/lib/actions/inventory/skuGenerator';
import { toast } from 'sonner';

/**
 * A comprehensive Label Printing Station.
 * Enhanced to support:
 * 1. Multi-product selection (Batch printing).
 * 2. Various sheet sizes (A4, A5, F4).
 * 3. PNG/Image export.
 */
interface LabelPrinterProps {
    brandId: string;
    products?: any[];
}

type SheetSize = 'A4' | 'A5' | 'F4' | 'STICKER_50x15' | 'STICKER_100x150';

export default function LabelPrinter({ brandId, products = [] }: LabelPrinterProps) {
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [userMode, setUserMode] = useState({
        layout: 'A4' as SheetSize,
        qrType: 'SKU' as 'SKU' | 'LINK'
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const componentRef = useRef<HTMLDivElement>(null);

    // Derived State
    const selectedProducts = useMemo(() =>
        products.filter(p => selectedProductIds.includes(p.id)),
        [products, selectedProductIds]);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Labels-${new Date().toISOString().split('T')[0]}`,
    });

    const handleDownloadPNG = async () => {
        if (!componentRef.current) return;

        const tid = toast.loading('Generating high-quality PNG...');
        try {
            const dataUrl = await toPng(componentRef.current, {
                quality: 1,
                pixelRatio: 2, // Higher density for crisp QR codes
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `rasa-ibu-labels-${userMode.layout}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Labels downloaded successfully!', { id: tid });
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate image', { id: tid });
        }
    };

    const toggleProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        const filteredIds = filteredProducts.map(p => p.id);
        setSelectedProductIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const clearSelection = () => setSelectedProductIds([]);

    const filteredProducts = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
            {/* Left: Product Selector */}
            <div className="w-full lg:w-1/3 bg-white p-6 rounded-[2.5rem] border border-[#E5E1D8] flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-[#2D3A2D] flex items-center gap-3">
                            <Tag className="w-6 h-6 text-emerald-600" />
                            Label Station
                        </h2>
                        <p className="text-xs text-[#8B7E66] mt-1 font-medium">
                            {selectedProductIds.length} items selected for printing
                        </p>
                    </div>
                    {selectedProductIds.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Clear selection"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search product..."
                            className="w-full pl-10 pr-4 py-3 bg-[#F9F7F2] rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={selectAll}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 px-2 hover:opacity-70"
                    >
                        <ListChecks className="w-3.5 h-3.5" />
                        Pilih Semua Hasil Cari
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {filteredProducts.map((p: any) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => toggleProduct(p.id)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${isSelected
                                    ? 'bg-[#2D3A2D] text-white border-[#2D3A2D] shadow-lg'
                                    : 'bg-white border-[#E5E1D8] text-[#2D3A2D] hover:bg-[#F9F7F2]'
                                    }`}
                            >
                                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-gray-50'}`}>
                                    {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm line-clamp-1">{p.name}</p>
                                    <p className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-white/60' : 'text-[#8B7E66]'}`}>
                                        {p.sku || 'NO SKU'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Preview & Settings */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Toolbar */}
                <div className="bg-white p-4 rounded-[2rem] border border-[#E5E1D8] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex bg-[#F9F7F2] p-1 rounded-xl overflow-x-auto">
                            {(['A4', 'A5', 'F4', 'STICKER_50x15'] as SheetSize[]).map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setUserMode(prev => ({ ...prev, layout: size }))}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${userMode.layout === size ? 'bg-white shadow-sm text-[#2D3A2D]' : 'text-gray-400'}`}
                                >
                                    {size.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-[#F9F7F2] p-1 rounded-xl">
                            <button
                                onClick={() => setUserMode(prev => ({ ...prev, qrType: 'SKU' }))}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${userMode.qrType === 'SKU' ? 'bg-white shadow-sm text-[#2D3A2D]' : 'text-gray-400'}`}
                            >
                                SKU
                            </button>
                            <button
                                onClick={() => setUserMode(prev => ({ ...prev, qrType: 'LINK' }))}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${userMode.qrType === 'LINK' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                            >
                                Link
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPNG}
                            disabled={selectedProductIds.length === 0}
                            className="px-6 py-2 bg-white border border-[#E5E1D8] text-[#2D3A2D] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F9F7F2] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Download PNG
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={selectedProductIds.length === 0}
                            className="px-6 py-2 bg-[#2D3A2D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            Print Label
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-[#8B7E66]/10 rounded-[2.5rem] border border-[#8B7E66]/20 flex items-center justify-center p-10 overflow-auto relative custom-scrollbar">
                    {selectedProductIds.length === 0 ? (
                        <div className="text-center text-[#8B7E66]/50">
                            <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="font-bold">Select products to preview sheet</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow-2xl origin-center transition-transform hover:scale-[1.02]">
                            {/* The Printable Component */}
                            <div ref={componentRef} className="bg-white text-black print:p-0">
                                {userMode.layout === 'STICKER_50x15' ? (
                                    <div className="flex flex-col gap-2 p-2">
                                        {selectedProducts.map(p => (
                                            <SingleSticker key={p.id} product={p} mode={userMode.qrType} />
                                        ))}
                                    </div>
                                ) : (
                                    <MultiSheet products={selectedProducts} mode={userMode.qrType} size={userMode.layout} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Overlay */}
                    {selectedProductIds.length > 0 && (
                        <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 backdrop-blur text-white text-[10px] font-mono rounded-full flex gap-4">
                            <span>{userMode.layout === 'A4' ? '210 x 297mm' : userMode.layout === 'A5' ? '148 x 210mm' : '215 x 330mm'}</span>
                            <span className="text-emerald-400 font-bold">{selectedProductIds.length} Menu</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components for Print Layouts

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://achiera.com';

function SingleSticker({ product, mode }: { product: any, mode: 'SKU' | 'LINK' }) {
    const qrValue = mode === 'LINK'
        ? `${BASE_URL}/rasa-ibu/products/${product.slug || product.id}`
        : product.sku || 'NO-SKU';

    return (
        <div style={{ width: '50mm', height: '15mm', padding: '1.5mm 2.5mm', display: 'flex', flexDirection: 'row', alignItems: 'center', boxSizing: 'border-box', border: '1px dashed #ddd', marginBottom: '2mm' }} className="print:border-0 print:mb-0 relative bg-white">
            <div style={{ flex: 1, overflow: 'hidden', paddingRight: '2mm' }}>
                <p style={{ fontSize: '6.5pt', fontWeight: '900', lineHeight: 1, marginBottom: '0.5mm', color: '#2D3A2D', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                <p style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#8B7E66' }}>{product.sku}</p>
                {mode === 'SKU' ? (
                    <p style={{ fontSize: '5.5pt', marginTop: '1mm', fontWeight: '900', color: '#2D3A2D' }}>Rp {Number(product.price || 0).toLocaleString('id-ID')}</p>
                ) : (
                    <p style={{ fontSize: '4.5pt', marginTop: '2mm', fontWeight: 'bold', color: '#EE4D2D', fontStyle: 'italic' }}>Mangga di-scan, Bunda! 🍲</p>
                )}
            </div>
            <div style={{ width: '12mm', height: '12mm', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {product.sku ? (
                    <QRCodeSVG value={qrValue} size={45} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[5px]">NO SKU</div>
                )}
            </div>
        </div>
    );
}

function MultiSheet({ products, mode, size }: { products: any[], mode: 'SKU' | 'LINK', size: any }) {
    // Determine sheet dimensions
    const dimensions = {
        'A4': { w: '210mm', h: '297mm', cols: 3, rows: 14 },
        'A5': { w: '148mm', h: '210mm', cols: 2, rows: 9 },
        'F4': { w: '215mm', h: '330mm', cols: 3, rows: 15 }
    }[size as 'A4' | 'A5' | 'F4'] || { w: '210mm', h: '297mm', cols: 3, rows: 14 };

    const totalSlots = dimensions.cols * dimensions.rows;
    const numSheets = Math.max(1, Math.ceil(products.length / totalSlots));

    return (
        <div className="flex flex-col gap-10 print:gap-0">
            {Array.from({ length: numSheets }).map((_, sheetIdx) => (
                <div
                    key={sheetIdx}
                    style={{
                        width: dimensions.w,
                        height: dimensions.h,
                        padding: '10mm',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${dimensions.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${dimensions.rows}, 1fr)`,
                        gap: '5mm',
                        backgroundColor: 'white',
                        pageBreakAfter: 'always'
                    }}
                    className="print:shadow-none"
                >
                    {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                        const globalIdx = (sheetIdx * totalSlots) + slotIdx;
                        // Cyclically pick product to ensure sheet is always full
                        const p = products[globalIdx % products.length];
                        const qrValue = mode === 'LINK'
                            ? `${BASE_URL}/rasa-ibu/products/${p.slug || p.id}`
                            : p.sku || 'NO-SKU';

                        return (
                            <div key={slotIdx} style={{ border: '1px dashed #ccc', display: 'flex', alignItems: 'center', padding: '2mm', boxSizing: 'border-box' }} className="print:border-0 overflow-hidden">
                                <div style={{ flex: 1, minWidth: 0, paddingRight: '1mm' }}>
                                    <p style={{ fontSize: '7pt', fontWeight: '900', color: '#2D3A2D', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', lineHeight: 1 }}>
                                        {p.name}
                                    </p>
                                    <p style={{ fontSize: '5pt', fontFamily: 'monospace', marginTop: '0.5mm', color: '#8B7E66' }}>{p.sku}</p>
                                    {mode === 'SKU' ? (
                                        <p style={{ fontSize: '6pt', fontWeight: '900', marginTop: '1mm', color: '#2D3A2D' }}>
                                            Rp {Number(p.price || 0).toLocaleString('id-ID')}
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '5pt', marginTop: '2mm', fontWeight: 'bold', color: '#EE4D2D', fontStyle: 'italic' }}>
                                            Mangga di-scan, Bunda! 🍲
                                        </p>
                                    )}
                                </div>
                                <div style={{ width: '10mm', height: '10mm', flexShrink: 0, marginLeft: '1mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {p.sku ? (
                                        <QRCodeSVG value={qrValue} size={38} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[6px]">GENERATE SKU</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
