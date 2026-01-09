import { prisma } from "../src/lib/prisma";
import { requireAccess, AccessControlError } from "../src/lib/auth/rbac";
import bcrypt from "bcrypt";

async function main() {
    console.log("🔒 Starting Owner Access Verification...");

    // 1. Create Non-Owner
    const nonOwner = await prisma.user.create({
        data: {
            name: 'Normie',
            email: 'normie@test.com',
            passwordHash: 'hash',
            globalRole: 'USER'
        }
    });

    // 2. Create Owner
    const owner = await prisma.user.create({
        data: {
            name: 'Owner',
            email: 'owner@test.com',
            passwordHash: 'hash',
            globalRole: 'OWNER'
        }
    });

    console.log("✅ Test Users Created");

    // 3. Test Non-Owner Access (Should Fail)
    let nonOwnerBlocked = false;
    try {
        await requireAccess(nonOwner.id, { global: ['OWNER'] });
    } catch (e) {
        if (e instanceof AccessControlError) {
            nonOwnerBlocked = true;
            console.log("✅ Non-Owner Verified: Access Denied (Expected)");
        } else {
            console.error("❌ Unexpected Error:", e);
        }
    }

    if (!nonOwnerBlocked) {
        console.error("❌ SECURITY FAIL: Non-Owner was allowed access!");
    }

    // 4. Test Owner Access (Should Pass)
    try {
        await requireAccess(owner.id, { global: ['OWNER'] });
        console.log("✅ Owner Verified: Access Granted");
    } catch (e) {
        console.error("❌ Owner Access Failed:", e);
    }

    // Cleanup
    await prisma.user.deleteMany({ where: { email: { in: ['normie@test.com', 'owner@test.com'] } } });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
