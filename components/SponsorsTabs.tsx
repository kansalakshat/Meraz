"use client";

// The sponsors page's two tabs, just under the nav bar: the sponsors, and Outreach (the campus ambassadors, cafés and
// influencers). Both are in the page's HTML; the one not chosen is hidden. /sponsors/#outreach (or a link to one of
// Outreach's sections) opens on Outreach.
import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TABS = [
  { id: "sponsors", label: "Sponsors", hindi: "प्रायोजक", paint: "bg-rani-deep text-cream" },
  { id: "outreach", label: "Outreach", hindi: "जनसंपर्क", paint: "bg-teal-deep text-cream" },
] as const;
type Tab = (typeof TABS)[number]["id"];
const OUTREACH_HASHES = ["#outreach", "#ambassadors", "#cafes", "#influencers"];

export default function SponsorsTabs({ sponsors, outreach }: { sponsors: React.ReactNode; outreach: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("sponsors");

  // the tab the address asks for, on arrival and when it changes
  useEffect(() => {
    const fromHash = () => {
      if (OUTREACH_HASHES.includes(location.hash)) setTab("outreach");
      else if (location.hash === "#sponsors") setTab("sponsors");
    };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, []);
  // the shown tab's scroll reveals measured where they now are
  useEffect(() => ScrollTrigger.refresh(), [tab]);

  const choose = (id: Tab) => {
    setTab(id);
    history.replaceState(null, "", id === "outreach" ? "#outreach" : location.pathname);
  };

  return (
    <>
      {/* clear of the nav bar, its pennants and (until a wide screen sets it off to the side) the music player under them */}
      <div role="tablist" aria-label="Sponsors and Outreach" className="nav-ground flex justify-center gap-3 border-b-4 border-ink px-4 pb-3 pt-[9.4rem] sm:gap-4 xl:pt-[calc(4.4rem+1.25rem)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => choose(t.id)}
            className={`flex min-h-12 items-baseline gap-2 rounded-t-xl rounded-b-sm border-2 border-ink px-4 py-2 shadow-[inset_0_0_0_2px_var(--color-turmeric),inset_0_0_0_3px_var(--color-ink),3px_3px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 aria-selected:!bg-ink aria-selected:!text-turmeric sm:px-6 ${t.paint}`}
          >
            <span className="font-display text-xl sm:text-2xl">{t.label}</span>
            <span lang="hi" aria-hidden="true" className="font-deva text-base opacity-90 sm:text-lg">
              {t.hindi}
            </span>
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={tab !== t.id}>
          {t.id === "sponsors" ? sponsors : outreach}
        </div>
      ))}
    </>
  );
}
