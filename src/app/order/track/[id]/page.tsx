import { Suspense } from 'react';
import OrderTrackingResultClient from './OrderTrackingClient';
import { Loader2 } from 'lucide-react';
import Footer from '@/components/Footer';
import RasaIbuFooter from '@/components/RasaIbuFooter';
import { unisolatedPrisma as prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrderTrackingResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch order to determine brand for footer
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            brand: {
                include: { brandConfig: true }
            }
        }
    });

    const isRasaIbu = order?.brand?.slug === 'rasa-ibu';

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex-1">
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                        <Loader2 className="w-10 h-10 animate-spin text-[#2D3A2D]" />
                    </div>
                }>
                    <OrderTrackingResultClient id={id} />
                </Suspense>
            </div>
            {isRasaIbu ? (
                <RasaIbuFooter
                    config={order?.brand?.brandConfig}
                    paymentSettings={order?.brand?.paymentSettings}
                />
            ) : (
                <Footer />
            )}
        </div>
    );
}
