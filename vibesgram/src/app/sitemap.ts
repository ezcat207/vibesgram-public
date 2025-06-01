import { type MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vibesgram.com";

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/tos`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
    },
  ];

  return staticRoutes;
}
