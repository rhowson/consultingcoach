import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consulting Coach",
  description: "Practise client conversations, storylines and SteerCo delivery with an AI coach — from Analyst to Director.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
