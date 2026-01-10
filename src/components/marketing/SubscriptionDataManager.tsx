'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    MapPin,
    Loader2,
    Settings2,
    Save,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Subscription {
    id: string;
    userId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    customerAddress: string;
    status: string;
    interval: string;
    deliveryDays: { day: string; timeSlot: string }[] | null;
    nextPaymentDate: string;
    createdAt: string;
    plan?: {
        name: string;
        price: number;
        type: string;
    };
    items?: {
        id: string;
        variantId: string;
        quantity: number;
        variant: {
            name: string;
            product: {
                name: string;
            };
        };
    }[];
    paymentProof?: string | null;
}

const DAY_LABELS: Record<string, string> = {
    'SUNDAY': 'Minggu',
    'MONDAY': 'Senin',
    'TUESDAY': 'Selasa',
    'WEDNESDAY': 'Rabu',
    'THURSDAY': 'Kamis',
    'FRIDAY': 'Jumat',
    'SATURDAY': 'Sabtu',
};

const DAYS_OF_WEEK = [
    { id: 'SUNDAY', label: 'Minggu' },
    { id: 'MONDAY', label: 'Senin' },
    { id: 'TUESDAY', label: 'Selasa' },
    { id: 'WEDNESDAY', label: 'Rabu' },
    { id: 'THURSDAY', label: 'Kamis' },
    { id: 'FRIDAY', label: 'Jumat' },
    { id: 'SATURDAY', label: 'Sabtu' },
];

const TIME_SLOTS = [
    "06:00 - 08:00",
    "10:00 - 12:00",
    "13:00 - 15:00",
    "19:00 - 21:00"
];

export default function SubscriptionDataManager({ brandId }: { brandId: string }) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [editingDaysId, setEditingDaysId] = useState<string | null>(null);
    const [tempSelectedDays, setTempSelectedDays] = useState<{ day: string; timeSlot: string }[]>([]);
    const [savingDays, setSavingDays] = useState(false);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, [brandId]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/subscriptions`);
            const data = await res.json();
            if (data.success) {
                const subs = data.data;
                if (data.debug) (subs as any).debug = data.debug;
                setSubscriptions(subs);
            } else {
                toast.error('Failed to fetch subscriptions');
            }
        } catch (error) {
            toast.error('Error loading subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/brands/${brandId}/subscriptions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success('Status langganan diperbarui');
                fetchSubscriptions();
            } else {
                toast.error('Gagal memperbarui status');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat memperbarui status');
        }
    };

    const toggleTempDay = (dayId: string) => {
        setTempSelectedDays(prev => {
            const exists = prev.find(d => d.day === dayId);
            if (exists) {
                return prev.filter(d => d.day !== dayId);
            } else {
                return [...prev, { day: dayId, timeSlot: TIME_SLOTS[0] }];
            }
        });
    };

    const updateTempTimeSlot = (dayId: string, timeSlot: string) => {
        setTempSelectedDays(prev => prev.map(d => d.day === dayId ? { ...d, timeSlot } : d));
    };

    const saveDeliveryDays = async (id: string) => {
        if (tempSelectedDays.length === 0) {
            toast.error('Pilih minimal satu hari pengiriman');
            return;
        }

        setSavingDays(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/subscriptions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryDays: tempSelectedDays })
            });

            if (res.ok) {
                toast.success('Hari pengiriman diperbarui');
                setEditingDaysId(null);
                fetchSubscriptions();
            } else {
                toast.error('Gagal memperbarui hari pengiriman');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSavingDays(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1">Aktif</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-3 py-1">Menunggu</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 py-1">Dibatalkan</Badge>;
            case 'EXPIRED':
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none px-3 py-1">Kadaluarsa</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-3 py-1">{status}</Badge>;
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesSearch =
            sub.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.customerPhone.includes(searchTerm);

        const matchesStatus = statusFilter === 'ALL' || sub.status.toUpperCase() === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Pelanggan Berlangganan</h2>
                    <p className="text-slate-500 text-sm">Kelola dan pantau seluruh langganan aktif pelanggan Anda.</p>
                    <div className="text-[10px] text-stone-300 font-mono mt-1">ID: {brandId}</div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-stone-400">Total Filtered: {subscriptions.length}</span>
                    {(subscriptions as any).debug && (
                        <span className="text-[10px] text-stone-400">| DB Total: {(subscriptions as any).debug.totalCount}</span>
                    )}
                    <Button onClick={fetchSubscriptions} variant="outline" size="icon" className="rounded-xl">
                        <Clock className="w-4 h-4 text-slate-500" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Cari nama, email, atau no. telepon..."
                        className="pl-10 rounded-xl border-slate-200 focus:ring-[#BD302D] focus:border-[#BD302D]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#BD302D] appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="PENDING">Menunggu</option>
                        <option value="CANCELLED">Dibatalkan</option>
                        <option value="EXPIRED">Kadaluarsa</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Loader2 className="w-10 h-10 animate-spin text-[#BD302D] mb-4" />
                    <p className="text-slate-500 font-medium">Memuat data pelanggan...</p>
                </div>
            ) : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <User className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">Tidak ada data ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSubscriptions.map((sub) => (
                        <div key={sub.id} className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#BD302D] font-black text-xl border border-slate-100">
                                            {sub.customerName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                {sub.customerName}
                                                {getStatusBadge(sub.status)}
                                                {sub.plan && (
                                                    <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50">
                                                        {sub.plan.name}
                                                    </Badge>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Terdaftar: {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1 uppercase tracking-wider font-bold">
                                                    <Clock className="w-3 h-3" />
                                                    Setiap {sub.interval === 'WEEKLY' ? 'Minggu' : 'Bulan'}
                                                </span>
                                                {sub.interval === 'WEEKLY' && (
                                                    <div className="mt-2 group/days relative">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hari Pengiriman:</span>
                                                            {editingDaysId !== sub.id && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingDaysId(sub.id);
                                                                        setTempSelectedDays(sub.deliveryDays || []);
                                                                    }}
                                                                    className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-[#BD302D] transition-colors"
                                                                >
                                                                    <Settings2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {editingDaysId === sub.id ? (
                                                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {DAYS_OF_WEEK.map((day) => {
                                                                        const isSelected = tempSelectedDays.some(d => d.day === day.id);
                                                                        return (
                                                                            <button
                                                                                key={day.id}
                                                                                onClick={() => toggleTempDay(day.id)}
                                                                                className={`px-2 py-2 rounded-md text-[9px] font-bold transition-all border ${isSelected
                                                                                    ? 'bg-[#2D3A2D] border-[#2D3A2D] text-white shadow-sm'
                                                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                                                                    }`}
                                                                            >
                                                                                {day.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {tempSelectedDays.length > 0 && (
                                                                    <div className="space-y-2 border-t border-slate-200 pt-3">
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Atur Jam Pengiriman:</span>
                                                                        {tempSelectedDays.map(d => (
                                                                            <div key={d.day} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100">
                                                                                <span className="text-[10px] font-bold text-slate-700">{DAY_LABELS[d.day]}</span>
                                                                                <select
                                                                                    value={d.timeSlot}
                                                                                    onChange={(e) => updateTempTimeSlot(d.day, e.target.value)}
                                                                                    className="bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-[10px] focus:ring-0 focus:border-[#B2BCA2] outline-none"
                                                                                >
                                                                                    {TIME_SLOTS.map(slot => (
                                                                                        <option key={slot} value={slot}>{slot}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2 pt-1">
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-7 px-3 text-[10px] bg-[#2D3A2D] hover:bg-[#1A241A] rounded-lg"
                                                                        disabled={savingDays}
                                                                        onClick={() => saveDeliveryDays(sub.id)}
                                                                    >
                                                                        {savingDays ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                                                                        Simpan
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 px-3 text-[10px] text-slate-500 hover:bg-slate-200 rounded-lg"
                                                                        onClick={() => setEditingDaysId(null)}
                                                                        disabled={savingDays}
                                                                    >
                                                                        <X className="w-3 h-3 mr-1" />
                                                                        Batal
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1">
                                                                {sub.deliveryDays?.length ? (
                                                                    sub.deliveryDays.map(d => (
                                                                        <Badge key={d.day} variant="secondary" className="text-[9px] px-1.5 py-1 bg-slate-100 text-slate-500 border-none font-medium flex flex-col items-start gap-0.5">
                                                                            <span className="font-bold text-[8px] uppercase">{DAY_LABELS[d.day] || d.day}</span>
                                                                            <span className="opacity-70">{d.timeSlot}</span>
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[10px] text-amber-500 italic">Belum diputuskan</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {sub.items && sub.items.length > 0 && (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Isi Paket / Produk Terpilih:</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {sub.items.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100">
                                                        <span className="text-slate-600 truncate mr-2">
                                                            {item.variant.product.name} ({item.variant.name})
                                                        </span>
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold">
                                                            {item.quantity}x
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-sm text-slate-600 truncate">{sub.customerEmail || 'No Email'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-sm text-slate-600">{sub.customerPhone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 lg:col-span-1 sm:col-span-2">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-xs text-slate-600 line-clamp-1">{sub.customerAddress}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col justify-between items-end gap-4 min-w-[200px]">
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                            {sub.plan ? 'Total Tagihan' : 'Tagihan Berikutnya'}
                                        </p>
                                        <div className="mb-2">
                                            {sub.plan ? (
                                                <p className="text-lg font-black text-[#BD302D]">
                                                    {sub.status.toUpperCase() === 'CANCELLED' ? 'Rp 0' : `Rp ${Number(sub.plan.price).toLocaleString('id-ID')}`}
                                                </p>
                                            ) : (
                                                <p className="text-sm font-black text-[#BD302D] flex items-center justify-end gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(sub.nextPaymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                        {sub.plan && sub.status.toUpperCase() !== 'CANCELLED' && (
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Jatuh Tempo: {new Date(sub.nextPaymentDate).toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                        {sub.status.toUpperCase() === 'CANCELLED' && (
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                                                <AlertCircle className="w-3 h-3 text-red-400" />
                                                Paket Berhenti
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* View Proof Button */}
                                        {sub.paymentProof && (
                                            <button
                                                onClick={() => setSelectedProof(sub.paymentProof!)}
                                                className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3" />
                                                    Bukti
                                                </div>
                                            </button>
                                        )}

                                        {sub.status.toUpperCase() !== 'ACTIVE' && sub.status.toUpperCase() !== 'CANCELLED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-lg border-green-200 text-green-600 hover:bg-green-50"
                                                onClick={() => updateStatus(sub.id, 'ACTIVE')}
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Aktifkan
                                            </Button>
                                        )}
                                        {sub.status.toUpperCase() !== 'CANCELLED' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => updateStatus(sub.id, 'CANCELLED')}
                                            >
                                                <XCircle className="w-3 h-3 mr-1" /> Stop
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Proof Preview Modal */}
            {selectedProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Bukti Pembayaran</h3>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center min-h-[300px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selectedProof}
                                alt="Bukti Pembayaran"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                            />
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-white">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedProof(null)}
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
