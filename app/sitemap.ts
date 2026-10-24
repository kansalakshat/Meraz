import type { MetadataRoute } from "next";
import { navLinks, site } from "@/data/site";

// out/sitemap.xml: the home page and the nav's pages, so search engines find (and re-read) them all; and the pages
// kept out of the nav for now (see navLinks), so they are found ahead of their launch.
export const dynamic = "force-static";
const UNLISTED = ["/outreach"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...new Set([...navLinks.map((l) => l.href), ...UNLISTED])]; // once a page is back in the nav, listed once
  return ["/", ...pages.map((href) => `${href}/`)].map((path) => ({ url: `${site.url}${path}` }));
}
