'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, Trash2, Loader2, Edit2 } from 'lucide-react';
import BundleForm from './BundleForm';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/BrandConfirm';

interface BundleManagerProps {
    brandId: string;
    campaign: any;
    onClose: () => void;
}

export default function BundleManager({ brandId, campaign, onClose }: BundleManagerProps) {
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [selectedBundle, setSelectedBundle] = useState<any>(null);
    const confirm = useConfirm();

    const fetchBundles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns/${campaign.id}/bundles`);
            const data = await res.json();
            setBundles(data);
        } catch (error) {
            console.error('Failed to fetch bundles', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBundles();
    }, [campaign.id]);

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Paket?',
            message: 'Bunda yakin ingin menghapus paket bundling ini?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'danger'
        });

        if (!confirmed) return;
        try {
            const res = await fetch(`/api/brands/${brandId}/campaigns/${campaign.id}/bundles?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Paket dihapus');
                fetchBundles();
            }
        } catch (error) {
            toast.error('Gagal menghapus');
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
                        <h1 className="text-2xl font-bold tracking-tight text-[#1A241A]">
                            {selectedBundle ? 'Edit Paket' : 'Tambah Paket Baru'}
                        </h1>
                        <p className="text-[#8B7E66] text-sm">Kampanye: {campaign.name}</p>
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] border border-[#E5E1D8] p-8 shadow-sm">
                    <BundleForm
                        brandId={brandId}
                        campaignId={campaign.id}
                        initialData={selectedBundle}
                        onCancel={() => setView('LIST')}
                        onSuccess={() => {
                            setView('LIST');
                            fetchBundles();
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
                        <h1 className="text-3xl font-bold tracking-tight text-[#1A241A]">Daftar Paket Bundling</h1>
                        <p className="text-[#8B7E66] text-sm">Kelola paket hemat untuk kampanye **{campaign.name}**.</p>
                    </div>
                </div>
                <Button onClick={() => { setSelectedBundle(null); setView('FORM'); }} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Paket
                </Button>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bundles.map(bundle => (
                        <div key={bundle.id} className="border border-[#E5E1D8] rounded-[2rem] p-8 bg-white shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
                            {/* Decorative badge */}
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    Paket Hemat
                                </span>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-black text-2xl text-[#1A241A] mb-2">{bundle.name}</h3>
                                <p className="text-sm text-[#8B7E66] line-clamp-2">{bundle.description || 'Tidak ada deskripsi.'}</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest mb-2">Isi Produk:</p>
                                {bundle.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm bg-stone-50 p-2 rounded-lg border border-stone-100">
                                        <span className="font-medium text-stone-700">{item.variant?.product?.name}</span>
                                        <span className="font-black text-amber-600">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-end justify-between pt-6 border-t border-stone-100">
                                <div>
                                    <p className="text-[10px] font-black text-[#8B7E66] uppercase tracking-widest">Harga Khusus Paket</p>
                                    <p className="text-3xl font-black text-[#2D3A2D]">Rp {Number(bundle.price).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-stone-400 hover:text-stone-600" onClick={() => { setSelectedBundle(bundle); setView('FORM'); }}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(bundle.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {bundles.length === 0 && (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-[#E5E1D8] rounded-[3rem] bg-[#FDFBF7]">
                            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                                <Plus className="w-10 h-10 text-stone-200" />
                            </div>
                            <p className="text-[#8B7E66] font-bold text-lg">Belum ada paket untuk kampanye ini.</p>
                            <p className="text-[#8B7E66]/60 text-sm max-w-xs mx-auto mt-1">Buat paket bundling pertama Anda untuk meningkatkan penjualan!</p>
                            <Button variant="outline" className="mt-6 rounded-xl border-stone-200" onClick={() => { setSelectedBundle(null); setView('FORM'); }}>
                                Tambah Sekarang
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
