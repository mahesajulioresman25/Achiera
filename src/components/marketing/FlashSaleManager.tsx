'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Loader2, Plus, Calendar, Clock, Trash2, Search, Edit } from 'lucide-react';
import FlashSaleForm from '@/components/marketing/FlashSaleForm';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';

export default function FlashSaleManager({ brandId, onClose }: { brandId: string, onClose: () => void }) {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedConfig, setSelectedConfig] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const confirm = useConfirm();

    const filteredConfigs = configs.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/flash-sale/list`); // Need to create this or update route
            // For now, let's use the main route which should ideally return a list if optimized
            const mainRes = await fetch(`/api/brands/${brandId}/flash-sale`);
            const data = await mainRes.json();
            setConfigs(Array.isArray(data) ? data : (data ? [data] : []));
        } catch (error) {
            console.error('Failed to fetch flash sale configs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, [brandId]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Flash Sale?',
            message: 'Konfigurasi Flash Sale ini akan dihapus permanen. Lanjutkan?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/brands/${brandId}/flash-sale/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Konfigurasi dihapus');
                fetchConfigs();
            } else {
                throw new Error('Gagal menghapus');
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (view === 'FORM') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setView('LIST')} className="rounded-full hover:bg-stone-100">
                        <ChevronLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#1A241A]">
                            {selectedConfig ? 'Edit Flash Sale' : 'Buat Flash Sale Baru'}
                        </h1>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] border border-[#E5E1D8] p-8 shadow-sm">
                    <FlashSaleForm
                        brandId={brandId}
                        initialData={selectedConfig}
                        onSuccess={() => {
                            setView('LIST');
                            fetchConfigs();
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-stone-100">
                        <ChevronLeft className="w-5 h-5 text-stone-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#1A241A]">Flash Sale Manager</h1>
                        <p className="text-[#8B7E66] text-sm">Kelola jadwal promo Flash Sale Anda.</p>
                    </div>
                </div>
                <Button onClick={() => { setSelectedConfig(null); setView('FORM'); }} className="bg-[#2D3A2D] hover:bg-[#1A241A]">
                    <Plus className="w-4 h-4 mr-2" /> Buat Baru
                </Button>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
                <div className="bg-white border boundary-[#E5E1D8] rounded-[2rem] p-6 shadow-sm">
                    {/* Search & Filter */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari flash sale..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-xl border-[#E5E1D8]"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#E5E1D8]">
                                    <th className="pb-3 font-bold text-[#1A241A] pl-4">Nama Campaign</th>
                                    <th className="pb-3 font-bold text-[#1A241A]">Jadwal</th>
                                    <th className="pb-3 font-bold text-[#1A241A]">Diskon</th>
                                    <th className="pb-3 font-bold text-[#1A241A]">Status</th>
                                    <th className="pb-3 font-bold text-[#1A241A] text-right pr-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E1D8]">
                                {filteredConfigs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                            Tidak ada data ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConfigs.map(config => (
                                        <tr key={config.id} className="group hover:bg-stone-50 transition-colors">
                                            <td className="py-4 pl-4 font-medium text-[#1A241A]">
                                                {config.name}
                                                <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                                                    Target: {config.targetType || 'ALL'}
                                                </div>
                                            </td>
                                            <td className="py-4 text-[#8B7E66]">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {config.startDate ? new Date(config.startDate).toLocaleDateString() : 'N/A'} - {config.endDate ? new Date(config.endDate).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-stone-400">
                                                        <Clock className="w-3 h-3" />
                                                        {config.startTime} - {config.endTime}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-bold text-orange-600">
                                                {config.discountPercentage}% <span className="text-[10px] text-gray-400 font-normal">OFF</span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-wider ${config.isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {config.isActive ? 'LIVE' : 'OFF'}
                                                </span>
                                            </td>
                                            <td className="py-4 pr-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-500 hover:text-[#1A241A]" onClick={() => { setSelectedConfig(config); setView('FORM'); }}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(config.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
