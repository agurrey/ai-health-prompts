import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ClientShell from "@/components/ClientShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hormesis — Free Daily Dumbbell Workout + AI Health Coach",
  description:
    "New WOD drops daily at 00:00. Free daily workout generator + 6 AI health prompts for training, nutrition, sleep, back pain, CrossFit, and pelvic floor. No login. No paywall.",
  openGraph: {
    title: "Hormesis — Free Daily Dumbbell Workout + AI Health Coach",
    description:
      "New WOD drops daily at 00:00. Free daily workout + 6 AI health prompts. No login. No paywall.",
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
        <meta name="theme-color" content="#111111" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientShell>{children}</ClientShell>
        <Analytics />
      </body>
    </html>
  );
}
