'use client';

import React from 'react';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

interface PricingCalculatorProps {
    hpp: number;
    operationalCost: number;
    marketplaceFeeRate: number; // 0.15 = 15%
    targetMargin: number; // 0.30 = 30%
    onChange?: (sellingPrice: number) => void;
}

export default function PricingCalculator({
    hpp,
    operationalCost,
    marketplaceFeeRate,
    targetMargin,
    onChange
}: PricingCalculatorProps) {
    // Simulation State
    const [simulatedVolume, setSimulatedVolume] = React.useState<number>(100);
    const [isSimulating, setIsSimulating] = React.useState(false);

    // Reverse engineer Total Overhead from Unit OpCost (assuming standard volume of 100 if unknown)
    const estimatedTotalOverhead = operationalCost * 100;

    // Calculate Dynamic Op Cost based on Simulation
    const dynamicOpCost = isSimulating ? (estimatedTotalOverhead / simulatedVolume) : operationalCost;

    // Formula: Selling Price = (HPP + OpCost) / (1 - MarketplaceFee - Margin)
    const subtotal = hpp + dynamicOpCost;
    const divisor = 1 - marketplaceFeeRate - targetMargin;
    const sellingPrice = divisor > 0 ? subtotal / divisor : 0;

    const marketplaceFee = sellingPrice * marketplaceFeeRate;
    const targetProfit = sellingPrice * targetMargin;
    const netProfit = sellingPrice - hpp - dynamicOpCost - marketplaceFee;

    React.useEffect(() => {
        if (onChange) {
            onChange(Math.round(sellingPrice));
        }
    }, [sellingPrice, onChange]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                    <Calculator className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-900">Kalkulasi Harga Jual</h4>
                    <p className="text-[10px] text-emerald-600 font-medium">Otomatis berdasarkan HPP + Biaya Operasional</p>
                </div>
            </div>

            {/* Volume Simulator */}
            <div className="p-5 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8] space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2D3A2D]">
                            Simulasi Volume Penjualan
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isSimulating}
                            onChange={(e) => setIsSimulating(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                {isSimulating ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={simulatedVolume}
                            onChange={(e) => setSimulatedVolume(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span>50 Porsi</span>
                            <span className="text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">{simulatedVolume} Porsi / Bulan</span>
                            <span>1000 Porsi</span>
                        </div>
                        <p className="text-[10px] italic text-[#8B7E66]">
                            "Semakin tinggi volume penjualan, semakin kecil beban per porsi."
                        </p>
                    </div>
                ) : (
                    <p className="text-[10px] text-[#8B7E66] opacity-60">Aktifkan untuk melihat dampak target penjualan terhadap harga.</p>
                )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600">HPP (Harga Pokok Produksi)</span>
                    <span className="text-sm font-black text-slate-900">Rp {hpp.toLocaleString('id-ID')}</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-xl transition-colors ${isSimulating ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">
                            Alokasi Biaya Tetap (Fixed Cost)
                            {isSimulating && <span className="ml-2 text-[9px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">SIMULATED</span>}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Listrik, Gaji, Sewa (dibagi volume)</span>
                    </div>
                    <span className={`text-sm font-black ${isSimulating ? 'text-amber-700' : 'text-slate-900'}`}>
                        Rp {Math.round(dynamicOpCost).toLocaleString('id-ID')}
                    </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-xs font-bold text-blue-700">Total Modal Dasar (HPP + Overhead)</span>
                    <span className="text-sm font-black text-blue-900">Rp {Math.round(subtotal).toLocaleString('id-ID')}</span>
                </div>
            </div>

            {/* Formula Explanation */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 mb-2">Formula Pricing</p>
                <div className="space-y-2">
                    <p className="text-xs font-mono text-amber-800">
                        Harga Jual = Modal Dasar / (1 - Fee - Margin)
                    </p>
                    <p className="text-xs font-mono text-amber-800">
                        = Rp {Math.round(subtotal).toLocaleString('id-ID')} / (1 - {(marketplaceFeeRate * 100).toFixed(0)}% - {(targetMargin * 100).toFixed(0)}%)
                    </p>
                    <p className="text-xs font-mono text-amber-800">
                        Dimana Modal Dasar = HPP + Overhead (OpCost)
                    </p>
                </div>
            </div>

            {/* Result */}
            <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Harga Jual Rekomendasi</span>
                    </div>
                    <TrendingUp className="w-5 h-5 opacity-50" />
                </div>
                <p className="text-5xl font-black mb-2">Rp {Math.round(sellingPrice).toLocaleString('id-ID')}</p>
                <p className="text-xs opacity-80 font-medium">per porsi / unit</p>
            </div>

            {/* Profit Breakdown */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[9px] font-black uppercase tracking-wider text-red-600 mb-1">Marketplace Fee</p>
                    <p className="text-lg font-black text-red-700">Rp {Math.round(marketplaceFee).toLocaleString('id-ID')}</p>
                    <p className="text-[8px] text-red-500 font-medium">{(marketplaceFeeRate * 100).toFixed(0)}% dari harga jual</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[9px] font-black uppercase tracking-wider text-blue-600 mb-1">Target Margin</p>
                    <p className="text-lg font-black text-blue-700">Rp {Math.round(targetProfit).toLocaleString('id-ID')}</p>
                    <p className="text-[8px] text-blue-500 font-medium">{(targetMargin * 100).toFixed(0)}% dari harga jual</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">Net Profit</p>
                    <p className="text-lg font-black text-emerald-700">Rp {Math.round(netProfit).toLocaleString('id-ID')}</p>
                    <p className="text-[8px] text-emerald-500 font-medium">Keuntungan bersih</p>
                </div>
            </div>
        </div>
    );
}
