import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qaalaa.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin/", "/api/", "/_next/", "/login", "/signup", "/profile"],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/admin/", "/api/", "/_next/"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
