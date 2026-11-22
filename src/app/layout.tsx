import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = "https://nurwehan.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "NUR위한",
  description: "한양대 간호학과 학습·실습 도우미",
  manifest: "/manifest.webmanifest",
  applicationName: "NUR위한",
  appleWebApp: { capable: true, title: "NUR위한", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "NUR위한",
    title: "NUR위한",
    description: "한양대 간호학과 학습·실습 도우미",
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NUR위한" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NUR위한",
    description: "한양대 간호학과 학습·실습 도우미",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E4A84",
};

import Header from "@/components/Header";
import DialogHost from "@/components/Dialog";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          {children}
        </div>
        <BottomNav />
        <DialogHost />
      </body>
    </html>
  );
}
