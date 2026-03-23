import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSLPay Merchant Portal",
  description: "OSLPay Merchant Platform - 商户入驻与开发者门户",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
