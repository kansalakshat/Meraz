/* ===========================================================================
 *  bot-widget.js — the Meraz helpdesk, as a portable television set.
 * ===========================================================================
 *
 *  WHY A TELEVISION
 *  ----------------
 *  Not a decorative choice. design-system/meraz/MASTER.md establishes the CRT
 *  television as one of the site's props ("CRT glow on the loader: part of the
 *  CRT TV metaphor") and permits rounded corners on physical objects while
 *  keeping UI controls sharp: "Physical props (TV, radio, board, projector,
 *  corkboard) may be rounded; they are objects, not UI."
 *
 *  So the widget is an object, not a chat panel: closed it is a set with an
 *  antenna showing a test card, open the screen becomes the conversation. The
 *  bezel is the frame, the input sits on the set's apron, and asking a
 *  question reads as tuning in to a channel. "Rewind. Replay. Rejoice." is
 *  broadcast language; this is the furniture that goes with it.
 *
 *  NOT USED: any real broadcaster's logo or mark. The test card, the colour
 *  bars and the set are generic period vocabulary, drawn here from scratch.
 *  A national broadcaster's emblem is a registered trademark, and redrawing
 *  one does not make it yours.
 *
 *  HOW IT PICKS UP THE SITE'S PALETTE
 *  ----------------------------------
 *  Everything below reads `var(--color-ink, #1a1a1a)` and friends. Those are
 *  the tokens Tailwind v4's `@theme` block emits onto :root in
 *  app/globals.css, and CSS CUSTOM PROPERTIES INHERIT THROUGH A SHADOW
 *  BOUNDARY — unlike ordinary styles, which cannot reach in. So the widget
 *  tracks the site's palette with no coupling: change a token and this
 *  follows. The literal after each comma is the fallback, which is what makes
 *  the same file still work dropped onto a site that has no such tokens.
 *
 *  (`:host { all: initial }` does not undo this. The `all` shorthand
 *  deliberately excludes custom properties.)
 *
 *  WHY VANILLA JS AND A SHADOW ROOT
 *  --------------------------------
 *  It is a <script> on someone else's page. No bundle, no build step, no React
 *  version to clash with — and a shadow root is a separate style scope, so the
 *  host page's resets cannot touch the widget and the widget cannot leak onto
 *  the page. On this site that also matters the other way round: body::after
 *  paints paper grain over everything at z-index 90, and the widget sits above
 *  it, so it carries its own grain to stay part of the same printed surface.
 *
 *  USAGE
 *      <script src="bot-widget.js" data-api="http://localhost:8001"></script>
 *
 *  ATTRIBUTES
 *      data-api     API base URL          (default http://localhost:8000)
 *      data-name    set's name plate      (default "Ask Meraz")
 *      data-channel channel number        (default "7")
 *      data-side    "left" or "right"     (default "right")
 *      data-accent  button colour         (default the rani-deep token)
 *
 *  THE HOST ELEMENT CARRIES id="compass-bot". Everything drawn lives in the
 *  shadow root and is unreachable from the page's CSS, but the host is an
 *  ordinary div, so the page can hide or move the whole widget with one rule.
 *  components/AskBot.tsx uses exactly that to keep it off the loading screen.
 * ======================================================================== */

(function () {
  "use strict";

  // document.currentScript is the <script> executing right now — how we read
  // our own data- attributes without needing an id. It is only valid during
  // initial synchronous execution; read it in a callback and it is null.
  const me = document.currentScript;

  // `me &&` guards currentScript being null in odd loading situations. Without
  // it, reading .dataset of null throws and the widget never appears.
  const API = (me && me.dataset.api) || "http://localhost:8000";
  const NAME = (me && me.dataset.name) || "Ask Meraz";
  const CHANNEL = (me && me.dataset.channel) || "7";
  const LEFT = (me && me.dataset.side) === "left";
  const ACCENT = (me && me.dataset.accent) || "var(--color-rani-deep, #b8166f)";

  // ---- mount ------------------------------------------------------------
  const host = document.createElement("div");
  host.id = "compass-bot";
  // 2147483647 is the maximum 32-bit signed integer — the conventional
  // "definitely above the host page's sticky headers and modals" value.
  // Only the side the widget is anchored to is set, so a page overriding the
  // position in CSS has nothing to fight.
  host.style.cssText =
    "position:fixed;z-index:2147483647;bottom:20px;" +
    (LEFT ? "left:20px;" : "right:20px;");
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  // The grain, as an inline SVG turbulence filter. Same technique as the
  // site's own --noise, restated here because a data: URI in the page's
  // custom property would resolve fine but tying the widget to a token that
  // is not part of the documented palette would be a hidden dependency.
  const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }

      /* ---- the set ------------------------------------------------------
         Rounded, because it is an object. Double inset ring then a hard
         offset shadow, which is the site's own control idiom (see @utility
         btn in globals.css): one light source, top-left, so every shadow in
         the page falls the same way. */
      .set {
        border: 3px solid var(--color-ink, #1a1a1a);
        border-radius: 14px 14px 8px 8px;
        background: var(--color-marigold, #f4a300);
        box-shadow:
          inset 0 0 0 3px var(--color-turmeric, #f2c14e),
          inset 0 0 0 4.5px var(--color-ink, #1a1a1a),
          5px 5px 0 var(--color-ink, #1a1a1a);
      }

      /* ---- closed: the launcher ---------------------------------------- */
      .launch {
        display: block; position: relative; margin: 0; padding: 0;
        width: 76px; cursor: pointer; background: none; border: 0;
        -webkit-tap-highlight-color: transparent;
      }
      .launch svg { display: block; width: 76px; height: 84px; overflow: visible; }
      .launch:hover { transform: translate(-2px, -2px) rotate(-2deg); }
      .launch:active { transform: translate(2px, 2px) rotate(0deg); }
      .launch { transition: transform .15s; }
      .launch:focus-visible {
        outline: 4px solid var(--color-ink, #1a1a1a); outline-offset: 3px;
      }

      /* ---- open: the set, switched on ---------------------------------- */
      .panel {
        display: none; width: 336px; max-width: calc(100vw - 40px);
        overflow: hidden;
      }
      .panel.on { display: block; }

      /* THE ONE PIECE OF MOTION: switching on. The screen opens from a
         single scanline, the way a CRT strikes. It answers a click, so it
         earns its place; nothing else here moves on its own. */
      @media (prefers-reduced-motion: no-preference) {
        .panel.on { animation: strike .26s cubic-bezier(.2,.8,.3,1) both; }
      }
      @keyframes strike {
        0%   { transform: scaleY(.02); filter: brightness(2.4); }
        60%  { transform: scaleY(1);   filter: brightness(1.5); }
        100% { transform: scaleY(1);   filter: brightness(1); }
      }

      /* ---- bezel: the set's top edge ----------------------------------- */
      .bezel {
        display: flex; align-items: center; gap: 9px;
        padding: 9px 10px 10px;
        background: var(--color-ink, #1a1a1a);
        color: var(--color-turmeric, #f2c14e);
      }
      /* The channel plate is a stamped metal tag, so it keeps the sharp
         corners the system reserves for non-object elements. */
      .plate {
        font-family: var(--font-display, Georgia, serif);
        font-size: 13px; line-height: 1;
        padding: 4px 6px;
        color: var(--color-ink, #1a1a1a);
        background: var(--color-turmeric, #f2c14e);
        border: 2px solid var(--color-ink, #1a1a1a);
        /* No drop shadow: the plate sits ON the bezel, and at this size a
           shadow only bled onto the colour bars below it. */
      }
      .name {
        font-family: var(--font-display, Georgia, serif);
        font-size: 15px; letter-spacing: .02em; flex: 1;
      }
      /* The bezel had a Devanagari "पूछिए" here, echoing the site's bilingual
         nav. It was cut. Plate + name + lamp + close is already four things
         competing in a 336px strip, and a fifth made the right-hand side
         crowded without telling anyone anything they did not already know
         from the name. The site's Hindi belongs in its nav, where it labels
         navigation; here it was ornament wearing a label's clothes. */
      .lamp {
        width: 9px; height: 9px; border-radius: 999px;
        background: var(--color-vermillion, #d7263d);
        box-shadow: 0 0 7px var(--color-vermillion, #d7263d);
      }
      @media (prefers-reduced-motion: no-preference) {
        .lamp { animation: breathe 2.6s ease-in-out infinite alternate; }
      }
      @keyframes breathe { from { opacity: .55 } to { opacity: 1 } }

      .shut {
        background: none; border: 0; cursor: pointer; padding: 0 2px;
        font-size: 19px; line-height: 1;
        color: var(--color-turmeric, #f2c14e);
        font-family: var(--font-display, Georgia, serif);
      }
      .shut:focus-visible { outline: 2px solid var(--color-turmeric, #f2c14e); }

      /* ---- colour bars: the strip under the bezel ----------------------
         The site's palette as a test-card strip. Seven hard stops, no
         gradient — printed ink does not blend. */
      /* SIX BARS, AND NO INK ONE. The first version had seven, ending on
         --color-ink — which is also the bezel above and the frame around, so
         the strip appeared to stop short of the right edge. A test card whose
         last bar is the colour of its own frame is not a test card. Every
         stop here is one that can be seen against ink.

         The ORDER matters too, for the same reason in miniature: cream was
         last, directly above a cream screen, so the strip still looked like
         it stopped short of the right edge. Running light to dark puts the
         pale bar against the bezel, where it shows, and ends on teal. */
      .bars {
        height: 7px;
        background: linear-gradient(to right,
          var(--color-cream,      #f3e6c8) 0      16.66%,
          var(--color-turmeric,   #f2c14e) 16.66% 33.33%,
          var(--color-marigold,   #f4a300) 33.33% 50%,
          var(--color-vermillion, #d7263d) 50%    66.66%,
          var(--color-rani,       #e0218a) 66.66% 83.33%,
          var(--color-teal,       #0f7c7c) 83.33% 100%);
        border-bottom: 3px solid var(--color-ink, #1a1a1a);
      }

      /* ---- the screen -------------------------------------------------- */
      .screen {
        position: relative;
        background: var(--color-cream, #f3e6c8);
        padding: 13px 13px 11px;
        min-height: 86px;
        font-family: var(--font-sans, Georgia, serif);
        font-size: 14px; line-height: 1.6;
        color: var(--color-ink, #1a1a1a);
      }
      /* Scanlines, at the site's own values, plus the paper grain. The two
         together are what stop the screen reading as a flat white div: it is
         a printed surface being broadcast at. */
      .screen::before, .screen::after {
        content: ""; position: absolute; inset: 0;
        pointer-events: none;
      }
      /* The site's scanlines utility is 1px every 3px at .22, which it uses
         over the loader art. This surface carries body text, so the same
         values cut straight through the glyphs. Lighter, and one pixel
         further apart: still unmistakably a CRT, still readable. */
      .screen::before {
        background-image: repeating-linear-gradient(to bottom,
          rgb(0 0 0 / .20) 0 1px, transparent 1px 4px);
        opacity: .42;
      }
      .screen::after {
        background-image: ${GRAIN};
        opacity: .14; mix-blend-mode: multiply;
      }
      .screen > * { position: relative; z-index: 1; }

      .heading {
        font-family: var(--font-display, Georgia, serif);
        font-size: 17px; line-height: 1.25; margin-bottom: 5px;
        padding-bottom: 5px;
        /* A hairline under the heading, so the matched topic reads as a
           caption for what follows rather than as its first sentence. */
        border-bottom: 2px solid color-mix(in srgb, var(--color-ink, #1a1a1a) 25%, transparent);
      }
      .hint { color: color-mix(in srgb, var(--color-ink, #1a1a1a) 72%, transparent); }
      .answer a {
        color: var(--color-teal-deep, #0a5f5f);
        font-weight: 700; text-decoration: underline;
        text-decoration-thickness: 2px; text-underline-offset: 2px;
      }

      /* ---- the apron: where you type ----------------------------------- */
      form {
        display: flex; gap: 7px; align-items: stretch;
        padding: 9px;
        background: var(--color-marigold, #f4a300);
        border-top: 3px solid var(--color-ink, #1a1a1a);
      }
      input {
        flex: 1; min-width: 0;
        font-family: var(--font-sans, Georgia, serif);
        font-size: 14px; padding: 7px 9px;
        color: var(--color-ink, #1a1a1a);
        background: var(--color-cream, #f3e6c8);
        border: 2px solid var(--color-ink, #1a1a1a);
        border-radius: 0;                 /* a control, so sharp */
        box-shadow: inset 2px 2px 0 rgb(0 0 0 / .18);
      }
      input:focus { outline: 3px solid var(--color-ink, #1a1a1a); outline-offset: 1px; }
      /* The browser's default selection blue is the only colour that would
         appear here from outside the palette — and it shows every time an
         answer lands, because the field re-selects so you can type over it. */
      ::selection { background: var(--color-turmeric, #f2c14e); color: var(--color-ink, #1a1a1a); }
      input::placeholder { color: color-mix(in srgb, var(--color-ink, #1a1a1a) 50%, transparent); }

      .ask {
        font-family: var(--font-display, Georgia, serif);
        font-size: 14px; padding: 7px 13px; cursor: pointer;
        color: var(--color-cream, #f3e6c8);
        background: ${ACCENT};
        border: 2px solid var(--color-ink, #1a1a1a);
        border-radius: 0;
        box-shadow: 3px 3px 0 var(--color-ink, #1a1a1a);
        transition: transform .12s, box-shadow .12s;
      }
      .ask:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--color-ink, #1a1a1a); }
      .ask:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--color-ink, #1a1a1a); }
      .ask:disabled { opacity: .6; cursor: default; transform: none; }
      .ask:focus-visible { outline: 3px solid var(--color-ink, #1a1a1a); outline-offset: 2px; }

      @media (prefers-reduced-motion: reduce) {
        .launch, .ask { transition: none; }
      }
    </style>

    <!-- OPEN: the set switched on -->
    <div class="panel set" part="panel">
      <div class="bezel">
        <span class="plate">CH ${CHANNEL}</span>
        <span class="name">${NAME}</span>
        <span class="lamp" aria-hidden="true"></span>
        <button class="shut" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="bars" aria-hidden="true"></div>
      <div class="screen">
        <div class="answer hint">Ask about passes, events, dates, or who to contact.</div>
      </div>
      <form>
        <input type="text" placeholder="Type your question" autocomplete="off"
               aria-label="Your question" />
        <button class="ask" type="submit">Ask</button>
      </form>
    </div>

    <!-- CLOSED: the set, off, showing a test card.
         Drawn as one SVG so the antenna can sit outside the casing without
         a wrapper to position, and so it scales as one object. -->
    <button class="launch" type="button" aria-label="${NAME}">
      <svg viewBox="0 0 76 84" role="img" aria-hidden="true">
        <!-- rabbit ears: what makes a small rounded box read as a television -->
        <g stroke="var(--color-ink, #1a1a1a)" stroke-width="3" stroke-linecap="round" fill="none">
          <path d="M30 26 L18 6" />
          <path d="M46 26 L58 6" />
        </g>
        <circle cx="18" cy="6" r="3.2" fill="var(--color-ink, #1a1a1a)" />
        <circle cx="58" cy="6" r="3.2" fill="var(--color-ink, #1a1a1a)" />

        <!-- the casing, with the same hard offset shadow as every control -->
        <rect x="7" y="27" width="62" height="50" rx="9"
              fill="var(--color-ink, #1a1a1a)" transform="translate(4,4)" />
        <rect x="7" y="27" width="62" height="50" rx="9"
              fill="var(--color-marigold, #f4a300)"
              stroke="var(--color-ink, #1a1a1a)" stroke-width="3" />
        <rect x="10.5" y="30.5" width="55" height="43" rx="6.5"
              fill="none" stroke="var(--color-turmeric, #f2c14e)" stroke-width="3" />

        <!-- the screen -->
        <rect x="15" y="34" width="38" height="36" rx="5"
              fill="var(--color-cream, #f3e6c8)"
              stroke="var(--color-ink, #1a1a1a)" stroke-width="2.5" />

        <!-- THE TEST CARD. Generic period vocabulary, drawn from scratch:
             concentric rings, a crosshair, and a four-step wedge. It is not,
             and must not become, any broadcaster's emblem. -->
        <g clip-path="inset(0 round 5px)">
          <g transform="translate(34 52)">
            <circle r="13" fill="none" stroke="var(--color-teal, #0f7c7c)" stroke-width="2.5" />
            <circle r="7"  fill="none" stroke="var(--color-rani, #e0218a)" stroke-width="2.5" />
            <circle r="2"  fill="var(--color-vermillion, #d7263d)" />
            <g stroke="var(--color-ink, #1a1a1a)" stroke-width="1.6">
              <path d="M-17 0 H-13 M13 0 H17 M0 -17 V-13 M0 13 V17" />
            </g>
          </g>
          <!-- the wedge, bottom of the screen -->
          <g>
            <rect x="16" y="64" width="9"  height="5" fill="var(--color-turmeric, #f2c14e)" />
            <rect x="25" y="64" width="9"  height="5" fill="var(--color-marigold, #f4a300)" />
            <rect x="34" y="64" width="9"  height="5" fill="var(--color-teal, #0f7c7c)" />
            <rect x="43" y="64" width="10" height="5" fill="var(--color-ink, #1a1a1a)" />
          </g>
        </g>
        <!-- scanlines over the screen only -->
        <g clip-path="inset(0 round 5px)" opacity=".34">
          ${Array.from({ length: 12 }, (_, i) =>
            `<path d="M15 ${35.5 + i * 3} H53" stroke="#000" stroke-width="1"/>`).join("")}
        </g>

        <!-- tuner: two knobs and a speaker slot, on the set's right cheek -->
        <circle cx="61" cy="42" r="4.2" fill="var(--color-cream, #f3e6c8)"
                stroke="var(--color-ink, #1a1a1a)" stroke-width="2" />
        <path d="M61 42 L61 38.5" stroke="var(--color-ink, #1a1a1a)" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="61" cy="54" r="4.2" fill="var(--color-vermillion, #d7263d)"
                stroke="var(--color-ink, #1a1a1a)" stroke-width="2" />
        <g stroke="var(--color-ink, #1a1a1a)" stroke-width="1.6" stroke-linecap="round">
          <path d="M57.5 63 H64.5 M57.5 66.5 H64.5" />
        </g>

        <!-- legs: it stands on the page -->
        <g stroke="var(--color-ink, #1a1a1a)" stroke-width="3" stroke-linecap="round">
          <path d="M19 77 L15 82" />
          <path d="M57 77 L61 82" />
        </g>
      </svg>
    </button>
  `;

  const panel = root.querySelector(".panel");
  const launch = root.querySelector(".launch");
  const screen = root.querySelector(".answer");
  const form = root.querySelector("form");
  const input = root.querySelector("input");
  const askBtn = root.querySelector(".ask");

  function open(on) {
    panel.classList.toggle("on", on);
    launch.style.display = on ? "none" : "block";
    if (on) input.focus();
  }
  launch.addEventListener("click", () => open(true));
  root.querySelector(".shut").addEventListener("click", () => {
    open(false);
    launch.focus();                     // keyboard users land back on the set
  });
  // Escape closes, as it does for any dialog-like thing.
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("on")) {
      open(false);
      launch.focus();
    }
  });

  // escapeHtml IS NOT OPTIONAL. The explanation comes from an LLM reading text
  // a human typed, and it goes into innerHTML. Without escaping, a stray
  // "<img onerror=...>" in the knowledge file would execute as script on the
  // host's page. Always escape anything you did not author into innerHTML.
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function say(html, hint) {
    screen.className = "answer" + (hint ? " hint" : "");
    screen.innerHTML = html;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();                 // never reload the host page
    const q = input.value.trim();
    if (!q) return;

    askBtn.disabled = true;
    say("Tuning in…", true);        // in-world, and says work is happening

    try {
      const res = await fetch(API + "/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (!data.found) {
        // The server's refusal is written for a visitor to read, so it is
        // shown as it stands rather than translated here.
        say(escapeHtml(data.reason || "No information on that."), true);
        return;
      }

      // The heading says WHICH topic was matched, which makes a near-miss
      // obvious instead of mysterious.
      let html = `<div class="heading">${escapeHtml(data.heading)}</div>` +
                 escapeHtml(data.explanation);

      // A typed fact often has no page of its own, so url is usually empty.
      // When it is set, offer the link. No trailing arrow: the words already
      // say what happens.
      if (data.url) {
        html += `<br><a href="${escapeHtml(data.url)}">Open the page</a>`;
      }
      say(html, false);
    } catch (err) {
      // Network failure, a CORS rejection, invalid JSON, or the server asleep.
      // Says what went wrong and what to do, in the interface's voice.
      say("Can't reach the helpdesk. Try again in a moment.", true);
    } finally {
      // `finally` runs on every path, including the early return above, so the
      // button is never left permanently disabled.
      askBtn.disabled = false;
      input.select();
    }
  });
})();
