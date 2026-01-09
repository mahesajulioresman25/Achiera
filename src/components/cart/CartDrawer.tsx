
'use client';

import { useCart } from '@/lib/contexts/CartContext';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function CartDrawer() {
    const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();
    const pathname = usePathname();
    const isRasaIbu = pathname?.startsWith('/rasa-ibu');
    const checkoutLink = isRasaIbu ? '/rasa-ibu/checkout' : '/merchandise/checkout';

    if (!isCartOpen) return null;
    if (isRasaIbu) return null; // Let FloatingCart handle this for Rasa Ibu

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-stone-700" />
                        <h2 className="font-serif text-lg font-bold text-stone-800">Shopping Cart ({items.length})</h2>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-stone-400">
                            <ShoppingBag className="w-16 h-16 opacity-20" />
                            <p>Your cart is empty.</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="text-amber-600 font-medium hover:underline"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 p-3 bg-white border border-stone-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                {/* Image */}
                                <div className="w-20 h-20 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100 relative">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                                            <ShoppingBag className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-medium text-stone-900 line-clamp-1">{item.name}</h3>
                                        <p className="text-xs text-stone-500">{item.variantName}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border border-stone-200 rounded-md">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="px-2 py-0.5 text-stone-600 hover:bg-stone-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 text-sm text-stone-900 font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-2 py-0.5 text-stone-600 hover:bg-stone-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-bold text-stone-900">
                                            Rp {item.total.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-4">
                        <div className="flex items-center justify-between text-stone-900">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-lg">Rp {cartTotal.toLocaleString()}</span>
                        </div>
                        <Link
                            href={checkoutLink}
                            onClick={() => setIsCartOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
                        >
                            {isRasaIbu ? 'Sajikan Sekarang' : 'Proceed to Checkout'}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
