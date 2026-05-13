import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUR위한 | 한양대학교 간호대학",
  description: "한양대학교 간호대학 OPEN LAB 신청",
};

import Header from "@/components/Header";

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
      </body>
    </html>
  );
}
