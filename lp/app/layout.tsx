import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "スマート配送コンパス",
  description:
    "受取人の予定変更をドライバーへリアルタイムに共有し、配送ルートを柔軟に調整する配送支援システム。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
