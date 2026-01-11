'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
}

export default function PromptModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    placeholder = 'Ketik di sini...',
    defaultValue = '',
    confirmText = 'Proses',
    cancelText = 'Batal'
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#2D3A2D]/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-[#E5E1D8] overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-6 text-center">
                                <div className="w-16 h-16 bg-[#B2BCA2]/10 text-[#2D3A2D] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                    <MessageSquare size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#2D3A2D] tracking-tight">{title}</h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block ml-1">
                                    Input Bunda
                                </label>
                                <textarea
                                    autoFocus
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full bg-[#FDFBF7] border-2 border-[#E5E1D8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#B2BCA2] focus:ring-4 focus:ring-[#B2BCA2]/5 transition-all min-h-[120px] resize-none font-medium text-[#2D3A2D]"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!value.trim()}
                                    className="flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white bg-[#2D3A2D] hover:bg-[#3d4d3d] disabled:opacity-30 disabled:grayscale rounded-2xl transition-all shadow-xl shadow-green-950/10 active:scale-[0.98]"
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </form>

                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
