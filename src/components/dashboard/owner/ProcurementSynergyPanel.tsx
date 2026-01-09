
'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { ProcurementSynergyService, SynergyOpportunity } from '@/lib/services/ProcurementSynergyService';
// Note: We need a server action or API route to call service from client. 
// For simplicity in this demo, we assume data is passed as prop or fetched via server action.
// But to make it self-contained, I will mock the fetch effect or use a server component pattern if applicable.
// Since this is a client component ('use client'), I should fetch via an action.

interface Props {
    opportunities: SynergyOpportunity[];
}

export const ProcurementSynergyPanel = ({ opportunities }: Props) => {
    // If no opportunities, show empty state
    if (!opportunities || opportunities.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingBag size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Procurement Synergy</h3>
                        <p className="text-xs text-slate-500">Cross-brand inventory optimization</p>
                    </div>
                </div>
                <div className="text-center py-8 text-slate-400 text-sm">
                    No synergy opportunities detected yet.
                </div>
            </div>
        );
    }

    const totalPotentialSavings = opportunities.reduce((acc, curr) => acc + curr.potentialSavings, 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                            <ShoppingBag size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Procurement Synergy Engine</h3>
                            <p className="text-xs text-blue-700 font-medium mt-0.5">Bulk Purchase Opportunities</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Potential Savings</div>
                        <div className="text-xl font-black text-emerald-600">
                            Rp {totalPotentialSavings.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">Shared Item</th>
                            <th className="px-6 py-3">Combined Volume</th>
                            <th className="px-6 py-3">Brands</th>
                            <th className="px-6 py-3 text-right">Est. Savings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {opportunities.slice(0, 5).map((opp, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {opp.itemName}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {opp.totalVolume.toLocaleString('id-ID')} <span className="text-xs text-slate-400">{opp.unit}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex -space-x-2">
                                        {opp.brandsInvolved.map((brand, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700" title={brand}>
                                                {brand.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                    Rp {opp.potentialSavings.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1 hover:gap-2 transition-all">
                    View Execution Plan <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
