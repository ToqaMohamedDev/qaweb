import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Cairo } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ChatWidget from "@/components/ChatWidget";
import { homeMetadata } from "@/lib/metadata";
import "./globals.css";

const clientBootstrapScript = `
  (() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    document.documentElement.classList[shouldUseDark ? 'add' : 'remove']('dark');
  })();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

// استخدام metadata المحسّن من utility
export const metadata: Metadata = homeMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Apple touch icon and other mobile improvements */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Theme color for different modes */}
        <meta name="theme-color" content="#7c3aed" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#a78bfa" media="(prefers-color-scheme: dark)" />

        {/* Additional SEO meta tags */}
        <meta name="language" content="Arabic" />
        <meta name="geo.region" content="EG" />
        <meta name="geo.placename" content="Egypt" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Noscript fallback */}
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center', background: '#fef2f2', color: '#991b1b' }}>
            يرجى تفعيل JavaScript لتشغيل هذا الموقع بشكل صحيح.
          </div>
        </noscript>

        <script
          dangerouslySetInnerHTML={{
            __html: clientBootstrapScript,
          }}
        />
        <ThemeProvider>
          {/* Main Content */}
          <div id="main-content" style={{ minHeight: "100dvh", position: "relative" }} suppressHydrationWarning>
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </div>
          {/* Chat Widget */}
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
