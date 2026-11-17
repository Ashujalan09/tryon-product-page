# What was taken from `high-fashion-shopify-template`

Source: `/Users/nachiket/workspace/high-fashion-shopify-template` (commit `2ecd995`, working tree
clean at read time). This repo is a trimmed, commerce-free extraction for a single PDP.

## Taken as-is / adapted

| Item | Source | Use here |
| ---- | ------ | -------- |
| Design tokens + type roles | `app/globals.css` | `app/globals.css` — full token layer, breakpoints `tablet` 750 / `desktop` 1100, zero-radius surfaces, `--gutter`, `--header-bar-h`, motion/z tokens. |
| Brand wordmark | `public/brand/wordmark.png` (950 × 82) | Header + footer brand. |
| App icons | `public/icons/*.png` | `app/icon.png`, `app/apple-icon.png`. |
| DM Sans loading | `app/layout.tsx` (`next/font/google`, var `--font-dm-sans`) | Same variable, weights 300–600. |
| Header/footer structure | `components/nav/*`, `components/footer/index.tsx`, `lib/nav/index.ts`, `components/brand/wordmark.tsx` | Simplified, Hydrogen-free: plain desktop nav links, bordered mobile chips, same 74/76 px bar and link labels. |
| Product photography | `../Lorum Ipsum resources/W_black_*mini_dress_*.jpeg` | `public/images/product/*` (hero, back, three crops). |
| Recommendation imagery | `../Lorum Ipsum resources/` | `public/images/recommendations/*` (placeholders for the Figma `imageRef`s). |
| PDP behaviour | `components/product-detail/product-media.tsx`, `product-accordion.tsx`, `size-guide.tsx` | Reimplemented: 5-slot gallery, `<details>` accordions, size-guide sheet. |
| Type/layout contract | `docs/reference/figma/product-desktop-frame-16-7053.md` (wireframe) + design-I export | The design-I measurements in `docs/figma/pdp-design-spec.md` supersede the wireframe for desktop. |

## Deliberately not copied

- `@shopify/hydrogen`, the Storefront API client, cart/auth/search/account libraries and all
  `/collections`, `/cart`, `/account` routes.
- `lib/config/server.ts` (env-throwing Next wrapper), `proxy.ts`, BotID, `eve`/AI agent, analytics.
- `.env.local`, `.vercel/`, build artefacts, Playwright caches.
- `pnpm`/`turbo` workspace config — this repo uses npm and a single Next app.
- Template lint gate (`scripts/check-design.mjs`). The PDP follows design-I values (4 px button
  radius, 12/14 px type) that would fail the template’s zero-radius/`type-*` rules.

## Try-on

The template has **no** upload/try-on implementation (verified by searching `app/`, `components/`,
`lib/` for upload/try-on/file-input usage). `components/try-on/*` and the multi-image studio here are
new.

## Env

No runtime environment variable is required. Optional:

- `NEXT_PUBLIC_SITE_URL` — canonical/OG URL when using a custom domain.
- `TRYON_API_URL` / `TRYON_API_KEY` — reserved for a server-side try-on model; the current
  implementation is local-only.
