import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[var(--background)] border-t border-[var(--border)] pt-16 pb-8 text-[var(--muted-foreground)] transition-colors duration-500">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-[var(--foreground)] mb-4 block group">
                            ACHIERA
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            Transforming Problems Into Possibilities. Your partner for premium merchandise and smart IT solutions.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-[var(--primary)] transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="hover:text-[var(--primary)] transition-colors"><Linkedin size={20} /></a>
                            <a href="#" className="hover:text-[var(--primary)] transition-colors"><Facebook size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[var(--foreground)] font-semibold mb-6">Solutions</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/merchandise" className="hover:text-[var(--primary)] transition-colors">Merchandise Solutions</Link></li>
                            <li><Link href="/it-solutions" className="hover:text-[var(--primary)] transition-colors">IT Solutions</Link></li>
                            <li><Link href="/it-solutions" className="hover:text-[var(--primary)] transition-colors">Custom Software</Link></li>
                            <li><Link href="/merchandise" className="hover:text-[var(--primary)] transition-colors">Corporate Kits</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[var(--foreground)] font-semibold mb-6">Company</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-[var(--primary)] transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-[var(--primary)] transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-[var(--foreground)] font-semibold mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start">
                                <Mail size={18} className="mr-3 text-[var(--primary)] shrink-0 mt-0.5" />
                                <span>Achiera.id@gmail.com</span>
                            </li>
                            <li className="flex items-start">
                                <Phone size={18} className="mr-3 text-[var(--primary)] shrink-0 mt-0.5" />
                                <span>+62 0822-1519-1435</span>
                            </li>
                            <li className="flex items-start">
                                <MapPin size={18} className="mr-3 text-[var(--primary)] shrink-0 mt-0.5" />
                                <span>Bandung, Indonesia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
                    <p>&copy; {new Date().getFullYear()} ACHIERA. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
