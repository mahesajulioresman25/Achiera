'use client';

import React from 'react';
import { X, Truck, User, Phone, Link as LinkIcon, Send } from 'lucide-react';

interface DeliveryInputModalProps {
    order: any;
    onClose: () => void;
    onSubmit: (data: {
        courierName: string;
        trackingNo: string;
        trackingUrl: string;
        driverName: string;
        driverPhone: string;
    }) => Promise<void>;
}

export default function DeliveryInputModal({ order, onClose, onSubmit }: DeliveryInputModalProps) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState({
        courierName: '',
        trackingNo: '',
        trackingUrl: '',
        driverName: '',
        driverPhone: ''
    });

    // Auto-fill courier based on channel or notes
    React.useEffect(() => {
        const channel = order.channel || '';
        if (['GRABFOOD', 'GRAB_FOOD'].includes(channel)) {
            setData(prev => ({ ...prev, courierName: 'Grab Express' }));
        } else if (['GOFOOD', 'GO_FOOD'].includes(channel)) {
            setData(prev => ({ ...prev, courierName: 'GoSend' }));
        } else if (order.customerNote?.includes('JNE')) {
            setData(prev => ({ ...prev, courierName: 'JNE' }));
        }
    }, [order]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(data);
            onClose();
        } catch (error) {
            console.error('Failed to update delivery info:', error);
        } finally {
            setLoading(false);
        }
    };

    // List of common couriers for quick selection
    const QUICK_COURIERS = [
        { name: 'Shopee Express', type: 'INSTANT', color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { name: 'GoSend', type: 'INSTANT', color: 'bg-green-50 text-green-700 border-green-200' },
        { name: 'JNE', type: 'REGULAR', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { name: 'J&T', type: 'REGULAR', color: 'bg-red-50 text-red-700 border-red-200' },
        { name: 'SiCepat', type: 'REGULAR', color: 'bg-stone-50 text-stone-700 border-stone-200' },
    ];

    const selectCourier = (courier: string) => {
        setData(prev => ({ ...prev, courierName: courier }));
        // Reset tracking URL unless it's JNE/J&T which we can auto-gen
        if (!['JNE', 'J&T'].includes(courier)) {
            setData(prev => ({ ...prev, trackingUrl: '' }));
        }
    };

    // Auto-generate tracking URL for JNE/J&T if resi is added
    React.useEffect(() => {
        if (data.trackingNo && ['JNE', 'J&T'].includes(data.courierName)) {
            const url = `https://cekresi.com/?noresi=${data.trackingNo}`;
            setData(prev => ({ ...prev, trackingUrl: url }));
        }
    }, [data.trackingNo, data.courierName]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] rounded-[2.5rem] w-full max-w-lg relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#2D3A2D] tracking-tight">Kirim Hidangan</h3>
                                <p className="text-[10px] font-bold text-[#8B7E66] uppercase tracking-[0.2em]">Pilih & Input Detail Pengiriman</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Pilih Cepat Kurir</label>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_COURIERS.map(c => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => selectCourier(c.name)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${data.courierName === c.name ? 'ring-2 ring-indigo-600 border-transparent shadow-md' : c.color + ' opacity-50 hover:opacity-100'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Courier Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Nama Kurir</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Truck className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Grab, Shopee, JNE..."
                                        required
                                        value={data.courierName}
                                        onChange={e => setData(prev => ({ ...prev, courierName: e.target.value }))}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#2D3A2D] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">No. Resi / ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <LinkIcon className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="ID Boking / No Resi"
                                        value={data.trackingNo}
                                        onChange={e => setData(prev => ({ ...prev, trackingNo: e.target.value }))}
                                        className="w-full bg-white border border-[#E5E1D8] rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#2D3A2D] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tracking Link */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Link Pelacakan (Opsional)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <LinkIcon className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="url"
                                    placeholder="Tempel link pelacakan dari Kurir..."
                                    value={data.trackingUrl}
                                    onChange={e => setData(prev => ({ ...prev, trackingUrl: e.target.value }))}
                                    className="w-full bg-white border border-[#E5E1D8] rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#1A241A] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                                />
                            </div>
                            {['Shopee Express', 'GoSend'].includes(data.courierName) && !data.trackingUrl && (
                                <p className="text-[9px] text-amber-600 font-bold px-2 italic">💡 Khusus Instan: Salin "Tracking Link" dari aplikasi dan tempel di sini.</p>
                            )}
                            {['JNE', 'J&T'].includes(data.courierName) && data.trackingNo && (
                                <p className="text-[9px] text-blue-600 font-bold px-2 italic">✨ Link pelacakan otomatis telah diaktifkan via cekresi.com</p>
                            )}
                        </div>

                        {/* Driver Section (Optional for Instant) */}
                        <div className="space-y-4 pt-4 border-t border-dashed border-[#E5E1D8]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">Nama Driver</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <User className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Nama Bpk Driver"
                                            value={data.driverName}
                                            onChange={e => setData(prev => ({ ...prev, driverName: e.target.value }))}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#2D3A2D] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest ml-1">WA Driver</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Phone className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="0812xxxx"
                                            value={data.driverPhone}
                                            onChange={e => setData(prev => ({ ...prev, driverPhone: e.target.value }))}
                                            className="w-full bg-white border border-[#E5E1D8] rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#2D3A2D] focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-[#2D3A2D] text-white py-5 rounded-3xl text-sm font-black uppercase tracking-widest hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Konfirmasi & Kirim Notifikasi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
