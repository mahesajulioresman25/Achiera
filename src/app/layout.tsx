import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import CartDrawer from '@/components/cart/CartDrawer';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { Toaster } from 'sonner';
import SeasonalDecorations from '@/components/ui/SeasonalDecorations';
import GlobalBirthdayBanner from '@/components/commerce/GlobalBirthdayBanner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ACHIERA | Transforming Problems Into Possibilities",
  description: "ACHIERA is your business and technology partner, helping companies turn challenges into opportunities through premium merchandise and integrated IT solutions.",
};

// Force dynamic rendering for all routes to prevent build-time errors
// Force dynamic rendering removed to allow static optimization
// export const dynamic = 'force-dynamic';
// export const dynamicParams = true;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground`}
        suppressHydrationWarning
      >
        <SessionProvider session={session}>
          <GlobalBirthdayBanner />
          <SeasonalDecorations />
          <Providers>
            {children}
            <CartDrawer />
          </Providers>
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
