# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static landing page for an Instax Mini camera rental business in Saint Petersburg, run by a self-employed individual. All content is in Russian.

```
index.html        markup only
styles.css        all styling, incl. theme tokens and responsive rules
script.js         the rental calculator
fonts.css         @font-face for the two self-hosted families
fonts/            5 woff2 — variable fonts, one file covers every weight: Unbounded (cyrillic, latin), Golos Text (cyrillic, latin, latin-ext — the latter only for ₽)
images/
  devices/        model-mini-{9,11,12}.jpg — 1200x900, camera on white, all facing the same way
  photos/         photo-01..15.jpg — 01-03 are the hero polaroids, 04-15 the gallery
og-image.jpg      1200x630 link preview, generated from scratchpad/og.html via headless Chrome
favicon.*, icon-*.png, apple-touch-icon.png, site.webmanifest, robots.txt, sitemap.xml
```

No build step, no package manager, no tests, no dependencies, and **no external requests** — fonts are local, there is no analytics and no cookies. Serve the folder (`python -m http.server`) rather than opening the file directly.

## Domain

The site is served from `https://instaxrent.ru` — that host appears in the head (`og:url`, `og:image`, `twitter:image`), in the JSON-LD graph, in `robots.txt` and in `sitemap.xml`. Keep them in sync if it ever changes.

## Pricing is duplicated — change all copies together

- **`DATA` in [script.js](script.js)**: per-model `steps` (days 1-4), `extra` (per-day rate from day 6), `dep` (deposit).
- **`FRAMES` map**: frame-count → price. **`BOOKING`** (350, charged on top of the rental).
- **Rates table** in `#tarify` — the same numbers as `steps`/`extra`/`dep`, hardcoded.
- **Model cards** in `#modeli` — per-day price and deposit.
- **Deposit chips** in `#usloviya`.
- **The FAQ section** `#voprosy` and the **JSON-LD** `Product`/`Offer` nodes both restate prices. The FAQ text must stay identical to the `FAQPage` answers or Google flags the markup.

`priceFor(m, n)` encodes the rule that **the 5th day is free**: days 1-4 read from `steps`, then `steps[3] + max(0, n - 5) * extra`.

## Calculator specifics

State is five module-scope variables; every handler ends in `render()`. The `Mini 12 × 2` button is a fourth model button carrying `data-two="1"` — it sets both model and quantity, and doubles rent and deposit.

Elements that appear and disappear (`#row-frames`, `#frame-price`) toggle the `.is-blank` class (`visibility:hidden`), **not** the `hidden` attribute — otherwise the card jumps in height. `[hidden]{display:none!important}` exists because `.out-line{display:flex}` would otherwise beat the UA rule.

## Responsive and browser support

Breakpoints: 480/560 (header shrinks its brand and button text), 700, 760 (touch targets grow to 44px, table scroll hint appears), 820 (calculator splits in two), 900 (nav joins the top row; below that it is a horizontally scrollable second row). `section[id]` carries `scroll-margin-top` in two values because the sticky header is 68px on desktop and 113px on mobile.

`header.top` declares a plain `background` **before** the `color-mix()` one — without that fallback, browsers older than Chrome 111 / Safari 16.2 leave the sticky header transparent. `@supports not (...)` blocks at the end of the stylesheet cover `aspect-ratio` and flex `gap`.

Note when testing: **headless Chrome clamps the top-level window to a 500px minimum width**, so `--window-size=360` silently lays out at 500. Measure and screenshot narrow widths through an `<iframe>` of the exact width instead.

## Legal (RU)

The footer carries the self-employed person's name and INN, required by ЗоЗПП ст. 9, plus a "not a public offer" line. The booking fee is deliberately framed as a *separate service rendered at the moment of booking* rather than a non-refundable prepayment — that wording is what keeps it defensible under ст. 32 ЗоЗПП, so do not simplify it back to "не возвращается" alone. No forms, analytics or cookies exist, which is why no privacy policy or cookie banner is needed; adding any of them brings 152-ФЗ obligations.

## Analytics

`collect.php` appends one JSON object per line to `stats/stats-YYYY-MM.jsonl`, locked with `flock`. It deliberately stores **no IP, no User-Agent and sets no cookies** — that is what keeps the site outside 152-ФЗ obligations, so do not "improve" it by adding visitor identification without also adding a privacy policy, consent and a Roskomnadzor notification.

Four event types are accepted (`page_view`, `click`, `faq`, `calc`); anything else is rejected so the file cannot be filled with junk. Clickable targets carry a human-readable `data-t` label in the markup; the tracking code at the bottom of [script.js](script.js) wires them up with `navigator.sendBeacon`, which survives the page unloading. Calculator changes are debounced by 3 s so a run of `+` clicks produces one line, not six.

The stats folder is closed from the web by `stats/.htaccess`; read the file over FTP.

## Caching and responsive images

`.htaccess` sets compression and cache lifetimes: woff2 for a year (`immutable` — the content behind a given name never changes), images 30 days, CSS/JS one day, HTML always revalidated. The short CSS/JS lifetime is deliberate — there is no build step and therefore no filename hashing, so a long cache would strand returning visitors on an old stylesheet. The https and www redirects sit at the bottom **commented out**; enable them only after the SSL certificate is issued, otherwise the redirect breaks the site.

Every image except `photo-03` (320px, no room to scale down) carries `srcset`. Variants are suffixed by width: gallery photos get `-400` and `-800`, hero polaroids `-640`, device shots `-600`; the un-suffixed file is always the largest. Generate new ones with `Variants.cs` in the scratchpad — it refuses to upscale. **When replacing a photo, regenerate its variants**, or visitors keep seeing the old picture at small sizes.

Measured: a phone at DPR 1 pulls 632 KB of images, a retina desktop 1.3 MB, against 2.3 MB before.
