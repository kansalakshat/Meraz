import type { Metadata } from "next";
import { Creeper, Garland, Rangoli, Stamp, Station } from "@/components/PassesArt";
import PassCards from "@/components/PassCards";
import { Container } from "@/components/ui";
import { passes } from "@/data/content";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Passes", description: "Student and Access passes for Meraz 7.0." };

// A painted poster: the dancer (public/passes/woman.webp, cut from woman.jpeg at the project root) out to the left of
// the title on large screens, the tiger (tiger.webp) prowling in on the right beside the notice; side by side under
// the notice on smaller screens.
// Around them a mela (components/PassesArt): marigold garlands with swinging bells strung under the header, the dancer
// on a rangoli, the clerk's stamp on the notice, and the old station with the Express standing at it closing the
// page. Behind it all: a faint Madhubani tile (fish, lotus, sun, peacock), washes of colour, creepers in the top corners.
export default function PassesPage() {
  return (
    <div className="madhubani relative isolate overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -right-40 top-10 size-[38rem] rounded-full bg-turmeric/35 blur-3xl" />
        <div className="absolute -left-48 top-[40%] size-[34rem] rounded-full bg-marigold/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-[36rem] rounded-full bg-rani/15 blur-3xl" />
        {/* top: clear of the fixed header, the creepers hanging from under it */}
        <Creeper id="creeper-l" className="absolute -left-3 top-[4.4rem] w-[clamp(4.5rem,13vw,13rem)] origin-top animate-sway" />
        <Creeper id="creeper-r" className="absolute -right-3 top-[4.4rem] w-[clamp(4rem,11vw,11rem)] origin-top -scale-x-100 animate-sway [animation-delay:-1.8s]" />
        {/* a second, shorter creeper twined in beside each */}
        <Creeper id="creeper-l2" className="absolute left-[3%] top-[4.4rem] w-[clamp(3rem,8vw,8rem)] origin-top animate-sway [animation-delay:-0.9s]" />
        <Creeper id="creeper-r2" className="absolute right-[3%] top-[4.4rem] w-[clamp(3rem,7vw,7rem)] origin-top -scale-x-100 animate-sway [animation-delay:-2.6s]" />
        <Garland className="absolute inset-x-0 top-[4.4rem] h-[clamp(5rem,9vw,9rem)] w-full" />
      </div>
      <section aria-labelledby="passes-title" className="relative px-4 pb-6 pt-40 sm:px-8 lg:pb-28 lg:pt-52">
        <div className="mx-auto max-w-[32rem]">
          {/* a soft cream halo keeps the title crisp over the Madhubani ground */}
          <h1 id="passes-title" className="-mx-8 px-8 py-4 text-center [background:radial-gradient(closest-side,rgb(243_230_200/.9)_55%,transparent)]">
            <span className="block font-mono text-xs font-bold uppercase tracking-[.35em] text-rani-deep sm:text-sm">
              {site.name} · {site.theme}
            </span>
            <span className="mt-3 block font-poster text-[clamp(1.6rem,3.4vw,2.6rem)] leading-none text-teal-deep">grab your</span>
            <span className="block font-poster text-[clamp(4rem,12vw,8.5rem)] leading-[.85] text-ink">Passes</span>
            <svg viewBox="0 0 240 16" aria-hidden="true" className="mx-auto mt-3 w-[min(70%,16rem)] text-rani">
              <path d="M3 10 Q33 2 63 9 T123 9 T183 9 T237 7" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </h1>

          {/* the notice, a handbill pasted up a little askew */}
          <div className="relative mx-auto mt-10 max-w-md -rotate-1 border-[3px] border-ink bg-turmeric px-6 py-5 text-center shadow-[6px_6px_0_var(--color-ink)]">
            <Stamp id="clerk-stamp" className="absolute -right-3 -top-12 w-[clamp(5rem,9vw,7rem)] rotate-12 text-rani-deep opacity-85 mix-blend-multiply sm:-right-12" />
            <p className="inline-block bg-ink px-2 py-0.5 font-display text-sm tracking-widest text-turmeric">Notice</p>
            <p className="mt-2 font-bold">Entry to the campus requires a valid Access/Student Pass.</p>
            <p className="mt-1">
              For any queries/issues contact{" "}
              {site.passQueryPhones.map((phone, i) => (
                <span key={phone}>
                  {i > 0 && " or "}
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="whitespace-nowrap font-bold underline decoration-2 underline-offset-4">
                    {phone}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-xs font-bold uppercase tracking-[.3em] text-rani-deep">
          Meraz 7.0 · 30 October to 1 November, 2026
        </p>

        {/* side by side under the notice on smaller screens; on large ones the row dissolves (contents) and each is
            placed out beside the title and notice */}
        <div className="mx-auto mt-14 flex max-w-3xl items-end justify-between gap-2 lg:contents">
          {/* dancing in the middle of a rangoli laid flat on the ground, turning slowly: her feet are 40% across her
              picture, and the squashed rangoli's centre, a fifth of its width up from its bottom edge, is set on them */}
          <div className="relative w-[47%] lg:absolute lg:left-[5%] lg:top-56 lg:w-[clamp(18rem,27vw,27rem)]">
            <div className="absolute -bottom-[16%] left-[40%] w-full origin-bottom sm:-bottom-[18%] sm:w-[115%] -translate-x-1/2 scale-y-[.32]">
              <Rangoli className="w-full animate-spin-slow" />
            </div>
            <img src="/passes/woman.webp" alt="" width={700} height={795} className="relative w-full origin-bottom animate-sway" />
          </div>
          <div className="w-[51%] lg:absolute lg:right-[3%] lg:top-[25rem] lg:w-[clamp(18rem,29vw,28rem)]">
            <img src="/passes/tiger.webp" alt="" width={900} height={738} className="w-full animate-prowl" />
          </div>
        </div>
      </section>

      {/* pt-16: room for the train on the first ticket */}
      <Container className="pt-16">
        <PassCards passes={passes} />
      </Container>

      {/* the station the tickets are for, closing the page */}
      <Station id="station" className="mt-16 block h-[clamp(11rem,26vw,24rem)] w-full" />
    </div>
  );
}
