import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; caseStudyId: string }> }
) {
    const { caseStudyId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const caseStudy = await prisma.itCaseStudy.findUnique({
            where: { id: caseStudyId },
        });

        if (!caseStudy) {
            return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
        }

        return NextResponse.json(caseStudy);
    } catch (error) {
        console.error('Error fetching case study:', error);
        return NextResponse.json({ error: 'Failed to fetch case study' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; caseStudyId: string }> }
) {
    const { caseStudyId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const caseStudy = await prisma.itCaseStudy.update({
            where: { id: caseStudyId },
            data: {
                title: body.title,
                subtitle: body.subtitle,
                client: body.client,
                industry: body.industry,
                duration: body.duration,
                teamSize: body.teamSize,
                context: body.context,
                challenge: body.challenge,
                solution: body.solution,
                results: body.results,
                techStack: body.techStack,
                images: body.images,
                sortOrder: body.sortOrder,
                isPublished: body.isPublished,
            },
        });

        return NextResponse.json(caseStudy);
    } catch (error) {
        console.error('Error updating case study:', error);
        return NextResponse.json({ error: 'Failed to update case study' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ brandSlug: string; caseStudyId: string }> }
) {
    const { caseStudyId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.itCaseStudy.delete({
            where: { id: caseStudyId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting case study:', error);
        return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 });
    }
}
