'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;
}

interface DigitalReceiptProps {
    order: any;
    onClose: () => void;
}

export default function DigitalReceipt({ order, onClose }: DigitalReceiptProps) {
    if (!order) return null;

    const items = order.orderItems || [];
    const subtotal = Number(order.totalAmount || order.total || 0);
    const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:static print:bg-white">
            {/* Control Panel (Hidden on Print) */}
            <div className="absolute top-8 right-8 flex gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
                >
                    Print Nota
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 shadow-xl hover:bg-slate-50 transition-all active:scale-95"
                >
                    Tutup
                </button>
            </div>

            {/* Receipt Paper */}
            <div className="bg-white w-full max-w-[400px] p-8 shadow-2xl print:shadow-none print:max-w-none print:w-[80mm] print:mx-auto font-mono text-slate-800 animate-in fade-in zoom-in duration-300">

                {/* Brand Header */}
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-2xl font-black text-emerald-900 tracking-tighter">RASA IBU</h1>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Masakan Rumah & Frozen Food</p>
                    <div className="h-0.5 w-12 bg-emerald-100 mx-auto rounded-full"></div>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[10px] mb-6 border-b border-dashed border-slate-200 pb-4">
                    <div className="flex justify-between">
                        <span>NO. NOTA</span>
                        <span className="font-bold">{order.invoiceNo || order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>TANGGAL</span>
                        <span className="font-bold">{dateStr}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>PELANGGAN</span>
                        <span className="font-bold">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>SUMBER</span>
                        <span className="font-bold uppercase tracking-wider">{order.channel || 'OFFLINE'}</span>
                    </div>
                    {(() => {
                        const deliveryMatch = order.customerNote?.match(/^\[(.*?)\]/);
                        const deliveryInfo = deliveryMatch ? deliveryMatch[1] : null;
                        if (deliveryInfo) {
                            const [method, courier] = deliveryInfo.split(' - ');
                            return (
                                <>
                                    <div className="flex justify-between">
                                        <span>PENGIRIMAN</span>
                                        <span className="font-bold uppercase">{method}</span>
                                    </div>
                                    {courier && (
                                        <div className="flex justify-between">
                                            <span>KURIR</span>
                                            <span className="font-bold uppercase">{courier}</span>
                                        </div>
                                    )}
                                </>
                            );
                        }
                        return null;
                    })()}
                    {order.customerAddress && (
                        <div className="pt-2 border-t border-dashed border-slate-100">
                            <span className="text-[9px] text-slate-400">ALAMAT PENGIRIMAN:</span>
                            <p className="text-[10px] font-bold mt-1 leading-relaxed">{order.customerAddress}</p>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[10px] font-black border-b border-slate-100 pb-2">
                        <span>PESANAN</span>
                        <span>SUBTOT</span>
                    </div>
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="uppercase">{item.frozenVariant?.product?.name || 'Produk'}</span>
                                <span>Rp {(item.quantity * Number(item.price || item.frozenVariant?.price || 0)).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                                {item.quantity} x @Rp {Number(item.price || item.frozenVariant?.price || 0).toLocaleString('id-ID')}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="text-[11px] font-bold flex justify-between">
                            <span className="uppercase">Pesanan Manual</span>
                            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="border-t-2 border-slate-900 pt-4 space-y-2 mb-8">
                    <div className="flex justify-between text-base font-black">
                        <span>TOTAL</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[9px] text-center text-slate-400 italic">
                        Harga sudah termasuk pajak & biaya layanan.
                    </div>
                </div>

                {/* Footer QR */}
                <div className="flex flex-col items-center gap-4">
                    <div className="p-2 border border-slate-100 rounded-xl">
                        <QRCodeSVG
                            value={order.id}
                            size={80}
                            className="grayscale"
                        />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Terima Kasih!</p>
                        <p className="text-[8px] text-slate-400 font-medium">Barang yang sudah dibeli tidak dapat ditukar.</p>
                        <p className="text-[8px] text-slate-400 font-medium italic">achiera.com • digital-receipt-v1</p>
                    </div>
                </div>

            </div>

            {/* Print Injected Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                    }
                }
            `}</style>
        </div>
    );
}
