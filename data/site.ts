// Fest-wide details. Anything marked PLACEHOLDER needs the real Meraz 7.0 value.

export const site = {
  name: "MERAZ 7.0",
  college: "IIT Bhilai",
  theme: "Retro India",
  tagline: "Rewind. Replay. Rejoice.", // PLACEHOLDER
  hindiTagline: "फिर से वही दौर", // "that era, once again"
  url: "https://meraz7.vercel.app", // used for SEO / Open Graph link previews; change if the domain moves
  aftermovie: "/aftermovie.mp4", // Meraz'24 aftermovie, same file as the current site
  passQueryPhone: "+91 94079 00542",
};

// The events page's mela: the whole carnival in one model. Models are cached for a day without asking
// (next.config.ts), so bump v whenever the file changes, or visitors keep the old model under the new code.
export const melaModel = "/models/mela.glb?v=5";

// Top nav links: same five, same order, as the menu on meraz.iitbhilai.ac.in
export const navLinks = [
  { href: "/about", label: "About", hindi: "परिचय", freq: "91.2" },
  { href: "/events", label: "Events", hindi: "कार्यक्रम", freq: "93.5" },
  { href: "/sponsors", label: "Sponsors", hindi: "प्रायोजक", freq: "97.3" },
  { href: "/passes", label: "Passes", hindi: "पास", freq: "101.4" },
  { href: "/contact", label: "Contact", hindi: "संपर्क", freq: "105.2" },
];
