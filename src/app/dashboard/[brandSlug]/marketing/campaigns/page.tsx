import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignsPage({ params }: { params: { brandSlug: string } }) {
    const campaigns = await prisma.campaign.findMany({
        where: { brandId: params.brandSlug },
        include: { bundles: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">
                        Kelola program kampanye bundling (contoh: "Pahlawan Gizi").
                    </p>
                </div>
                <Link href={`/dashboard/${params.brandSlug}/marketing/campaigns/new`}>
                    <Button>
                        + Buat Campaign Baru
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{campaign.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${campaign.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {campaign.isActive ? 'AKTIF' : 'DRAFT'}
                                </span>
                            </div>
                            <Link href={`/dashboard/${params.brandSlug}/marketing/campaigns/${campaign.id}`}>
                                <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                            {campaign.description || "Tidak ada deskripsi"}
                        </p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Paket Bundling</p>
                            <div className="space-y-2">
                                {campaign.bundles.map(bundle => (
                                    <div key={bundle.id} className="flex justify-between text-sm">
                                        <span>{bundle.name}</span>
                                        <span className="font-bold">Rp {Number(bundle.price).toLocaleString()}</span>
                                    </div>
                                ))}
                                {campaign.bundles.length === 0 && <p className="text-sm text-gray-400 italic">Belum ada paket.</p>}
                            </div>
                        </div>
                    </div>
                ))}

                {campaigns.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                        <p className="text-gray-500">Belum ada campaign yang dibuat.</p>
                        <Button className="mt-4" variant="outline">Mulai Buat Campaign</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
