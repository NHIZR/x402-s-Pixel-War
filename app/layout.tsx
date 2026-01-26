import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel War - Conquer the Grid",
  description: "A multiplayer pixel conquest game on Solana blockchain. Pay USDC to conquer pixels, change colors, and compete with players worldwide.",
  keywords: ["pixel", "game", "solana", "blockchain", "web3", "multiplayer", "crypto"],
  authors: [{ name: "Pixel War Team" }],
  openGraph: {
    title: "Pixel War - Conquer the Grid",
    description: "A multiplayer pixel conquest game on Solana blockchain",
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel War - Conquer the Grid",
    description: "A multiplayer pixel conquest game on Solana blockchain",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <SolanaWalletProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
