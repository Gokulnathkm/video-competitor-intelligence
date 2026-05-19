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
  title: "Video Competitor Intelligence Tool",
  description: "Analyze competitor video performance, uncover posting frequencies, detect content gaps, and export presentation-ready PPTX reports using real-time YouTube intelligence.",
  openGraph: {
    title: "Video Competitor Intelligence & Marketing Audit Tool",
    description: "Analyze competitor video performance, uncover posting frequencies, detect content gaps, and export presentation-ready PPTX reports using real-time YouTube intelligence.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Competitor Intelligence & Marketing Audit Tool",
    description: "Analyze competitor video performance, uncover posting frequencies, detect content gaps, and export presentation-ready PPTX reports using real-time YouTube intelligence.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
