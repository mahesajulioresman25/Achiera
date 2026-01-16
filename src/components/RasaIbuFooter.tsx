import React from 'react';
import Link from 'next/link';
import { Instagram, Mail, Heart } from 'lucide-react';

export default function RasaIbuFooter({ config, paymentSettings }: { config?: any, paymentSettings?: any }) {
    // Priority: CRM -> Config -> Fallback
    const whatsapp = paymentSettings?.whatsappCrm || config?.whatsapp || "628123456789";
    const instagram = config?.socialLinks?.instagram || "https://instagram.com/rasaibu";
    const email = config?.email || "halo@rasaibu.id";

    return (
        <footer className="bg-[#2D3A2D] text-[#E5E1D8] pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-[#E5E1D8]/20 pb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/rasa-ibu">
                            <img src="/images/logos/rasa-ibu-logo.png" alt="Rasa Ibu" className="h-16 w-auto brightness-0 invert" />
                        </Link>
                        <p className="text-[#B2BCA2] leading-relaxed text-sm">
                            {config?.footerDescription || "Menghadirkan kehangatan masakan rumah ke meja makan Anda. Praktis, sehat, dan penuh cinta."}
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#E5E1D8]/10 flex items-center justify-center hover:bg-[#B2BCA2] hover:text-[#2D3A2D] transition-all" title="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href={`mailto:${email}`} className="w-10 h-10 rounded-full bg-[#E5E1D8]/10 flex items-center justify-center hover:bg-[#B2BCA2] hover:text-[#2D3A2D] transition-all" title="Email">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Menu</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li>
                                <Link href="/rasa-ibu" className="hover:text-white transition-colors">Beranda</Link>
                            </li>
                            <li>
                                <Link href="/rasa-ibu/products" className="hover:text-white transition-colors">Produk Kami</Link>
                            </li>
                            <li>
                                <Link href="/rasa-ibu/subscribe" className="hover:text-white transition-colors">Cara Pesan</Link>
                            </li>
                            <li>
                                <Link href="/rasa-ibu/about" className="hover:text-white transition-colors">Tentang Kami</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Layanan</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li>
                                <Link href="/rasa-ibu/subscribe" className="hover:text-white transition-colors">Berlangganan Bunda</Link>
                            </li>
                            <li>
                                <Link href="https://wa.me/6282215191435" target="_blank" className="hover:text-white transition-colors">Katering Acara</Link>
                            </li>
                            <li>
                                <Link href="https://wa.me/6282215191435" target="_blank" className="hover:text-white transition-colors">Konsultasi Menu</Link>
                            </li>
                            <li>
                                <Link href="/order/track" className="hover:text-white transition-colors">Lacak Pesanan</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter or Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Hubungi Kami</h3>
                        <p className="text-xs text-[#B2BCA2] mb-4 leading-relaxed">
                            Butuh bantuan pesanan atau ingin bertanya lebih lanjut?
                        </p>
                        <a
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Halo Rasa Ibu, saya butuh bantuan order.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 bg-[#B2BCA2] hover:bg-[#A3AD94] text-[#2D3A2D] rounded-xl font-bold transition-all w-full text-xs"
                        >
                            Chat WhatsApp
                        </a>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#B2BCA2] gap-4">
                    <p>&copy; {new Date().getFullYear()} Rasa Ibu by Achiera. All rights reserved. (System v2.5)</p>
                    <div className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-pink-500 fill-current" /> for Families
                    </div>
                </div>
            </div>
        </footer>
    );
}
