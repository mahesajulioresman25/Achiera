import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Mail, Calendar, User } from 'lucide-react';

export default async function RequestsListPage() {
    const requests = await prisma.catalogueRequest.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const statusColors = {
        NEW: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-amber-100 text-amber-700',
        DONE: 'bg-green-100 text-green-700',
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Catalogue Requests</h1>
                    <p className="text-stone-600">View and manage customer requests</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12 text-center">
                    <Mail className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No requests yet</h3>
                    <p className="text-stone-600">Catalogue requests will appear here</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                    Date
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
                            {requests.map((request) => (
                                <tr key={request.id} className="hover:bg-stone-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-stone-900">{request.companyName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-stone-900">{request.contactName}</div>
                                        <div className="text-sm text-stone-500">{request.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/requests/${request.id}`}
                                            className="text-sm font-medium text-amber-700 hover:text-amber-900"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
