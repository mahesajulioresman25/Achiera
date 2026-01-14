import { Suspense } from 'react';
import OrderTrackingResultClient from './OrderTrackingClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrderTrackingResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="w-10 h-10 animate-spin text-[#2D3A2D]" />
            </div>
        }>
            <OrderTrackingResultClient id={id} />
        </Suspense>
    );
}
