import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from '@/auth';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ACHIERA | Transforming Problems Into Possibilities",
  description: "ACHIERA is your business and technology partner, helping companies turn challenges into opportunities through premium merchandise and integrated IT solutions.",
};

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
        <ClientProviders session={session}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
