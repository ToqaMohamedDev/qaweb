import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================
  // Image Optimization
  // ============================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
    // أفضل formats للضغط
    formats: ['image/avif', 'image/webp'],
    // تحسين الجودة
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================
  // Compression & Performance
  // ============================================
  compress: true,
  poweredByHeader: false, // إخفاء X-Powered-By header للأمان

  // ============================================
  // React Strict Mode
  // ============================================
  reactStrictMode: true,

  // ============================================
  // Security Headers
  // ============================================
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // منع clickjacking
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        // منع MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        // حماية XSS
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        // Referrer policy
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // Permissions Policy
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
        },
        // HSTS (Strict Transport Security)
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
    // Cache static assets
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Cache images
    {
      source: '/images/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=43200',
        },
      ],
    },
  ],

  // ============================================
  // Experimental Features (if needed)
  // ============================================
  experimental: {
    // تحسين حجم الـ bundle
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // ============================================
  // Turbopack Configuration (Silence Warning)
  // ============================================
  turbopack: {},

  // ============================================
  // Webpack Optimization
  // ============================================
  webpack: (config, { dev, isServer }) => {
    // تحسينات للإنتاج فقط
    if (!dev && !isServer) {
      // تقليل حجم الـ bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module: { context: string }) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `vendor.${packageName?.replace('@', '')}`;
              },
              priority: 10,
              reuseExistingChunk: true,
            },
            commons: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
