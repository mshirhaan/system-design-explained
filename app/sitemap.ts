import type { MetadataRoute } from "next";
import { lessons } from "@/lib/curriculum";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/course`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/labs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site.url}/labs/sandbox`, changeFrequency: "weekly", priority: 0.8 },
    ...lessons.map((l) => ({
      url: `${site.url}/lessons/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: l.access === "free" ? 0.8 : 0.6,
    })),
  ];
}
