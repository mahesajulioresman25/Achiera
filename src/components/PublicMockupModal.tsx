'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, X, Upload, ShoppingCart, RefreshCcw, ZoomIn } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useCart } from '@/lib/contexts/CartContext';
import Moveable from 'react-moveable';

interface PublicMockupModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    variantId?: string;
}

export default function PublicMockupModal({
    isOpen,
    onClose,
    productId,
    variantId
}: PublicMockupModalProps) {
    const toast = useToast();
    const { addToCart } = useCart();
    const targetRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [template, setTemplate] = useState<any>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(variantId || '');

    // Design state
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [detectedColors, setDetectedColors] = useState<string[]>([]);

    // Order Type State
    const [isBlank, setIsBlank] = useState(false);

    // Order State
    const [quantity, setQuantity] = useState(1);

    // Pricing State
    const [printOptions, setPrintOptions] = useState({
        printMethod: 'dtf', // Default
        designSize: 'A4',
        colorCount: 1
    });
    const [priceBreakdown, setPriceBreakdown] = useState<any>(null);

    // Transform State (Pixels relative to container)
    // We use Ref for high-performance updates during drag, avoiding re-renders
    const transformRef = useRef({
        translate: [0, 0],
        rotate: 0,
        scale: [1, 1]
    });

    useEffect(() => {
        if (isOpen && productId) {
            fetchData();
        }
    }, [isOpen, productId]);

    useEffect(() => {
        if (selectedVariantId) {
            fetchTemplate(selectedVariantId);
        }
    }, [selectedVariantId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const prodRes = await fetch(`/api/public/products/${productId}`);
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                setProduct(prodData);

                if (!selectedVariantId && prodData.variants.length > 0) {
                    setSelectedVariantId(prodData.variants[0].id);
                } else if (selectedVariantId) {
                    fetchTemplate(selectedVariantId);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplate = async (vId: string) => {
        try {
            const res = await fetch(`/api/public/products/${productId}/mockup?variantId=${vId}`);
            if (res.ok) {
                const data = await res.json();
                setTemplate(data);
                // Reset transform when template changes
                transformRef.current = { translate: [0, 0], rotate: 0, scale: [1, 1] };
            } else {
                setTemplate(null);
            }
        } catch (error) {
            console.error('Error fetching template:', error);
        }
    };

    // PRICE CALCULATION
    useEffect(() => {
        if (productId && selectedVariantId) {
            calculatePrice();
        }
    }, [productId, selectedVariantId, printOptions, quantity, isBlank]);

    const calculatePrice = async () => {
        try {
            // For blank orders, we send empty options (or minimal ones) to mostly hit base price
            const calcOptions = isBlank ? {} : printOptions;

            const res = await fetch('/api/public/price/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    variantId: selectedVariantId,
                    quantity: quantity,
                    options: calcOptions
                })
            });
            if (res.ok) {
                const data = await res.json();
                setPriceBreakdown(data);
            }
        } catch (error) {
            console.error('Price Calc Error:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setUploadedImage(previewUrl);
        setIsUploading(true);
        // Reset transform for new image
        transformRef.current = { translate: [0, 0], rotate: 0, scale: [1, 1] };

        // Auto-detect colors
        import('@/utils/image-analysis').then(async ({ detectColors }) => {
            try {
                // @ts-ignore
                const { count, colors } = await detectColors(previewUrl);

                setDetectedColors(colors || []);
                const adjustedCount = Math.min(Math.max(1, count), 4);

                setPrintOptions(prev => ({
                    ...prev,
                    colorCount: adjustedCount
                }));

                toast.success(`Detected ${count} colors`);
            } catch (e) {
                console.error("Color detect fail", e);
            }
        });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUploadedImage(data.url);
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    // COMPOSITE GENERATION
    const generateCompositeMockup = async (): Promise<string | null> => {
        if (!template || !template.frontMockupImage || !uploadedImage || !targetRef.current) return null;

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Set canvas size to match original template resolution (High Quality)
            canvas.width = template.canvasWidth;
            canvas.height = template.canvasHeight;

            const baseImg = new Image();
            baseImg.crossOrigin = "anonymous";
            baseImg.src = template.frontMockupImage;

            baseImg.onload = () => {
                // 1. Draw Base Mockup
                ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

                // 2. Draw User Design
                const designImg = new Image();
                designImg.crossOrigin = "anonymous";
                designImg.src = uploadedImage;

                designImg.onload = () => {
                    // Calculate mapping from Screen Pixels (500px container) to Canvas Pixels (e.g., 2000px)
                    const containerWidth = 500; // Fixed width from render
                    const ratio = canvas.width / containerWidth;

                    // Design position relative to container
                    // The print area wrapper offset needs to be accounted for?
                    // Actually, the Moveable is inside the Print Area div.
                    // So (0,0) of Moveable = (0,0) of Print Area.

                    // Get Print Area Offset on Canvas
                    const printAreaX = template.printAreaX;
                    const printAreaY = template.printAreaY;

                    // Get Transform Values
                    const { translate: [tx, ty], rotate, scale } = transformRef.current;
                    // Moveable translate is relative to its start position.
                    // Start position is top-left of Print Area?
                    // We render img inside Print Area div.

                    // Center the context to the design's location for rotation
                    // Original Design Size (visual):
                    // We need to know the rendered size of the image.
                    const renderedWidth = targetRef.current!.offsetWidth * scale[0];
                    const renderedHeight = targetRef.current!.offsetHeight * scale[1];
                    const rawWidth = targetRef.current!.offsetWidth; // Unscaled visual width
                    const rawHeight = targetRef.current!.offsetHeight;

                    // Save context
                    ctx.save();

                    // MOCKUP LOGIC:
                    // 1. Translate to Print Area Origin + Drag Translation
                    // We need to map visual (CSS) pixels to Canvas pixels.

                    // Visual X (relative to Print Area) = tx
                    // Canvas X = printAreaX + (tx * ratio)

                    const canvasX = printAreaX + (tx * ratio);
                    const canvasY = printAreaY + (ty * ratio);

                    // We need to handle rotation around center
                    // Move context to center of the image
                    const centerX = canvasX + (rawWidth * ratio * scale[0]) / 2;
                    const centerY = canvasY + (rawHeight * ratio * scale[1]) / 2;

                    // BUT transform-origin is usually center in Moveable?
                    // Let's assume user rotates around center.

                    ctx.save();

                    ctx.translate(canvasX + (rawWidth * ratio) / 2, canvasY + (rawHeight * ratio) / 2);
                    ctx.rotate((rotate * Math.PI) / 180);
                    ctx.scale(scale[0], scale[1]);

                    // Draw Image centered
                    ctx.drawImage(
                        designImg,
                        -(rawWidth * ratio) / 2,
                        -(rawHeight * ratio) / 2,
                        rawWidth * ratio,
                        rawHeight * ratio
                    );

                    ctx.restore();

                    // 3. Resolve
                    resolve(canvas.toDataURL('image/png', 0.9));
                };
                designImg.onerror = () => resolve(null);
            };
            baseImg.onerror = () => resolve(null);
        });
    };

    const handleAddToCart = async () => {
        if (!isBlank && isUploading) {
            toast.error('Please wait for upload');
            return;
        }

        const selectedVariant = product.variants.find((v: any) => v.id === selectedVariantId);
        if (!selectedVariant) return;

        let finalMockupUrl = uploadedImage;

        // Generate Composite ONLY if not blank and image exists
        if (!isBlank && uploadedImage) {
            setIsGenerating(true);
            try {
                const compositeBase64 = await generateCompositeMockup();
                if (compositeBase64) {
                    // Upload composite
                    const blob = await (await fetch(compositeBase64)).blob();
                    const formData = new FormData();
                    formData.append('file', blob, 'mockup-composite.png');

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        finalMockupUrl = data.url;
                    }
                }
            } catch (error) {
                console.error('Composite error:', error);
                // Fallback to original image
            } finally {
                setIsGenerating(false);
            }
        } else if (isBlank) {
            // For blank orders, use the template image or blank placeholder
            finalMockupUrl = template?.frontMockupImage || '';
        }

        addToCart({
            productId: product.id,
            variantId: selectedVariant.id,
            name: product.name + (isBlank ? ' (Blank)' : ''),
            variantName: selectedVariant.name,
            quantity: quantity,
            price: priceBreakdown ? priceBreakdown.totalPrice / quantity : Number(selectedVariant.basePrice), // Unit price for cart
            image: finalMockupUrl || '',
            mockupResultPath: finalMockupUrl || '',
            metadata: !isBlank ? {
                printMethod: printOptions.printMethod,
                printSize: printOptions.designSize === 'Custom' ? (printOptions as any).customSize || 'Custom' : printOptions.designSize,
                colorCount: printOptions.printMethod === 'plastisol' ? printOptions.colorCount : undefined,
                detectedColors: printOptions.printMethod === 'plastisol' ? detectedColors : undefined
            } : undefined
        });

        toast.success('Added to cart!');
        setTimeout(onClose, 500);
    };

    if (!isOpen || !product) return null;

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">

                {/* LEFT: Visual Editor (Flexible) */}
                <div className="flex-1 bg-stone-100 relative items-center justify-center flex p-8 overflow-auto">
                    <div className="relative bg-white shadow-lg rounded-lg overflow-hidden flex-shrink-0"
                        style={{
                            width: '500px',
                            height: '500px'
                        }}>
                        {template?.frontMockupImage ? (
                            <div className="relative w-full h-full" ref={containerRef}>
                                <img src={template.frontMockupImage} className="w-full h-full object-contain pointer-events-none select-none" />

                                {/* Print Area */}
                                {!isBlank && (
                                    <div className="absolute overflow-hidden"
                                        style={{
                                            left: `${(template.printAreaX / template.canvasWidth) * 100}%`,
                                            top: `${(template.printAreaY / template.canvasHeight) * 100}%`,
                                            width: `${(template.printAreaWidth / template.canvasWidth) * 100}%`,
                                            height: `${(template.printAreaHeight / template.canvasHeight) * 100}%`,
                                        }}>
                                        {uploadedImage ? (
                                            <>
                                                <div
                                                    ref={targetRef}
                                                    className="origin-center inline-block cursor-grab active:cursor-grabbing hover:ring-2 ring-blue-400 hover:ring-opacity-50"
                                                    style={{
                                                        transform: `translate(${transformRef.current.translate[0]}px, ${transformRef.current.translate[1]}px) rotate(${transformRef.current.rotate}deg) scale(${transformRef.current.scale[0]}, ${transformRef.current.scale[1]})`,
                                                        maxWidth: '100%',
                                                        maxHeight: '100%'
                                                    }}
                                                >
                                                    <img src={uploadedImage} className="max-w-[150px] max-h-[150px] object-contain pointer-events-none" />
                                                </div>

                                                <Moveable
                                                    target={targetRef}
                                                    draggable={true}
                                                    throttleDrag={0}
                                                    startDragRotate={0}
                                                    throttleDragRotate={0}
                                                    zoom={1}
                                                    origin={true}
                                                    padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
                                                    rotatable={true}
                                                    throttleRotate={0}
                                                    rotationPosition={"top"}
                                                    scalable={true}
                                                    keepRatio={true}
                                                    throttleScale={0}
                                                    renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                                                    resizable={false} // Use scalable for image
                                                    // HANDLERS
                                                    onDrag={({ target, beforeTranslate }) => {
                                                        target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${transformRef.current.rotate}deg) scale(${transformRef.current.scale[0]}, ${transformRef.current.scale[1]})`;
                                                        transformRef.current.translate = beforeTranslate;
                                                    }}
                                                    onRotate={({ target, beforeRotate }) => {
                                                        target.style.transform = `translate(${transformRef.current.translate[0]}px, ${transformRef.current.translate[1]}px) rotate(${beforeRotate}deg) scale(${transformRef.current.scale[0]}, ${transformRef.current.scale[1]})`;
                                                        transformRef.current.rotate = beforeRotate;
                                                    }}
                                                    // Fixing onScale implementation
                                                    onScale={({ target, scale, drag }) => {
                                                        // Scale affects translate too (transform origin)
                                                        // But simplified:
                                                        const [sx, sy] = scale;
                                                        target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) rotate(${transformRef.current.rotate}deg) scale(${sx}, ${sy})`;
                                                        transformRef.current.scale = [sx, sy];
                                                        transformRef.current.translate = drag.beforeTranslate;
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full border-2 border-dashed border-transparent hover:border-stone-300 flex items-center justify-center text-stone-400 text-xs transition-colors">
                                                {/* Hidden drop zone */}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-stone-400">Mockup not configured</div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Controls Sidebar (Fixed Width) */}
                <div className="w-[400px] bg-white border-l border-stone-200 flex flex-col h-full shadow-xl z-10">

                    {/* Header */}
                    <div className="p-6 border-b border-stone-100 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-stone-900">{product.name}</h2>
                            <p className="text-sm text-stone-500">Interactive Mockup</p>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* 1. Variant & Quantity Group */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Order Type</h3>
                                <div className="flex bg-stone-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setIsBlank(false)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isBlank ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                    >
                                        Custom Print
                                    </button>
                                    <button
                                        onClick={() => setIsBlank(true)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isBlank ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                                    >
                                        Blank Product
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">product details</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-stone-700 block mb-1">Variant</label>
                                        <select
                                            value={selectedVariantId}
                                            onChange={(e) => setSelectedVariantId(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                                        >
                                            {product.variants.map((v: any) => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-stone-700 block mb-1">Quantity</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:bg-stone-100 transition-colors"
                                            >-</button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="flex-1 h-10 text-center border border-stone-200 rounded-lg bg-white"
                                            />
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:bg-stone-100 transition-colors"
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Print Options (Hidden if Blank) */}
                        {!isBlank && (
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Print Configuration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-stone-700 block mb-1">Method</label>
                                        <select
                                            value={printOptions.printMethod}
                                            onChange={(e) => setPrintOptions({ ...printOptions, printMethod: e.target.value })}
                                            className="w-full p-2.5 text-sm rounded-lg border border-stone-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        >
                                            <option value="dtf">DTF (Direct to Film)</option>
                                            <option value="plastisol">Plastisol</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-stone-700 block mb-1">Print Size</label>
                                        <select
                                            value={printOptions.designSize}
                                            onChange={(e) => setPrintOptions({ ...printOptions, designSize: e.target.value })}
                                            className="w-full p-2.5 text-sm rounded-lg border border-stone-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        >
                                            <option value="A4">A4 (21 x 30 cm)</option>
                                            <option value="A3">A3 (30 x 42 cm)</option>
                                            <option value="Custom">Custom Size</option>
                                        </select>
                                        {printOptions.designSize === 'Custom' && (
                                            <input
                                                type="text"
                                                placeholder="e.g. 15 x 20 cm"
                                                className="mt-2 w-full p-2.5 text-sm rounded-lg border border-stone-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                                onChange={(e) => setPrintOptions(prev => ({ ...prev, customSize: e.target.value }))}
                                            />
                                        )}
                                    </div>
                                    {printOptions.printMethod === 'plastisol' && (
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-stone-700 block mb-1">Color Count (Detected)</label>
                                            <select
                                                value={printOptions.colorCount}
                                                onChange={(e) => setPrintOptions({ ...printOptions, colorCount: Number(e.target.value) })}
                                                className="w-full p-2.5 text-sm rounded-lg border border-stone-200 bg-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                            >
                                                <option value={1}>1 Color</option>
                                                <option value={2}>2 Colors</option>
                                                <option value={3}>3 Colors</option>
                                                <option value={4}>4+ Colors</option>
                                            </select>

                                            {/* Color Palette Box */}
                                            {detectedColors.length > 0 && (
                                                <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Detected Palette</span>
                                                        <span className="text-[10px] text-stone-500">{detectedColors.length} colors</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {detectedColors.map((color, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="group relative w-6 h-6 rounded-md border border-stone-200 shadow-sm transition-transform hover:scale-110 cursor-help"
                                                                style={{ backgroundColor: color }}
                                                            >
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                    {color}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. Upload (Hidden if Blank) */}
                        {!isBlank && (
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Design File</h3>
                                <div className="relative">
                                    <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${uploadedImage ? 'border-amber-400 bg-amber-50/50' : 'border-stone-200 hover:border-amber-400 hover:bg-stone-50'}`}>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                        {uploadedImage ? (
                                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                                                <div className="w-16 h-16 relative mb-3 bg-white rounded-lg shadow-sm border border-stone-100 p-1">
                                                    <img src={uploadedImage} className="w-full h-full object-contain rounded" />
                                                </div>
                                                <span className="text-sm font-medium text-stone-900">Change Design</span>
                                                <span className="text-xs text-stone-500 mt-1">Click to replace</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center py-2">
                                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3 text-stone-400 group-hover:text-stone-600">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <span className="text-sm font-medium text-stone-900">Upload Image</span>
                                                <span className="text-xs text-stone-500 mt-1 max-w-[200px]">Supports PNG, JPG (Max 5MB)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer: Price & Action */}
                    <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">

                        {/* Price Card */}
                        <div className="space-y-2">
                            {priceBreakdown ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-sm text-stone-500">
                                        <span>Unit Price</span>
                                        <span>Rp {(priceBreakdown.unitPrice).toLocaleString()}</span>
                                    </div>
                                    {/* Discount Indicator if applicable */}
                                    {quantity > 11 && (
                                        <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                                            <span>Bulk Discount Applied!</span>
                                            <span>Yes</span>
                                        </div>
                                    )}
                                    <div className="pt-2 flex justify-between items-end border-t border-stone-200 mt-2">
                                        <span className="text-base font-bold text-stone-900">Total</span>
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold text-stone-900">Rp {priceBreakdown.totalPrice.toLocaleString()}</span>
                                            {/* Show savings or details if needed */}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-20 animate-pulse bg-stone-200 rounded"></div>
                            )}
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isUploading || isGenerating}
                            className="w-full py-4 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading || isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ShoppingCart className="w-5 h-5" />
                            )}
                            {isGenerating ? 'Generating...' : 'Add to Cart'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Note: I will write a cleaner implementation using Moveable's `onRender` to handle all transforms.
