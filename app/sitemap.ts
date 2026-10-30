import type { MetadataRoute } from "next";
import { navLinks, site } from "@/data/site";

// out/sitemap.xml: the home page and the nav's pages, so search engines find (and re-read) them all. (Outreach is a
// tab of the sponsors page, so it comes with it.)
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", ...navLinks.map((l) => `${l.href}/`)].map((path) => ({ url: `${site.url}${path}` }));
}
