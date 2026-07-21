import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SessionProvider from "@/components/session-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TravelShots - 发现完美拍照点",
  description:
    "发现最佳摄影点位，获取拍摄技巧、穿搭建议和构图指南。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <Header />
          <div className="flex-1 pb-14 sm:pb-0">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
