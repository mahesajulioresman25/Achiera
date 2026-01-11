'use client';

import React from 'react';
import { Share2, Instagram, MessageCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
    title: string;
    url: string;
}

export default function SocialShare({ title, url }: SocialShareProps) {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : url;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link disalin ke clipboard!');
    };

    const shareWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`, '_blank');
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Bagikan:</span>
            <button
                onClick={shareWhatsApp}
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#25D366]/20"
                title="Bagikan ke WhatsApp"
            >
                <MessageCircle className="w-4 h-4" />
            </button>
            <button
                onClick={() => window.open('https://instagram.com', '_blank')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Instagram"
            >
                <Instagram className="w-4 h-4" />
            </button>
            <button
                onClick={copyToClipboard}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:scale-110 transition-transform"
                title="Salin Link"
            >
                <Link2 className="w-4 h-4" />
            </button>
        </div>
    );
}
