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
  title: "Hormesis — Your daily training dose",
  description:
    "Coached sessions that change every day. 4-week periodization, warmup → strength → conditioning. 155 exercises, real coaching cues. Free. No login.",
  openGraph: {
    title: "Hormesis — Your daily training dose",
    description:
      "Your body adapts to stress. Hormesis gives you the right dose. New coached session every day. Free.",
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
