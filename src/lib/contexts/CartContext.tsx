
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string; // unique ID for cart item (timestamp)
    productId: string;
    variantId: string;
    name: string;
    variantName: string;
    quantity: number;
    price: number;
    image: string;
    total: number;
    note?: string; // Customer notes/instructions for this item
    // Design Data
    designState?: any;
    mockupResultPath?: string;
    metadata?: any; // e.g. print details

    // Campaign / Bundle Data
    productBundleId?: string;
    type?: 'UNIT' | 'BUNDLE';
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'id' | 'total'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    updateItemNote: (id: string, note: string) => void;
    clearCart: () => void;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Persist Load
    useEffect(() => {
        const stored = localStorage.getItem('achiera_cart');
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    // Persist Save
    useEffect(() => {
        localStorage.setItem('achiera_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, 'id' | 'total'>) => {
        setItems(prev => {
            // Check if the same variant already exists in cart (for regular menu items)
            // For custom mockups/designs, we still treat them as unique
            const existingItemIndex = prev.findIndex(item =>
                item.variantId === newItem.variantId &&
                !newItem.mockupResultPath && // Not a custom design
                !item.mockupResultPath
            );

            if (existingItemIndex !== -1) {
                // Item exists, increment quantity
                const updated = [...prev];
                const existingItem = updated[existingItemIndex];
                const newQuantity = existingItem.quantity + newItem.quantity;
                updated[existingItemIndex] = {
                    ...existingItem,
                    quantity: newQuantity,
                    total: existingItem.price * newQuantity
                };
                return updated;
            } else {
                // New item, add to cart
                const item: CartItem = {
                    ...newItem,
                    type: newItem.type || 'UNIT',
                    id: Date.now().toString(),
                    total: newItem.price * newItem.quantity
                };
                return [...prev, item];
            }
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return;
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity, total: item.price * quantity } : item
        ));
    };

    const updateItemNote = (id: string, note: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, note } : item
        ));
    };

    const clearCart = () => {
        setItems([]);
    };

    const cartTotal = items.reduce((acc, item) => acc + item.total, 0);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            updateItemNote,
            clearCart,
            cartTotal,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
