'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Loader2, Plus, Trash2, ShoppingBasket, Search, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';
import Link from 'next/link';

interface Campaign {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    bundles: any[];
}

interface CampaignManagerProps {
    brandId: string;
    onClose: () => void;
    onCreate: () => void;
    onEdit: (campaign: any) => void;
    onManageBundles: (campaign: any) => void;
}

export default function CampaignManager({ brandId, onClose, onCreate, onEdit, onManageBundles }: CampaignManagerProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const confirm = useConfirm();

    const filteredCampaigns = campaigns.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns`);
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [brandId]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Kampanye?',
            message: 'Semua paket (bundles) di dalam kampanye ini juga akan terhapus. Bunda yakin?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Kampanye berhasil dihapus');
                fetchCampaigns();
            } else {
                throw new Error('Gagal menghapus');
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#1A241A]">Manage Campaigns</h1>
                    <p className="text-[#8B7E66]">
                        Kelola program kampanye bundling (contoh: "Pahlawan Gizi").
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Kembali
                    </Button>
                    <Button
                        onClick={onCreate}
                        className="bg-[#2D3A2D] hover:bg-[#1A241A]"
                    >
                        + Buat Campaign Baru
                    </Button>
                </div>
            </div>

            <div className="bg-white border boundary-[#E5E1D8] rounded-[2rem] p-6 shadow-sm">
                {/* Search & Filter */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari campaign..."
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
                                <th className="pb-3 font-bold text-[#1A241A]">Periode</th>
                                <th className="pb-3 font-bold text-[#1A241A]">Paket (Bundles)</th>
                                <th className="pb-3 font-bold text-[#1A241A]">Status</th>
                                <th className="pb-3 font-bold text-[#1A241A] text-right pr-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E1D8]">
                            {filteredCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredCampaigns.map(campaign => (
                                    <tr key={campaign.id} className="group hover:bg-stone-50 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="font-bold text-[#1A241A]">{campaign.title}</div>
                                            {campaign.description && (
                                                <div className="text-[10px] text-gray-500 max-w-[200px] truncate">{campaign.description}</div>
                                            )}
                                        </td>
                                        <td className="py-4 text-[#8B7E66]">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-bold text-[#1A241A]">
                                                    <ShoppingBasket className="w-3.5 h-3.5 text-amber-600" />
                                                    {campaign.bundles?.length || 0} Paket
                                                </div>
                                                <Button
                                                    onClick={() => onManageBundles(campaign)}
                                                    variant="link"
                                                    className="h-auto p-0 text-[10px] text-amber-600 hover:text-amber-700 justify-start"
                                                >
                                                    Kelola Isi Paket &rarr;
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] px-2 py-1 round-full font-bold uppercase tracking-wider ${campaign.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {campaign.isActive ? 'AKTIF' : 'NON-AKTIF'}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-stone-500 hover:text-[#1A241A]" onClick={() => onEdit(campaign)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(campaign.id)}>
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
        </div>
    );
}
