import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Refacciones Fiesco — Refacciones de electrodomésticos",
    template: "%s | Refacciones Fiesco",
  },
  description:
    "Refacciones de electrodomésticos, nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos. Envíos a todo México.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Refacciones Fiesco",
    title: "Refacciones de electrodomésticos en México",
    description:
      "Refacciones nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos. Envíos a todo México.",
    url: SITE_URL,
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "Refacciones Fiesco" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refacciones de electrodomésticos en México",
    description:
      "Refacciones nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos. Envíos a todo México.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
