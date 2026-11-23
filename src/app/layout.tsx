import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gurupith Analytics | WhatsApp Monitoring",
  description: "A live analytics workspace for Gurupith WhatsApp conversations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
