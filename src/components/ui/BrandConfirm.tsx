'use client';

import React, { useState, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
    showInput?: boolean;
    inputPlaceholder?: string;
    defaultValue?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean | string>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function BrandConfirmProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<ConfirmOptions | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [resolve, setResolve] = useState<((value: any) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        setConfig(options);
        setInputValue(options.defaultValue || '');
        return new Promise<boolean | string>((res) => {
            setResolve(() => res);
        });
    }, []);

    const handleCancel = () => {
        if (resolve) resolve(false);
        setConfig(null);
    };

    const handleConfirm = () => {
        if (resolve) {
            if (config?.showInput) {
                resolve(inputValue);
            } else {
                resolve(true);
            }
        }
        setConfig(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {config && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-[#2D3A2D]/40 backdrop-blur-md"
                        />

                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-[#FDFBF7] rounded-[2.5rem] shadow-[0_50px_100px_rgba(45,58,45,0.15)] border border-[#E5E1D8] p-10 text-center overflow-hidden"
                        >
                            <div className={`w-16 h-16 ${config.variant === 'danger' ? 'bg-red-50' : 'bg-[#F9F7F2]'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                                {config.variant === 'danger' ? (
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                ) : (
                                    <HelpCircle className="w-8 h-8 text-[#2D3A2D]" />
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-[#2D3A2D] font-serif italic mb-3">
                                {config.title}
                            </h3>
                            <p className="text-[#8B7E66] text-sm font-medium leading-relaxed mb-6">
                                {config.message}
                            </p>

                            {config.showInput && (
                                <div className="mb-8">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={config.inputPlaceholder}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2D3A2D] transition-colors"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirm}
                                    className={`w-full py-4 ${config.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2D3A2D] hover:bg-[#1f281f]'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95`}
                                >
                                    {config.confirmText || 'Ya, Lanjutkan'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="w-full py-4 text-[#8B7E66] hover:text-[#2D3A2D] text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    {config.cancelText || 'Batalkan'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a BrandConfirmProvider');
    }
    return context.confirm;
}
