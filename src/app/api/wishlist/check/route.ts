import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { unisolatedPrisma as prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ isFavorite: false });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const brandId = searchParams.get('brandId');

        if (!productId || !brandId) {
            return NextResponse.json({ isFavorite: false });
        }

        const wishlistItem = await prisma.productWishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId
                }
            }
        });

        return NextResponse.json({ isFavorite: !!wishlistItem });
    } catch (error) {
        return NextResponse.json({ isFavorite: false });
    }
}
