import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import CartDrawer from '@/components/cart/CartDrawer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Achiera - Transforming Problems into Profit',
  description: 'Enterprise business intelligence and automation platform',
};

// Force dynamic rendering for all routes to prevent build-time errors
// Force dynamic rendering removed to allow static optimization
// export const dynamic = 'force-dynamic';
// export const dynamicParams = true;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider session={session}>
          <GlobalBirthdayBanner />
          <SeasonalDecorations />
          {children}
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
