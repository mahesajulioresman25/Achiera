import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Package, Edit } from 'lucide-react';

export default async function CollectionsListPage() {
    const collections = await prisma.merchCollection.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Collections</h1>
                    <p className="text-stone-600">Manage merchandise collection content</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Collection
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                        {collections.map((collection) => (
                            <tr key={collection.id} className="hover:bg-stone-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-stone-900">{collection.name}</div>
                                            <div className="text-sm text-stone-500">{collection.heroTitle}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-stone-600">
                                    <code className="px-2 py-1 bg-stone-100 rounded">{collection.slug}</code>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/dashboard/collections/${collection.slug}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
