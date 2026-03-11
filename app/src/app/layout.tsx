import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import ClientShell from "@/components/ClientShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hormesis — Free Daily Workout",
  description:
    "New WOD drops daily at 00:00. Free daily workout generator with 4-week periodization, warmup, strength, and conditioning. No login. No paywall.",
  openGraph: {
    title: "Hormesis — Free Daily Workout",
    description:
      "New WOD drops daily at 00:00. Free daily workout. No login. No paywall.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ignakki",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ClientShell>{children}</ClientShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
