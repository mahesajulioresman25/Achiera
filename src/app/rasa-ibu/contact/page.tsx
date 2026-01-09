'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, MapPin, Clock, ArrowLeft, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getPlatformSettingsAction } from '@/lib/actions/rasa-ibu/finance';
import { sendContactMessageAction } from '@/lib/actions/rasa-ibu/contact';
import { toast } from 'sonner';

/**
 * RASA IBU CONTACT PAGE
 * Aesthetic: Warm, honest, homey.
 */
export default function RasaIbuContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Default dynamic values (will be overridden by config if exists)
    const [contactInfo, setContactInfo] = useState({
        whatsapp: '085862005917',
        email: 'achiera25.id@gmail.com'
    });

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: ''
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await getPlatformSettingsAction('clvx1234567890'); // Placeholder or specific ID for Rasa Ibu
                if (res.success && res.settings?.paymentSettings) {
                    const settings = res.settings.paymentSettings as any;
                    setContactInfo({
                        whatsapp: settings.whatsappCrm || '085862005917',
                        email: 'achiera25.id@gmail.com' // Explicitly set as per user request
                    });
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
            }
        }
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.message) {
            toast.error("Mohon isi semua bidang ya, Bunda. 😊");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await sendContactMessageAction({
                name: formData.name,
                phone: formData.phone,
                message: formData.message,
                targetEmail: contactInfo.email
            });

            if (res.success) {
                setIsSuccess(true);
                toast.success("Pesan Bunda sudah kami terima dengan tulus! ✨");
                setFormData({ name: '', phone: '', message: '' });
            } else {
                toast.error(res.error || "Aduh, sepertinya ada kendala teknis. Coba lagi ya, Bunda.");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem. Mohon maaf atas ketidaknyamanannya.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] border border-[#E5E1D8] shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black tracking-tight">Terima Kasih, Bunda!</h2>
                        <p className="text-gray-600 font-medium leading-relaxed">
                            Pesan tulus Bunda sudah sampai di dapur kami. Tim Rasa Ibu akan segera menghubungi Bunda melalui WhatsApp.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="w-full py-4 bg-[#2D3A2D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A241A] transition-all"
                    >
                        Kirim Pesan Lain
                    </button>
                    <Link href="/rasa-ibu" className="block text-xs font-bold text-[#8B7E66] hover:text-[#2D3A2D] uppercase tracking-widest">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2D3A2D] pb-32">
            {/* Decorative Top */}
            <div className="h-24 bg-gradient-to-b from-[#E5E1D8]/20 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-20 items-start">

                    {/* Left: Content */}
                    <div className="lg:w-1/2 space-y-12">
                        <div className="space-y-6">
                            <Link
                                href="/rasa-ibu"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:text-[#2D3A2D] transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Kembali ke Beranda
                            </Link>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                                Mari Bertegur <br />
                                <span className="text-[#8B7E66]">Sapa.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-lg">
                                Kami percaya kejujuran dimulai dari komunikasi yang tulus. Ada pertanyaan tentang menu, katering, atau sekadar ingin berbagi cerita? Dapur kami selalu terbuka.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] shadow-sm space-y-4 hover:shadow-xl transition-all duration-500">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <MessageSquare size={24} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest">WhatsApp Bunda</h3>
                                <p className="text-xs text-gray-500 font-medium">Fast response untuk order kilat atau tanya stok harian.</p>
                                <a
                                    href={`https://wa.me/${contactInfo.whatsapp}?text=Halo%20Rasa%20Ibu,%20saya%20ingin%20tanya...`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pt-2 inline-flex items-center gap-2 text-xs font-black text-emerald-600 border-b-2 border-emerald-100 hover:border-emerald-600 transition-all uppercase tracking-widest"
                                >
                                    Chat Sekarang
                                </a>
                            </div>

                            <div className="p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] shadow-sm space-y-4 hover:shadow-xl transition-all duration-500">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Mail size={24} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest">Email Resmi</h3>
                                <p className="text-xs text-gray-500 font-medium">Untuk kerjasama, feedback mendalam, atau keluhan pelanggan.</p>
                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    className="pt-2 inline-flex items-center gap-2 text-xs font-black text-amber-600 border-b-2 border-amber-100 hover:border-amber-600 transition-all uppercase tracking-widest"
                                >
                                    Kirim Email
                                </a>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6">
                            <div className="flex items-center gap-4 text-gray-600">
                                <Clock className="w-5 h-5 text-[#8B7E66]" />
                                <span className="text-sm font-medium">Jam Operasional: Senin - Minggu | 08:00 - 17:00</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600">
                                <MapPin className="w-5 h-5 text-[#8B7E66]" />
                                <span className="text-sm font-medium">Dapur Pusat: Bandung, Jawa Barat.</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Simple Form Card */}
                    <div className="lg:w-1/2 w-full">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-[#E5E1D8] shadow-2xl shadow-stone-200/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B7E66]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight">Kirim Pesan Tulus</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66]">AI akan meneruskan ke tim dapur kami.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Bunda/Kakak..."
                                            disabled={isSubmitting}
                                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#8B7E66] transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Nomor WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Contoh: 0812345..."
                                            disabled={isSubmitting}
                                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#8B7E66] transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66]">Pesan Anda</label>
                                        <textarea
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Ceritakan apa yang bisa kami bantu..."
                                            disabled={isSubmitting}
                                            className="w-full bg-[#FDFBF7] border border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#8B7E66] transition-colors resize-none disabled:opacity-50"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 bg-[#2D3A2D] hover:bg-[#1A241A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-stone-900/10 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Kirim Sekarang
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-8 border-t border-[#E5E1D8] flex items-center gap-4">
                                    <div className="p-2 bg-stone-50 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 leading-relaxed italic">
                                        Pesan ini akan diproses oleh Intelligence Hub untuk memastikan Anda mendapat solusi terbaik secepatnya.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
