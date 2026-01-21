import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InfTest - 感染科互動測驗網",
  description: "歷屆感染科專科醫師考題互動測驗",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={outfit.className} suppressHydrationWarning>
        <Navbar />
        <main style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
