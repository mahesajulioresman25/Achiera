import { NextAuthOptions, getServerSession as originalGetServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { GlobalRole } from "@prisma/client";

// Extend session types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            phone?: string | null;
            address?: string | null;
            profileImage?: string | null;
            globalRole: GlobalRole;
            brands: Array<{
                brandId: string;
                brandSlug: string;
                brandName: string;
                role: string;
            }>;
        }
    }

    interface User {
        id: string;
        phone?: string | null;
        address?: string | null;
        profileImage?: string | null;
        globalRole: GlobalRole;
        brands: Array<{
            brandId: string;
            brandSlug: string;
            brandName: string;
            role: string;
        }>;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        phone?: string | null;
        address?: string | null;
        profileImage?: string | null;
        globalRole: GlobalRole;
        brands: Array<{
            brandId: string;
            brandSlug: string;
            brandName: string;
            role: string;
        }>;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otpToken: { label: "OTP Token", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    return null;
                }

                const { email, password, otpToken } = credentials;

                console.log(`[AUTH] Authorizing user: ${credentials.email}`);

                // Use raw query to bypass brand isolation extension
                const users = await prisma.$queryRaw<any[]>`
                    SELECT id, email, name, phone, address, "profileImage", "passwordHash", "globalRole"
                    FROM users
                    WHERE email = ${credentials.email}
                    LIMIT 1
                `;

                const user = users[0];

                if (!user) {
                    console.log(`[AUTH] User not found: ${credentials.email}`);
                    return null;
                }

                // Fetch brand roles separately
                const brandRoles = await prisma.$queryRaw<any[]>`
                    SELECT br."brandId", br.role, b.name as "brandName", b.slug as "brandSlug"
                    FROM user_brand_roles br
                    INNER JOIN brands b ON br."brandId" = b.id
                    WHERE br."userId" = ${user.id}
                `;

                // Attach brandRoles to user object
                user.brandRoles = brandRoles.map((br: any) => ({
                    brandId: br.brandId,
                    role: br.role,
                    brand: {
                        name: br.brandName,
                        slug: br.brandSlug
                    }
                }));

                if (otpToken) {
                    // Login via OTP Token
                    const { OTPService } = await import("@/lib/services/OTPService");
                    // Try OTP_LOGIN first, then OTP_REGISTER if needed
                    let verification = await OTPService.verifyToken(otpToken, 'OTP_LOGIN');
                    if (!verification.success) {
                        verification = await OTPService.verifyToken(otpToken, 'OTP_REGISTER');
                    }

                    if (!verification.success || verification.email !== email) {
                        console.log(`[AUTH] Invalid OTP token for: ${email}`);
                        return null;
                    }
                } else if (password) {
                    // Login via Password
                    const isValid = await bcrypt.compare(password, user.passwordHash);

                    if (!isValid) {
                        console.log(`[AUTH] Invalid password for: ${email}`);
                        return null;
                    }
                } else {
                    return null;
                }

                let mappedBrands: Array<{
                    brandId: string;
                    brandSlug: string;
                    brandName: string;
                    role: string;
                }>;

                // OWNER gets access to ALL brands
                if (user.globalRole === 'OWNER') {
                    // Instead of loading all brands into session (causes HTTP 431),
                    // we use an empty array and let /dashboard page fetch brands
                    // This prevents routing conflicts with brand slugs
                    mappedBrands = [];

                    console.log(`[AUTH] OWNER detected! Will fetch brands on-demand.`);
                } else {
                    // Regular users only get their assigned brands
                    mappedBrands = user.brandRoles.map(br => ({
                        brandId: br.brandId,
                        brandSlug: br.brand.slug,
                        brandName: br.brand.name,
                        role: br.role
                    }));
                }

                console.log(`[AUTH] Success! User: ${user.email}, GlobalRole: ${user.globalRole}, Brands context count: ${mappedBrands.length}`);

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    profileImage: user.profileImage,
                    globalRole: user.globalRole,
                    brands: mappedBrands
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.phone = (user as any).phone;
                token.address = (user as any).address;
                token.profileImage = (user as any).profileImage;
                token.globalRole = user.globalRole;
                token.brands = (user as any).brands;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.phone = token.phone;
                session.user.address = token.address;
                session.user.profileImage = token.profileImage;
                session.user.globalRole = token.globalRole;
                session.user.brands = token.brands;
            }
            return session;
        }
    },
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        },
        callbackUrl: {
            name: `__Secure-next-auth.callback-url`,
            options: {
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        },
        csrfToken: {
            name: `__Host-next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    },
    pages: {
        signIn: '/auth/signin', // Optional custom page
    }
};

/**
 * Helper wrapper for getServerSession to use in Server Components/Actions
 */
export async function auth() {
    return await originalGetServerSession(authOptions);
}
