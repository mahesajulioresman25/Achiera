import React from 'react';
import { updateOrderStatus } from '@/lib/actions/rasa-ibu/orders';
import DeliveryInputModal from './DeliveryInputModal';

const STATUS_LABELS: Record<string, string> = {
    'DIPESAN': 'Pesan Tercatat',
    'MENUNGGU_VERIFIKASI_QRIS': '🔍 Verifikasi QRIS',
    'DIBAYAR': 'Sudah Dibayar',
    'DISIAPKAN': 'Sedang Disiapkan',
    'DIKIRIM': 'Sedang Diantar',
    'SELESAI': 'Selesai',
};

const STATUS_COLORS: Record<string, string> = {
    'DIPESAN': 'bg-stone-50 text-stone-600 border-stone-200',
    'MENUNGGU_VERIFIKASI_QRIS': 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    'DIBAYAR': 'bg-blue-50 text-blue-700 border-blue-200',
    'DISIAPKAN': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'DIKIRIM': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'SELESAI': 'bg-slate-100 text-slate-500 border-slate-200',
};

const SOURCE_LOGOS: Record<string, string> = {
    'WHATSAPP': '/images/platforms/shopee.png', // Fallback for now or use a dedicated WA logo if found
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

interface ManualOrderLedgerProps {
    orders: any[];
    onOpenIngestion: () => void;
    onOpenOrderEntry: () => void;
    onOpenReceipt: (order: any) => void;
    onOpenQRISPayment: (order: any) => void;
    onOpenPaymentVerification: () => void;
    onOpenPaymentHistory?: () => void;
    onToggleFullscreen?: () => void;
    isFullscreen?: boolean;
}

export default function ManualOrderLedger({
    orders,
    onOpenIngestion,
    onOpenOrderEntry,
    onOpenReceipt,
    onOpenQRISPayment,
    onOpenPaymentVerification,
    onOpenPaymentHistory,
    onToggleFullscreen,
    isFullscreen = false
}: ManualOrderLedgerProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [deliveryModalOrder, setDeliveryModalOrder] = React.useState<any>(null);

    const sortedOrders = [...orders]
        .filter(order => {
            const searchLower = searchQuery.toLowerCase();
            return (
                order.customerName?.toLowerCase().includes(searchLower) ||
                order.manualRef?.toLowerCase().includes(searchLower) ||
                order.customerAddress?.toLowerCase().includes(searchLower) ||
                order.channel?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div suppressHydrationWarning className={`bg-white border border-[#E5E1D8] ${isFullscreen ? 'rounded-none border-none min-h-screen' : 'rounded-[3rem] shadow-sm shadow-stone-200/50'} overflow-hidden transition-all duration-500`}>
            <div className={`px-6 py-6 border-b border-[#F9F7F2] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white ${isFullscreen ? 'sticky top-0 z-20 shadow-sm' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2D3A2D] rounded-lg flex items-center justify-center">
                        <span className="text-sm">📋</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#2D3A2D] uppercase tracking-widest">Buku Pesanan RASA IBU</h3>
                        {isFullscreen && <p className="text-[10px] text-[#8B7E66] font-bold uppercase tracking-widest opacity-60">Operational Fullscreen View</p>}
                    </div>
                </div>

                {/* Integrated Search Bar */}
                <div className="flex-1 max-w-md w-full relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-stone-400 group-focus-within:text-[#2D3A2D] transition-colors">🔍</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Bunda, Ref, atau Alamat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F9F7F2] border border-[#E5E1D8] rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-[#2D3A2D] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D3A2D]/10 focus:border-[#2D3A2D] transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={onOpenIngestion}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7E66] border border-[#E5E1D8] px-5 py-2.5 rounded-xl hover:bg-stone-50 transition-all shadow-sm"
                    >
                        📥 Impor
                    </button>
                    {onOpenPaymentHistory && (
                        <button
                            onClick={onOpenPaymentHistory}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100 px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all shadow-sm"
                        >
                            📜 Riwayat
                        </button>
                    )}
                    <button
                        onClick={onOpenOrderEntry}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7] bg-[#2D3A2D] px-5 py-2.5 rounded-xl hover:shadow-xl hover:bg-[#1A241A] transition-all shadow-lg shadow-green-900/10 flex-1 md:flex-none text-center"
                    >
                        + Catat Baru
                    </button>
                    {onToggleFullscreen && (
                        <button
                            onClick={onToggleFullscreen}
                            className={`p-2.5 rounded-xl border border-[#E5E1D8] transition-all ${isFullscreen ? 'bg-[#2D3A2D] text-white border-[#2D3A2D]' : 'bg-white text-[#8B7E66] hover:bg-stone-50'}`}
                            title={isFullscreen ? 'Minimize' : 'Maximize'}
                        >
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className={`overflow-x-auto ${isFullscreen ? 'pb-10' : ''}`}>
                <table className="w-full text-left">
                    <thead className={`bg-[#F9F7F2] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 ${isFullscreen ? 'sticky top-[81px] z-10' : ''}`}>
                        <tr>
                            <th className="px-6 py-5">Sumber</th>
                            <th className="px-6 py-5">Pelanggan / Ref</th>
                            <th className="px-6 py-5">Pengiriman</th>
                            <th className="px-6 py-5">Outlet</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5 text-right">Total</th>
                            <th className="px-6 py-5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedOrders.map((order) => {
                            const isAttentionNeeded = order.status === 'DIPESAN';

                            // Detect if order is "Frozen-Only"
                            const orderItems = order.orderItems || [];
                            const isFrozenOnly = orderItems.length > 0 && orderItems.every((item: any) =>
                                item.frozenVariant?.product?.category?.slug === 'frozen' ||
                                item.frozenVariant?.product?.category?.name?.toLowerCase().includes('frozen')
                            );

                            return (
                                <tr key={order.id} className={`hover:bg-[#FDFBF7]/50 transition-colors ${isAttentionNeeded ? 'bg-amber-50/20' : ''}`}>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 p-1 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help shadow-sm" title={order.channel || 'Manual'}>
                                                {SOURCE_LOGOS[order.channel?.toUpperCase()] ? (
                                                    <img src={SOURCE_LOGOS[order.channel.toUpperCase()]} alt={order.channel} className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="text-lg">❓</span>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                {order.channel || 'Manual'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-black text-[#1A241A] whitespace-nowrap">{order.customerName}</p>
                                                {order.subscriptionId && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[8px] font-black uppercase tracking-wider">
                                                        🔄 Langganan
                                                    </span>
                                                )}
                                            </div>
                                            {order.manualRef && (
                                                <p className="text-[9px] font-medium text-slate-400 tracking-tighter">REF: {order.manualRef}</p>
                                            )}
                                            {order.customerAddress && (
                                                <p className="text-[9px] text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded inline-block max-w-[250px] truncate font-bold">
                                                    📍 {order.customerAddress}
                                                </p>
                                            )}
                                            {order.customerNote && (
                                                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-100 max-w-[250px]">
                                                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">📝 Catatan Customer:</p>
                                                    <p className="text-[9px] text-amber-700 leading-relaxed font-medium">"{order.customerNote}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        {(() => {
                                            const deliveryMatch = order.customerNote?.match(/^\[(.*?)\]/);
                                            const deliveryInfo = deliveryMatch ? deliveryMatch[1] : null;

                                            if (!deliveryInfo && !order.courierName) return <span className="text-slate-300 italic text-[10px]">Cek Manual</span>;

                                            const method = order.courierName || (deliveryInfo ? deliveryInfo.split(' - ')[0] : 'Kurir');
                                            const courier = order.trackingNo || (deliveryInfo ? deliveryInfo.split(' - ')[1] : null);

                                            return (
                                                <div className="flex flex-col gap-1 min-w-[100px]">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight text-center border ${method.toLowerCase().includes('instan') || method.toLowerCase().includes('grab') || method.toLowerCase().includes('go')
                                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        }`}>
                                                        {method}
                                                    </span>
                                                    {courier && (
                                                        <span className="text-[9px] font-black text-[#8B7E66] uppercase text-center truncate max-w-[120px]" title={courier}>{courier}</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-[#2D3A2D] uppercase tracking-widest whitespace-nowrap">
                                                {order.warehouse?.name || 'Dapur Ibu'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${STATUS_COLORS[order.status] || 'bg-slate-50'}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right font-black text-[#1A241A] text-sm whitespace-nowrap">
                                        Rp {(Number(order.totalAmount || order.total || 0)).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2 flex-nowrap">
                                            <button
                                                onClick={() => onOpenReceipt(order)}
                                                className="text-[9px] font-black uppercase text-amber-600 border border-amber-200 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition-all shadow-sm"
                                            >
                                                Nota
                                            </button>
                                            {order.status === 'DIPESAN' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onOpenQRISPayment(order)}
                                                        className="text-[9px] font-black uppercase text-purple-600 border border-purple-200 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all shadow-sm"
                                                    >
                                                        QRIS
                                                    </button>
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, 'DIBAYAR')}
                                                        className="text-[9px] font-black uppercase text-blue-600 border border-blue-200 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                                                    >
                                                        Cash
                                                    </button>
                                                </div>
                                            )}
                                            {order.status === 'MENUNGGU_VERIFIKASI_QRIS' && (
                                                <button
                                                    onClick={onOpenPaymentVerification}
                                                    className="text-[9px] font-black uppercase text-amber-600 border border-amber-200 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    Cek Bukti
                                                </button>
                                            )}
                                            {/* Show BUKTI button for orders with payment proof */}
                                            {order.paymentProof && order.status !== 'MENUNGGU_VERIFIKASI_QRIS' && (
                                                <button
                                                    onClick={onOpenPaymentVerification}
                                                    className="text-[9px] font-black uppercase text-blue-600 border border-blue-200 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    📸 Bukti
                                                </button>
                                            )}
                                            {order.status === 'DIBAYAR' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'DISIAPKAN')}
                                                    className="text-[9px] font-black uppercase text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm"
                                                >
                                                    {isFrozenOnly ? '🧤 Siapkan' : '🍳 Masak'}
                                                </button>
                                            )}
                                            {order.status === 'DISIAPKAN' && (
                                                <button
                                                    onClick={() => setDeliveryModalOrder(order)}
                                                    className="text-[9px] font-black uppercase text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all shadow-sm"
                                                >
                                                    {isFrozenOnly ? '📦 Pack' : '🚚 Antar'}
                                                </button>
                                            )}
                                            {order.status === 'DIKIRIM' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'SELESAI')}
                                                    className="text-[9px] font-black uppercase text-slate-600 border border-slate-200 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all shadow-sm"
                                                >
                                                    Selesai
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedOrders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <span className="text-4xl">🔎</span>
                                        <p className="text-slate-400 italic text-sm font-bold uppercase tracking-widest">
                                            {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada pesanan terdaftar hari ini.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deliveryModalOrder && (
                <DeliveryInputModal
                    order={deliveryModalOrder}
                    onClose={() => setDeliveryModalOrder(null)}
                    onSubmit={async (deliveryData) => {
                        await updateOrderStatus(deliveryModalOrder.id, 'DIKIRIM', deliveryData);
                    }}
                />
            )}
        </div>
    );
}
