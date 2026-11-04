import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusCodeFix — Review & Capstone Code Debugging | Guaranteed Run or ₹0 Charge",
  description:
    "Fast 1-2 hour turnaround emergency code debugging for engineering capstones, lab exams, and semester project submissions. 100% anonymous, encrypted, with execution proof and guaranteed run.",
  keywords: [
    "capstone code debugging",
    "engineering project debug",
    "verified code execution",
    "student code fix",
    "Next.js debug",
    "Python debugging service",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark bg-[#09090b] text-white antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#09090b] text-[#a1a1aa] selection:bg-[#f97316]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
