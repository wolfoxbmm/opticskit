import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://opticskit.cn";
  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Static pages
  entries.push({ url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
  entries.push({ url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 });
  entries.push({ url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 });
  entries.push({ url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 });

  // Tools - dynamic
  try {
    const toolsDir = "/home/admin/opticskit/src/app/tools";
    const tools = fs.readdirSync(toolsDir).filter(d => {
      const p = path.join(toolsDir, d);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "page.tsx"));
    });
    for (const tool of tools) {
      entries.push({
        url: `${baseUrl}/tools/${tool}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {}

  // Articles - dynamic
  try {
    const index = JSON.parse(fs.readFileSync("/home/admin/opticskit/articles/index.json", "utf-8"));
    for (const article of index) {
      entries.push({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: new Date(article.date),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {}

  return entries;
}
