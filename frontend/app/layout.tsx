import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Compliance Assistant",
  description: "AI Financial Risk & Compliance Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
