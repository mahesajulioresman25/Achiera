'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPendingICTransactionsAction,
    getICBalancesAction,
    approveICTransactionAction,
    rejectICTransactionAction,
    getICTransactionHistoryAction
} from '@/lib/actions/interCompany';
import { Check, X, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export function InterCompanyHub() {
    const queryClient = useQueryClient();
    const [selectedTab, setSelectedTab] = useState<'pending' | 'balances' | 'history'>('pending');

    // Fetch pending transactions
    const { data: pendingData, isLoading: loadingPending } = useQuery({
        queryKey: ['ic-pending'],
        queryFn: () => getPendingICTransactionsAction()
    });

    // Fetch IC balances
    const { data: balancesData, isLoading: loadingBalances } = useQuery({
        queryKey: ['ic-balances'],
        queryFn: () => getICBalancesAction()
    });

    // Fetch transaction history
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['ic-history'],
        queryFn: () => getICTransactionHistoryAction()
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
            approveICTransactionAction(id, approvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ic-pending'] });
            queryClient.invalidateQueries({ queryKey: ['ic-balances'] });
            queryClient.invalidateQueries({ queryKey: ['ic-history'] });
        }
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: (id: string) => rejectICTransactionAction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ic-pending'] });
            queryClient.invalidateQueries({ queryKey: ['ic-history'] });
        }
    });

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    const pendingTransactions = (pendingData as any)?.data || [];
    const balances = (balancesData as any)?.data || [];
    const history = (historyData as any)?.data || [];

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-500/30 text-indigo-400">
                        <ArrowRight size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl tracking-tight">Inter-Company Transaction Center</h3>
                        <p className="text-slate-400 font-medium">Coordinate financial flows and balances across brands</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-50/50 p-2 border-b border-slate-200">
                <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200 w-fit mx-auto sm:mx-0">
                    <button
                        onClick={() => setSelectedTab('pending')}
                        className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all ${selectedTab === 'pending'
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        Pending Approvals ({pendingTransactions.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('balances')}
                        className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all ${selectedTab === 'balances'
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        IC Balances
                    </button>
                    <button
                        onClick={() => setSelectedTab('history')}
                        className={`px-6 py-2.5 font-bold text-sm rounded-xl transition-all ${selectedTab === 'history'
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Pending Approvals Tab */}
                {selectedTab === 'pending' && (
                    <div className="space-y-4">
                        {loadingPending ? (
                            <div className="text-center py-8 text-slate-400">Loading...</div>
                        ) : pendingTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-green-600" />
                                </div>
                                <h4 className="font-medium text-slate-900">All Clear</h4>
                                <p className="text-sm text-slate-500 mt-1">No pending IC transactions</p>
                            </div>
                        ) : (
                            pendingTransactions.map((tx: any) => (
                                <div key={tx.id} className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">{tx.fromBrand.name}</span>
                                                <ArrowRight size={16} className="text-slate-400" />
                                                <span className="font-bold text-slate-900">{tx.toBrand.name}</span>
                                            </div>
                                            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                                {tx.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-slate-900">{currency.format(Number(tx.amount))}</div>
                                            <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{tx.description}</p>
                                    {tx.referenceNo && (
                                        <p className="text-xs text-slate-400 mb-3">Ref: {tx.referenceNo}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveMutation.mutate({ id: tx.id, approvedBy: 'OWNER' })}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => rejectMutation.mutate(tx.id)}
                                            disabled={rejectMutation.isPending}
                                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <X size={16} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* IC Balances Tab */}
                {selectedTab === 'balances' && (
                    <div className="space-y-6">
                        {loadingBalances ? (
                            <div className="text-center py-8 text-slate-400">Loading...</div>
                        ) : balances.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">No IC balances found</div>
                        ) : (
                            balances.map((balance: any) => (
                                <div key={balance.brandId} className="border border-slate-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-900">{balance.brandName}</h4>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net Position</div>
                                            <div className={`text-xl font-black ${balance.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {balance.netPosition >= 0 ? (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp size={20} />
                                                        {currency.format(balance.netPosition)}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingDown size={20} />
                                                        {currency.format(Math.abs(balance.netPosition))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {balance.details.map((detail: any) => (
                                            <div key={detail.counterpartyBrandId} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                                                <span className="text-slate-700">{detail.counterpartyName}</span>
                                                <div className="flex gap-4 text-xs">
                                                    <span className="text-green-600">Receivable: {currency.format(detail.receivable)}</span>
                                                    <span className="text-red-600">Payable: {currency.format(detail.payable)}</span>
                                                    <span className={`font-bold ${detail.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        Net: {currency.format(Math.abs(detail.net))}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Transaction History Tab */}
                {selectedTab === 'history' && (
                    <div className="space-y-2">
                        {loadingHistory ? (
                            <div className="text-center py-8 text-slate-400">Loading...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">No transaction history</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">From</th>
                                        <th className="px-4 py-3 text-left">To</th>
                                        <th className="px-4 py-3 text-left">Type</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-medium">{tx.fromBrand.name}</td>
                                            <td className="px-4 py-3 font-medium">{tx.toBrand.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{tx.type.replace('_', ' ')}</td>
                                            <td className="px-4 py-3 text-right font-bold">{currency.format(Number(tx.amount))}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tx.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    tx.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
