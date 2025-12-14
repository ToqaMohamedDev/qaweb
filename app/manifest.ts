import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QAlaa - منصة تعليمية حديثة",
    short_name: "QAlaa",
    description: "منصة تعليمية حديثة للأسئلة والأجوبة - مواد اللغة العربية والإنجليزية مع امتحانات شاملة",
    start_url: "/",
    scope: "/",
    id: "qaalaa-edu-app",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "QAlaa الصفحة الرئيسية",
      },
    ],
    shortcuts: [
      {
        name: "اللغة العربية",
        short_name: "عربي",
        description: "مواد اللغة العربية",
        url: "/arabic",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "English",
        short_name: "English",
        description: "English language materials",
        url: "/english",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    categories: ["education", "learning", "productivity"],
    lang: "ar",
    dir: "rtl",
    prefer_related_applications: false,
  };
}
