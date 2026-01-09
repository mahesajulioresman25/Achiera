'use client';

import React, { useEffect, useState } from 'react';
import {
    Cpu,
    Link,
    Unlink,
    History,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Power,
    RefreshCw,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getProductMappings,
    deleteProductMapping,
    toggleMappingAutomation,
    getUnmappedMarketplaceItems
} from '@/lib/actions/rasa-ibu/automation';
import { createProductMapping } from '@/lib/intelligence/automationEngine';

interface AutomationHubProps {
    brandId: string;
    onClose?: () => void;
}

export default function AutomationHub({ brandId, onClose }: AutomationHubProps) {
    const [activeTab, setActiveTab] = useState<'mappings' | 'assistant' | 'logs'>('mappings');
    const [mappings, setMappings] = useState<any[]>([]);
    const [unmapped, setUnmapped] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [mRes, uRes] = await Promise.all([
            getProductMappings(brandId),
            getUnmappedMarketplaceItems(brandId)
        ]);

        if (mRes.success) setMappings(mRes.data || []);
        if (uRes.success) setUnmapped(uRes.data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const handleDelete = async (id: string) => {
        const res = await deleteProductMapping(id);
        if (res.success) {
            toast.success("Mapping dihapus");
            loadData();
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        const res = await toggleMappingAutomation(id, !current);
        if (res.success) {
            toast.success(`Automasi ${!current ? 'Aktif' : 'Nonaktif'}`);
            loadData();
        }
    };

    const filteredMappings = mappings.filter(m =>
        m.externalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.variant.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Cpu className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Achiera Autonomous Engine (AAE)</h2>
                        <p className="text-sm text-gray-500">Pusat kontrol automasi Pesanan & Stok jalur ninja.</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-full">
                        <Link className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{mappings.length}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Produk Ter-Link</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-full">
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{unmapped.length}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Butuh Mapping</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">100%</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Engine Health</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('mappings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'mappings' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Management Mapping
                </button>
                <button
                    onClick={() => setActiveTab('assistant')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'assistant' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Mapping Assistant
                    {unmapped.length > 0 && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </button>
            </div>

            {/* Tab: Management Mapping */}
            {activeTab === 'mappings' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama produk marketplace atau internal..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nama Produk Marketplace</th>
                                    <th className="px-6 py-4">Internal Variant</th>
                                    <th className="px-6 py-4 text-center">Platform</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMappings.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{m.externalName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-700">{m.variant.product.name}</div>
                                            <div className="text-xs text-gray-400">{m.variant.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase">
                                                {m.platform}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(m.id, m.automationActive)}
                                                className={`p-1 rounded-full transition-colors ${m.automationActive ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-50'
                                                    }`}
                                            >
                                                <Power className="w-5 h-5" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMappings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Belum ada mapping produk. Gunaan Mapping Assistant untuk memulainya.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Mapping Assistant */}
            {activeTab === 'assistant' && (
                <div className="space-y-4">
                    {unmapped.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center space-y-3">
                            <div className="p-4 bg-green-50 rounded-full w-fit mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Semua Ter-Link Sempurna!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Tidak ada produk marketplace yang bingung. Achiera Autonomous Engine bekerja dengan tenang.
                            </p>
                        </div>
                    ) : (
                        unmapped.map((item, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 rounded-lg">
                                        <Unlink className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{item.externalName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <span className="uppercase font-bold text-amber-600">{item.platform}</span>
                                            <span>•</span>
                                            <span>Ditemukan {new Date(item.timestamp).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 transition-all flex items-center gap-2"
                                        onClick={() => toast.info("Buka Catalog Manager untuk pilih variant & jodohkan!")}
                                    >
                                        <Link className="w-4 h-4" />
                                        Jodohkan Sekarang
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
