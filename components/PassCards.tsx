"use client";

// The passes as Meraz Express tickets (public/passes/ticket.webp, the Canva ticket at 2x 961 x 348, its printed pass
// name left out). The pass's name is printed where the ticket had it, its button is the Buy Now link, and its
// details are printed on the blank body. Large screens: two rows of 2 sliding tickets each.
import { useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import type { Pass } from "@/data/content";

const BUY_NOW_URL = "https://meraz.ksverse.in/";

// Original reference values (2 passes per row) — taller tickets so content fits
const ROW = "calc((100cqw - 1rem) * 0.35)";    // was 0.29846
const OPEN = "((100cqw - 1rem) * 0.8242)";     // original width
const STUB = "((100cqw - 1rem) * 0.17578)";    // original width

function Details({ p }: { p: Pass }) {
  // The pronite pass titles end "... with ARTIST & ARTIST."; the artists get a bold line each so they read from far.
  const m = p.title.match(/^(.*?\bwith)\s+([A-Z0-9.\- &]+?)\.?$/);
  return (
    <>
      <p className="font-mono text-xs font-bold uppercase tracking-[.3em] text-[#7a061d] pb-3">
        Meraz 7.0 · 30 October to 1 November, 2026
      </p>
      {m ? (
        <p className="font-poster text-[1.25em] leading-tight">
          {m[1]}
          {m[2].split(/\s&\s/).map((a) => (
            <span key={a} className="block text-[1.12em] font-black uppercase tracking-wide text-[#7a061d]">{a}</span>
          ))}
        </p>
      ) : (
        <p className="font-poster text-[1.25em] leading-tight">{p.title}</p>
      )}
      <div className="mt-[0.6em] grid grid-cols-[repeat(auto-fit,minmax(14em,1fr))] gap-x-[1.5em] gap-y-[0.8em]">
        {p.discountCategories.map((c) => (
          <div key={c.type}>
            <p className="font-bold uppercase tracking-wider">{c.type}</p>
            <ul className="mt-[0.3em] space-y-[0.15em]">
              {c.discounts.map((d) => (
                <li key={d} className="flex gap-[0.5em]">
                  <span className="mt-[0.45em] size-[0.4em] shrink-0 rotate-45 bg-current" aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

// A ticket, its name and Buy Now button on it, and its details when given a class for them (there being room).
function Ticket({ p, details, className = "", fontSize }: { p: Pass; details?: string; className?: string; fontSize: string }) {
  return (
    <div className={`relative aspect-[961/348] font-mono text-[#3d2a14] ${className}`} style={{ fontSize }}>
      <img src="/passes/ticket.webp" alt="" width={961} height={348} className="absolute inset-0 size-full" />
      <h2 className="absolute left-[58.2%] top-[90.8%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[1.22em] font-bold uppercase tracking-[0.12em]">
        {p.name}
      </h2>
      <a
        href={BUY_NOW_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Buy ${p.name} (opens in new tab)`}
        className="absolute left-[29.1%] top-[81.3%] aspect-square w-[7.9%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-110 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
      >
        <span className="absolute left-full top-1/2 ml-[0.4em] flex -translate-y-1/2 items-center gap-[0.3em] whitespace-nowrap text-[0.9em] font-bold uppercase tracking-widest">
          Buy now <ArrowUpRight weight="bold" aria-hidden="true" />
        </span>
      </a>
      {details !== undefined && (
        <div className={`absolute bottom-[30%] left-[24.5%] right-[4%] top-[18%] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[0.92em] leading-tight ${details}`}>
          <Details p={p} />
        </div>
      )}
    </div>
  );
}

// The ticket's maroon half-moons biting into the paper, ringed like its frame (cream, then a dark line).
function Bite({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute size-9 rounded-full bg-[#7a061d] shadow-[0_0_0_2px_#f6e3a4,0_0_0_3.5px_#3d1a08] ${className}`} />;
}

// Smaller screens: the same ticket stood up, made of its own pieces (public/passes/stamp, class, title, barcode and coin
// .webp, cut from ticket.webp, the paper keyed out of all but the coin): its stub on top with the stamp and the pass's
// name, torn off along the perforation from the body, which carries the details and the Buy Now coin.
function TallTicket({ p, train }: { p: Pass; train: boolean }) {
  return (
    <article aria-label={p.name} className="relative bg-[#7a061d] p-2.5 drop-shadow-[0_14px_18px_rgb(0_0_0/0.3)]">
      {train && <img src="/passes/train.webp" alt="" width={88} height={66} className="absolute bottom-full left-[12%] w-16" />}
      <div className="relative overflow-hidden bg-[#f4f1a0] font-mono text-[#3d2a14] shadow-[inset_0_0_0_2px_#f6e3a4,inset_0_0_0_3.5px_#3d1a08,inset_0_0_32px_rgb(160_140_30/0.35)]">
        <Bite className="-left-[18px] -top-[18px]" />
        <Bite className="-right-[18px] -top-[18px]" />
        <Bite className="-bottom-[18px] -left-[18px]" />
        <Bite className="-bottom-[18px] -right-[18px]" />

        {/* the stub */}
        <div className="flex items-center gap-4 px-6 pb-5 pt-7">
          <img src="/passes/stamp.webp" alt="" width={212} height={212} className="w-[30%] max-w-28 shrink-0 -rotate-6" />
          <div className="min-w-0 grow">
            <img src="/passes/class.webp" alt="2nd class" width={130} height={38} className="h-4 w-auto" />
            <img src="/passes/title.webp" alt="Meraz Express" width={590} height={72} className="mt-2 w-full" />
            <h2 className="mt-2 whitespace-nowrap text-[clamp(.85rem,4vw,1.2rem)] font-bold uppercase tracking-[0.1em]">{p.name}</h2>
          </div>
        </div>

        {/* the perforation, a half-moon at each end */}
        <div className="relative mx-6 border-t-[3px] border-dashed border-[#7a061d]">
          <Bite className="-left-[calc(1.5rem+18px)] -top-[19.5px]" />
          <Bite className="-right-[calc(1.5rem+18px)] -top-[19.5px]" />
        </div>

        {/* the body */}
        <div className="px-6 pb-8 pt-6 text-[15px] leading-snug overflow-y-auto max-h-[60vh]">
          <Details p={p} />
          <div className="mt-6 flex items-end justify-between gap-4 flex-shrink-0">
            <a
              href={BUY_NOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buy ${p.name} (opens in new tab)`}
              className="group flex items-center gap-2 font-bold uppercase tracking-widest focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <img src="/passes/coin.webp" alt="" width={166} height={166} className="size-20 transition-transform group-hover:scale-110 group-active:scale-95" />
              <span className="flex items-center gap-1 whitespace-nowrap">
                Buy now <ArrowUpRight weight="bold" aria-hidden="true" />
              </span>
            </a>
            <img src="/passes/barcode.webp" alt="" width={188} height={148} className="hidden h-14 w-auto shrink-0 min-[360px]:block" />
          </div>
        </div>
      </div>
    </article>
  );
}


export default function PassCards({ passes }: { passes: Pass[] }) {
  const [active, setActive] = useState([0, 0]); // [row1, row2]
  const rows = [passes.slice(0, 2), passes.slice(2, 4)];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-16">
      <div className="@container mx-auto max-w-6xl">
        {/* Two rows of sliding tickets */}
        <div className="flex flex-col gap-12">
          {rows.map((rowPasses, rowIdx) => (
            <div key={rowIdx} className="relative hidden gap-4 lg:flex" style={{ height: ROW }}>
            <img
              src="/passes/train.webp"
              alt=""
              width={88}
              height={66}
              className="absolute bottom-full transition-[left] duration-500"
              style={{
                left: `calc(${active[rowIdx]} * ${STUB} + ${active[rowIdx]} * 1rem + ${OPEN} * 0.184)`,
                width: `calc(${OPEN} * 0.092)`
              }}
            />
            {rowPasses.map((p, i) => {
              const on = i === active[rowIdx];
              return (
                <article
                  key={p.name}
                  aria-label={p.name}
                  className={`relative overflow-hidden drop-shadow-[0_14px_18px_rgb(0_0_0/0.3)] transition-[flex-grow] duration-500 ${on ? "grow" : "grow-0"}`}
                  style={{ flexBasis: `calc(${STUB})` }}
                >
                  <div inert={!on} className="h-full" style={{ width: `calc(${OPEN})` }}>
                    <Ticket
                      p={p}
                      details={`transition-opacity duration-300 ${on ? "delay-300" : "opacity-0"}`}
                      className="size-full"
                      fontSize={`calc(${OPEN} * 0.0155)`}
                    />
                  </div>
                  {!on && (
                    <button type="button" onClick={() => setActive(a => { const n = [...a]; n[rowIdx] = i; return n; })} aria-expanded={false} aria-label={`Open the ${p.name}`} className="absolute inset-0 cursor-pointer">
                      <span
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#7a061d]/90 py-1 text-center font-mono font-bold uppercase tracking-widest text-cream flex items-center justify-center gap-1"
                        style={{ fontSize: `calc(${OPEN} * 0.013)` }}
                      >
                        {p.name}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ))}
      </div>

      {/* smaller: tall tickets, everything printed on them; two side by side on a tablet */}
      <ul className="mx-auto grid max-w-md items-start gap-16 md:max-w-none md:grid-cols-2 md:gap-8 lg:hidden">
        {passes.map((p) => (
          <li key={p.name}>
            <TallTicket p={p} train={false} />
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}