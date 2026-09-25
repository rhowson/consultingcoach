import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600"], variable: "--font-serif4" });

export const metadata: Metadata = {
  title: "Consulting Coach",
  description: "Practise client conversations, storylines and SteerCo delivery with an AI coach — from Analyst to Director.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
