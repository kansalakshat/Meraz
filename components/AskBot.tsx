"use client";

// The Meraz question bot: a chat bubble at the bottom left that answers from a
// hand-written knowledge file (see the CompassForMeraz project). It is a plain
// <script> in public/, not a React component, because the same file is meant to
// drop into any site — so everything it draws lives in a shadow root and none
// of this site's CSS reaches it.
//
// This component exists only to decide WHEN and WHERE it shows. Three rules:
//
//  1. NOT WHILE THE LOADING SCREEN IS UP. Transition.tsx already marks that
//     state in the DOM — `<div data-page-screen data-up>` — and its own comment
//     says the page's entrances wait on it. So this reuses the site's existing
//     signal instead of adding another source of truth, and Transition.tsx did
//     not need to change at all.
//
//  2. NOT ON THE HOME PAGE. "/" is the full-screen 3D ride, and the site
//     already treats it as chrome-free (no NavBar either — see app/page.tsx).
//     A chat bubble would compete with the ride's own SKIP and SCROLL prompts.
//     Delete the `home` branch below if you want it there too.
//
//  3. BOTTOM LEFT, because BackToTop occupies the bottom right.
//
// The widget itself is never unmounted. It is injected once and then shown or
// hidden with CSS — unmounting a next/script does not remove the DOM the script
// already created, so toggling the <Script> would leave the bubble stranded on
// the next route.

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Where the bot's backend lives. Set NEXT_PUBLIC_BOT_API in the Vercel project
// to the deployed API; the fallback is the local dev server.
//
// NOTE: port 8001, not 8000 — the main Compass project uses Django's default,
// and two Django projects on one port is a confusing failure, because the
// server answers and simply does not have this endpoint.
//
// Until that API is deployed and reachable over HTTPS, the bubble will appear
// on a deployed site and fail to answer: a page served over HTTPS cannot call
// http://localhost, and visitors have no such server anyway.
const API = process.env.NEXT_PUBLIC_BOT_API || "https://compassformeraz.onrender.com";

// How long the bot will wait for the loading screen before showing anyway.
// Transition.tsx does not trust its own loading screen either — it has a
// CAP_MS that force-lifts it — and this is the same idea applied from
// outside: hiding is a courtesy, so it must never be permanent.
//
// WITHOUT THIS the bot is invisible for exactly as long as [data-up] is set,
// with no upper bound. On a dev server that was measured at well over 6
// seconds and sometimes tens of seconds, which is indistinguishable from the
// widget being broken. A visible bot during the last moment of a loading
// screen is a much smaller problem than a bot nobody can find.
const SHOW_ANYWAY_MS = 4000;

export default function AskBot() {
  const pathname = usePathname();
  const home = pathname === "/";

  // Reset on every route change, because each navigation puts the loading
  // screen back up and deserves its own grace period.
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    setWaited(false);
    const t = setTimeout(() => setWaited(true), SHOW_ANYWAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {/* Scoped to #compass-bot, the id the widget puts on its host element.
          The host is an ordinary div in this page even though its contents are
          in a shadow root, so it is styleable from here — that is the only
          seam the widget exposes, and all this needs. */}
      <style>{`
        #compass-bot { transition: opacity .3s ease; }

        /* While a page transition's loading screen is up — but only until
           SHOW_ANYWAY_MS has passed. :has() lets a rule depend on a
           descendant existing, so no JavaScript has to watch for it. If you
           ever need a browser without :has(), the fallback is a
           MutationObserver on [data-page-screen] toggling a class here. */
        ${waited ? "" : `
        body:has([data-page-screen][data-up]) #compass-bot {
          opacity: 0;
          pointer-events: none;
        }`}

        /* Floating controls are hidden in print, as BackToTop and ScrollHint
           already are (print:hidden). */
        @media print { #compass-bot { display: none; } }

        ${home ? "#compass-bot { display: none !important; }" : ""}
      `}</style>

      <Script
        src="/bot-widget.js"
        // afterInteractive: the widget is not needed for first paint and must
        // not compete with the 3D scene's downloads. beforeInteractive would
        // also break it, since it reads document.currentScript.
        strategy="afterInteractive"
        data-api={API}
        data-side="left"
        data-name="Ask about Meraz"
        // Matches the site's own accent (--color-vermilion / marigold family).
        data-accent="#b8166f"
      />
    </>
  );
}
