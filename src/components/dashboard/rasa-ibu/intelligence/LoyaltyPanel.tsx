'use client';

import React, { useState } from 'react';
import { getLoyaltyStatsAction, redeemLoyaltyPointsAction } from '@/lib/actions/rasa-ibu/intelligence';
import { Gift, Search, Coins, Award, History, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyPanelProps {
    brandId: string;
}

export default function LoyaltyPanel({ brandId }: LoyaltyPanelProps) {
    const [phone, setPhone] = useState('');
    const [account, setAccount] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState<number>(0);
    const [pointValue, setPointValue] = useState<number>(100);

    const handleCheck = async () => {
        if (!phone) return toast.error('Masukkan nomor HP');
        setIsLoading(true);
        const res = await getLoyaltyStatsAction({ customerPhone: phone, brandId });

        if (res.success && res.data) {
            setAccount(res.data);
            if (res.config?.pointValueInRupiah) {
                setPointValue(res.config.pointValueInRupiah);
            }
        } else if (res.success) {
            setAccount(null);
            toast.info('Pelanggan belum memiliki point loyalty.');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const handleRedeem = async () => {
        if (!redeemAmount || redeemAmount <= 0) return;
        if (redeemAmount > (account?.balance || 0)) return toast.error('Poin tidak mencukupi');

        setIsLoading(true);
        const res = await redeemLoyaltyPointsAction({
            brandId,
            customerPhone: phone,
            points: redeemAmount,
            description: `Redemption via Dashboard`
        });

        if (res.success) {
            toast.success(`Berhasil redeem ${redeemAmount} poin!`);
            handleCheck(); // Refresh
            setRedeemAmount(0);
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'PLATINUM': return 'bg-slate-800 text-white border-slate-600';
            case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'SILVER': return 'bg-slate-100 text-slate-700 border-slate-300';
            default: return 'bg-orange-50 text-orange-700 border-orange-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-50 text-purple-600 rounded-[1.5rem] shadow-inner">
                    <Gift className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Retention</h3>
                    <h2 className="text-2xl font-black text-[#2D3A2D]">Loyalty & Gamification</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Search & Action */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-sm space-y-6">
                    <h4 className="font-black text-[#2D3A2D] flex items-center gap-2">
                        <Search className="w-4 h-4 text-purple-500" />
                        Cek Poin Pelanggan
                    </h4>

                    <div className="flex gap-2">
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Nomor HP (0812...)"
                            className="flex-1 px-4 py-3 rounded-xl border border-[#E5E1D8] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                        <button
                            onClick={handleCheck}
                            disabled={isLoading}
                            className="px-6 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
                        </button>
                    </div>

                    {account && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-[2rem] text-white shadow-lg shadow-purple-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Award className="w-32 h-32 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-purple-100 text-xs font-bold uppercase tracking-widest">Total Poin</p>
                                            <h3 className="text-4xl font-black mt-1">{account.balance}</h3>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getTierColor(account.tier)}`}>
                                            {account.tier} TIER
                                        </span>
                                    </div>
                                    <div className="mt-8 flex gap-4 text-sm font-medium text-purple-100">
                                        <div>
                                            <p className="text-[10px] opacity-70 uppercase">Lifetime Earned</p>
                                            <p>{account.lifetimeEarned}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] opacity-70 uppercase">Redeemed</p>
                                            <p>{account.lifetimeRedeemed}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] block">Tukar Poin</label>
                                <div className="flex gap-2">
                                    {[50, 100, 200].map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => setRedeemAmount(amt)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${redeemAmount === amt
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                                }`}
                                        >
                                            {amt} Poin
                                        </button>
                                    ))}
                                </div>

                                {redeemAmount > 0 && (
                                    <div className="bg-slate-50 p-4 rounded-xl text-center space-y-2">
                                        <p className="text-xs text-slate-500">Nilai Penukaran:</p>
                                        <p className="text-xl font-black text-purple-600">Rp {(redeemAmount * pointValue).toLocaleString('id-ID')}</p>
                                        <button
                                            onClick={handleRedeem}
                                            disabled={isLoading}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
                                        >
                                            Konfirmasi Redeem
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* History */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8B7E66] px-2 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Riwayat Transaksi Terakhir
                    </h4>

                    {account?.transactions?.length > 0 ? (
                        <div className="space-y-3">
                            {account.transactions.map((tx: any) => (
                                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-[#E5E1D8] flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {tx.amount > 0 ? <Coins className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#2D3A2D]">{tx.description}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-xs text-slate-400 font-medium">Belum ada riwayat transaksi atau pilih pelanggan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
