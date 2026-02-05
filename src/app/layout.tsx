import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import OrganizationSchema from "@/components/schema/OrganizationSchema";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookiscout.com"),
  title: {
    default: "BookiScout - Croatia Travel Guide | Apartments, Beaches & More",
    template: "%s | BookiScout",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  description:
    "Discover the best apartments, beaches, restaurants, and hidden gems in Croatia. Your ultimate travel guide for Split, Dubrovnik, Zagreb, and more.",
  keywords: [
    "Croatia travel",
    "Croatia apartments",
    "Croatia beaches",
    "Split apartments",
    "Dubrovnik guide",
    "Croatia vacation",
    "Adriatic coast",
    "Croatian islands",
  ],
  authors: [{ name: "BookiScout" }],
  creator: "BookiScout",
  publisher: "BookiScout",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookiscout.com",
    siteName: "BookiScout",
    title: "BookiScout - Croatia Travel Guide",
    description:
      "Discover the best apartments, beaches, restaurants, and hidden gems in Croatia.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BookiScout - Croatia Travel Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookiScout - Croatia Travel Guide",
    description:
      "Discover the best apartments, beaches, restaurants, and hidden gems in Croatia.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable}>
      <head>
        {/* AI Search Engine Tags */}
        <meta name="ai-content-declaration" content="human-edited" />
        <link rel="llms" href="/llms.txt" />
      </head>
      <body className="min-h-screen flex flex-col">
        <OrganizationSchema />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
