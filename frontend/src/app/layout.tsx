import type { Metadata } from "next";
import { Playfair_Display, Crimson_Pro, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stock Analyser — Sentiment Intelligence",
  description:
    "Professional AI-powered stock market sentiment analysis. Track social media trends, mentions, and sentiment scores across thousands of assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable} ${mono.variable}`}>
      <body className="antialiased min-h-screen selection:bg-[#E6FF00] selection:text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
