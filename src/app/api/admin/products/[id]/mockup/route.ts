import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/admin/products/[id]/mockup - Get mockup template for product
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;
        const { searchParams } = new URL(req.url);
        const variantId = searchParams.get('variantId');

        // Get mockup template for product (and optionally specific variant)
        const mockupTemplate = await prisma.mockupTemplate.findFirst({
            where: {
                productId,
                ...(variantId ? { variantId } : { variantId: null }),
                isActive: true
            },
            include: {
                product: true,
                variant: true
            }
        });

        if (!mockupTemplate) {
            return NextResponse.json({ error: 'Mockup template not found' }, { status: 404 });
        }

        return NextResponse.json(mockupTemplate);
    } catch (error) {
        console.error('Error fetching mockup template:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/products/[id]/mockup - Create or update mockup template
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: productId } = await params;
        const body = await req.json();

        // Whitelist fields
        const templateData = {
            variantId: body.variantId || null,
            canvasWidth: body.canvasWidth,
            canvasHeight: body.canvasHeight,
            aspectRatio: body.aspectRatio,
            printAreaX: body.printAreaX,
            printAreaY: body.printAreaY,
            printAreaWidth: body.printAreaWidth,
            printAreaHeight: body.printAreaHeight,
            // Default Safe Area to Print Area if not provided
            safeAreaX: body.safeAreaX ?? body.printAreaX,
            safeAreaY: body.safeAreaY ?? body.printAreaY,
            safeAreaWidth: body.safeAreaWidth ?? body.printAreaWidth,
            safeAreaHeight: body.safeAreaHeight ?? body.printAreaHeight,
            hasBackView: body.hasBackView || false,
            backPrintAreaX: body.backPrintAreaX,
            backPrintAreaY: body.backPrintAreaY,
            backPrintAreaWidth: body.backPrintAreaWidth,
            backPrintAreaHeight: body.backPrintAreaHeight,
            backSafeAreaX: body.backSafeAreaX,
            backSafeAreaY: body.backSafeAreaY,
            backSafeAreaWidth: body.backSafeAreaWidth,
            backSafeAreaHeight: body.backSafeAreaHeight,
            frontMockupImage: body.frontMockupImage,
            backMockupImage: body.backMockupImage,
            tintMaskUrl: body.tintMaskUrl,
            maxColors: body.maxColors,
            allowedFormats: body.allowedFormats,
            minResolution: body.minResolution,
            maxFileSize: body.maxFileSize,
            layersConfig: body.layersConfig,
            isActive: body.isActive ?? true
        };

        // Check if mockup template exists
        const existing = await prisma.mockupTemplate.findFirst({
            where: {
                productId,
                variantId: body.variantId || null
            }
        });

        let mockupTemplate;

        if (existing) {
            // Update existing
            mockupTemplate = await prisma.mockupTemplate.update({
                where: { id: existing.id },
                data: {
                    ...templateData,
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new
            mockupTemplate = await prisma.mockupTemplate.create({
                data: {
                    productId,
                    ...templateData
                }
            });
        }

        return NextResponse.json(mockupTemplate);
    } catch (error: any) {
        console.error('Error saving mockup template:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error',
            details: error
        }, { status: 500 });
    }
}
