import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthDebug } from "@/components/shared/AuthDebug";
import { BRAND } from "@/lib/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0F52BA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://wibawa-nusantara.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/branding/favicon.png",
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/branding/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.shortName,
  },
  keywords: ["komunitas", "wibawa", "marketplace", "nusantara", "sosial media", "forum"],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: BRAND.name,
    description: BRAND.description,
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
    creator: BRAND.twitterHandle,
  },
};

import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <MobileBottomNav />
        <PWAInstallPrompt />
        <AuthDebug />
      </body>
    </html>
  );
}
