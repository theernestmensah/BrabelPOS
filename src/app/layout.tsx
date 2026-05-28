import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BrAbelPOS — Luxury Point of Sale for Africa",
  description:
    "The offline-first, cloud-ready POS and SaaS platform built for the African market. Power your business with cinematic analytics, multi-branch sync, and AI-driven insights.",
  keywords: ["POS", "Ghana", "Africa", "Point of Sale", "SaaS", "Retail"],
  authors: [{ name: "BrAbel Technologies" }],
  openGraph: {
    title: "BrAbelPOS — Luxury POS for Africa",
    description: "Offline-first POS and SaaS ecosystem for the African market.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-obsidian text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
