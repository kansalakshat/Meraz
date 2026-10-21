"use client";

// Events page, same behaviour as the reference:
// - a title panel + one panel per category; clicking a panel opens it (800ms lock while it animates)
// - the open panel shows heading, description and a 3D carousel of sub-events (arrows + dots)
// - register rules: SCI-TECH gets IIT / non-IIT buttons, INFORMALS without a link says "on the spot",
//   everything else with a link gets one Register button. All links open in a new tab.
import { useRef, useState, type KeyboardEvent } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { eventCategories, type EventCategory, type SubEvent } from "@/data/events";

export const tones = ["bg-marigold text-ink", "bg-rani-deep text-cream", "bg-teal-deep text-cream", "bg-vermillion-deep text-cream", "bg-ink text-cream", "bg-[#6b3f1f] text-cream"];
const panels = [{ id: 0, title: "EVENTS", hindi: "कार्यक्रम" } as const, ...eventCategories];

export default function EventsPanels() {
  const [active, setActive] = useState(0);
  const locked = useRef(false);

  function open(i: number) {
    if (locked.current || i === active) return;
    locked.current = true;
    setActive(i);
    setTimeout(() => (locked.current = false), 800);
  }

  return (
    <div id="categories" className="flex flex-col pt-[4.6rem] md:h-[100dvh] md:flex-row">
      {panels.map((p, i) => {
        const on = i === active;
        return (
          <section
            key={p.id}
            className={`relative flex flex-col overflow-hidden border-ink max-md:border-b-4 md:flex-row md:border-l-4 md:transition-[flex-grow] md:duration-700 md:ease-[cubic-bezier(.7,0,.3,1)] ${tones[i]} ${on ? "md:grow" : "md:grow-0"} md:basis-[4.5rem]`}
          >
            <div className="halftone pointer-events-none absolute inset-0 text-ink/10" aria-hidden="true" />
            <button
              type="button"
              onClick={() => open(i)}
              aria-expanded={on}
              aria-controls={`panel-${p.id}`}
              className="relative flex min-h-14 shrink-0 items-center gap-3 px-4 text-left md:h-full md:w-[4.5rem] md:flex-col md:justify-center md:px-0"
            >
              <span className="font-display text-lg md:[writing-mode:vertical-rl] md:rotate-180 md:text-xl">{p.title}</span>
              <span className="font-deva text-base opacity-90 md:[writing-mode:vertical-rl] md:rotate-180">{p.hindi}</span>
            </button>
            {on && (
              <div id={`panel-${p.id}`} className="relative flex min-w-0 flex-1 flex-col justify-center px-4 pb-10 pt-2 md:overflow-y-auto md:px-10 md:py-10">
                {"heading" in p ? <CategoryContent cat={p} /> : <TitleContent />}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TitleContent() {
  return (
    <div className="text-center">
      <p className="painted font-deva text-[clamp(2.5rem,7vw,4.5rem)] leading-none text-cream" aria-hidden="true">
        कार्यक्रम
      </p>
      <h1 className="painted font-display text-[clamp(3.5rem,12vw,8rem)] leading-[.85] text-cream misprint">EVENTS</h1>
      <p className="mx-auto mt-6 w-fit bg-ink px-3 py-1 font-mono text-sm font-bold tracking-widest text-turmeric">PICK A CATEGORY TO OPEN IT</p>
    </div>
  );
}

// split: on a short landscape screen (see the short variant in app/globals.css) the blurb sits beside the tickets.
export function CategoryContent({ cat, split = false }: { cat: EventCategory; split?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-4xl ${split ? "short:grid short:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] short:items-center short:gap-4" : ""}`}>
      <div>
        <h2 className={`painted font-display text-[clamp(2rem,5vw,3.75rem)] leading-none text-cream ${split ? "short:text-3xl" : ""}`}>{cat.heading}</h2>
        <p className={`mt-3 max-w-2xl text-base sm:text-lg ${split ? "short:text-sm" : ""}`}>{cat.description}</p>
      </div>
      <Carousel items={cat.subEvents} category={cat.title} split={split} />
    </div>
  );
}

export function Carousel({ items, category, split = false }: { items: SubEvent[]; category: string; split?: boolean }) {
  const [index, setIndex] = useState(0);
  const n = items.length;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };

  return (
    // beside the blurb, clipped: the side tickets would otherwise swing out over it
    <div className={`mt-6 sm:mt-8 ${split ? "short:-m-2 short:overflow-hidden short:p-2" : ""}`} role="region" aria-roledescription="carousel" aria-label={`${category} events`} onKeyDown={onKey}>
      {/* phones: the ticket takes the full width, its arrows on a row of their own below it (but beside it, beside the
          blurb: below, they would fall out of the short dialog) */}
      <div className={`relative flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap ${split ? "short:flex-nowrap" : ""}`}>
        {n > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous event" className="btn relative z-10 size-11 shrink-0 justify-center bg-cream !p-0 text-ink">
            <CaretLeft weight="bold" aria-hidden="true" />
          </button>
        )}
        <div className={`relative order-first grid basis-full [perspective:1200px] sm:order-none sm:flex-1 sm:basis-auto ${split ? "short:order-none short:flex-1 short:basis-auto" : ""}`}>
          {items.map((ev, k) => {
            const off = (k - index + n) % n;
            const pos = off === 0 ? "active" : off === 1 ? "right" : off === n - 1 ? "left" : "hide";
            return (
              <article key={ev.title} className="carousel-card" data-pos={pos} aria-hidden={pos !== "active"} inert={pos !== "active"}>
                <Ticket ev={ev} category={category} serial={k} split={split} />
              </article>
            );
          })}
        </div>
        {n > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next event" className="btn relative z-10 size-11 shrink-0 justify-center bg-cream !p-0 text-ink">
            <CaretRight weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>
      {/* beside the blurb there is no height for the dots: the arrows do */}
      {n > 1 && (
        <div className={`mt-5 flex flex-wrap justify-center gap-1.5 ${split ? "short:hidden" : ""}`}>
          {items.map((ev, k) => (
            <button
              key={ev.title}
              type="button"
              onClick={() => setIndex(k)}
              aria-label={`Show ${ev.title}`}
              aria-current={k === index}
              className="grid size-7 place-items-center"
            >
              <span className={`block size-3 rotate-45 border-2 border-current ${k === index ? "bg-turmeric" : ""}`} />
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {items[index].title}, {index + 1} of {n}
      </p>
    </div>
  );
}

// A long description scrolls inside the ticket rather than being cut off. split: beside the blurb (see CategoryContent),
// the ticket may take the dialog's height.
export function Ticket({ ev, category, serial, split = false }: { ev: SubEvent; category: string; serial: number; split?: boolean }) {
  return (
    <div className={`flex h-full max-h-[52vh] overflow-hidden rounded-md border-[3px] border-ink bg-cream text-ink shadow-[6px_6px_0_var(--color-ink)] ${split ? "short:max-h-[calc(94dvh-2rem)]" : ""}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 bg-ink px-3 py-2 font-mono text-xs font-bold text-turmeric sm:px-4 shrink-0">
          <span className="min-w-0 truncate">{category}</span>
          <span className="shrink-0">ADMIT ONE</span>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-4 min-h-0 overflow-hidden">
          <h3 className="font-poster text-lg leading-tight [overflow-wrap:anywhere] sm:text-2xl shrink-0">{ev.title}</h3>
          {ev.stall && <p className="mt-1 shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest text-vermillion-deep sm:text-xs">{ev.stall}</p>}
          <p className="mt-1 text-xs leading-relaxed sm:text-sm flex-1 min-h-0 overflow-y-auto">{ev.desc}</p>
          <div className="mt-2 pt-2 shrink-0">
            <RegisterArea ev={ev} category={category} />
          </div>
        </div>
      </div>
      <div className="relative w-0 border-l-[3px] border-dashed border-ink" aria-hidden="true">
        <span className="absolute -left-[11px] -top-3 size-5 rounded-full border-[3px] border-ink bg-cream" />
        <span className="absolute -bottom-3 -left-[11px] size-5 rounded-full border-[3px] border-ink bg-cream" />
      </div>
      <div className="flex w-9 shrink-0 items-center justify-center bg-turmeric sm:w-14" aria-hidden="true">
        <span className="rotate-90 whitespace-nowrap font-mono text-xs font-bold tracking-widest">No. {String(70123 + serial * 137).padStart(6, "0")}</span>
      </div>
    </div>
  );
}

function RegisterArea({ ev, category }: { ev: SubEvent; category: string }) {
  const link = (href: string | undefined, label: string) => (
    <a href={href || "#"} target="_blank" rel="noopener noreferrer" className="btn bg-rani-deep !px-4 !py-2 !text-sm text-cream">
      {label}
    </a>
  );
  if (category === "SCI-TECH") {
    if (!ev.registerUrlIIT)
      return <p className="w-fit -rotate-2 border-4 border-double border-vermillion-deep px-3 py-1 font-display text-sm text-vermillion-deep">Coming Soon</p>;
    return (
      <div className="flex flex-wrap gap-4">
        <div>
          {link(ev.registerUrlIIT, "Register")}
          <p className="mt-2 font-mono text-[11px] font-bold uppercase">For IIT Bhilai students</p>
        </div>
        <div>
          {link(ev.registerUrlNonIIT, "Register")}
          <p className="mt-2 font-mono text-[11px] font-bold uppercase">For non-IIT Bhilai students</p>
        </div>
      </div>
    );
  }
  if (category === "INFORMALS & VARCHASVA" && !ev.registerUrlIIT)
    return <p className="w-fit -rotate-2 border-4 border-double border-vermillion-deep px-3 py-1 font-display text-sm text-vermillion-deep">All registrations will be done on the spot</p>;
  if ((category === "CULTURALS" || category === "FinTech" || category === "E-CELL") && !ev.registerUrlIIT)
    return <p className="w-fit -rotate-2 border-4 border-double border-vermillion-deep px-3 py-1 font-display text-sm text-vermillion-deep">Coming Soon</p>;
  if (ev.registerUrlIIT) return link(ev.registerUrlIIT, "Register");
  return null;
}
