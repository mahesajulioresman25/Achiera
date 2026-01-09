'use client';

import React, { useState } from 'react';
import { generateReportAction } from '@/lib/actions/report';
import { FileText, Download, Loader, Calendar, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { ReportType } from '@/lib/services/ReportService';

export function ReportGeneratorDashboard() {
    const [selectedType, setSelectedType] = useState<ReportType>('BOARD');
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateReportAction(selectedType);
            if (result.success) {
                setReport(result.data);
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = () => {
        window.print();
    };

    const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms]">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 text-white print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-indigo-500/30 text-indigo-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl tracking-tight">Executive Intelligence Center</h3>
                            <p className="text-slate-400 font-medium">Generate high-fidelity reports for board and investors</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Controls - Hidden when printing */}
                <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 print:hidden">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as ReportType)}
                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-400 focus:outline-none"
                        >
                            <option value="BOARD">Board Report (Quarterly)</option>
                            <option value="INVESTOR">Investor Update</option>
                            <option value="EXECUTIVE_SUMMARY">Monthly Executive Summary</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2 h-full">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 h-[42px]"
                        >
                            {isGenerating ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                            {isGenerating ? 'Generating...' : 'Generate New Report'}
                        </button>
                    </div>
                </div>

                {/* Report Preview / Content */}
                {report ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Report Header */}
                        <div className="flex justify-between items-end mb-8 border-b-2 border-slate-900 pb-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                    {selectedType.replace('_', ' ')}
                                </h1>
                                <div className="flex items-center gap-2 text-slate-600 mt-2">
                                    <Calendar size={18} />
                                    <span className="font-medium text-lg">{report.period.label}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-500">Generated on</div>
                                <div className="font-bold text-slate-900">{new Date(report.generatedAt).toLocaleDateString()}</div>
                                <button
                                    onClick={handleExport}
                                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-slate-200 flex items-center gap-2 ml-auto print:hidden"
                                >
                                    <Download size={14} /> Export PDF
                                </button>
                            </div>
                        </div>

                        {/* Executive Summary Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShieldCheck size={24} className="text-slate-400" />
                                Executive Summary
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="mb-4">
                                    <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Highlights</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {report.summary.highlights.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-slate-700">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mb-4">
                                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Concerns</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {report.summary.concerns.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-slate-700">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Recommendations</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {report.summary.recommendations.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-slate-700 font-medium">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Financial Highlights Grid */}
                        <div className="mb-8 p-6 bg-slate-900 text-white rounded-xl">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp size={24} className="text-emerald-400" />
                                <h2 className="text-xl font-bold">Financial Performance</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-8">
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Revenue</div>
                                    <div className="text-2xl font-black">{currency.format(report.financials.totalRevenue)}</div>
                                    <div className={`text-xs mt-1 ${report.financials.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {report.financials.revenueGrowth > 0 ? '+' : ''}{report.financials.revenueGrowth.toFixed(1)}% YoY
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Net Profit</div>
                                    <div className="text-2xl font-black">{currency.format(report.financials.totalProfit)}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {report.financials.netMargin.toFixed(1)}% Margin
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Cash Position</div>
                                    <div className="text-2xl font-black">{currency.format(report.financials.cashPosition)}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Gross Margin</div>
                                    <div className="text-2xl font-black">{report.financials.grossMargin.toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Strategic Insights (if applicable) */}
                        {report.insights && (
                            <div className="mb-8 grid grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200 p-6 rounded-xl">
                                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} /> Strategic Opportunities
                                    </div>
                                    <ul className="space-y-2">
                                        {report.insights.opportunities.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="text-blue-500 mt-1">•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white border border-slate-200 p-6 rounded-xl">
                                    <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Key Risks
                                    </div>
                                    <ul className="space-y-2">
                                        {report.insights.risks.map((item: string, idx: number) => (
                                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="text-rose-500 mt-1">•</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Brand Performance Table */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Brand Performance</h2>
                            <div className="overflow-hidden border border-slate-200 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Brand Name</th>
                                            <th className="p-4 text-right">Revenue</th>
                                            <th className="p-4 text-right">Growth</th>
                                            <th className="p-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {report.brands.map((brand: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-4 font-medium text-slate-900">{brand.name}</td>
                                                <td className="p-4 text-right">{currency.format(brand.revenue)}</td>
                                                <td className="p-4 text-right">
                                                    <span className={brand.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {brand.growth > 0 ? '+' : ''}{brand.growth.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${brand.status === 'excellent' ? 'bg-green-100 text-green-700' :
                                                        brand.status === 'good' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {brand.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 mt-12 print:mt-auto">
                            <p>Confidential - For Internal Use Only</p>
                            <p>Achiera Holding &copy; 2026 rasa-ibu</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="font-bold text-slate-600">No Report Generated</h3>
                        <p className="text-sm text-slate-400 mt-1">Select a report type and generate to view insights</p>
                    </div>
                )}
            </div>
        </div>
    );
}
