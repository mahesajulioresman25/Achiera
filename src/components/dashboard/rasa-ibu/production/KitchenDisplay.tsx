'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, AlertCircle, CheckCircle2, Play, ChevronRight, X, Volume2, Box } from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/rasa-ibu/orders';

interface KitchenDisplayProps {
    brandId: string;
    orders: any[];
    onClose: () => void;
}

export default function KitchenDisplay({ brandId, orders, onClose }: KitchenDisplayProps) {
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [audio] = useState(typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') : null);

    useEffect(() => {
        // Filter for orders that need kitchen attention
        const filtered = orders.filter(o => ['DIBAYAR', 'DISIAPKAN'].includes(o.status))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Play sound if new orders arrived (simple check)
        if (filtered.length > activeOrders.length) {
            audio?.play().catch(() => { }); // Catch browser auto-play block
        }

        setActiveOrders(filtered);
    }, [orders]);

    const handleStatusTransition = async (orderId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'DIBAYAR' ? 'DISIAPKAN' : 'DIKIRIM';
        await updateOrderStatus(orderId, nextStatus);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#1A241A] flex flex-col overflow-hidden">
            {/* KDS Header */}
            <div className="px-10 py-6 border-b border-emerald-900/50 flex justify-between items-center bg-[#1A241A]">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl">
                        <ChefHat className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Production Control</span>
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500 text-[#1A241A] text-[8px] font-black rounded-full animate-pulse">LIVE</div>
                        </div>
                        <h2 className="text-3xl font-black text-white italic">LAYAR MONITOR DAPUR</h2>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest">Aktivitas Saat Ini</p>
                        <p className="text-2xl font-black text-white">{activeOrders.length} Antrian</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-full transition-all text-white/50">
                        <X className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* KDS Grid */}
            <div className="flex-1 overflow-x-auto p-10 bg-[#141B14] receipt-pattern">
                <div className="flex gap-8 h-full min-w-max">
                    {activeOrders.map((order) => {
                        const timeInSystem = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60));
                        const isWarning = timeInSystem > 20;
                        const isUrgent = timeInSystem > 40;

                        return (
                            <div
                                key={order.id}
                                className={`w-80 h-full flex flex-col rounded-[2.5rem] border-2 transition-all animate-in slide-in-from-right duration-500 ${isUrgent ? 'bg-rose-950/20 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.1)]' :
                                    isWarning ? 'bg-amber-950/20 border-amber-500' :
                                        'bg-[#1F291F] border-emerald-900/50'
                                    }`}
                            >
                                {/* Card Header */}
                                <div className={`p-6 border-b rounded-t-[2.5rem] flex justify-between items-start ${isUrgent ? 'border-rose-500/30' :
                                    isWarning ? 'border-amber-500/30' :
                                        'border-emerald-900/30'
                                    }`}>
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter">REF: {order.manualRef || order.id.slice(-6)}</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{order.customerName}</h3>
                                            {order.subscriptionId && (
                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-[8px] font-black uppercase tracking-wider">
                                                    🔄 Langganan
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={`flex items-center gap-1 font-black text-xs ${isUrgent ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            <Clock className="w-4 h-4" />
                                            {timeInSystem}m
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {(() => {
                                                const SOURCE_LOGOS: Record<string, string> = {
                                                    'WHATSAPP': '/images/platforms/whatsapp.png',
                                                    'WEBSITE': '/globe.svg',
                                                    'SHOPEE': '/images/platforms/shopee-ecomerce.png',
                                                    'SHOPEE_FOOD': '/images/platforms/shopee.png',
                                                    'GRAB_FOOD': '/images/platforms/grabfood.png',
                                                    'GO_FOOD': '/images/platforms/gofood.webp',
                                                    'TOKOPEDIA': '/images/platforms/tokopedia.png',
                                                    'TIKTOK_SHOP': '/images/platforms/TikTok.png',
                                                    'GRAB_MART': '/images/platforms/grabamart.png',
                                                    'MANUAL': '/file.svg'
                                                };
                                                const logo = SOURCE_LOGOS[order.channel?.toUpperCase()];
                                                return logo ? (
                                                    <div className="w-4 h-4 rounded-sm bg-white/10 p-0.5 flex items-center justify-center">
                                                        <img src={logo} alt={order.channel} className="w-full h-full object-contain" />
                                                    </div>
                                                ) : null;
                                            })()}
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{order.channel || 'Manual'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    <div className="space-y-3">
                                        {order.orderItems && order.orderItems.length > 0 ? (
                                            order.orderItems.map((item: any, idx: number) => (
                                                <div key={idx} className="space-y-1">
                                                    <div className="p-3 bg-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                                        <span className="text-sm font-bold text-white uppercase">{item.name}</span>
                                                        <span className="px-3 py-1 bg-emerald-500 text-[#1A241A] rounded-xl font-black text-xs">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                    {item.note && (
                                                        <div className="px-3 py-1 bg-purple-500/10 border-l-2 border-purple-500/50 ml-2">
                                                            <p className="text-[10px] text-purple-300 italic font-medium">"{item.note}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <>
                                                {/* Fallback to parsing internalNotes if orderItems not pre-loaded */}
                                                {order.internalNotes?.split('\n\nItems: ')[1]?.split(', ').map((itemStr: string, idx: number) => (
                                                    <div key={idx} className="p-3 bg-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                                        <span className="text-sm font-bold text-white uppercase">{itemStr.split(' x')[0]}</span>
                                                        <span className="px-3 py-1 bg-emerald-500 text-[#1A241A] rounded-xl font-black text-xs">
                                                            x{itemStr.split(' x')[1]?.split(' @')[0] || '1'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {!order.internalNotes?.includes('Items: ') && (
                                                    <div className="p-3 bg-white/5 rounded-2xl text-center">
                                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Cek Catatan Manual</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {order.customerNote && (
                                        <div className="mt-4 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                                <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Customer Note</span>
                                            </div>
                                            <p className="text-sm text-amber-200/90 font-bold italic leading-relaxed">
                                                "{order.customerNote}"
                                            </p>
                                        </div>
                                    )}

                                    {order.internalNotes?.split('\n\nItems: ')[0] && (
                                        <div className="mt-4 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-3 h-3 text-blue-500" />
                                                <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Internal Notes</span>
                                            </div>
                                            <p className="text-xs text-blue-200/80 font-medium italic leading-relaxed">
                                                "{order.internalNotes.split('\n\nItems: ')[0]}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Footer */}
                                <div className="p-6">
                                    {(order.orderItems?.some((item: any) => item.frozenVariant?.product?.category?.slug === 'siap-saji') || !order.orderItems) ? (
                                        // Ready to Eat Workflow
                                        order.status === 'DIBAYAR' ? (
                                            <button
                                                onClick={() => handleStatusTransition(order.id, 'DIBAYAR')}
                                                className="w-full py-5 bg-emerald-500 text-[#1A241A] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                            >
                                                <Play className="w-5 h-5 fill-current" />
                                                Mulai Masak
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusTransition(order.id, 'DISIAPKAN')}
                                                className="w-full py-5 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all animate-pulse"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                Masakan Siap
                                            </button>
                                        )
                                    ) : (
                                        // Frozen Food Workflow
                                        order.status === 'DIBAYAR' ? (
                                            <button
                                                onClick={() => handleStatusTransition(order.id, 'DIBAYAR')}
                                                className="w-full py-5 bg-amber-500 text-[#1A241A] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                            >
                                                <Box className="w-5 h-5" />
                                                Pack Pesanan
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStatusTransition(order.id, 'DISIAPKAN')}
                                                className="w-full py-5 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all animate-pulse"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                                Pesanan Siap Kirim
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {activeOrders.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-6 text-emerald-900/30">
                            < ChefHat className="w-32 h-32 opacity-10" />
                            <p className="text-xl font-black uppercase tracking-[0.5em] italic">Dapur Kosong & Tenang Bun</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Patterns & Overlays */}
            <style jsx>{`
                .receipt-pattern {
                    background-image: radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.05) 1px, transparent 0);
                    background-size: 40px 40px;
                }
            `}</style>
        </div>
    );
}
