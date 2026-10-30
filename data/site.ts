// Fest-wide details. Anything marked PLACEHOLDER needs the real Meraz 7.0 value.

export const site = {
  name: "MERAZ 7.0",
  college: "IIT Bhilai",
  theme: "Retro India",
  tagline: "Rewind. Replay. Rejoice.", // PLACEHOLDER
  url: "https://meraz.iitbhilai.ac.in", // used for SEO / Open Graph link previews; change if the domain moves
  instagram: "meraziitbh", // the fest's Instagram handle, without the @
  passQueryPhones: ["+91 62815 21833", "+91 76674 16430"], // each is its own tap-to-call link on the passes page
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
  // (Outreach is the sponsors page's second tab, /sponsors/#outreach: components/SponsorsTabs.tsx)
  { href: "/contact", label: "Contact", hindi: "संपर्क", freq: "105.2" },
];
