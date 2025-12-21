import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout";

export const metadata: Metadata = {
  title: "Xanlytics - pNode Analytics Platform",
  description: "Real-time analytics and monitoring for Xandeum pNodes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
