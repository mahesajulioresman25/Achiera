
import ProductDetailPage from '@/app/dashboard/[brandSlug]/products/[id]/page';

export default async function MerchProductDetailWrapper({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    // Inject 'merch' as brandSlug
    // We recreate the promise structure expected by the original page
    const augmentedParams = Promise.resolve({
        brandSlug: 'merch',
        id
    });

    return <ProductDetailPage params={augmentedParams} />;
}
