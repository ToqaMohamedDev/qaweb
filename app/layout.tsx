import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import { SplashScreenWrapper } from "@/components/SplashScreen";
import { homeMetadata } from "@/lib/metadata";
import "./globals.css";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  // Create a Supabase client to check the session on the server
  // This is safe because we are only reading cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Layout cannot set cookies, this is just for reading
        },
      },
    }
  );

  // Fetch the user from the session
  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    userProfile = data;
  }

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      {/* ... head ... */}
      <head>
        {/* Preconnect to external origins for faster loading */}\
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ... existing meta tags ... */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="theme-color" content="#7c3aed" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#a78bfa" media="(prefers-color-scheme: dark)" />

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

        <ClientProviders user={user} profile={userProfile}>
          <SplashScreenWrapper>
            {children}
          </SplashScreenWrapper>
        </ClientProviders>
      </body>
    </html>
  );
}
