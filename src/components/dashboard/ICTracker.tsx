'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getICTransactionHistoryAction } from '@/lib/actions/interCompany';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface ICTrackerProps {
    brandId: string;
    brandName: string;
}

export function ICTracker({ brandId, brandName }: ICTrackerProps) {
    const { data: historyData, isLoading } = useQuery({
        queryKey: ['ic-history', brandId],
        queryFn: () => getICTransactionHistoryAction(brandId)
    });

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const transactions = (historyData as any)?.data || [];

    // Calculate net position
    let totalReceivable = 0;
    let totalPayable = 0;

    transactions.forEach((tx: any) => {
        if (tx.status === 'APPROVED') {
            if (tx.fromBrandId === brandId) {
                totalReceivable += Number(tx.amount);
            } else if (tx.toBrandId === brandId) {
                totalPayable += Number(tx.amount);
            }
        }
    });

    const netPosition = totalReceivable - totalPayable;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="text-center text-slate-400">Loading IC data...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <h3 className="font-black text-lg text-purple-900">Inter-Company Position</h3>
                <p className="text-sm text-purple-700 mt-1">Transactions with other brands</p>
            </div>

            <div className="p-6">
                {/* Net Position Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Receivable</div>
                        <div className="text-xl font-black text-green-900">{currency.format(totalReceivable)}</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Payable</div>
                        <div className="text-xl font-black text-red-900">{currency.format(totalPayable)}</div>
                    </div>
                    <div className={`text-center p-4 rounded-xl border-2 ${netPosition >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-orange-50 border-orange-300'}`}>
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${netPosition >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                            Net Position
                        </div>
                        <div className={`text-xl font-black flex items-center justify-center gap-1 ${netPosition >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
                            {netPosition >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {currency.format(Math.abs(netPosition))}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-3 uppercase tracking-wider">Recent Transactions</h4>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No IC transactions yet</div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.slice(0, 5).map((tx: any) => {
                                const isReceivable = tx.fromBrandId === brandId;
                                const counterparty = isReceivable ? tx.toBrand.name : tx.fromBrand.name;

                                return (
                                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isReceivable ? (
                                                    <>
                                                        <span className="font-medium text-slate-900">{brandName}</span>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                        <span className="text-slate-600">{counterparty}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-slate-600">{counterparty}</span>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                        <span className="font-medium text-slate-900">{brandName}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{tx.type.replace('_', ' ')} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${isReceivable ? 'text-green-600' : 'text-red-600'}`}>
                                                {isReceivable ? '+' : '-'}{currency.format(Number(tx.amount))}
                                            </div>
                                            <div className={`text-[10px] font-medium ${tx.status === 'APPROVED' ? 'text-green-600' :
                                                    tx.status === 'PENDING' ? 'text-amber-600' :
                                                        'text-red-600'
                                                }`}>
                                                {tx.status}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
