import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SupportWidget } from "@/components/SupportWidget";
import { SkipLinks } from "@/components/Accessibility";
import "./globals.css";

const clientBootstrapScript = `
  (() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    document.documentElement.classList[shouldUseDark ? 'add' : 'remove']('dark');

    const ignorePatterns = [
      'runtime.lastError',
      'Unchecked runtime.lastError',
      'message port closed',
      'message channel closed',
      'Receiving end does not exist',
      'Could not establish connection',
      'Extension context invalidated',
      'asynchronous response',
      'listener indicated',
      'before a response was received',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://'
    ].map((pattern) => pattern.toLowerCase());

    const shouldIgnoreError = (msg) => {
      if (!msg) return false;
      const normalized = String(msg).toLowerCase();
      return ignorePatterns.some((pattern) => normalized.includes(pattern));
    };

    const guardConsoleMethod = (methodName) => {
      const original = console[methodName];
      console[methodName] = (...args) => {
        const message = args
          .map((arg) => {
            if (typeof arg === 'string') return arg;
            if (arg?.message) return arg.message;
            return String(arg);
          })
          .join(' ');

        if (!shouldIgnoreError(message)) {
          original.apply(console, args);
        }
      };
    };

    guardConsoleMethod('error');
    guardConsoleMethod('warn');

    const originalOnError = window.onerror;
    window.onerror = (...params) => {
      const [msg, url] = params;
      if (shouldIgnoreError(msg) || (url && shouldIgnoreError(url))) {
        return true;
      }
      return originalOnError ? originalOnError.apply(window, params) : false;
    };

    window.addEventListener(
      'unhandledrejection',
      (event) => {
        const reason = event.reason;
        const message =
          typeof reason === 'string'
            ? reason
            : reason?.message ?? reason?.toString?.() ?? '';

        if (shouldIgnoreError(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const originalSendMessage = chrome.runtime.sendMessage;
        if (originalSendMessage) {
          chrome.runtime.sendMessage = (...args) => {
            try {
              return originalSendMessage.apply(chrome.runtime, args);
            } catch (error) {
              if (!shouldIgnoreError(error?.message ?? String(error))) {
                throw error;
              }
              return undefined;
            }
          };
        }

        chrome.runtime.onMessage.addListener(() => true);
      } catch (error) {
        // Ignore extension runtime errors
      }
    }
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

export const metadata: Metadata = {
  title: {
    default: "QAlaa - منصة تعليمية حديثة",
    template: "%s | QAlaa",
  },
  description: "منصة تعليمية حديثة للأسئلة والأجوبة - مواد اللغة العربية والإنجليزية مع امتحانات شاملة وتصميم عصري",
  keywords: ["تعليم", "أسئلة", "أجوبة", "لغة عربية", "لغة إنجليزية", "امتحانات", "دروس", "QAlaa"],
  authors: [{ name: "QAlaa Team" }],
  creator: "QAlaa",
  publisher: "QAlaa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://qaalaa.com"),
  alternates: {
    canonical: "/",
    languages: {
      "ar": "/",
      "en": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "/",
    siteName: "QAlaa",
    title: "QAlaa - منصة تعليمية حديثة",
    description: "منصة تعليمية حديثة للأسئلة والأجوبة - مواد اللغة العربية والإنجليزية مع امتحانات شاملة",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QAlaa - منصة تعليمية حديثة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QAlaa - منصة تعليمية حديثة",
    description: "منصة تعليمية حديثة للأسئلة والأجوبة",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

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
        <link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />

        {/* DNS prefetch for additional performance */}
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://securetoken.googleapis.com" />

        {/* Apple touch icon and other mobile improvements */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Theme color for different modes */}
        <meta name="theme-color" content="#7c3aed" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#a78bfa" media="(prefers-color-scheme: dark)" />
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
          <AuthProvider>
            <ToastProvider>
              {/* Skip Links for Accessibility */}
              <SkipLinks />

              <OfflineIndicator />

              {/* Main Content */}
              <div id="main-content">
                {children}
              </div>

              <SupportWidget />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
