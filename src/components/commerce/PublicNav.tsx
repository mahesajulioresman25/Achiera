"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Instagram, MessageCircle, Send, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useSession } from 'next-auth/react';

interface NavLink {
    label: string;
    href: string;
}

interface PublicNavProps {
    navLinks: NavLink[];
    whatsapp?: string;
    instagramHandle?: string;
    socialLinks?: {
        instagram?: string;
        [key: string]: any;
    };
    config?: any;
}

export default function PublicNav({ navLinks, whatsapp, instagramHandle = '@rasaibu', socialLinks, config }: PublicNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { items, setIsCartOpen } = useCart();
    const { data: session } = useSession();
    const pathname = usePathname();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const platformLinks = (config?.platformLinks as any) || {};
    const platforms = [
        { key: 'shopeeFood', label: 'Shopee Food', image: '/images/platforms/shopee.png', icon: '🛍️' },
        { key: 'grabFood', label: 'Grab Food', image: '/images/platforms/grabfood.png', icon: '🛵' },
        { key: 'goFood', label: 'GoFood', image: '/images/platforms/gofood.webp', icon: '❤️' },
        { key: 'shopee', label: 'Shopee', image: '/images/platforms/shopee-ecomerce.png', icon: '🛍️' },
        { key: 'tokopedia', label: 'Tokopedia', image: '/images/platforms/tokopedia.png', icon: '💚' },
        { key: 'tiktok', label: 'TikTok Shop', image: '/images/platforms/TikTok.png', icon: '🎵' },
        { key: 'grabMart', label: 'GrabMart', image: '/images/platforms/grabamart.png', icon: '🏪' },
    ].filter(p => platformLinks[p.key]);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-[#E5E1D8]/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/rasa-ibu" className="relative z-[70] flex items-center gap-3 group">
                        <img
                            src="/images/logos/rasa-ibu-logo.png"
                            alt="Rasa Ibu"
                            className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link, idx) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={idx}
                                    href={link.href}
                                    className={`relative text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:text-[#8B7E66] group ${isActive ? 'text-[#8B7E66]' : 'text-[#2D3A2D]/70'
                                        }`}
                                >
                                    {link.label}
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#8B7E66] transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                            );
                        })}

                        {/* Profile Link Desktop */}
                        {session && (
                            <Link
                                href="/rasa-ibu/profile"
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:text-[#8B7E66] ${pathname.startsWith('/rasa-ibu/profile') ? 'text-[#8B7E66]' : 'text-[#2D3A2D]/70'}`}
                            >
                                <UserIcon className="w-4 h-4" />
                                Akun Saya
                            </Link>
                        )}

                        {/* Cart Button Desktop */}
                        {itemCount > 0 && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2.5 text-[#2D3A2D] hover:bg-[#E5E1D8]/40 rounded-full transition-all duration-300 group shadow-sm hover:shadow-md"
                            >
                                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B7E66] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#FDFBF7] animate-in zoom-in shadow-lg">
                                    {itemCount}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex items-center gap-2 mobile:gap-4 md:hidden">
                        {/* Profile Icon Mobile */}
                        {session && (
                            <Link href="/rasa-ibu/profile" className="p-2 text-[#2D3A2D]">
                                <UserIcon className="w-6 h-6" />
                            </Link>
                        )}

                        {/* Cart Button Mobile */}
                        {itemCount > 0 && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-[#2D3A2D] active:scale-90 transition-all"
                            >
                                <ShoppingBag className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B7E66] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#FDFBF7] animate-in zoom-in">
                                    {itemCount}
                                </span>
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative z-[70] p-2 text-[#2D3A2D] hover:bg-[#E5E1D8]/30 rounded-full transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X className="w-6 h-6 animate-in spin-in-90 duration-300" /> : <Menu className="w-6 h-6 animate-in zoom-in duration-300" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay - Move outside nav to avoid sticky/transparency issues */}
            <div
                className={`fixed inset-0 bg-[#FDFBF7] z-[9999] flex flex-col transition-all duration-500 ease-in-out md:hidden ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
                    }`}
            >
                {/* Internal Overlay Header */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-[#E5E1D8]/50 bg-[#FDFBF7]">
                    <img
                        src="/images/logos/rasa-ibu-logo.png"
                        alt="Rasa Ibu"
                        className="h-10 w-auto object-contain"
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-[#2D3A2D] hover:bg-[#E5E1D8]/30 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-between overflow-y-auto px-10 py-10 relative">
                    {/* Main Links - Balanced Sizing */}
                    <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7E66] mb-2 opacity-60">Menu Navigasi</span>
                        {navLinks.map((link, idx) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={idx}
                                    href={link.href}
                                    style={{ transitionDelay: `${isOpen ? idx * 40 : 0}ms` }}
                                    className={`text-2xl font-black uppercase tracking-[0.1em] transition-all flex items-center justify-between py-1.5 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'} duration-500 ${isActive ? 'text-[#8B7E66]' : 'text-[#1A241A] active:scale-95'
                                        }`}
                                >
                                    <span>{link.label}</span>
                                    {isActive && <div className="w-2 h-2 rounded-full bg-[#8B7E66]" />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Bottom Sections: Spacing adjusted for full height */}
                    <div className="space-y-10">
                        {/* Platforms */}
                        {platforms.length > 0 && (
                            <div className={`space-y-4 transition-all duration-700 delay-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B7E66]">Platform Kami</span>
                                    <div className="h-px flex-1 bg-[#E5E1D8]"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {platforms.map((p) => (
                                        <a
                                            key={p.key}
                                            href={platformLinks[p.key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3.5 bg-white border border-[#E5E1D8] rounded-2xl shadow-sm active:scale-95 transition-all group hover:border-[#8B7E66]"
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center bg-[#FDFBF7] rounded-full group-hover:bg-white transition-colors">
                                                {(p as any).image ? (
                                                    <img
                                                        src={(p as any).image}
                                                        alt={p.label}
                                                        className="w-5 h-5 object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-lg">{p.icon}</span>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#2D3A2D]">{p.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Socials */}
                        <div className={`space-y-6 transition-all duration-700 delay-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center justify-between p-5 bg-[#1A241A] rounded-[2rem] text-[#FDFBF7] shadow-xl">
                                <div className="flex gap-5">
                                    <a href={`https://wa.me/${whatsapp}`} className="hover:scale-110 transition-transform">
                                        <MessageCircle className="w-7 h-7 text-[#25D366]" />
                                    </a>
                                    <a href={socialLinks?.instagram || 'https://instagram.com/rasaibu'} className="hover:scale-110 transition-transform">
                                        <Instagram className="w-7 h-7 text-[#E4405F]" />
                                    </a>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8B7E66]">Contact</p>
                                    <p className="text-xs font-bold text-white">{instagramHandle}</p>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#8B7E66] italic opacity-40">
                                    KEJUJURAN DARI DAPUR.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
