import { prisma } from "@/lib/prisma";
import { AuthorizationError } from "@/lib/auth/rbac";

type ServiceContext = {
    brandId: string;
    userId?: string;
};

export class FrozenService {

    // --------------------------------------------------------
    // PRODUCT MANAGEMENT
    // --------------------------------------------------------

    /**
     * Get products with brand isolation
     */
    async getProducts(ctx: ServiceContext, categorySlug?: string) {
        return prisma.frozenProduct.findMany({
            where: {
                category: {
                    brandId: ctx.brandId,
                    ...(categorySlug ? { slug: categorySlug } : {})
                }
            },
            include: {
                variants: true,
                category: true
            }
        });
    }

    // --------------------------------------------------------
    // WAREHOUSE FIFO LOGIC
    // --------------------------------------------------------

    /**
     * Deducts stock using FIFO strategy (Oldest Expiry First)
     */
    async deductStock(ctx: ServiceContext, variantId: string, quantityToDeduct: number) {
        // 1. Verify Variant belongs to Brand
        const variant = await prisma.frozenVariant.findFirst({
            where: { id: variantId, product: { category: { brandId: ctx.brandId } } }
        });
        if (!variant) throw new Error("Variant not found or access denied");

        return prisma.$transaction(async (tx: any) => {
            // 2. Fetch batches sorted by Expiry (Oldest First)
            const batches = await tx.inventoryBatch.findMany({
                where: {
                    variantId,
                    quantity: { gt: 0 },
                    isExpired: false,
                    warehouse: { brandId: ctx.brandId }
                },
                orderBy: { expiryDate: 'asc' }
            });

            let remaining = quantityToDeduct;

            for (const batch of batches) {
                if (remaining <= 0) break;

                const deduction = Math.min(batch.quantity, remaining);

                // Update Batch
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { quantity: { decrement: deduction } }
                });

                remaining -= deduction;
            }

            if (remaining > 0) {
                throw new Error(`Insufficient stock for variant ${variant.name}. Missing: ${remaining}`);
            }

            // 3. Update Aggregate Stock
            await tx.frozenVariant.update({
                where: { id: variantId },
                data: { stockOnHand: { decrement: quantityToDeduct } }
            });

            return true; // Success
        });
    }

    // --------------------------------------------------------
    // SUBSCRIPTION LOGIC
    // --------------------------------------------------------

    /**
     * Creates an Order from a Subscription (Renewal)
     */
    async processSubscriptionRenewal(ctx: ServiceContext, subscriptionId: string) {
        const sub = await prisma.subscription.findUnique({
            where: { id: subscriptionId, brandId: ctx.brandId },
            include: { items: { include: { variant: true } }, user: true }
        });

        if (!sub || sub.status !== 'ACTIVE') throw new Error("Invalid Subscription");

        // Calculate Totals
        let subtotal = 0;
        const orderItemsData = sub.items.map((item: any) => {
            const lineTotal = Number(item.variant.price) * item.quantity;
            subtotal += lineTotal;
            return {
                variantId: item.variantId,
                productId: item.variant.productId, // This field might need check if OrderItem has productId
                quantity: item.quantity,
                price: item.variant.price,
                total: lineTotal
            };
        });

        // Create Order
        const order = await prisma.order.create({
            data: {
                invoiceNo: `SUB-${Date.now()}`,
                quantity: sub.items.reduce((acc: any, i: any) => acc + i.quantity, 0),
                subtotal: subtotal,
                total: subtotal, // Add tax logic if needed
                customerName: sub.user.name,
                customerEmail: sub.user.email,
                customerPhone: "N/A", // Should fetch from profile
                status: 'WAITING_PAYMENT',
                // Link items (Note: OrderItem schema needs to support FrozenVariant connection)
                // For this demo, assuming standard OrderItem structure or adapting it
            }
        });

        // Setup Queue for FIFO deduction upon Payment...

        return order;
    }
}
