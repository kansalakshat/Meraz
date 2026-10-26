import type { Metadata } from "next";
import { Kathputli, Mandala, Petals, Tassel } from "@/components/SponsorsArt";
import { sponsorTiers, SPONSORS_REVEALED } from "@/data/content";

export const metadata: Metadata = { title: "Sponsors", description: "The partners powering Meraz." };

// The Canva design (SPONSORS, exported as SPONSORS.zip at the project root), cut into public/sponsors/stage: its top
// (the toran, the carved pillars and bells, the Ganesh pair with the title) and its bottom (the elephants on the pink
// zigzag, held at the foot of the screen) as bands; between them the design's teal and pink dots, the pillars' carved edge run on down each side, and
// every sponsor in its arch frame as SBI is there: the logo on white, the name under it on teal. Over it the page's
// own art (components/SponsorsArt): puppets, falling petals, a mandala behind the title sponsors, the ribbons' tassels.
// The frame (stage/frame.webp, 330 x 447) has its window cut out; stage/window.png is that window, masking what shows
// through it. The white half ends 55.7% of the way down the window.
const WINDOW = { left: 70 / 330, top: 100 / 447, width: 191 / 330, height: 290 / 447 };
const pc = (v: number) => `${v * 100}%`;
const SPLIT = pc(WINDOW.top + 0.557 * WINDOW.height); // the white's edge, down the whole frame
const size = { title: "w-[min(48vw,20rem)]", platinum: "w-[min(36vw,13.5rem)]", gold: "w-[min(36vw,12rem)]", associate: "w-[min(36vw,12rem)]", "co-sponsor": "w-[min(36vw,12rem)]", partner: "w-[min(30vw,10rem)]" };

// The name's size, in cqw of the frame: the largest (up to SBI's in the design) at which its words, wrapped greedily,
// fit the teal half of the window: lines of about 48cqw, about 28cqw tall in all. Bebas runs about 0.42em a letter.
function nameSize(name: string) {
  const words = name.split(" ");
  for (let s = 22; s > 6; s -= 0.5) {
    const per = 48 / (0.42 * s); // letters a line holds
    let lines = 1;
    let used = 0;
    let fits = true;
    for (const w of words) {
      if (w.length > per) fits = false;
      if (used && used + 1 + w.length > per) {
        lines++;
        used = w.length;
      } else used += (used ? 1 : 0) + w.length;
    }
    if (fits && lines * 0.95 * s <= 28) return s;
  }
  return 6;
}

function Frame(sponsor: { name: string; logo: string; dark?: boolean }) {
  const { name, logo, dark } = SPONSORS_REVEALED ? sponsor : { name: "To be announced", logo: "/sponsors/coming-soon.svg", dark: false };
  return (
    <figure className="@container relative aspect-[330/447] w-full transition-[translate,rotate,filter] duration-300 hover:-translate-y-2 hover:-rotate-1 hover:drop-shadow-[0_0_18px_rgb(255_46_136/0.75)]">
      {/* the window's ground, masked to it over the whole frame: white (dark for a light logo) to 55.7% of the way
          down the window, teal below; the logo and name set in the window's box */}
      <div
        className="absolute inset-0 [mask:url(/sponsors/stage/window.png)_0_0/100%_100%]"
        style={{ background: `linear-gradient(${dark ? "#1a1a1a" : "#fff"} ${SPLIT}, #0f8b8d ${SPLIT})` }}
      >
        <div className="absolute flex flex-col" style={{ left: pc(WINDOW.left), top: pc(WINDOW.top), width: pc(WINDOW.width), height: pc(WINDOW.height) }}>
          <div className="flex h-[55.7%] items-center justify-center px-[9%] pt-[20%]">
            <img src={logo} alt={`${name} logo`} loading="lazy" className="max-h-[82%] max-w-full object-contain" />
          </div>
          <figcaption
            className="grid grow place-items-center px-[6%] pb-[16%] text-center font-bebas leading-[.95] text-black"
            style={{ fontSize: `${nameSize(name)}cqw` }}
          >
            {name}
          </figcaption>
        </div>
      </div>
      <img src="/sponsors/stage/frame.webp" alt="" width={330} height={447} className="pointer-events-none absolute inset-0 size-full" />
    </figure>
  );
}

// The tier's label on the design's ribbon: pink, a yellow edge, a notch at each end.
function Ribbon({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="relative z-0 mx-auto w-fit whitespace-nowrap px-7 pb-1 pt-1.5 text-center font-bebas text-[clamp(1.15rem,3vw,2.4rem)] tracking-wide text-white sm:px-10">
      <svg viewBox="0 0 700 58" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 -z-10 size-full">
        <path d="M0 0H700L675 29 700 58H0L25 29Z" fill="#ff2e88" stroke="#ffd23f" strokeWidth="4" vectorEffect="non-scaling-stroke" />
      </svg>
      {children}
      <Tassel className="absolute left-3 top-full w-3 sm:w-4" />
      <Tassel delay={-1.3} className="absolute right-3 top-full w-3 sm:w-4" />
    </h2>
  );
}

// The design's four-point sparkle.
function Sparkle({ fill, className }: { fill: string; className: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d="M50 0C55 40 60 45 100 50 60 55 55 60 50 100 45 60 40 55 0 50 40 45 45 40 50 0Z" fill={fill} />
    </svg>
  );
}

export default function SponsorsPage() {
  const [title, coTitle, ...rest] = sponsorTiers;
  return (
    <div className="bg-[#0f8b8d] pt-[4.4rem]">
      <h1 className="sr-only">Sponsors: the visionaries behind the reverie</h1>
      {/* the title: on a laptop the band whole across the width, as in the design; on a phone scaled up past the
          screen's sides so its lettering reads, the far ends cropped. Shown unfaded, down to the tips of the trunks. */}
      <div className="sponsor-dots relative overflow-hidden">
        <img
          src="/sponsors/stage/top.webp"
          alt=""
          width={1920}
          height={548}
          className="relative left-1/2 block w-[175vw] max-w-none -translate-x-1/2 sm:w-full"
        />
      </div>

      <div className="sponsor-dots relative overflow-x-clip">
        {/* the pillars' carved edge, down each side */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[2.8125vw] bg-[url(/sponsors/stage/pillar-left.webp)] bg-[length:100%_auto] bg-repeat-y" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[2.9167vw] bg-[url(/sponsors/stage/pillar-right.webp)] bg-[length:100%_auto] bg-repeat-y" />
        <Petals />
        {/* the puppets, hung in the side margins (wide screens only: no margin on a phone) */}
        <Kathputli className="absolute left-[4.5vw] top-0 hidden w-[clamp(4.5rem,6.5vw,8rem)] xl:block" />
        <Kathputli she delay={-1.4} className="absolute right-[4.5vw] top-0 hidden w-[clamp(4.5rem,6.5vw,8rem)] xl:block" />
        <Kathputli she delay={-0.6} className="absolute left-[4.5vw] top-[45%] hidden w-[clamp(4rem,5.5vw,7rem)] xl:block" />
        <Kathputli delay={-2} className="absolute right-[4.5vw] top-[45%] hidden w-[clamp(4rem,5.5vw,7rem)] xl:block" />

        <div className="relative mx-auto max-w-6xl px-[6vw] pb-[24vw] pt-6">
          {/* the title sponsors, as the design has SBI, its sparkles either side */}
          <section aria-label="Title sponsors" className="relative flex flex-wrap items-start justify-center gap-x-[6vw] gap-y-12">
            <Sparkle fill="#e6006e" className="absolute left-[8%] top-[6%] hidden w-[3.6vw] max-w-16 sm:block" />
            <Sparkle fill="#e6006e" className="absolute right-[8%] top-[6%] hidden w-[3.6vw] max-w-16 sm:block" />
            <Sparkle fill="#ffd23f" className="absolute -left-[2%] top-[18%] w-[2.6vw] min-w-5 max-w-12" />
            <Sparkle fill="#ffd23f" className="absolute -right-[2%] top-[18%] w-[2.6vw] min-w-5 max-w-12" />
            {[title, coTitle].map((t, i) => (
              <div key={t.tier} data-reveal aria-labelledby={`tier-t${i}`} className={size.title}>
                <Ribbon id={`tier-t${i}`}>{t.tier}</Ribbon>
                <div className="relative isolate mt-4">
                  <Mandala className="absolute left-1/2 top-[58%] -z-10 w-[125%] sm:w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-60" />
                  <Frame {...t.sponsors[0]} />
                </div>
              </div>
            ))}
          </section>

          {rest.map((t, ti) => (
            <section key={t.tier} aria-labelledby={`tier-${ti}`} className="mt-16">
              <div aria-hidden="true" className="shisha mx-auto mb-8 h-5 w-[min(84%,36rem)] [mask:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] sm:h-6" />
              <Ribbon id={`tier-${ti}`}>{t.tier}</Ribbon>
              <ul className="mt-12 flex flex-wrap sm:mt-10 justify-center gap-x-[clamp(.75rem,3vw,2.5rem)] gap-y-6">
                {t.sponsors.map((s) => (
                  <li key={s.name} data-reveal className={size[t.level]}>
                    <Frame {...s} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* the elephants: their band (its ground keyed out) held at the foot of the screen all the way down, settling over
          the end of the dots at the page's end; it is 390/1920 of the width tall, and pulled up by that much */}
      <img
        src="/sponsors/stage/bottom.webp"
        alt=""
        width={1920}
        height={390}
        className="pointer-events-none sticky bottom-0 z-10 -mt-[20.3125vw] block w-full"
      />
    </div>
  );
}
