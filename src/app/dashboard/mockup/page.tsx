import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Palette, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

export default async function MockupConfigPage() {
    const configs = await prisma.mockupConfig.findMany({
        orderBy: { displayName: 'asc' },
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Mockup Builder Config</h1>
                    <p className="text-stone-600">Manage mockup product configurations</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Colors
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                        {configs.map((config) => {
                            const baseImages = typeof config.baseImages === 'string'
                                ? JSON.parse(config.baseImages)
                                : config.baseImages;
                            const colors = Object.keys(baseImages);

                            return (
                                <tr key={config.id} className="hover:bg-stone-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Palette className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="font-medium text-stone-900">{config.displayName}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        <code className="px-2 py-1 bg-stone-100 rounded">{config.productType}</code>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {colors.length} colors
                                    </td>
                                    <td className="px-6 py-4">
                                        {config.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                                <ToggleRight className="w-3 h-3" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">
                                                <ToggleLeft className="w-3 h-3" />
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Full mockup config editor will be available in the multi-brand upgrade.
                    For now, you can view existing configurations here.
                </p>
            </div>
        </div>
    );
}
