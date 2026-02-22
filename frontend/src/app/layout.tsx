import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stockify — Market Sentiment Dashboard",
  description:
    "Real-time AI-powered stock market sentiment analysis. Track social media trends, mentions, and sentiment scores across thousands of assets.",
  keywords: ["stock market", "sentiment analysis", "AI", "trading", "finance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "var(--bg-shell)" }}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
