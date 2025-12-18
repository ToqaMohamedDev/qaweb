import type { Metadata } from "next";

// Base URL - يجب تحديثه عند النشر
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qalaa.com";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noindex?: boolean;
  alternateLanguages?: { lang: string; url: string }[];
}

/**
 * إنشاء metadata كامل للصفحة مع SEO محسّن
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  path = "",
  image,
  noindex = false,
  alternateLanguages = [],
}: PageMetadata): Metadata {
  const url = `${baseUrl}${path}`;
  const imageUrl = image || `${baseUrl}/og-image.jpg`;
  const fullTitle = `${title} | QAlaa`;

  // دمج الكلمات المفتاحية الأساسية
  const allKeywords = [
    "QAlaa",
    "منصة تعليمية",
    "تعليم",
    "أسئلة وأجوبة",
    "لغة عربية",
    "لغة إنجليزية",
    "امتحانات",
    "دروس",
    "تعليم إلكتروني",
    ...keywords,
  ];

  // إعداد alternate languages
  const alternates: Metadata["alternates"] = {
    canonical: url,
    languages: {
      "ar-EG": url,
      "en-US": `${baseUrl}/en${path}`,
    },
  };

  // إضافة alternate languages إضافية
  if (alternateLanguages.length > 0) {
    alternates.languages = {
      ...alternates.languages,
      ...Object.fromEntries(
        alternateLanguages.map((alt) => [alt.lang, alt.url])
      ),
    };
  }

  return {
    title: {
      default: fullTitle,
      template: "%s | QAlaa",
    },
    description,
    keywords: allKeywords,
    authors: [{ name: "QAlaa Team" }],
    creator: "QAlaa",
    publisher: "QAlaa",
    applicationName: "QAlaa",
    category: "education",
    classification: "Educational Platform",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates,
    openGraph: {
      type: "website",
      locale: "ar_EG",
      url,
      siteName: "QAlaa",
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@qalaa",
      site: "@qalaa",
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // يمكن إضافة Google Search Console verification
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

/**
 * Metadata للصفحة الرئيسية
 */
export const homeMetadata: Metadata = generateMetadata({
  title: "QAlaa - منصة تعليمية حديثة",
  description:
    "منصة تعليمية حديثة للأسئلة والأجوبة - مواد اللغة العربية والإنجليزية مع امتحانات شاملة وتصميم عصري. ابدأ رحلتك التعليمية اليوم!",
  keywords: [
    "منصة تعليمية",
    "تعليم إلكتروني",
    "أسئلة وأجوبة",
    "امتحانات",
    "دروس عربية",
    "دروس إنجليزية",
  ],
  path: "/",
});

/**
 * Metadata لصفحة اللغة العربية
 */
export const arabicPageMetadata: Metadata = generateMetadata({
  title: "اللغة العربية - دروس وامتحانات شاملة",
  description:
    "دروس وامتحانات شاملة في النحو والصرف والبلاغة والأدب والقراءة والتعبير. محتوى تعليمي متكامل للغة العربية مع أسئلة تفاعلية.",
  keywords: [
    "النحو",
    "الصرف",
    "البلاغة",
    "الأدب",
    "القراءة",
    "التعبير",
    "امتحانات عربية",
    "دروس عربية",
  ],
  path: "/arabic",
});

/**
 * Metadata لصفحة اللغة الإنجليزية
 */
export const englishPageMetadata: Metadata = generateMetadata({
  title: "English Language - Comprehensive Lessons and Exams",
  description:
    "Comprehensive lessons and exams in vocabulary, grammar, reading comprehension, translation, and literature. Interactive English learning platform.",
  keywords: [
    "English grammar",
    "English vocabulary",
    "English exams",
    "English lessons",
    "reading comprehension",
    "translation",
    "literature",
  ],
  path: "/english",
});

/**
 * Metadata لصفحة تسجيل الدخول
 */
export const loginPageMetadata: Metadata = generateMetadata({
  title: "تسجيل الدخول - QAlaa",
  description: "سجّل دخولك إلى حسابك في QAlaa للمتابعة في رحلتك التعليمية.",
  keywords: ["تسجيل دخول", "حساب", "QAlaa"],
  path: "/login",
  noindex: true, // لا نريد فهرسة صفحات تسجيل الدخول
});

/**
 * Metadata لصفحة إنشاء حساب
 */
export const signupPageMetadata: Metadata = generateMetadata({
  title: "إنشاء حساب جديد - QAlaa",
  description: "انضم إلى QAlaa وابدأ رحلة التعلم. إنشاء حساب مجاني للوصول إلى جميع الدروس والامتحانات.",
  keywords: ["إنشاء حساب", "تسجيل", "QAlaa"],
  path: "/signup",
  noindex: true, // لا نريد فهرسة صفحات التسجيل
});


