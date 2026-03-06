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
    "Small dose, big adaptation. Free daily dumbbell workout generator + 6 AI health prompts for training, nutrition, sleep, back pain, CrossFit, and pelvic floor. No login. No paywall.",
  openGraph: {
    title: "Hormesis — Free Daily Dumbbell Workout + AI Health Coach",
    description:
      "Small dose, big adaptation. Free daily workout + 6 AI health prompts. No login. No paywall.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientShell>{children}</ClientShell>
        <Analytics />
      </body>
    </html>
  );
}
