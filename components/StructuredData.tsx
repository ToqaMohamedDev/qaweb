"use client";

import { useEffect } from "react";

interface StructuredDataProps {
  data: object;
}

/**
 * مكون لإضافة Structured Data (JSON-LD) للصفحة
 * يساعد محركات البحث على فهم المحتوى بشكل أفضل
 */
export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    script.id = "structured-data";
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("structured-data");
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [data]);

  return null;
}

/**
 * Structured Data للصفحة الرئيسية
 */
export const homeStructuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "QAlaa",
  description:
    "منصة تعليمية حديثة للأسئلة والأجوبة - مواد اللغة العربية والإنجليزية مع امتحانات شاملة",
  url: "https://qalaa.com",
  logo: "https://qalaa.com/logo.png",
  sameAs: [
    // يمكن إضافة روابط وسائل التواصل الاجتماعي
    // "https://facebook.com/qalaa",
    // "https://twitter.com/qalaa",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Arabic", "English"],
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EGP",
    description: "منصة تعليمية مجانية",
  },
  areaServed: {
    "@type": "Country",
    name: "Egypt",
  },
  educationalCredentialAwarded: "Certificate",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Educational Courses",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "اللغة العربية",
          description: "دروس وامتحانات شاملة في اللغة العربية",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "English Language",
          description: "Comprehensive English lessons and exams",
        },
      },
    ],
  },
};

/**
 * Structured Data لصفحة المادة الدراسية
 */
export function createCourseStructuredData(
  courseName: string,
  courseDescription: string,
  courseUrl: string,
  lessons: Array<{ name: string; description: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseName,
    description: courseDescription,
    url: courseUrl,
    provider: {
      "@type": "EducationalOrganization",
      name: "QAlaa",
      url: "https://qalaa.com",
    },
    hasCourseInstance: lessons.map((lesson, index) => ({
      "@type": "CourseInstance",
      name: lesson.name,
      description: lesson.description,
      courseMode: "online",
      position: index + 1,
    })),
  };
}


