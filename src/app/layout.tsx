import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { CookieBanner } from "@/components/CookieBanner";
import { Suspense } from "react";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Andrea Piano - Official Music Site",
    template: "%s | Andrea Piano",
  },
  description:
    "The official website of Andrea Piano, singer-songwriter and independent music artist. Discover original music, listen on Spotify, and watch on YouTube.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HeroHeader />
          <CookieBanner />

          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>

          {children}
          <FooterSection />
        </ThemeProvider>
      </body>
    </html>
  );
}
