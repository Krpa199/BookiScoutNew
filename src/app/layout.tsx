import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookiscout.com"),
  title: {
    default: "BookiScout - Croatia Travel Guide | Apartments, Beaches & More",
    template: "%s | BookiScout",
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
  alternates: {
    canonical: "https://bookiscout.com",
    languages: {
      "en-US": "https://bookiscout.com/en",
      "de-DE": "https://bookiscout.com/de",
      "it-IT": "https://bookiscout.com/it",
      "pl-PL": "https://bookiscout.com/pl",
      "hr-HR": "https://bookiscout.com/hr",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* AI Search Engine Tags */}
        <meta name="ai-content-declaration" content="human-edited" />
        <link rel="llms" href="/llms.txt" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
