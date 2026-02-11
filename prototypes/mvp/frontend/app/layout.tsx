import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon Calendar Sync",
  description: "美容室の予約リクエスト管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
