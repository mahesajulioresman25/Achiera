
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, usually it does in shadcn setups

interface Product {
    id: string;
    name: string;
    variants: any[];
}

interface ProductSelectorProps {
    brandId: string;
    value?: string; // Selected Product ID
    onSelect: (product: Product) => void;
    placeholder?: string;
    className?: string;
}

export default function ProductSelector({ brandId, value, onSelect, placeholder = "Pilih Produk...", className }: ProductSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch products
    useEffect(() => {
        if (!isOpen) return; // Only fetch when opening or searching

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/brands/${brandId}/products?query=${searchQuery}`);
                const data = await res.json();
                setProducts(data.products || []);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [brandId, searchQuery, isOpen]);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div
                className="relative cursor-pointer"
                onClick={() => {
                    setIsOpen(!isOpen);
                    // If opening, maybe clear query or keep it? Keeping it is fine.
                }}
            >
                <div className="flex items-center justify-between h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <span className={cn("block truncate", !selectedProduct && "text-muted-foreground")}>
                        {selectedProduct ? selectedProduct.name : (value ? "Item Terpilih" : placeholder)}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md bg-white animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center border-b px-3 pb-2 pt-2 sticky top-0 bg-white">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    </div>

                    <div className="py-1">
                        {products.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Tidak ada produk ditemukan.
                            </div>
                        )}
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer hover:bg-slate-50",
                                    value === product.id && "bg-slate-100 font-bold"
                                )}
                                onClick={() => {
                                    onSelect(product);
                                    setSelectedProduct(product);
                                    setIsOpen(false);
                                    setSearchQuery('');
                                }}
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    {value === product.id && <Check className="h-4 w-4" />}
                                </span>
                                {product.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
