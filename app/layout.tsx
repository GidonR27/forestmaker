import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forest Maker - Create Your Perfect Forest Soundscape",
  description: "Design your own forest atmosphere. Mix sounds like rain, wind, fireflies, and create a personalized relaxing forest experience.",
  manifest: "/manifest.json",
  keywords: "forest sounds, nature sounds, ambient forest, rain sounds, relaxing sounds, background sound app, meditation sounds, calming forest, wind sounds, fire crackling, bird songs, nature soundscape, peaceful atmosphere, forest ambience, relaxing nature app, sleep sounds, mindfulness sounds, natural sound mixer, forest sound generator, ambient rain forest",
  authors: [{ name: "Forest Maker" }],
  verification: {
    google: 'e-Bm2XIG87CTU7w7xAsoY2gjG2sL9jdzyoGhu5-9-_w',
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  appleWebApp: {
    capable: false,
    statusBarStyle: "default",
    title: "Forest Maker",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
      },
    ],
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  themeColor: "#ffffff",
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Forest Maker',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://forestmaker.vercel.app',
  description:
    'Mix nature sounds — rain, wind, birds, insects, fire, and more — to build your perfect forest soundscape for sleep, focus, meditation, or relaxation.',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Ambient forest soundscapes',
    'Customizable sound mixing',
    '19 real-world forests',
    'Sleep sounds',
    'Focus and meditation sounds',
    'Background audio on mobile',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS Home Screen icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* iOS splash screens */}
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Forest Maker" />
        {/* Theme color */}
        <meta name="theme-color" content="#ffffff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
