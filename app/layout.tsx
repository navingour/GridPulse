import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridPulse — Power-Line Stock & Ordering Intelligence",
  description: "Causal inventory optimization & bottleneck forecasting for Lumino Industries 1,700 Poles Kanpur project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
