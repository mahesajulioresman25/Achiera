import OrderTrackingResultClient from './OrderTrackingClient';

export default async function OrderTrackingResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <OrderTrackingResultClient id={id} />;
}
