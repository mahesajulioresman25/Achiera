import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        const slide = await prisma.heroSlide.update({
            where: { id: id },
            data: {
                title: body.title,
                subtitle: body.subtitle,
                ctaLabel: body.ctaLabel,
                ctaLink: body.ctaLink,
                mediaType: body.mediaType,
                imageUrl: body.imageUrl,
                videoUrl: body.videoUrl,
                sortOrder: body.sortOrder,
                isActive: body.isActive,
            },
        });

        return NextResponse.json(slide);
    } catch (error) {
        console.error('Error updating hero slide:', error);
        return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        await prisma.heroSlide.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 });
    }
}
