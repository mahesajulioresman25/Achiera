import React, { useEffect, useState } from 'react';
import { Calendar, Package, AlertCircle, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { getUserSubscriptionsAction, cancelSubscriptionAction, uploadSubscriptionProofAction } from '@/lib/actions/commerce/subscriptions';
import { useConfirm } from '@/components/ui/BrandConfirm';
import { useToast } from '@/components/ui/ToastProvider';

// Fix userId prop typing
interface SubscriptionListProps {
    userId?: string;
}

export default function SubscriptionList({ userId }: SubscriptionListProps) {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [viewingScheduleSub, setViewingScheduleSub] = useState<any | null>(null);
    const confirm = useConfirm();
    const { success, error, info } = useToast();

    const loadData = async () => {
        setLoading(true);
        const data = await getUserSubscriptionsAction(userId);
        setSubscriptions(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleCancel = async (id: string) => {
        const confirmed = await confirm({
            title: 'Berhenti Langganan?',
            message: 'Sayang sekali jika Bunda ingin berhenti. Masakan Bunda rindu lho, Bunda yakin ingin mengakhiri paket ini?',
            confirmText: 'Ya, Berhenti',
            cancelText: 'Kembali',
            variant: 'danger'
        });

        if (!confirmed) return;

        const res = await cancelSubscriptionAction(id);
        if (res.success) {
            success('Berhasil berhenti berlangganan. Dapur Bunda selalu terbuka jika Bunda rindu masakan kami!');
            loadData();
        } else {
            error(res.error || 'Gagal memproses permintaan Bunda.');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, subId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            error('Ukuran file maksimal 2MB');
            return;
        }

        setUploadingId(subId);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const res = await uploadSubscriptionProofAction(subId, base64);
                if (res.success) {
                    success('Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi Ibu.');
                    loadData();
                } else {
                    error(res.error || 'Gagal mengunggah bukti.');
                }
                setUploadingId(null);
            };
        } catch (err) {
            error('Terjadi kesalahan saat mengunggah.');
            setUploadingId(null);
        }
    };

    if (loading && subscriptions.length === 0) return <div className="p-8 text-center text-gray-500">Memuat data langganan...</div>;

    if (subscriptions.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Langganan</h3>
                <p className="text-gray-500 mb-6">Anda belum memiliki paket langganan aktif.</p>
                <a href="/rasa-ibu#subscription" className="px-6 py-2 bg-[#BD302D] text-white rounded-lg font-bold hover:bg-[#a32826] transition-colors">
                    Lihat Paket
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${sub.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-100' :
                                    sub.status === 'WAITING_PAYMENT' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        'bg-gray-50 text-gray-500 border border-gray-100'
                                    }`}>
                                    {sub.status === 'WAITING_PAYMENT' ? 'Menunggu Bayar' : sub.status}
                                </span>
                                <span className="text-gray-300 text-[10px]">•</span>
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                    {sub.paymentProof ? 'Bukti Terunggah' : 'Jatuh Tempo: ' + new Date(sub.nextPaymentDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-[#2D3A2D] font-serif">Paket {sub.interval === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tagihan</p>
                            <p className="text-xl font-black text-[#BD302D]">
                                Rp {sub.plan?.price?.toLocaleString() || "0"}
                                <span className="text-[10px] text-gray-400 font-normal ml-1">/{sub.interval.toLowerCase()}</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-[#FDFBF7]/50">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Package className="w-3 h-3 text-[#B2BCA2]" /> Isi Paket Langganan
                        </h4>
                        <ul className="space-y-2">
                            {sub.items?.map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#2D3A2D]">{item.variant?.product?.name || "Menu Rasa Ibu"}</span>
                                        <span className="text-[10px] text-gray-400 italic">{item.variant?.name || "Normal"}</span>
                                    </div>
                                    <span className="font-black text-[#2D3A2D]">x{item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-4 flex flex-wrap justify-between items-center gap-3 bg-white border-t border-gray-100">
                        <div className="text-[10px] text-gray-400 italic">
                            Berakhir: {new Date(sub.endDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </div>
                        <div className="flex gap-2">
                            {sub.status === 'WAITING_PAYMENT' && (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileChange(e, sub.id)}
                                        disabled={uploadingId === sub.id}
                                    />
                                    <button className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-[#2D3A2D] text-white hover:bg-[#1f281f] rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-black/5">
                                        {uploadingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        {sub.paymentProof ? 'Update Bukti' : 'Upload Bukti Bayar'}
                                    </button>
                                </div>
                            )}

                            {sub.status === 'ACTIVE' && (
                                <button
                                    onClick={() => setViewingScheduleSub(sub)}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#2D3A2D] border border-gray-200 hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Jadwal Kirim
                                </button>
                            )}

                            {sub.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => handleCancel(sub.id)}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    Stop
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Schedule Modal */}
            {viewingScheduleSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDFBF7]">
                            <div>
                                <h3 className="font-serif font-bold text-lg text-[#2D3A2D]">Jadwal Pengiriman</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Paket {viewingScheduleSub.interval === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}</p>
                            </div>
                            <button
                                onClick={() => setViewingScheduleSub(null)}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!viewingScheduleSub.deliveryDays || viewingScheduleSub.deliveryDays.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 italic">
                                    Belum ada jadwal pengiriman yang diatur.
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {viewingScheduleSub.deliveryDays.map((day: any, idx: number) => {
                                        const dayLabels: Record<string, string> = {
                                            'SUNDAY': 'Minggu', 'MONDAY': 'Senin', 'TUESDAY': 'Selasa',
                                            'WEDNESDAY': 'Rabu', 'THURSDAY': 'Kamis', 'FRIDAY': 'Jumat', 'SATURDAY': 'Sabtu'
                                        };
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#BD302D]/10 text-[#BD302D] flex items-center justify-center">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-[#2D3A2D]">{dayLabels[day.day] || day.day}</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                                    {day.timeSlot}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                            <p className="text-[10px] text-gray-400 italic">
                                *Hubungi admin jika ingin mengubah jadwal
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
