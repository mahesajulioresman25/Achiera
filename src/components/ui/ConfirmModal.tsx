'use client';

import React from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    type = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20',
            icon: AlertTriangle
        },
        success: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20',
            icon: CheckCircle2
        },
        info: {
            bg: 'bg-sky-50',
            text: 'text-sky-600',
            button: 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/20',
            icon: Info
        }
    };

    const config = colors[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div
                className="absolute inset-0 bg-[#2D3A2D]/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-[#E5E1D8] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
                <div className="p-8 text-center space-y-4">
                    <div className={`w-14 h-14 ${config.bg} ${config.text} rounded-2xl flex items-center justify-center mx-auto`}>
                        <Icon size={28} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-black text-[#2D3A2D]">{title}</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${config.button}`}
                    >
                        {confirmText}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
