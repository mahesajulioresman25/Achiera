"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag } from 'lucide-react';
import Button from './Button';
import { useCart } from '@/lib/contexts/CartContext';
import CartDrawer from './cart/CartDrawer';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { items, setIsCartOpen } = useCart();

    const cartCount = items.length;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isRasaIbu = pathname?.startsWith('/rasa-ibu');
    const brandName = isRasaIbu ? 'RASA IBU' : 'ACHIERA';

    const navLinks = isRasaIbu ? [
        { name: 'Home', href: '/rasa-ibu' },
        { name: 'Products', href: '/rasa-ibu/products' },
        { name: 'Subscription', href: '/rasa-ibu/subscribe' },
        { name: 'Recipes', href: '/rasa-ibu/recipes' },
        { name: 'About', href: '/rasa-ibu/about' },
        { name: 'Main Hub', href: '/' },
    ] : [
        { name: 'Home', href: '/' },
        { name: 'Rasa Ibu', href: '/rasa-ibu' },
        { name: 'Merchandise', href: '/merchandise' },
        { name: 'IT Solutions', href: '/it-solutions' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
                    ? 'bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] py-3 shadow-sm'
                    : 'bg-transparent py-5'
                    }`}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <Link href={isRasaIbu ? "/rasa-ibu" : "/"} className="text-2xl font-bold tracking-tighter group">
                        <span className={isRasaIbu ? "text-[#2D3A2D]" : "text-[var(--foreground)] group-hover:text-[var(--primary)] transition-all duration-300"}>
                            {brandName}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Cart Trigger */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-amber-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <Link href="/contact">
                            <Button variant="outline" size="sm">Get Started</Button>
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-4 md:hidden">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="text-[var(--foreground)] relative"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        <button
                            className="text-[var(--foreground)]"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--background)] border-b border-[var(--border)] p-4 flex flex-col space-y-4 animate-in slide-in-from-top-5 shadow-xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="primary" className="w-full">Get Started</Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Cart Drawer */}
            <CartDrawer />
        </>
    );
}
