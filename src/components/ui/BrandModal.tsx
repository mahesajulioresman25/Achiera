'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function BrandModal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: BrandModalProps) {
    // Prevent scroll on body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#1A241A]/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`relative w-full ${maxWidth} bg-[#FDFBF7] rounded-[3rem] shadow-2xl border border-[#E5E1D8] overflow-hidden`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-[#E5E1D8]/50">
                            {title ? (
                                <h3 className="text-xl font-serif italic font-bold text-[#2D3A2D]">{title}</h3>
                            ) : (
                                <img src="/images/brand/logo.png" alt="Rasa Ibu" className="h-10 w-auto object-contain" />
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#E5E1D8]/50 rounded-full transition-colors text-[#2D3A2D]"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-10 py-10 max-h-[80vh] overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
