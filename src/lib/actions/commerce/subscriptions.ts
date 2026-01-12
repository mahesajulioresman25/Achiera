'use server';

import { prisma, unisolatedPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// MOCK: In production, get userId from session
const MOCK_USER_ID = 'user-demo-id';

export async function getUserSubscriptionsAction() {
    try {
        const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
        if (!brand) return [];

        const subscriptions = await prisma.subscription.findMany({
            where: {
                brandId: brand.id,
                // userId: userId // Enable this when User model has data
            },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                brand: true,
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return subscriptions;
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return [];
    }
}

export async function cancelSubscriptionAction(subscriptionId: string) {
    try {
        await unisolatedPrisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: 'CANCELLED' }
        });
        return { success: true };
    } catch (error) {
        console.error("Cancel subscription error:", error);
        return { success: false, error: "Failed to cancel" };
    }
}

// Stub for Email Notification (replacing WA)
export async function sendEmailNotification(to: string, subject: string, message: string) {
    // In production: Use nodemailer
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} | Body: ${message}`);
    // await transporter.sendMail(...)
    return true;
}

export async function createSubscriptionAction(data: {
    userId?: string,
    email?: string,
    name?: string,
    phone?: string,
    interval: 'WEEKLY' | 'MONTHLY',
    address: string,
    deliveryDays?: { day: string, timeSlot: string }[],
    planId?: string,
    selectedProducts?: { variantId: string, quantity: number, note?: string }[],
    paymentMethod?: 'QRIS' | 'BANK_TRANSFER',
    customerNote?: string
}) {
    let finalUserId = data.userId;
    let isNewUser = false;
    let generatedPassword = "";

    // If no userId, try to find by email
    if (!finalUserId && data.email) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (user) {
            finalUserId = user.id;
        } else {
            // CREATE NEW USER (Auto-Register)
            isNewUser = true;
            generatedPassword = crypto.randomBytes(4).toString('hex') + "A1!";
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            const newUser = await prisma.user.create({
                data: {
                    email: data.email,
                    name: data.name || "Customer",
                    phone: data.phone,
                    address: data.address,
                    passwordHash: hashedPassword,
                    globalRole: 'USER'
                }
            });
            finalUserId = newUser.id;
        }
    } else if (finalUserId) {
        // Update existing user if phone/address are missing
        const user = await prisma.user.findUnique({ where: { id: finalUserId } });
        if (user && (!user.phone || !user.address)) {
            await prisma.user.update({
                where: { id: finalUserId },
                data: {
                    phone: user.phone || data.phone,
                    address: user.address || data.address
                }
            });
        }
    }

    if (!finalUserId) {
        return { success: false, error: "Gagal memproses user." };
    }

    // Verify user exists in database
    const userExists = await prisma.user.findUnique({ where: { id: finalUserId } });
    if (!userExists) {
        console.error('[createSubscriptionAction] User not found:', finalUserId);
        return { success: false, error: "User tidak ditemukan di sistem. Silakan login ulang." };
    }

    try {
        // Resolve Brand ID
        const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
        if (!brand) return { success: false, error: "Brand Rasa Ibu tidak ditemukan." };

        let plan = null;
        if (data.planId) {
            plan = await (prisma as any).subscriptionPlan.findUnique({
                where: {
                    id: data.planId,
                    brandId: brand.id
                },
                include: {
                    planProducts: {
                        include: {
                            variant: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                }
            });
        }

        // Determine items to add
        let itemsToCreate: { variantId: string, quantity: number, note?: string }[] = [];

        if (plan) {
            if ((plan as any).type === 'FIXED') {
                // Use default products from plan
                itemsToCreate = (plan as any).planProducts.map((pp: any) => {
                    const userSelection = data.selectedProducts?.find(sp => sp.variantId === pp.variantId);
                    return {
                        variantId: pp.variantId,
                        quantity: pp.quantity,
                        note: userSelection?.note || null
                    };
                });
            } else if ((plan as any).type === 'CUSTOMIZABLE') {
                // Use selected products
                if (!data.selectedProducts || data.selectedProducts.length === 0) {
                    return { success: false, error: "Produk belum dipilih untuk paket customizable." };
                }

                // Check limit
                const totalQty = data.selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
                if ((plan as any).limitItems && totalQty > (plan as any).limitItems) {
                    return { success: false, error: `Jumlah produk melebihi batas (maks: ${(plan as any).limitItems}).` };
                }

                itemsToCreate = data.selectedProducts.map(sp => ({
                    variantId: sp.variantId,
                    quantity: sp.quantity,
                    note: sp.note || undefined
                }));
            }
        }

        // Calculate Next Payment Date and End Date
        const startDate = new Date();
        let nextPaymentDate = new Date(startDate);
        let endDate = new Date(startDate);

        if (data.interval === 'WEEKLY') {
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
            endDate.setDate(endDate.getDate() + 7);
        } else {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Create Subscription
        const sub = await (prisma as any).subscription.create({
            data: {
                userId: finalUserId,
                brandId: brand.id,
                planId: data.planId || null,
                customerName: data.name || "Customer",
                customerEmail: data.email,
                customerPhone: data.phone || "-",
                customerAddress: data.address,
                customerNote: data.customerNote || null,
                interval: data.interval,
                paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
                nextPaymentDate: nextPaymentDate,
                endDate: endDate,
                deliveryDays: data.deliveryDays || null,
                status: 'WAITING_PAYMENT',
                items: {
                    create: itemsToCreate
                }
            },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                plan: true
            }
        });

        // Send subscription invoice email
        if (data.email) {
            const { EmailService } = await import('@/lib/services/EmailService');
            await EmailService.sendSubscriptionInvoice(sub);
        }

        // Email Notification for new users
        if (isNewUser && data.email) {
            await sendEmailNotification(
                data.email,
                "Selamat Datang di Rasa Ibu!",
                `Terima kasih telah berlangganan.\n\nAkun Anda telah dibuat otomatis.\nEmail: ${data.email}\nPassword: ${generatedPassword}\n\nSilakan login untuk mengelola langganan Anda.`
            );
        }

        return { success: true, subscriptionId: sub.id, isNewUser, generatedPassword };

    } catch (error) {
        console.error("Create Sub Error:", error);
        return { success: false, error: "Gagal membuat langganan: " + (error as any).message };
    }
}

export async function uploadSubscriptionProofAction(subscriptionId: string, proofBase64: string) {
    try {
        // In a real app, you'd upload to S3/Cloudinary. For now, we store the base64 or a mock path.
        // We'll update the subscription status to 'PENDING_VERIFICATION' or keep as 'WAITING_PAYMENT' but with proof.
        await unisolatedPrisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                paymentProof: proofBase64,
                status: 'PENDING_VERIFICATION'
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Upload Proof Error:", error);
        return { success: false, error: "Gagal mengunggah bukti pembayaran." };
    }
}
