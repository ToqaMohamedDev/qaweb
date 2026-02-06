import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
// SplashScreenWrapper is already inside ClientProviders - no need to import here
import { homeMetadata } from "@/lib/metadata";
import "./globals.css";

const clientBootstrapScript = `
  (() => {
    // Force dark mode only
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
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
      className="dark"
    >
      <head>
        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Apple touch icon and other mobile improvements */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Theme color - dark mode only (matches the app's dark background) */}
        <meta name="theme-color" content="#0a0a0a" />

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

        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
