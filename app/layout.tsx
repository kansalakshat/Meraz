import type { Metadata, Viewport } from "next";
import { Almendra, Arbutus_Slab, Rozha_One, Yatra_One } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { site } from "@/data/site";
import { TransitionProvider } from "@/components/Transition";
import NavBar from "@/components/NavBar";
import ScrollFx from "@/components/ScrollFx";
import ScrollHint from "@/components/ScrollHint";
import MusicPlayer from "@/components/MusicPlayer";
import AskBot from "@/components/AskBot";

// Headings: Luminari where the visitor has it (macOS ships it; it can't be served), else Almendra, its nearest free cut.
const almendra = Almendra({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-almendra", display: "swap" });
const rozha = Rozha_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-rozha", display: "swap", preload: false });
const yatra = Yatra_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-yatra", display: "swap", preload: false });
const arbutus = Arbutus_Slab({ weight: "400", subsets: ["latin"], variable: "--font-arbutus", display: "swap" }); // body text

const description = `${site.name}, the annual techno-cultural fest of ${site.college}. ${site.theme} edition. ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description,
  keywords: ["Meraz", "IIT Bhilai", "techno-cultural fest", "college fest", "Chhattisgarh", "Retro India"],
  openGraph: { type: "website", siteName: site.name, title: `${site.name} · Retro India`, description, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: `${site.name} · Retro India`, description },
};

export const viewport: Viewport = { themeColor: "#F3E6C8" };

// Runs before paint: marks JS as available (scroll reveals start hidden only then).
const boot = `try{document.documentElement.classList.add('js')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${almendra.variable} ${rozha.variable} ${yatra.variable} ${arbutus.variable}`}>
      <head>
      </head>
      <body className="js-enabled">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <TransitionProvider>
          <NavBar />
          <main id="main">{children}</main>
          <ScrollFx />
          <ScrollHint />
          <MusicPlayer />
          {/* bottom-left chat bubble; hides itself while the loading screen is up */}
          <AskBot />
        </TransitionProvider>
      </body>
    </html>
  );
}
