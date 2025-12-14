import { MetadataRoute } from "next";

// Static routes with their configurations
const staticRoutes = [
  { path: "", changeFrequency: "daily" as const, priority: 1.0 },
  { path: "/arabic", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/english", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/signup", changeFrequency: "monthly" as const, priority: 0.4 },
];

// Get today's date at midnight for consistent lastModified
const getLastModified = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qaalaa.com";
  const lastModified = getLastModified();

  // Generate sitemap entries for static routes
  const staticSitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        ar: `${baseUrl}${route.path}`,
        en: `${baseUrl}${route.path}`,
      },
    },
  }));

  // Future: Add dynamic routes (e.g., from database)
  // const dynamicRoutes = await fetchDynamicRoutes();

  return [...staticSitemapEntries];
}
