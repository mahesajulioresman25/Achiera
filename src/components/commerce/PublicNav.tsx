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
        { key: 'shopeeFood', label: 'Shopee', image: '/images/platforms/shopee.png', icon: '🛍️' },
        { key: 'grabFood', label: 'Grab', image: '/images/platforms/grabfood.png', icon: '🛵' },
        { key: 'goFood', label: 'GoFood', image: '/images/platforms/gofood.webp', icon: '❤️' },
        { key: 'tokopedia', label: 'TokPed', icon: '🛒' }, // No image yet
    ].filter(p => platformLinks[p.key]);

    return (
        // ... (truncated part)
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
                </div >
            </div >
        </>
    );
}
