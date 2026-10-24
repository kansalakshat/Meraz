import type { Metadata } from "next";
import { ArrowSquareOut, DownloadSimple, MagnifyingGlass, Phone } from "@phosphor-icons/react/ssr";
import { CafeFront, KiteHero, Motif, ReelPhone, Talkies } from "@/components/OutreachArt";
import { Container } from "@/components/ui";
import { outreach } from "@/data/content";

export const metadata: Metadata = {
  title: "Outreach",
  description: "Meraz 7.0 campus ambassadors, partnered cafés and partnered influencers, with each programme's rulebook.",
};

// The kites over the rooftops and the picture palace's film posters (components/OutreachArt.tsx), then three
// sections, each closing on its programme's rulebook: the campus ambassadors (with the referral perks and the outreach
// lead to call), the partnered cafés, and the partnered influencers. The lists fill in from data/content.ts.
const { ambassadors, cafes, influencers } = outreach;
// the ambassadors under their colleges, the colleges with the most first
const byCollege = [
  ...ambassadors.people.reduce((m, p) => m.set(p.college, [...(m.get(p.college) ?? []), p.name]), new Map<string, string[]>()),
].sort((a, b) => b[1].length - a[1].length);

// A section's title on a painted board, its Hindi above it.
function Heading({ id, hindi, children }: { id: string; hindi: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <p lang="hi" aria-hidden="true" className="font-deva text-2xl text-rani-deep sm:text-3xl">
        {hindi}
      </p>
      <h2 id={id} className="mx-auto mt-1 w-fit max-w-full -rotate-1 border-4 border-ink bg-turmeric px-5 py-2 font-display text-[clamp(1.6rem,5vw,2.75rem)] leading-tight text-ink shadow-[6px_6px_0_var(--color-ink)]">
        {children}
      </h2>
    </div>
  );
}

// Until the list is filled in.
function ToBeAnnounced({ what }: { what: string }) {
  return (
    <p className="mx-auto mt-10 max-w-md border-4 border-dashed border-ink/40 bg-cream/70 px-6 py-8 text-center font-display text-xl text-ink/70">
      {what} to be announced
    </p>
  );
}

// The programme's call to join: what's said beside it, and the button to its form ("Opening soon" until there is one).
function Apply({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-5 border-4 border-ink bg-turmeric px-6 py-5 text-center shadow-[6px_6px_0_var(--color-ink)] sm:flex-row sm:text-left">
      <div>{children}</div>
      {href ? (
        <a href={href} target="_blank" rel="noopener" className="btn shrink-0 bg-rani-deep text-cream">
          {label}
        </a>
      ) : (
        <p className="btn pointer-events-none shrink-0 bg-cream text-ink/70">
          {label}: opening soon
        </p>
      )}
    </div>
  );
}

// A line beside the cafés' and influencers' buttons.
function Pitch({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <>
      <p className="font-mono text-xs font-bold uppercase tracking-[.3em] text-rani-deep">{kicker}</p>
      <p className="mt-1 font-display text-2xl leading-tight">{children}</p>
    </>
  );
}

// The programme's rulebook: its cover, to open it, and a download.
function Rulebook({ href, cover, title }: { href: string; cover: string; title: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 border-4 border-ink bg-ink p-4 text-cream shadow-[8px_8px_0_var(--color-rani-deep)] sm:flex-row sm:p-5">
      <a href={href} target="_blank" rel="noopener" className="block w-full shrink-0 border-2 border-cream/30 transition-transform hover:-rotate-1 hover:scale-[1.02] sm:w-64">
        <img src={cover} alt={`Cover of the ${title}`} width={960} height={540} loading="lazy" className="block w-full" />
      </a>
      <div className="text-center sm:text-left">
        <p className="font-mono text-xs font-bold uppercase tracking-[.3em] text-turmeric">Rulebook</p>
        <h3 className="mt-1 font-display text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-cream/75">PDF, about 3 MB</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
          <a href={href} target="_blank" rel="noopener" className="btn bg-rani-deep !px-4 !py-2 text-cream">
            <ArrowSquareOut size={20} weight="bold" aria-hidden="true" />
            Read it
          </a>
          <a href={href} download className="btn bg-cream !px-4 !py-2 text-ink">
            <DownloadSimple size={20} weight="bold" aria-hidden="true" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

const TIER_PAINT = ["bg-teal-deep", "bg-rani-deep", "bg-vermillion-deep", "bg-ink"];

// Instagram's own logo, in its colours: the camera drawn in white on the yellow-to-violet glow.
function InstaLogo({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-11 shrink-0 drop-shadow-[2px_2px_0_var(--color-ink)]">
      <radialGradient id={id} cx="0.3" cy="1.07" r="1.5">
        <stop offset="0" stopColor="#fdf497" />
        <stop offset=".05" stopColor="#fdf497" />
        <stop offset=".45" stopColor="#fd5949" />
        <stop offset=".6" stopColor="#d6249f" />
        <stop offset=".9" stopColor="#285aeb" />
      </radialGradient>
      <rect width="48" height="48" rx="12" fill={`url(#${id})`} />
      <g fill="none" stroke="#fff" strokeWidth="3.6">
        <rect x="10" y="10" width="28" height="28" rx="8.5" />
        <circle cx="24" cy="24" r="6.6" />
      </g>
      <circle cx="32.4" cy="15.6" r="2.1" fill="#fff" />
    </svg>
  );
}

export default function OutreachPage() {
  const tel = ambassadors.contact.phone.replace(/\\s/g, "");
  return (
    <div className="bg-paper text-ink">
      <KiteHero />
      
      <Talkies />

      {/* Campus ambassadors */}
      <section id="ambassadors" aria-labelledby="ambassadors-title" className="relative scroll-mt-24 overflow-hidden py-4">
        <Motif of="ambassadors" />
        <img src="/outreach/AMBAASSDOR.webp" alt="Campus Ambassadors" width={1200} height="400" loading="lazy" className="mx-auto mt-0 w-full max-w-lg" />
        <Container className="relative">
          <Heading id="ambassadors-title" hindi="हमारे कैंपस एम्बेसडर">
            Our Campus Ambassadors
          </Heading>
          {ambassadors.people.length ? (
            <>
              <p className="mt-6 text-center text-ink/75">
                {ambassadors.people.length} ambassadors from {byCollege.length} colleges
              </p>
              <ul className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {byCollege.map(([college, names]) => (
                  <li key={college} className="mb-5 break-inside-avoid border-[3px] border-ink bg-cream shadow-[4px_4px_0_var(--color-ink)]">
                    <h3 className="border-b-[3px] border-ink bg-teal-deep px-4 py-2 font-display text-lg leading-tight text-cream">{college}</h3>
                    <ul className="flex flex-wrap gap-2 px-4 py-3">
                      {names.map((n) => (
                        <li key={n} className="border-2 border-ink/60 bg-paper px-2 py-0.5 leading-snug">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ToBeAnnounced what="Ambassadors" />
          )}

          <h3 className="mt-16 text-center font-display text-[clamp(1.4rem,4vw,2.1rem)]">Perks</h3>
          <p className="mt-1 text-center text-ink/75">The more students you bring to Meraz, the more you unlock.</p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ambassadors.perks.map((t, i) => (
              <li key={t.referrals} className="flex flex-col border-[3px] border-ink bg-cream shadow-[5px_5px_0_var(--color-ink)]">
                <p className={`border-b-[3px] border-ink px-4 py-3 font-display text-2xl text-cream ${TIER_PAINT[i]}`}>
                  {t.referrals} <span className="text-base">referrals</span>
                </p>
                <ul className="grow list-disc space-y-1.5 py-4 pl-9 pr-4 text-[0.95rem] leading-snug marker:text-rani-deep">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <Apply href={ambassadors.applyUrl} label="Apply as a Campus Ambassador">
            <p className="font-mono text-xs font-bold uppercase tracking-[.3em] text-rani-deep">Questions? Call</p>
            <p className="mt-1 font-display text-2xl">
              {ambassadors.contact.name}, <span className="text-lg">{ambassadors.contact.role}</span>
            </p>
            <a href={`tel:${tel}`} className="mt-1 inline-flex items-center gap-2 whitespace-nowrap text-lg font-bold underline decoration-2 underline-offset-4">
              <Phone size={20} weight="bold" aria-hidden="true" />
              {ambassadors.contact.phone}
            </a>
          </Apply>

          <Rulebook href={ambassadors.rulebook} cover="/outreach/ca-rulebook.webp" title="Campus Ambassador Program" />
        </Container>
      </section>

      {/* Partnered cafés */}
      <section id="cafes" aria-labelledby="cafes-title" className="relative scroll-mt-24 overflow-hidden border-y-4 border-ink bg-cream py-4">
        <Motif of="cafes" />
        <img src="/outreach/Catering.webp" alt="Partnered Cafes" width={1200} height="400" loading="lazy" className="mx-auto mt-0 w-full max-w-lg" />
        <Container className="relative">
          <Heading id="cafes-title" hindi="साथी कैफ़े">
            Partnered Cafes
          </Heading>
          {cafes.list.length ? (
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {cafes.list.map((c, i) => (
                <li key={c.name} className="overflow-hidden border-[3px] border-ink bg-paper text-center shadow-[4px_4px_0_var(--color-ink)]">
                  <CafeFront name={c.name} n={i} />
                  {/* its Google results (its listing, map and reviews), all the cafés being in Bhilai */}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${c.name} Bhilai`)}`}
                    target="_blank"
                    rel="noopener"
                    className="my-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-rani-deep underline decoration-2 underline-offset-4"
                  >
                    <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
                    See on Google<span className="sr-only">: {c.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ToBeAnnounced what="Cafés" />
          )}
          <Apply href={cafes.applyUrl} label="Register your café">
            <Pitch kicker="Run a café?">Bring the fest to your tables and partner with Meraz.</Pitch>
          </Apply>
          <Rulebook href={cafes.rulebook} cover="/outreach/cafe-rulebook.webp" title="Cafe Partner Program" />
        </Container>
      </section>

      {/* Partnered influencers */}
      <section id="influencers" aria-labelledby="influencers-title" className="relative scroll-mt-24 overflow-hidden  py-4">
        <Motif of="influencers" />
        <img src="/outreach/influencer.webp" alt="Partnered Influencers" width={1200} height="400" loading="lazy" className="mx-auto mt-0 w-full max-w-lg" />
        <Container className="relative">
          <Heading id="influencers-title" hindi="साथी क्रिएटर">
            Partnered Influencers
          </Heading>
          {/* the phone playing a Meraz reel, beside the list on wide screens and over it on phones */}
          <div className="mt-12 lg:grid lg:grid-cols-[14rem_1fr] lg:items-center lg:gap-12">
            <ReelPhone className="mx-auto w-52 lg:w-full" />
            {influencers.list.length ? (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0 xl:grid-cols-3">
                {influencers.list.map((p) => (
                  <li key={p.instagram} className="flex items-center gap-3 border-[3px] border-ink bg-cream px-4 py-3 shadow-[4px_4px_0_var(--color-ink)]">
                    <InstaLogo id={`insta-${p.instagram}`} />
                    <div className="min-w-0">
                      <p className="font-display text-xl leading-tight">{p.name}</p>
                      <a
                        href={`https://www.instagram.com/${p.instagram}/`}
                        target="_blank"
                        rel="noopener"
                        className="mt-1 inline-flex max-w-full font-bold text-rani-deep underline decoration-2 underline-offset-4"
                      >
                        <span className="truncate">@{p.instagram}</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ToBeAnnounced what="Influencers" />
            )}
          </div>
          <Apply href={influencers.applyUrl} label="Apply as an influencer">
            <Pitch kicker="Create content?">Your audience, your creativity, your Meraz.</Pitch>
          </Apply>
          <Rulebook href={influencers.rulebook} cover="/outreach/influencer-rulebook.webp" title="Influencer Program" />
        </Container>
      </section>
    </div>
  );
}
