import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUR위한",
  description: "한양대 간호학과 학습·실습 도우미",
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
