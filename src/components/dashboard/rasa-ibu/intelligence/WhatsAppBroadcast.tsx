'use client';

import React, { useState, useEffect } from 'react';
import { createWhatsAppCampaignAction, getWhatsAppCampaignsAction, getCampaignRecipientsAction } from '@/lib/actions/rasa-ibu/intelligence';
import { MessageCircle, Users, Send, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';

interface WhatsAppBroadcastProps {
    brandId: string;
}

export default function WhatsAppBroadcast({ brandId }: WhatsAppBroadcastProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        targetSegment: 'AT_RISK',
        messageTemplate: 'Halo Bunda {{name}}, kami kangen nih! Ada promo spesial buat Bunda hari ini. Yuk cek menu terbaru kami! 🍽️✨'
    });

    useEffect(() => {
        loadCampaigns();
    }, [brandId]);

    async function loadCampaigns() {
        const res = await getWhatsAppCampaignsAction(brandId);
        if (res.success) {
            setCampaigns(res.data);
        }
    }

    const handleCreateCampaign = async () => {
        if (!formData.name) return toast.error('Nama campaign harus diisi');

        setIsLoading(true);
        const res = await createWhatsAppCampaignAction({
            brandId,
            ...formData
        });

        if (res.success) {
            toast.success(`Campaign berhasil dibuat! ${res.count} penerima ditargetkan.`);
            loadCampaigns();
            setFormData({ ...formData, name: '' });
        } else {
            toast.error('Gagal membuat campaign: ' + res.error);
        }
        setIsLoading(false);
    };

    const handleDownload = async (campaignId: string, campaignName: string) => {
        const res = await getCampaignRecipientsAction(campaignId);
        if (res.success) {
            const exportData = res.data.map((r: any) => ({
                'Phone': r.phone,
                'Name': r.name,
                'Message': r.message,
                'Status': r.isSent ? 'Sent' : 'Draft'
            }));
            exportToCSV(exportData, `WA_Campaign_${campaignName.replace(/\s+/g, '_')}`);
            toast.success('File CSV berhasil di-download. Siap untuk broadcast manual!');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-green-50 text-green-600 rounded-[1.5rem] shadow-inner">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em]">Communication</h3>
                    <h2 className="text-2xl font-black text-[#2D3A2D]">WhatsApp Broadcast Manager</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Creator Form */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                        <Send className="w-5 h-5 text-green-500" />
                        <h4 className="font-black text-[#2D3A2D]">Buat Campaign Baru</h4>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-2 block">Nama Campaign</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Promo Gajian Agustus"
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E1D8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-2 block">Target Audience</label>
                            <select
                                value={formData.targetSegment}
                                onChange={e => setFormData({ ...formData, targetSegment: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E1D8] text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            >
                                <option value="AT_RISK">At Risk (Sudah lama tidak order)</option>
                                <option value="VIP">VIP Customers (Loyal)</option>
                                <option value="NEW">New Customers (Baru sekali order)</option>
                                <option value="ALL">Semua Pelanggan</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] mb-2 block">Template Pesan</label>
                            <div className="relative">
                                <textarea
                                    value={formData.messageTemplate}
                                    onChange={e => setFormData({ ...formData, messageTemplate: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E1D8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                                />
                                <p className="text-[9px] text-slate-400 mt-2 text-right">Gunakan <b>{`{{name}}`}</b> untuk nama pelanggan customer.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateCampaign}
                            disabled={isLoading}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            Generate Target List
                        </button>
                    </div>
                </div>

                {/* Campaign History */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] px-2">Campaign History</h4>
                    <div className="space-y-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {campaigns.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <p className="text-xs text-slate-400 font-medium">Belum ada campaign dibuat.</p>
                            </div>
                        ) : (
                            campaigns.map((camp) => (
                                <div key={camp.id} className="bg-white p-6 rounded-[2rem] border border-[#E5E1D8] hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h5 className="font-black text-[#2D3A2D]">{camp.name}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                {new Date(camp.createdAt).toLocaleDateString('id-ID')} • {camp.targetSegment.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${camp.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {camp.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A2D]">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            {camp.totalRecipients} Penerima
                                        </div>
                                        <button
                                            onClick={() => handleDownload(camp.id, camp.name)}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 group-hover:bg-green-50 group-hover:text-green-600"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Download CSV
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                <div className="space-y-1">
                    <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Cara Broadcast Manual (Aman & Gratis)</p>
                    <p className="text-xs text-blue-800 leading-relaxed opacity-90">
                        1. Download file CSV dari campaign yang sudah dibuat.<br />
                        2. Buka file CSV, copy nomor telepon dan pesan yang sudah dipersonalisasi.<br />
                        3. Gunakan WhatsApp Web untuk mengirim pesan satu per satu (hindari spamming massal agar nomor aman).<br />
                        4. Untuk otomatisasi penuh (berbayar), kita bisa upgrade ke WhatsApp Business API di fase selanjutnya.
                    </p>
                </div>
            </div>
        </div>
    );
}
