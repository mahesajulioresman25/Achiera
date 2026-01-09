
'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'; // Assuming shadcn/ui table exists, if not will use standard div
import {
    Loader2,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Package,
    Search,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    status: string;
    image: string | null;
    categoryName: string;
    variantCount: number;
    totalStock: number;
}

interface MerchProductListProps {
    brandSlug: string;
}

export default function MerchProductList({ brandSlug }: MerchProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchProducts();
    }, [brandSlug]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/admin/${brandSlug}/products`);
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        // Optimistic update
        const previousProducts = [...products];
        setProducts(products.filter(p => p.id !== id));

        try {
            // Note: We haven't implemented DELETE API yet, assuming generic logic or will add later.
            // For now, we'll try the generic endpoint if available, but likely need to add DELETE to route.ts
            // Actually, I should check route.ts first. I only added GET/POST. 
            // I'll skip DELETE implementation for now or add it to route.ts in next step.
            toast.info('Delete feature coming soon');
            setProducts(previousProducts); // Revert
        } catch (error) {
            toast.error('Failed to delete product');
            setProducts(previousProducts);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
                <Link
                    href={`/dashboard/${brandSlug}/products/new`}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </Link>
            </div>

            {/* Empty State */}
            {products.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <Package className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">No Products Found</h3>
                    <p className="text-stone-500 max-w-sm mx-auto mb-6">
                        Get started by adding your first merchandise product.
                    </p>
                    <Link
                        href={`/dashboard/${brandSlug}/products/new`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add First Product
                    </Link>
                </div>
            ) : (
                /* Product Table */
                <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Price</th>
                                <th className="px-6 py-4 text-right">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-stone-900">{product.name}</div>
                                                <div className="text-xs text-stone-500 font-mono mt-0.5">
                                                    SKU: {product.sku || 'N/A'} • {product.variantCount} variants
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                                            {product.categoryName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${product.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-stone-100 text-stone-600 border-stone-200'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-stone-900">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.basePrice)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-medium ${product.totalStock > 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                                            {product.totalStock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/${brandSlug}/products/${product.id}`}
                                                className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
