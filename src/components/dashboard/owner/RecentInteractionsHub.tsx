'use client';

import React from 'react';
import { MessageSquare, Clock, ArrowRight, User, Phone, Mail, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Interaction {
    id: string;
    brandName: string;
    timestamp: Date;
    data: {
        source?: string;
        name?: string;
        phone?: string;
        email?: string;
        message?: string;
    };
}

interface RecentInteractionsHubProps {
    interactions: Interaction[];
}

export function RecentInteractionsHub({ interactions }: RecentInteractionsHubProps) {
    if (!interactions || interactions.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <MessageSquare size={32} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">Belum Ada Interaksi</h3>
                    <p className="text-sm text-slate-500">Pesan dari pelanggan atau lead baru akan muncul di sini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl backdrop-blur-md border border-emerald-500/30 text-emerald-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl tracking-tight">Intelligence Interactions</h3>
                        <p className="text-emerald-400/80 font-medium">Recent leads & customer inquiries across brands</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    Live Monitoring
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {interactions.map((interaction) => (
                    <div key={interaction.id} className="p-6 hover:bg-slate-50 transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                    <User size={24} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-900">{interaction.data.name || 'Anonymous Bundle'}</span>
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
                                            {interaction.brandName}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                                        {interaction.data.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={12} className="text-emerald-500" />
                                                {interaction.data.phone}
                                            </div>
                                        )}
                                        {interaction.data.email && (
                                            <div className="flex items-center gap-1.5">
                                                <Mail size={12} className="text-blue-500" />
                                                {interaction.data.email}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true, locale: id })}
                                        </div>
                                    </div>
                                    {interaction.data.message && (
                                        <p className="text-sm text-slate-600 mt-3 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                                            "{interaction.data.message}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                                    View Full Lead
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Data generated via Achiera Intelligence Hub
            </div>
        </div>
    );
}
