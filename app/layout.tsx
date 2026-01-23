import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SolanaWalletProvider } from "@/components/providers/SolanaWalletProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "x402's Pixel War - Pixel Conquest Game",
  description: "A multiplayer pixel conquest game built on Agentic Economy mechanics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
