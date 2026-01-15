import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardClientWrapper from '@/components/dashboard/rasa-ibu/DashboardClientWrapper';
import { getFulfillmentRhythm, getStockAnticipations } from '@/lib/intelligence/rhythmEngine';
import { getFinancialPulse } from '@/lib/intelligence/financeEngine';

/**
 * RASA IBU Operations Dashboard (Server Component)
 * Fetches real-time operational data for Admin Dapur and Owner personas.
 */
export default async function RasaIbuOpsDashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // 1. Fetch Brand Data (RASA IBU)
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        include: {
            orders: {
                orderBy: { createdAt: 'desc' },
                include: {
                    warehouse: true,
                    payments: {
                        select: {
                            proofPath: true
                        }
                    },
                    paymentReconciliations: {
                        select: {
                            paymentProof: true
                        }
                    },
                    orderItems: {
                        include: {
                            frozenVariant: {
                                include: {
                                    product: {
                                        include: {
                                            category: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                take: 10
            }
        }
    });

    if (!brand) {
        return (
            <div className="p-12 text-center text-slate-400">
                Brand "RASA IBU" belum terdaftar di sistem.
            </div>
        );
    }

    try {
        // 2. Fetch Intelligence Data (Phase 7.25 Soft Ops)
        const rhythm = await getFulfillmentRhythm(brand.id);
        const anticipations = await getStockAnticipations(brand.id);
        const finance = await getFinancialPulse(brand.id);

        // 3. Fetch Frozen Products for Stock
        const frozenProducts = await prisma.frozenProduct.findMany({
            where: { category: { brandId: brand.id } },
            include: {
                category: true,
                variants: true
            },
            orderBy: { name: 'asc' }
        });

        // Mock Activities (Until Real Log is implemented)
        const MOCK_ACTIVITIES = [
            { type: 'CHAT_STARTED', customerName: 'Ibu Linda', timeAgo: '2m ago' },
            { type: 'ACTIVE_REPLY', customerName: 'Bunda Sarah', assistantName: 'Mbak Siti', timeAgo: '15m ago' },
            { type: 'CHAT_STARTED', customerName: 'Mbak Dini', timeAgo: '45m ago' },
        ];

        // 4. Serialize Data (Handle Prisma Decimal)
        const serializeOrder = (order: any) => ({
            ...order,
            paymentProof: order.payments?.find((p: any) => p.proofPath)?.proofPath ||
                order.paymentReconciliations?.find((r: any) => r.paymentProof)?.paymentProof ||
                null,
            totalAmount: Number(order.totalAmount || 0),
            total: Number(order.total || 0),
            subtotal: Number(order.subtotal || 0),
            tax: Number(order.tax || 0),
            quantity: Number(order.quantity || 0),
            createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
            updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
            orderItems: order.orderItems?.map((item: any) => ({
                ...item,
                price: Number(item.price || 0),
                subtotal: Number(item.subtotal || 0),
                quantity: Number(item.quantity || 0),
                createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
                updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
                frozenVariant: item.frozenVariant ? {
                    ...item.frozenVariant,
                    price: Number(item.frozenVariant.price || 0),
                    costPrice: Number(item.frozenVariant.costPrice || 0),
                    weight: Number(item.frozenVariant.weight || 0),
                    operationalCostPerUnit: Number(item.frozenVariant.operationalCostPerUnit || 0),
                    marketplaceFeeRate: Number(item.frozenVariant.marketplaceFeeRate || 0),
                    targetMargin: Number(item.frozenVariant.targetMargin || 0),
                    sellingPrice: Number(item.frozenVariant.sellingPrice || 0)
                } : undefined
            }))
        });

        const serializeProduct = (product: any) => {
            const inventoryType = product.inventoryType || product.inventoryCategory?.type || 'FINISHED_GOOD';
            return {
                ...product,
                inventoryType,
                variants: product.variants?.map((v: any) => ({
                    ...v,
                    price: Number(v.price || 0),
                    costPrice: Number(v.costPrice || 0),
                    weight: Number(v.weight || 0),
                    unit: v.unit || 'pcs',
                    operationalCostPerUnit: Number(v.operationalCostPerUnit || 0),
                    marketplaceFeeRate: Number(v.marketplaceFeeRate || 0),
                    targetMargin: Number(v.targetMargin || 0),
                    sellingPrice: Number(v.sellingPrice || 0)
                }))
            };
        };

        const serializedOrders = (brand as any).orders.map(serializeOrder);
        const serializedProducts = frozenProducts.map(serializeProduct);

        // 5. Fetch Recipes for Management
        const recipes = await (prisma as any).recipePost.findMany({
            where: { brandId: brand.id },
            include: {
                comments: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Final Deep Serialization to prevent "Event handlers" or non-serializable prop errors
        const dashboardData = JSON.parse(JSON.stringify({
            brandId: brand.id,
            initialOrders: serializedOrders,
            initialProducts: serializedProducts,
            initialRecipes: recipes,
            activities: MOCK_ACTIVITIES,
            intelligence: { rhythm, anticipations, finance }
        }));

        return (
            <DashboardClientWrapper {...dashboardData} />
        );
    } catch (error) {
        console.error('Error loading Rasa Ibu dashboard:', error);
        return (
            <div className="p-12 text-center text-rose-500">
                Gagal memuat data dashboard. Silakan coba lagi nanti.
            </div>
        );
    }
}
