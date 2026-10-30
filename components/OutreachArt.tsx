// The Outreach page's own art, drawn the way the other pages' scenes are: ink outlines over flat, loud colour, the
// still pieces kept off true by a "wobble" filter so they read hand-drawn (the moving ones go without it, as a filter
// re-run every frame costs more than it gives). First a Sankranti sky with three kites flying over the rooftops, then a
// picture palace's marquee over three film posters; both the kites and the posters jump to the page's three sections.
// Further down, each section has its own faint scatter of icons behind it, each partner café's card is a little
// shopfront, and a truck-art phone plays a Meraz reel beside the influencers. The motion stops under reduced motion.
import type { Icon } from "@phosphor-icons/react";
import {
  CameraIcon,
  ChatCircleIcon,
  CoffeeIcon as Coffee,
  ConfettiIcon,
  CookieIcon,
  FilmReelIcon,
  GraduationCapIcon,
  HeartIcon,
  IceCreamIcon,
  InstagramLogoIcon as InstagramLogo,
  MegaphoneIcon,
  MusicNotesIcon,
  PaperPlaneTiltIcon,
  PizzaIcon,
  PlayIcon,
  SparkleIcon,
  StudentIcon as Student,
  TicketIcon,
} from "@phosphor-icons/react/ssr";
import { site } from "@/data/site";

const INK = "#1a1a1a";
const CREAM = "#f3e6c8";
const TURMERIC = "#f2c14e";
const RANI = "#e0218a";
const RANI_DEEP = "#b8166f";
const TEAL_DEEP = "#0a5f5f";
const VERMILLION = "#d7263d";

const SECTIONS = [
  { id: "ambassadors", label: "Campus Ambassadors", hindi: "कैंपस एम्बेसडर" },
  { id: "cafes", label: "Partnered Cafes", hindi: "साथी कैफ़े" },
  { id: "influencers", label: "Influencers", hindi: "साथी क्रिएटर" },
];

function Wobble({ id }: { id: string }) {
  return (
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" />
      <feDisplacementMap in="SourceGraphic" scale="3" />
    </filter>
  );
}

// ======================================================================================================================
// Patang: a Sankranti sky over the rooftops of Bhilai, three kites flying on their strings, one per programme (the
// kites are the jump nav), each swaying on the wind. Meraz reaching far.
// ======================================================================================================================

// A diamond kite, its spars, the tail (pucchi) at its foot, its string trailing down to the left; 120 x 220.
function Kite({ id, a, b }: { id: string; a: string; b: string }) {
  return (
    <svg viewBox="0 0 120 220" overflow="visible" aria-hidden="true" className="w-full">
      <Wobble id={id} />
      <path d="M60 128C40 160 30 190 -40 230" fill="none" stroke={CREAM} strokeWidth="1.5" strokeDasharray="1 0" />
      <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M60 6L112 62 60 128 8 62Z" fill={a} />
        <path d="M60 6L112 62 60 62Z M60 62L8 62 60 128Z" fill={b} />
        <path d="M60 6V128M8 62Q60 40 112 62" fill="none" strokeWidth="2" />
        <circle cx="60" cy="62" r="9" fill={CREAM} />
        <path d="M60 126L46 150H74Z" fill={b} />
      </g>
    </svg>
  );
}

const KITES = [
  { a: RANI, b: TURMERIC, lift: "mt-8", delay: 0 },
  { a: VERMILLION, b: CREAM, lift: "mt-0", delay: -1.2 },
  { a: TURMERIC, b: TEAL_DEEP, lift: "mt-12", delay: -2.1 },
];

// The rooftops: flat roofs at different heights, a water tank, a TV antenna, a clothes line; 1440 x 160, sliced to
// its middle on narrow screens.
function Rooftops({ id, className }: { id: string; className: string }) {
  const roofs = [
    [0, 70, 180], [180, 40, 160], [340, 90, 200], [540, 56, 150], [690, 30, 190], [880, 80, 170], [1050, 50, 210],
    [1260, 74, 180],
  ];
  return (
    <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <Wobble id={id} />
      <g filter={`url(#${id})`} stroke={INK} strokeWidth="3" strokeLinejoin="round">
        {roofs.map(([x, y, w], i) => (
          <g key={x}>
            <rect x={x} y={y} width={w} height={170 - y} fill={i % 2 ? "#e8d5a8" : "#dfca9f"} />
            <rect x={x - 4} y={y - 8} width={w + 8} height="10" fill={i % 3 ? CREAM : TURMERIC} />
            {[0.25, 0.6].map((f) => (
              <rect key={f} x={x + w * f} y={y + 26} width="22" height="30" fill={TEAL_DEEP} />
            ))}
          </g>
        ))}
        {/* the Sintex tank on its stand, and the TV antenna, its rods shortening toward the front */}
        <rect x="236" y="4" width="46" height="34" rx="6" fill={INK} />
        <path d="M244 38V40M274 38V40" />
        <path d="M960 72V14M926 22L994 14M932 34L988 28M940 46L980 41M948 58L974 54" fill="none" strokeWidth="2.5" />
        {/* a clothes line with a sari drying on it */}
        <path d="M1080 50V10M1240 76V24M1080 14Q1160 34 1240 28" fill="none" strokeWidth="2" />
        <path d="M1120 22Q1150 30 1180 30V66Q1150 58 1120 64Z" fill={RANI} />
      </g>
    </svg>
  );
}

export function KiteHero() {
  return (
    <section className="relative overflow-hidden border-b-4 border-ink bg-teal pt-8 sm:pt-12">
      <div aria-hidden="true" className="halftone absolute inset-0 text-cream/15" />
      {/* the sun */}
      <div aria-hidden="true" className="absolute -right-16 top-4 size-48 rounded-full border-4 border-ink bg-turmeric sm:right-10 sm:size-64" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p lang="hi" className="painted font-deva text-3xl text-cream sm:text-4xl">
          जनसंपर्क
        </p>
        <h1 className="painted misprint font-display text-[clamp(3rem,11vw,7.5rem)] leading-[.9] text-cream">Outreach</h1>
        <p className="mt-5 max-w-xl bg-cream/90 p-4 text-lg text-ink shadow-[5px_5px_0_var(--color-ink)]">
          Meraz flies beyond IIT Bhilai: catch a kite.
        </p>
        <nav aria-label="Outreach sections" className="mt-6">
          <ul className="mx-auto grid max-w-3xl grid-cols-3 gap-4 sm:gap-10">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className={KITES[i].lift}>
                <a href={`#${s.id}`} className="group block text-center">
                  <span className="block animate-bob" style={{ animationDelay: `${KITES[i].delay}s`, animationDuration: "2.6s" }}>
                    <span className="mx-auto block w-20 origin-bottom animate-swing transition-transform group-hover:scale-110 sm:w-28" style={{ animationDelay: `${KITES[i].delay}s` }}>
                      <Kite id={`kite-wobble-${i}`} a={KITES[i].a} b={KITES[i].b} />
                    </span>
                  </span>
                  {/* the tag tied to its string */}
                  <span className="relative -mt-6 inline-block -rotate-2 border-2 border-ink bg-cream px-2 py-1 font-display text-sm leading-tight text-ink shadow-[3px_3px_0_var(--color-ink)] sm:text-lg">
                    {s.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Rooftops id="roof-wobble" className="relative -mb-1 mt-4 h-24 w-full sm:h-36" />
    </section>
  );
}

// ======================================================================================================================
// Talkies: a picture palace's marquee, ringed with blinking bulbs, "Now showing: Outreach", and under it three
// hand-painted film posters, one per programme (the posters jump to the sections), "Meraz 7.0 presents".
// ======================================================================================================================

function Bulbs({ n, className }: { n: number; className: string }) {
  return (
    <div aria-hidden="true" className={`flex justify-between ${className}`}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="size-2.5 animate-pulse rounded-full border border-ink bg-turmeric shadow-[0_0_8px_2px_rgb(242_193_78/0.7)] sm:size-3"
          style={{ animationDelay: `${(i % 2) * 1}s` }}
        />
      ))}
    </div>
  );
}

const FILMS = [
  { Icon: Student, rays: "[--ray-a:#E0218A] [--ray-b:#D7263D]", tagline: "Near you" },
  { Icon: Coffee, rays: "[--ray-a:#F4A300] [--ray-b:#F2C14E]", tagline: "Now serving" },
  { Icon: InstagramLogo, rays: "[--ray-a:#0F7C7C] [--ray-b:#0a5f5f]", tagline: "On your feed" },
];

export function Talkies() {
  return (
    <section aria-labelledby="talkies-title" className="relative overflow-hidden border-b-4 border-ink bg-ink py-14">
      <div aria-hidden="true" className="halftone absolute inset-0 text-cream/10" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* the marquee */}
        <div className="relative mx-auto max-w-3xl border-4 border-ink bg-vermillion p-3 shadow-[8px_8px_0_var(--color-rani-deep)]">
          <Bulbs n={16} className="px-1" />
          <div className="my-3 border-4 border-ink bg-cream px-4 py-5 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[.4em] text-rani-deep sm:text-sm">
              Meraz Talkies <span className="hidden sm:inline">·</span> <span className="block sm:inline">Now showing</span>
            </p>
            <p lang="hi" className="mt-2 font-deva text-2xl text-vermillion sm:text-3xl">
              जनसंपर्क
            </p>
            <h2 id="talkies-title" className="painted misprint font-display text-[clamp(2.8rem,10vw,6.5rem)] leading-[.9] text-turmeric">
              Outreach
            </h2>
          </div>
          <Bulbs n={16} className="px-1" />
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-lg text-cream/90">Three shows, one fest. Pick yours.</p>
        {/* the posters */}
        <nav aria-label="Programmes" className="mt-6">
          <ul className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
            {SECTIONS.map((s, i) => {
              const { Icon, rays, tagline } = FILMS[i];
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`relative flex aspect-[2/3] flex-col items-center justify-between overflow-hidden border-4 border-cream text-center shadow-[5px_5px_0_var(--color-rani-deep)] transition-transform hover:-translate-y-1 hover:rotate-0 ${i === 1 ? "rotate-1" : "-rotate-1"}`}
                  >
                    <span aria-hidden="true" className={`sunburst absolute left-1/2 top-[45%] size-[300%] -translate-x-1/2 -translate-y-1/2 ${rays}`} />
                    <span aria-hidden="true" className="halftone absolute inset-0 text-ink/20" />
                    <span className="relative w-full bg-ink py-1 font-mono text-[0.55rem] uppercase tracking-[.2em] text-cream sm:text-xs">
                      Meraz 7.0<span className="hidden sm:inline"> presents</span>
                    </span>
                    <span className="relative grid size-14 place-items-center rounded-full border-[3px] border-ink bg-cream sm:size-24">
                      <Icon weight="duotone" aria-hidden="true" className="size-9 text-ink sm:size-16" />
                    </span>
                    <span className="relative mx-1 -rotate-2 border-2 border-ink bg-cream px-1.5 py-0.5 font-display text-[clamp(0.75rem,3.2vw,1.5rem)] leading-tight text-ink">{s.label}</span>
                    <span className="relative w-full bg-ink py-1 text-[0.55rem] text-turmeric sm:text-xs">{tagline}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}

// ======================================================================================================================
// A partner café's shopfront, for its card: a scalloped awning striped rani and cream, the café's name on a turmeric
// signboard under it, three of the treats on its counter (each card a different three), and the fest's rubber stamp
// pressed on the corner.
// ======================================================================================================================

// Eight stripes, each ending in a scallop, under a valance; stretched to the card's width (the strokes keep their
// weight).
function Awning({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 240 42" preserveAspectRatio="none" aria-hidden="true" className="block h-10 w-full">
      <Wobble id={id} />
      <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${i * 30} 6H${i * 30 + 30}V27A15 12 0 0 1 ${i * 30} 27Z`} fill={i % 2 ? CREAM : RANI} vectorEffect="non-scaling-stroke" />
        ))}
        <rect x="-2" y="-2" width="244" height="9" fill={RANI_DEEP} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

// The treats on a café's counter, each 100 x 100 standing on y = 96: a cutting-chai glass and a cup of coffee with
// steam curling off them (each wisp wavering and fading in its own time), a slice of pizza, a strawberry shake.
function Steam({ xs, top }: { xs: number[]; top: number }) {
  return xs.map((x, i) => (
    <g key={x} className="origin-bottom animate-sway [transform-box:fill-box]" style={{ animationDelay: `${-i * 1.1}s` }}>
      <path
        d={`M${x} ${top}C${x - 6} ${top - 8} ${x + 6} ${top - 14} ${x} ${top - 26}`}
        fill="none"
        stroke={INK}
        strokeOpacity=".55"
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-pulse"
        style={{ animationDelay: `${i * 0.6}s` }}
      />
    </g>
  ));
}

function Chai({ id }: { id: string }) {
  return (
    <>
      <Steam xs={[42, 58]} top={30} />
      <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M28 34H72L65 94H35Z" fill="#e3ecee" />
        <path d="M29.6 48H70.4L65 94H35Z" fill="#b8742f" />
        <path d="M40 50L42 92M50 50V92M60 50L58 92" fill="none" strokeWidth="1.5" strokeOpacity=".5" />
      </g>
    </>
  );
}

function CoffeeCup({ id }: { id: string }) {
  return (
    <>
      <Steam xs={[38, 50, 62]} top={34} />
      <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <ellipse cx="50" cy="90" rx="40" ry="7" fill={CREAM} />
        <path d="M74 50C90 48 92 72 70 72" fill="none" strokeWidth="5" />
        <path d="M22 42H78L72 80Q70 86 62 86H38Q30 86 28 80Z" fill={RANI} />
        <path d="M24 54H76L75 62H25Z" fill={TURMERIC} strokeWidth="2" />
        <ellipse cx="50" cy="42" rx="28" ry="6" fill="#6b3e1f" />
      </g>
    </>
  );
}

function Pizza({ id }: { id: string }) {
  return (
    <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M14 30Q50 16 86 30L50 96Z" fill={TURMERIC} />
      <path d="M14 30Q50 16 86 30L82 40Q50 28 18 40Z" fill="#c8742f" />
      {[[38, 50], [60, 52], [50, 70]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="6" fill={VERMILLION} strokeWidth="2" />
      ))}
      <path d="M30 44Q33 54 31 58M70 44Q67 52 69 56" fill="none" strokeWidth="2" />
    </g>
  );
}

function Shake({ id }: { id: string }) {
  return (
    <g filter={`url(#${id})`} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M58 30L72 2" fill="none" stroke={TEAL_DEEP} strokeWidth="6" />
      <path d="M32 34H68L62 94H38Z" fill="#f4a3c6" />
      <path d="M33.4 44H66.6" fill="none" strokeWidth="1.5" />
      <path d="M28 36C24 26 34 20 40 24C42 14 58 14 60 24C66 20 76 26 72 36Z" fill={CREAM} />
      <circle cx="47" cy="16" r="5" fill={VERMILLION} strokeWidth="2" />
      <path d="M47 11Q49 4 54 3" fill="none" strokeWidth="1.8" />
    </g>
  );
}

const TREATS = [Chai, CoffeeCup, Pizza, Shake];

function Treat({ id, n, className }: { id: string; n: number; className: string }) {
  const Item = TREATS[n % TREATS.length];
  return (
    <svg viewBox="0 0 100 100" overflow="visible" aria-hidden="true" className={className}>
      <Wobble id={id} />
      <Item id={id} />
    </svg>
  );
}

// The fest's rubber stamp: "Meraz 7.0 · partner café" round the rim, साथी (partner) in the middle.
function PartnerStamp({ id, className }: { id: string; className: string }) {
  return (
    <svg viewBox="-60 -60 120 120" aria-hidden="true" className={className}>
      <path id={id} d="M-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0" fill="none" />
      <g fill="none" stroke="currentColor">
        <circle r="56" strokeWidth="3.5" />
        <circle r="31" strokeWidth="1.6" />
      </g>
      <text fill="currentColor" fontSize="9" letterSpacing="1" fontWeight="700" style={{ fontFamily: "var(--font-mono)" }}>
        <textPath href={`#${id}`}>MERAZ 7.0 · PARTNER CAFÉ · BHILAI ·</textPath>
      </text>
      <text fill="currentColor" fontSize="15" textAnchor="middle" y="5" style={{ fontFamily: "var(--font-yatra)" }}>
        साथी
      </text>
    </svg>
  );
}

export function CafeFront({ name, n }: { name: string; n: number }) {
  return (
    <>
      <Awning id={`awning-wobble-${n}`} />
      <div className="relative px-4 pt-4">
        <h3 className="relative mx-auto w-fit max-w-full -rotate-1 border-[3px] border-ink bg-turmeric px-4 py-1.5 font-display text-xl leading-tight text-ink shadow-[3px_3px_0_var(--color-ink)]">
          {name}
        </h3>
        {/* the counter */}
        <div className="mx-auto mt-4 flex max-w-60 items-end justify-around border-b-[5px] border-ink px-2">
          {[0, 1, 2].map((k) => (
            <Treat key={k} id={`treat-wobble-${n}-${k}`} n={n + k} className="w-14 sm:w-12 lg:w-14" />
          ))}
        </div>
        <PartnerStamp id={`cafe-stamp-${n}`} className="absolute right-1 top-14 w-16 rotate-12 text-vermillion-deep opacity-80 mix-blend-multiply" />
      </div>
    </>
  );
}

// ======================================================================================================================
// A section's backdrop: its own icons scattered faintly round the edges, each turned a little. Kept to the margins and
// the corners so they never sit under the text.
// ======================================================================================================================

const SPOTS = [
  "left-[3%] top-10 -rotate-12",
  "right-[4%] top-24 rotate-12",
  "left-[6%] top-[38%] rotate-6",
  "right-[2%] top-[55%] -rotate-6",
  "left-[2%] bottom-24 rotate-12",
  "right-[7%] bottom-10 -rotate-12",
];
const MOTIFS: Record<"ambassadors" | "cafes" | "influencers", Icon[]> = {
  ambassadors: [GraduationCapIcon, MegaphoneIcon, TicketIcon, Student, ConfettiIcon, MegaphoneIcon],
  cafes: [Coffee, PizzaIcon, IceCreamIcon, CookieIcon, Coffee, PizzaIcon],
  influencers: [HeartIcon, CameraIcon, PlayIcon, SparkleIcon, FilmReelIcon, HeartIcon],
};

export function Motif({ of }: { of: keyof typeof MOTIFS }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-ink/[.07]">
      {MOTIFS[of].map((Glyph, i) => (
        <Glyph key={i} weight="fill" className={`absolute size-16 sm:size-24 ${SPOTS[i]}`} />
      ))}
    </div>
  );
}

// ======================================================================================================================
// The influencers' phone: a mobile in a case painted truck-art fashion (turmeric, a row of white dots round it),
// playing a reel of four retro scenes in turn: the fest's name over a turning sunburst, the kites over the rooftops,
// a picture palace's marquee, a café's front. Like, comment and share down its side, hearts floating up off the like,
// and under it the truck's painted board, "Follow OK Please". The whole of it is a link to the fest's Instagram.
// ======================================================================================================================

// [right rem, bottom %, size rem, delay s]: the hearts, rising off the like button
const HEARTS = [
  [0.2, 44, 1.4, 0],
  [-1.2, 52, 1, -0.8],
  [0.9, 58, 1.1, -1.5],
] as const;

// A scene's caption, painted on a board across its top.
function SceneTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`absolute inset-x-0 top-9 mx-auto w-fit -rotate-2 border-2 border-ink px-2 py-0.5 font-display text-base leading-tight shadow-[2px_2px_0_var(--color-ink)] ${className}`}>
      {children}
    </p>
  );
}

const SCENES = [
  // the fest's name, painted over a sunburst
  <div key="name" className="absolute inset-0 overflow-hidden bg-rani-deep">
    <div className="sunburst absolute left-1/2 top-1/2 size-[260%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow [--ray-a:#E0218A] [--ray-b:#b8166f]" />
    <div className="halftone absolute inset-0 text-ink/20" />
    <div className="absolute inset-x-0 top-[34%] -rotate-3 text-center">
      <p lang="hi" className="font-deva text-lg text-turmeric">
        मेराज़
      </p>
      <p className="painted misprint font-display text-[2.6rem] leading-none text-cream">MERAZ</p>
      <p className="painted mt-1 font-display text-3xl leading-none text-turmeric">7.0</p>
    </div>
  </div>,
  // the kites over the rooftops
  <div key="kites" className="absolute inset-0 overflow-hidden bg-teal">
    <div className="halftone absolute inset-0 text-cream/15" />
    <div className="absolute -right-6 top-16 size-24 rounded-full border-[3px] border-ink bg-turmeric" />
    <SceneTitle className="bg-cream text-ink">Meraz flies far</SceneTitle>
    <span className="absolute left-[14%] top-[36%] block w-12 origin-bottom animate-swing">
      <Kite id="reel-kite-a" a={RANI} b={TURMERIC} />
    </span>
    <span className="absolute right-[16%] top-[30%] block w-10 origin-bottom animate-swing" style={{ animationDelay: "-1.4s" }}>
      <Kite id="reel-kite-b" a={VERMILLION} b={CREAM} />
    </span>
    <Rooftops id="reel-roofs" className="absolute inset-x-0 bottom-0 h-20 w-full" />
  </div>,
  // a picture palace's marquee
  <div key="talkies" className="absolute inset-0 overflow-hidden bg-ink">
    <div className="halftone absolute inset-0 text-cream/10" />
    <div className="absolute inset-x-3 top-[30%] border-[3px] border-ink bg-vermillion p-1.5 shadow-[3px_3px_0_var(--color-rani-deep)]">
      <Bulbs n={7} className="px-0.5 [&>span]:!size-2" />
      <div className="my-1.5 border-2 border-ink bg-cream px-1 py-2 text-center">
        <p className="font-mono text-[0.5rem] font-bold uppercase tracking-[.25em] text-rani-deep">Now showing</p>
        <p className="painted misprint font-display text-3xl leading-none text-turmeric">You</p>
      </div>
      <Bulbs n={7} className="px-0.5 [&>span]:!size-2" />
    </div>
    <p className="absolute left-3 right-10 top-[66%] font-display text-sm leading-tight text-cream/90">Starring: every creator</p>
  </div>,
  // a café's front
  <div key="cafe" className="absolute inset-0 overflow-hidden bg-paper">
    <div className="absolute inset-x-0 top-8">
      <Awning id="reel-awning" />
    </div>
    <SceneTitle className="!top-[5.5rem] bg-turmeric text-ink">Chai pe Meraz</SceneTitle>
    <div className="absolute inset-x-4 top-[52%] flex items-end justify-around border-b-4 border-ink">
      {[0, 2, 3].map((k) => (
        <Treat key={k} id={`reel-treat-${k}`} n={k} className="w-11" />
      ))}
    </div>
  </div>,
];

export function ReelPhone({ className }: { className: string }) {
  return (
    <a
      href={`https://www.instagram.com/${site.instagram}/`}
      target="_blank"
      rel="noopener"
      aria-label={`Meraz on Instagram, @${site.instagram}`}
      className={`group relative block transition-transform hover:-translate-y-1 ${className}`}
    >
      {/* the case, its dots, the bezel */}
      <div aria-hidden="true" className="rotate-2 rounded-[2rem] border-4 border-ink bg-turmeric bg-[radial-gradient(circle,rgb(255_255_255/0.8)_1.4px,transparent_1.8px)] bg-[length:10px_10px] p-2.5 shadow-[6px_6px_0_var(--color-ink)] transition-shadow group-hover:shadow-[8px_8px_0_var(--color-rani-deep)]">
        <div className="rounded-[1.4rem] border-[3px] border-ink bg-ink p-1.5">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink">
            {/* the reel's scenes, each on screen for its quarter of the turn (keep the delays in step with
                --animate-reel-scene in app/globals.css) */}
            {SCENES.map((scene, i) => (
              <div key={i} className="absolute inset-0 animate-reel-scene" style={{ animationDelay: `${i * 4 - 16}s` }}>
                {scene}
              </div>
            ))}
            {/* the notch, the label */}
            <span className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink" />
            <p className="absolute left-3 top-4 flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[.2em] text-cream drop-shadow-[1px_1px_0_var(--color-ink)]">
              <span className="size-2 animate-pulse rounded-full bg-turmeric" />
              Reels
            </p>
            {/* like, comment, share */}
            <div className="absolute bottom-10 right-2.5 flex flex-col items-center gap-3 text-cream">
              <HeartIcon weight="fill" className="size-6 text-turmeric drop-shadow-[1px_1px_0_var(--color-ink)]" />
              <ChatCircleIcon weight="fill" className="size-6 drop-shadow-[1px_1px_0_var(--color-ink)]" />
              <PaperPlaneTiltIcon weight="fill" className="size-6 drop-shadow-[1px_1px_0_var(--color-ink)]" />
            </div>
            {/* the account, the progress through each scene */}
            <p className="absolute bottom-5 left-3 flex items-center gap-1 text-[0.65rem] font-bold text-cream drop-shadow-[1px_1px_0_var(--color-ink)]">
              <MusicNotesIcon weight="fill" className="size-3.5" />@{site.instagram}
            </p>
            <span className="absolute inset-x-3 bottom-2.5 h-1 rounded-full bg-cream/40">
              <span className="block h-full origin-left animate-reel-bar rounded-full bg-cream" />
            </span>
          </div>
        </div>
      </div>
      {HEARTS.map(([right, bottom, size, delay]) => (
        <svg
          key={size}
          viewBox="-16 -8 32 26"
          aria-hidden="true"
          className="absolute animate-bob"
          style={{ right: `${right}rem`, bottom: `${bottom}%`, width: `${size}rem`, animationDelay: `${delay}s`, animationDuration: "2.2s" }}
        >
          <path d="M0 4C-6-4-14 2-8 8L0 15 8 8C14 2 6-4 0 4Z" fill={RANI} stroke={INK} strokeWidth="1.5" className="animate-pulse" style={{ animationDelay: `${delay}s` }} />
        </svg>
      ))}
      {/* the truck's board */}
      <span aria-hidden="true" className="relative mx-auto mt-5 block w-fit -rotate-2 border-[3px] border-ink bg-vermillion-deep px-3 py-1 text-center font-display text-lg leading-tight text-cream shadow-[3px_3px_0_var(--color-ink)]">
        Follow <span className="text-turmeric">OK</span> Please
      </span>
    </a>
  );
}
