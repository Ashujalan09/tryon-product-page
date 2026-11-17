# PDP layout & interaction contract

Derived contract for the standalone try-on PDP app. Sources are the template repo
`/Users/nachiket/workspace/high-fashion-shopify-template` (specs + shipped code) and a live Figma plugin
export dropped into this repo at `docs/figma/pdp-frames.json`.

Written 2026-11-17. The template repo was read only; nothing there was modified.

## Provenance and how to read this

Two Figma generations describe the same page, and they disagree:

| Generation            | File                                                             | Desktop frame | Mobile frame       | Height |
| --------------------- | ---------------------------------------------------------------- | ------------- | ------------------ | ------ |
| **Wireframe** (older) | `Lorem Ipsum Wireframe` `TzeMmJHUVWuiuknAcm1hq4`                 | `16:7053`     | `16:6217`          | 5445   |
| **Design I** (newer)  | `Lorem Ipsum Design I (Copy)`, page `All desings` (key unrecorded) | `2044:2602`   | `16:6217` (reused) | 5445 body, frame clipped to 3742 |

Throughout this document:

- **"Wireframe"** = the frame set the template's spec docs were written from.
- **"Design I"** = the newer file, read from `docs/figma/pdp-frames.json`.
- **"Shipped"** = what the template renders today, a blend of Design I's mobile menu, the wireframe's
  header/footer composition, and design-system type tokens rather than either file's raw sizes.

> **Volatility warning.** `docs/figma/pdp-frames.json` was being regenerated while this was written.
> The read snapshot was 269,361 bytes, sha256 prefix `6e3589df`, containing exactly two node trees
> (`2044:2602` desktop, `16:6217` mobile) plus `meta`, `fonts`, `colors`, `imageRefs`. A larger earlier
> revision carried seven frame names but the same two trees. Numbers below come from the two stable
> trees; re-read the file before trusting a coordinate.

Both generations share the page skeleton: **74–76 px header → product area (800/592 split) →
recommendation row → footer**. What changes is the gallery composition, the buy-column order, the
primary CTA, and the typography.

---

## 0. TL;DR for the builder

1. One ordered PDP: header → gallery + buy column (2-up at `desktop`) → recommendation row → footer.
   Mobile is gallery first, then the buy column; there is no mobile-only section.
2. Desktop split is `800fr / 592fr` (793/587 inside a 30 px gutter); buy content is 432 wide.
3. Buy column order (Design I, authoritative for desktop): title + price → colours → size →
   primary CTA → disclosures → help. The wireframe puts disclosures **before** size at desktop; the
   shipped code and the mobile frame put them **after** the CTA. Follow the latter.
4. Desktop default has **no size selected** and the CTA reads `select size` (disabled). The wireframe
   preselects nothing but labels the CTA `Add to bag`; the shipped code preselects the first available
   variant and labels it `Add to cart`. Recommendation: preselect the first available variant and use the
   frame's label, `Add to bag`, because a PDP-only app has no other path to a selection.
5. Header is 76 px (Design I draws 74), 24 px gutter, three zones: `Woman Man Search` left, wordmark
   centre, `Wishlist Bag Help Account` right. Desktop controls are 43 px bordered chips; Design I draws
   them as 14 px text with no border.
6. Footer is 419 px in Design I (361 in the wireframe; the live reference measures 361 at 1440). Four link
   columns at a 160 px pitch, wordmark left, newsletter right.
7. Seven PDP states: four page states (default in-stock, variant selected, low stock, out-of-stock/waitlist)
   plus three overlays (size guide, notify-me, slide-over confirmation). Only the first two are fully
   specified; the stock states exist as frame deltas, and the slide-over has no written geometry.
8. Try-on should enter through **one control in the buy column** and **one overlay button on the first
   gallery tile**, with the result in a sheet. Do not insert a tile at the head of the gallery: that
   moves the LCP image and breaks the Design I mosaic.
9. All rectangular surfaces are zero radius; `rounded-full` survives only for counts and gallery dots.
   Type comes from `type-*` roles; the Figma's 12/600 and 14/700 are not implementable as written.
10. The export plugin reads the document through the plugin API, which is not metered. It has nothing to
    do with the REST quota, and it never exports image bytes.

---

## 1. Two generations: what actually changed

`docs/reference/figma/README.md` documents the wireframe as the build target, and the execution plan
(`docs/WIREFRAME-EXECUTION-PLAN.md`) sequences that build. **There is no migration document from the
wireframe to Design I.** The only acknowledgement in the repo is one paragraph in
`docs/WIREFRAME-PROGRESS.md` and one section in `docs/reference/figma/mobile-frames.md`, both about the
mobile menu panel (`2022:4641`, `2022:4768`). Design I's file key is not recorded anywhere; this repo's
`docs/figma/pdp-frames.json` `meta.figmaFile` is the first place the file is named.

What changed, measured from the two trees:

| Area              | Wireframe `16:7053`                                        | Design I `2044:2602`                                                            | Shipped template                              |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| Header height     | 76                                                         | 74                                                                              | 76 (`--header-bar-h`)                         |
| Header controls   | 43 px bordered chips, 14/400                               | plain text 14/700 `#353535`, 24 gap, no border                                   | bordered chips, `type-body` 400               |
| Gallery           | 4 stacked 800×1080 (20:27), 10 gap                        | editorial mosaic: 800×1432, then 2-up 400×535.71 staggered 68, then 2-up again   | 1-col stack, `aspect-[20/27]`, 10 gap         |
| Gallery height    | ~4320                                                      | 2578.43                                                                          | varies with media count                       |
| Product title     | 12/600 `#353535`                                           | 12/600 `#353535` (unchanged)                                                     | `type-display` 22/29 uppercase                |
| Price             | 10/600 `#353535`                                           | 14/600 `#353535`                                                                 | `type-display` 22/29                          |
| Size chips        | 26 tall, 1 px `#000`, 4 inset                              | 44 tall, 1 px `#DCDCDC`, pad 13/16, 12/500 `#666`                                | no border; underline on selected, min-h-9     |
| Primary CTA       | `Add to bag`, 432×40, `#666` fill, radius 4                | `select size`, 432×40, `#DFDFDF` fill (disabled), radius 4                       | 36 tall, outline ink, zero radius, `Add to cart` |
| Buy order         | name → colours → **disclosures** → size → CTA → help      | name → colours → **size → CTA → disclosures** → help                            | name → options → CTA → disclosures → help     |
| Disclosures       | 3 × 49 rows, closed                                        | description **expanded** (173), details 81, shipping 81, 1 px `#000`             | `<details>` accordion, 49-ish rows            |
| Recommendation    | 4 × 360.8×588, caption 48                                  | 4 × 360×515, image 250×447 inset 55, caption 44                                 | 4-up, `captionLayout="row"`, 48 caption       |
| Footer            | 361                                                        | 419                                                                              | shipped composition, ~361 at 1440             |
| Imagery           | zero image fills; `#DFDFDF` rectangles                     | 7 real `imageRef`s (Gemini-generated placeholders)                               | real product photos                           |
| Fonts             | DM Sans 10–18; no Helvetica on PDP                         | DM Sans + **Helvetica** 12 (133 runs) + **Mea Culpa** 54 (off-canvas wordmark study) | DM Sans 300/400/500 only                 |
| Palette           | nine neutral greys                                         | `#000`, `#666`, `#353535`, `#fff`, `#DCDCDC`, `#DFDFDF`, `#F2F2F2`, `#BBBBBB`, `#1D1B20`, `#A66100` | `--ink`, `--ink-muted`, `--rule`, `--surface` |

**Read this as:** Design I is a photographic pass over the same skeleton. Geometry moved (gallery
mosaic, 44 px chips, footer 419), type weight increased (700 in the header, 600 on names), and a real
image set replaced the grey boxes. The design system rejects the weights and the radii, so the
translation is: keep Design I's *structure and sizes where they fit the token scale*, keep the template's
*roles and zero radius*.

Three details from Design I worth copying verbatim:

- `size recommendation` sits right-aligned on the size label row, 12/500 `#666`.
- The description disclosure renders **open** by default and is the only one with body copy.
- Header labels: Design I sets the left group uppercase (`WOMAN`, `MAN`, `SEARCH`) at 14/700 and the right
  group Title Case (`Wishlist`, `Bag`, `Help`, `Account`) at 14/700. The wireframe and shipped code use
  `Woman`, `Men`, `Search`, `Wishlist`, `Bag`, `Help`, `Account`. Design I says `MAN`; the catalogue says
  Men. Use **Men** (commit `f506f69` in the template).

---

## 2. The PDP section list

### 2.1 Desktop (1440), Design I `2044:2602`

Frame 1440 × 3742 as clipped; the body `Frame 64` is 1440 × 5445 and the last ~1700 px is empty, which
is a stale-frame defect, not layout. Content ends at y 3742. Header is 74 tall.

| #   | Section                | Node               | Geometry (x, y, w×h)                          | Responsibility                                                                 |
| --- | ---------------------- | ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Header                 | `2044:2718`        | 0,0 1440×74; inner 24,0 1392×74               | Brand, category entry, search, wishlist, bag, help, account. Sticky.           |
| 2   | Product area           | `2044:2606`        | 0,0 1440×2578.43                              | Two columns: gallery rail + buy column.                                        |
| 2a  | Gallery                | `2044:2608`        | 24,0 800×2578.43, top padding 75              | Product imagery, click-to-zoom, colour-driven media.                           |
| 2b  | Buy column             | `2044:2619`        | 824,0 592×1033, padding 140/80, gap 40        | Title, price, colour, size, CTA, disclosures, help. Content 432 wide.         |
| 3   | Recommendation         | `2044:2661`        | 0,2602.43 1440×711                            | "you may also like" label + 4-up row. 24 px below the product area.            |
| 4   | Footer                 | `2044:2685`        | 0,3323.43 1440×419                            | Wordmark, four link columns, newsletter.                                       |

Buy column internals, in order:

| #   | Block              | Node         | Geometry (relative)        | Type / colour                                                        |
| --- | ------------------ | ------------ | -------------------------- | -------------------------------------------------------------------- |
| 1   | Title              | `2044:2621`  | y140, 137×16               | DM Sans 12/600, `#353535`                                            |
| 2   | Price              | `2044:2622`  | y168, 46×18 (12 gap)       | DM Sans 14/600, `#353535`                                            |
| 3   | Colours label      | `2044:2624`  | y226, 34×16                | DM Sans 12/500, `#000`                                               |
| 4   | Colour swatch      | `2044:2626`  | y254, 16×16                | solid `#000`, 1 px stroke; 12 gap, 12 between swatches               |
| 5   | Size label row     | `2044:2628`  | y310, 432×16, space-between | `size` 12/500 `#000`; `size recommendation` right 12/500 `#666`      |
| 6   | Size chips         | `2044:2631`  | y338, 432×44, 12 gap       | each 44 tall, 1 px `#DCDCDC`, pad 13/16, 12/500 `#666`               |
| 7   | Primary CTA        | `2044:2646`  | y422, 432×40, radius 4     | fill `#DFDFDF`, label white 12/500 — `select size` (disabled state)  |
| 8   | Disclosures        | `2044:2648`  | y502, 432×335              | description 173 (open), details 81, shipping 81; 1 px `#000`         |
| 9   | Help               | `2044:2660`  | y877, 122×16               | DM Sans 12/500, `#666`: `need help? contact us`                      |

Gallery internals: one full-width image `800×1432` at y75; a two-up row at y1507 (`400×535.71` each,
the right tile offset +67.86); a second two-up row at y2042.71. Ratios are photographic (~0.559 and
0.747), not a single tile ratio.

Footer internals: content at y3444.43 (121 from the footer top). `LOREM IPSUM` 249×54 Helvetica 36/400 at
x22; columns 83 wide at x444 / 604 / 764 / 924 (160 pitch), heading `#000`, links `#666`, 42 px row
rhythm; newsletter label at x1180, field 234×39 at y3468, `SUBSCRIBE` at x1335.

### 2.2 Mobile (390), wireframe `16:6217`

Frame 390 × 4080, content 2299.56 tall, rest dead. Header 76.

| #   | Section            | Node         | Geometry (x, y, w×h)             | Responsibility                                              |
| --- | ------------------ | ------------ | -------------------------------- | ----------------------------------------------------------- |
| 1   | Header             | `16:6218`    | 0,0 390×76; inner 24,16 342×43   | `Menu` 57×43, wordmark 125×27 at x104, `Bag` 47×43, `Help` 51×43 |
| 2   | Gallery            | `16:6231`    | 0,76 390×585                     | Full-bleed 2:3 snap carousel, no visible counter in the frame |
| 3   | Buy column         | `16:6508`    | 0,661 390×574, padding 24        | Same blocks as desktop, 342 content width                   |
| 3a  | Title + price      | `16:6509`    | y685, 70×41                      | padding-top 24; name 16, 12 gap, price 13                   |
| 3b  | Colours            | `16:6512`    | y766, 44×44                      | label + two 16×16 swatches, 12 gap                          |
| 3c  | Size               | `16:6527`    | y850, 342×54                     | label row + 26-tall chips (not 44)                          |
| 3d  | Primary CTA        | `16:6544`    | y944, 342×40                     | `Add to bag`                                                |
| 3e  | Disclosures        | `16:6517`    | y1024, 342×147                   | three 49 px rows                                            |
| 3f  | Help               | `16:6546`    | y1195, 122×16                    | `need help? contact us`                                     |
| 4   | Recommendation     | `16:6576`    | 0,1235 390×424.56                | label at y1275, 720-wide rail of 180.75×318.56 cards, 2 visible |
| 5   | Footer             | `16:6265`    | 0,1659.56 390×716                | Broken desktop copy: newsletter label is off-canvas at x1179 |

Mobile recommendation card: image 180.75×270.56 (2:3), caption 48 with the name left at an 8 px inset
and the price right.

### 2.3 Ordering rules

- **One DOM order for both breakpoints.** The only reorder between desktop and mobile is that the
  gallery is first at both sizes, and the buy column follows; desktop places them side by side with
  `grid-cols-1 desktop:grid-cols-[minmax(0,800fr)_minmax(0,592fr)]`.
- Buy column order is fixed: title/price → colour → size → CTA → disclosures → help. Anything inserted
  for try-on goes **after size and before the CTA** (see §8).
- Disclosures are `description, details, shipping`, lowercase labels in Figma, sentence case in the
  shipped accordion. Keep sentence case (`Description`, `Details`, `Shipping`).
- Recommendation sits 24 px below the product area and is full-bleed; the label is on the 24/30 gutter,
  the cards are edge to edge with no column gap.
- No breadcrumb, no rating, no SKU, no shipping estimate, no sticky buy bar on mobile. The frames show
  none of these and the shipped build adds none.

---

## 3. Current implementation map (template repo)

### 3.1 Route and data flow

`app/products/[handle]/page.tsx` is a Server Component inside `Page className="pt-0"`.

1. `generateStaticParams` seeds one handle (or `PLACEHOLDER_HANDLE`).
2. `generateMetadata` builds SEO/OG from `getProduct`.
3. The page renders `<Suspense fallback={<ProductDetailSkeleton />}>` and inside it:
   - starts `getProductRecommendations({ handle, intent: "RELATED" })` **before** the product read;
   - awaits `getProduct` and `searchParams` together;
   - resolves `selectedOptions` from the URL (`?Color=Black&Size=M`) over `defaultSelectedOptions`;
   - if no option is in the URL, `variantPromise` resolves the cached `defaultVariant`; otherwise it
     calls the **uncached** `fetchProductVariant` so price and stock are live;
   - renders `ProductViewedTracker`, `RecentlyViewedRecorder`, `ProductDetailSection`, then a deferred
     `RelatedProductsSection`.
4. `ProductDetailSection` emits JSON-LD (`ProductSchema`, `ProductOpenGraph`, `BreadcrumbSchema`) and the
   two-column grid.

Loading contract (`docs/PDP-HYDRATION-AND-LOADING.md`): the skeleton is route-level only; the media
renders from the URL selection synchronously; the first gallery image is eager/high priority/preloaded;
later tiles mount through `IntersectionObserver` at a 300 px margin; recommendations mount only near the
viewport. Do not wrap the whole PDP in an image-awaiting skeleton, and do not move the selected-colour
image behind a second boundary.

### 3.2 Section order as rendered

```
<Page pt-0>
  ProductSchema / ProductOpenGraph / BreadcrumbSchema   (head-only)
  div.grid.desktop:grid-cols-[800fr_592fr]              (px-(--gutter) at desktop)
    ProductMediaArea                                    → mobile carousel + desktop grid
    ProductInfoArea (desktop:sticky top-[76px])
      div.mx-auto.max-w-[432px].grid.gap-10
        h1 title + WishlistButton
        ProductPrice (when pricing is uniform)
        div.grid.gap-7
          ProductForm
            ProductFormPrice (when pricing varies)
            ProductFormOptions (colour, then size, then other axes)
            BuyButtons (qty picker + primary + Buy it now)
          BundleRelationships (when present)
          ProductAccordion (Description / Details / Shipping)
          div.sticky.bottom-0 → Need help? mailto
  DeferredRelatedProducts
    h2 "You may also like" + 4-up row captionLayout="row"
```

### 3.3 Component table

| File                                              | Responsibility                                                                 | Props / inputs                                                                 | Tokens and classes it owns                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `app/products/[handle]/page.tsx`                  | Route, metadata, URL→variant resolution, Suspense                                  | `params.handle`, `searchParams`                                                | `Page`, `pt-0`                                                                    |
| `product-detail/product-detail-section.tsx`        | Grid, schema, media/info split, skeletons                                        | `product`, `selectedOptions`, `variantPromise`                                 | `desktop:grid-cols-[minmax(0,800fr)_minmax(0,592fr)]`, `desktop:px-(--gutter)`    |
| `product-detail/product-media.tsx`                | Mobile snap carousel + dot rail; desktop lightbox grid; colour slot              | `media`, `title`, `desktopSlot`, `mobileSlot`                                  | `aspect-[2/3]`, `aspect-[20/27]`, `gap-2.5`, `bg-surface`, `snap-x snap-mandatory`  |
| `product-detail/lightbox.tsx`                     | Full-screen image viewer                                                         | trigger + image                                                                | dialog, arrows, count                                                            |
| `product-detail/product-info.tsx`                 | Option groups: colour vs size vs single-value                                    | `options`, `lowStockLabel`, `sizeGuideCategory`, `onSelectValue`, `compact`    | `gap-7`, `type-h4`, `type-body-sm`                                                |
| `product-detail/color-picker.tsx`                 | Swatch row                                                                       | `option`, `onSelectValue`, `hideImages`                                        | `Swatch`, 36 px target                                                            |
| `product-detail/option-picker.tsx`                | Text option chips (sizes) + size-guide trigger + low-stock footnote              | `option`, `footnote`, `sizeGuideCategory`                                      | `min-h-9 min-w-9`, underline selection, `line-through` unavailable                |
| `product-detail/product-form.tsx`                 | Client provider, URL replace on select, resolves live variant                    | `product`, `handle`, `sizeGuideCategory`                                       | `router.replace(..., { scroll: false })`                                          |
| `product-detail/buy-buttons.tsx`                  | Quantity stepper, primary submit, Buy it now, selling plans, pending state       | `fallbackVariant`, `availableForSale`, `quantityPicker`, `buyWithShop`         | `h-9`, `border-ink`, `grid-cols-[2.25rem_1.5rem_2.25rem]`                         |
| `product-detail/product-accordion.tsx`            | Three disclosures                                                               | `descriptionHtml`                                                              | `Accordion` (`<details>`), `py-4`, `border-rule`                                  |
| `product-detail/size-guide.tsx`                   | Right sheet wrapper around the size-chart content                               | `category`                                                                     | `w-(--drawer-size)` (720 desktop / 100% mobile), `shadow-modal`                    |
| `product-detail/product-price.tsx`                | Price + compare-at                                                              | `amount`, `currencyCode`, `compareAtAmount`                                    | `type-display`                                                                    |
| `product-detail/product-detail-section.tsx` (fallbacks) | Static skeleton with matching geometry                                     | `product`, `allInStock`, `showLabel`                                           | `Skeleton`, `h-9`, `max-w-[432px]`                                                |
| `product-detail/recently-viewed.tsx`              | localStorage recorder                                                           | product summary                                                                | —                                                                                 |
| `product-detail/schema.tsx` / `open-graph.tsx`    | Structured data                                                                 | product/variant facts                                                          | —                                                                                 |
| `product-card/product-card.tsx`                   | Recommendation card                                                             | `product`, `captionLayout`, `loading`, `outOfStockText`                        | `aspect-[2/3]`, `type-h4`, `type-label`, `type-body-sm`                           |
| `product-card/wishlist-button.tsx`                | Heart toggle                                                                    | product                                                                        | local storage, `aria-pressed`                                                      |
| `product/related-products-section.tsx`            | Heading + 4-up row                                                              | `limit`, `productsPromise`                                                     | `grid-cols-2 desktop:grid-cols-4`, `gap-y-(--grid-row-gap)`, `type-h4`             |
| `product/price.tsx`                               | Currency formatting                                                             | `amount`, `currencyCode`                                                       | `tabular-nums`, `font-light`, `normal-case`                                        |

### 3.4 Responsive behaviour

- **Breakpoints are `tablet:` 46.875rem (750) and `desktop:` 68.75rem (1100).** `md:`/`lg:`/`xl:` are
  rejected by the design gate.
- Below `desktop`: one column, gallery carousel `aspect-[2/3]` full-bleed, info padded `px-(--gutter) py-6`,
  `gap-10` between blocks, 432 px max width.
- At `desktop`: two columns, gallery grid `aspect-[20/27]` with `gap-2.5` (10 px), info is
  `sticky top-[76px] max-h-[calc(100svh-76px)] overflow-y-auto pt-[64px]` and centred at 432 px.
- Gutter is 24 px below 1100 and 30 px at and above.
- The mobile header has no search, wishlist or account control; those live in the menu panel.

### 3.5 States already implemented

| State                        | Mechanism                                                                   |
| ---------------------------- | --------------------------------------------------------------------------- |
| Default selection            | `defaultSelectedOptions(product)` fills every option                        |
| URL-selected variant         | `parseSelectedOptions` → `fetchProductVariant` (uncached)                   |
| Unavailable option value     | `line-through opacity-50`, disabled if `!exists` or `!available && !selected` |
| Selection still resolving    | `data-selection-unresolved`, button visible but `disabled`, label stays     |
| Pending add                  | label `Adding to cart…`, spinner on Buy it now, `aria-disabled`             |
| Out of stock                 | label `Out of stock`, button disabled, Buy it now `invisible`               |
| Bundle needs configuration   | label `Choose bundle items`, disabled                                       |
| Selling plan required        | label `Subscription unavailable`, disabled                                  |
| Low stock                    | `getLowStockLabel` footnote under size chips, threshold ≤ 5                 |
| Low stock data absent        | `quantityAvailable === null` → renders nothing (dormant)                    |
| Gift card                    | `GiftCardPurchaseForm` replaces the buy controls                            |
| Empty media                  | `ImagePlaceholder` tile                                                     |
| Video media                  | `AutoPlayVideo` with preview image                                          |
| Add-to-bag confirmation      | cart drawer opens (`openOverlay()`)                                         |

---

## 4. State matrix

Frames: default `16:7053` / `2044:2602`, variant selected `1:967` / `2044:2736`, low stock `1:1090` /
`2050:3697`, out-of-stock `1:1910` / `2050:4111`, size guide `16:7450` + `16:7270`, notify-me `16:7696` +
`16:8009`, slide-over `16:8173` + `16:8341`.

### 4.1 Page states

| State                       | Trigger                                        | Visible difference (desktop)                                                                                                         | Visible difference (mobile)                          | Required data                                                                              |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Default, in stock**       | first paint, no URL options                     | title 12/600, price 14/600, colours, size chips unselected, CTA `select size` disabled (`#DFDFDF`) or `Add to bag` enabled, description open | gallery, then title/price, colours, size, `Add to bag` | title, price, currency, media[], options, variants[] with `availableForSale`, description    |
| **Variant selected**        | option click, or `?Color=…&Size=…`             | price and compare-at update; gallery swaps to that colour's media; selected chip underlined/filled; CTA enabled; URL replaced         | same, plus the carousel resets to slide 1 and the dot count changes | variant `{ price, compareAtPrice, image, availableForSale, quantityAvailable, selectedOptions }` |
| **Low stock**               | `0 < quantityAvailable ≤ 5` for the selection  | one extra line under the chips, 12 below: `Only N left in stock`, 12/500 `#000`, 96×16; everything below moves down 28 px           | same line under the chips; CTA moves down            | `quantityAvailable` (integer). Null = no line. Threshold is a product decision (template uses 5) |
| **Out of stock / waitlist** | selection `availableForSale === false`         | chips keep 26/44 height, border becomes `#BBBBBB`, no selected fill; CTA becomes an outlined waitlist trigger 432×42, 1 px `#000`, no fill, `Notify me when available` 12/500 `#000`; help follows | chips greyed, CTA swapped for bordered `Notify me when available` | per-value availability from `encodedVariantAvailability` or variant `availableForSale`; a waitlist sink |
| **Selection unresolved**    | option clicked, live variant not yet returned   | button stays visible, `disabled`, label unchanged; no spinner on the primary                                  | same                                                 | — (transient)                                                                              |
| **Add in flight**           | submit                                          | label `Adding to cart…`, control not re-clickable, Buy it now spinner                                        | same                                                 | cart mutation result                                                                       |
| **Add failed**              | mutation error                                  | inline/global error, drawer does not open                                                                    | same                                                 | error code                                                                                 |
| **No media**                | `media.length === 0`                            | `ImagePlaceholder` tile at 20:27, lightbox suppressed                                                        | placeholder 2:3, single dot hidden                   | —                                                                                          |

### 4.2 Overlay states

| State                            | Frame(s)                    | Geometry                                                                                                                                  | What changes on the page                                    | Required data                                        |
| -------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **Size guide modal**             | `16:7450`, `16:7270`        | Not written up in any spec. Shipped: right sheet, 720 px at `desktop` (`--drawer-size`), full width below; 56 px header with `Size guide` + close; scrollable body | page scrolls behind, body not inert in the shipped build    | size chart per category, cm/in toggle, conversion table |
| **Notify-me modal**              | `16:7696`, `16:8009`        | **Right sheet, not a centred dialog.** Scrim 20 % black; panel 592×794 flush right at x848; header 592×72 pad 24, title `Notify Me` 16/400, close 24×24; body 592×621 pad 24 gap 32; product 544×191 (image 123×191 + 397 block with name/price/size); size row 544×54; email block 544×75 (helper 12/500 + field 544×49, 1 px border, placeholder 12/400 `#666`); footer 592×101 pad 24, button 544×53 pad 16/12, 1 px border, `Notify Me` 16/600. Mobile: bottom sheet 390×744 at y100, body 342, scrim solid black | page stays visible behind the scrim; row shifts nowhere   | product summary, selected size, email, consent, spam control, a sink |
| **Slide-over confirmation**      | `16:8173`, `16:8341`        | **No written geometry anywhere.** Shipped surrogate is the cart drawer: right sheet `--drawer-cart` 440 px desktop / full-screen mobile, title `Bag (n)`, header 56, lines + summary | opens after a successful add; page unchanged                 | added line, quantity, subtotal, currency              |

### 4.3 Behavioural requirements per state

- **Default.** The buy column must be usable before any option is chosen. Two mutually exclusive
  readings:
  - *Design I:* nothing is selected; the CTA is `select size` and disabled until a size is chosen.
  - *Wireframe + shipped:* the first available variant is preselected; the CTA is live.
  For a PDP-only app, preselect the first available variant (the shipped behaviour) and keep the label
  `Add to bag`. A dead primary button on first paint is a conversion risk and the design system has no
  disabled-button treatment beyond `opacity-50`.
- **Variant selected.** Selection must not scroll the page (`router.replace(..., { scroll: false })`),
  must survive a refresh via the URL, and must update price, gallery, availability and the low-stock line
  together. Gallery update is per colour, not per size.
- **Low stock.** The line is per selected variant, not per product. It is the only new line in the size
  block and must not push the CTA without moving everything below it (the frame moves the button by 28).
  Copy in the frame is lowercase `only 1 left in stock`; the shipped helper writes `Only 1 left in stock`.
  Pick one casing (the design system is sentence case for body copy).
- **Out of stock.** All chips become `#BBBBBB`-bordered and no chip is selected. The primary control
  becomes an **outlined** waitlist trigger, not a filled one. The help line stays. Do not hide the price
  or the gallery.
- **Notify-me.** Opens as a right sheet on desktop and a bottom sheet on mobile. It repeats the product
  image, name, price and selected size; it collects one email; it needs a visible success state that the
  frame does not draw. It must validate email inline, set `aria-invalid`, and announce errors.
- **Size guide.** Opens from the size row (shipped puts the trigger at the end of the row). It must move
  focus into the sheet, trap it, restore it on close, and mark the page behind inert — the shipped build
  does not, and the live reference does not either (`docs/reference/interactions/product-detail.md` §4).
- **Slide-over confirmation.** If it is the cart drawer, it must open on success only, show the added
  variant and quantity, and keep the page scroll locked while open. If it is a bespoke "added" sheet, it
  must still offer a route to the bag and to continue shopping.

### 4.4 Copy inventory

Frame copy to keep: `you may also like`, `need help? contact us`, `size recommendation`,
`Add to bag`, `Notify me when available`, `Notify Me`, `Size guide`.
Frame copy to correct: `Man` → `Men`; `only 1 left in stock` → sentence case; `Enter you email/address`
→ `Enter your email address`; `CONTROL YOUR NURRATIVE` (not on PDP); `Notify Me Modall` (frame name only).

---

## 5. Header / nav contract

### 5.1 Desktop bar

| Property        | Wireframe `1:152` / `1:309`                              | Design I `2044:2718`                       | Ship this |
| --------------- | -------------------------------------------------------- | ------------------------------------------ | --------- |
| Height          | 76                                                       | 74                                         | **76** (`--header-bar-h`), sticky, z `--z-header` |
| Padding         | 16 / 24                                                  | 0 / 24                                     | 24 horizontal, hairline bottom |
| Zones           | 3: left, centre, right                                   | 3: left, centre, right                     | `grid-cols-[1fr_auto_1fr] gap-4` |
| Left labels     | `Woman` (70×43), `Man` (49×43), `Search` (66×43), gap 10 | `WOMAN` (57), `MAN` (33), `SEARCH` (55), 14/700, gap 24 | `Woman`, `Men`, `Search` as buttons/links |
| Centre          | wordmark 125×27 at x658, 18/400                          | wordmark vector 303×24 at x568.5           | `Wordmark variant="nav"`, 125 px wide |
| Right labels    | `Wishlist` 70, `Bag` 47, `Help` 51, `Account` 72, gap 24 | same four, 14/700, gap 24                  | same four; `Bag (n)` when the cart is non-empty |
| Control         | 43 px chip: 1 px border, 10 px horizontal padding, 14/400 | no border, no background                  | **chip** (`NAV_CHIP_CLASS`): `h-[43px] border border-ink px-2.5`, `type-body`, hover inverts |
| Wordmark link   | → `/`                                                    | → `/`                                      | `aria-label` = site name |
| Announcement    | none                                                     | none                                       | none — header is the first element |
| Search          | `Search` chip opens the search sheet                     | text label                                 | chip opens the search sheet; `⌘K` is a shipped extra |

`NAV_CHIP_CLASS` exactly:
`type-body font-normal focus-ring flex h-[43px] shrink-0 cursor-pointer items-center border border-ink px-2.5 text-ink transition-colors hover:bg-ink hover:text-inverse`.

### 5.2 Category panel (mega menu)

| Part   | Geometry                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------- |
| Scrim  | `#000` at 20 % over the page                                                                    |
| Panel  | 592 × full height, flush left, white, `--z-overlay`                                             |
| Header | 73 tall, padding 24: the three chips (`Woman`, `Men`, `Search`) + a 36 px close target          |
| Body   | padding 24, gap 24: `SHOP WOMAN` 16/400 `#353535`, then links 16/400 on a 43 px baseline rhythm |
| Footer | `Lorem Ipsum` 16/400, 24 from the bottom                                                        |
| Motion | 300 ms `--ease-standard`; body scroll locked while open; `Escape` closes and restores focus      |

Woman links (11): All, Bralettes, Bodysuits, Dress, Pants, Racer Backs, Shirts, Skirt, Shorts, T-shirt,
Tops. Men links (6): All, Jackets, Pants, Shirts, Shorts, T-shirt. In the template these are
`/collections/<handle>`; in a PDP-only app they need either real destinations or an explicit inert
treatment (§11.2, question 5).

### 5.3 Mobile bar and menu

Closed bar, 390: 76 tall, 24 gutter, inner 342×43 at 16/24.

| Element  | Geometry | Treatment                          |
| -------- | -------- | ---------------------------------- |
| `Menu`   | 57×43    | 1 px border chip, 14/400           |
| Wordmark | 125×27   | optically centred at x104          |
| `Bag`    | 47×43    | 1 px border chip                   |
| `Help`   | 51×43    | 1 px border chip                   |

No search, no account icon, no wishlist, no bag count, no bottom navigation in any 390 frame.

Open menu (Design I `2022:4641` Woman, `2022:4768` Men): full-height white panel replacing the page.

| Part    | Geometry                                                                                    |
| ------- | ------------------------------------------------------------------------------------------- |
| Header  | 74 tall, padding 24: `WOMAN MAN SEARCH` 14 px left; search, bag, account, close icons right  |
| Links   | one column at the 24 gutter, 21 px rows, 24 px rhythm                                        |
| Utility | `My Account`, `Delivery`, `Return`, `Contact Us` — muted, 12 px apart                        |
| Tiles   | full-bleed square images, uppercase white label bottom-left; three for Woman, two for Men     |

All menu type stays DM Sans. The wordmark stays a bitmap, not type.

### 5.4 Brand wordmark

- Asset: `public/brand/wordmark.png`, 950×82, ink 950×82 (cropped from the 1200×1800 `IMG_0923` raster).
- Component: image inside a `<Link href="/">`, `aria-label` = site name; variants `nav` = 125 px wide and
  `footer` = 315 px wide; `priority` only in the header.
- Do not set it in type. The face is unidentified (wider than Archivo 700/100, Gothic A1 Black and Poppins
  ExtraBold at matched width) and no webfont matches it.
- Design I also carries an off-canvas script study, `Lorem Ipsum` in Mea Culpa 54 at y −113. It is not
  part of the page; ignore it.

---

## 6. Footer contract

### 6.1 Frame geometry

| Property      | Design I `2044:2685`                                  | Wireframe / shipped                          |
| ------------- | ----------------------------------------------------- | -------------------------------------------- |
| Height        | 419                                                   | 361 in the wireframe (`16:7127`); the live reference measures 361 at 1440 |
| Top rule      | 1 px                                                  | `border-t border-rule`                        |
| Top padding   | 121 to content                                        | `pt-20` (80) + block gaps                    |
| Wordmark      | `LOREM IPSUM` 249×54, Helvetica 36/400 at x22         | `Wordmark variant="footer"`, 315 px wide      |
| Columns       | 4 × 83 wide at x444 / 604 / 764 / 924 (160 pitch)     | 4 columns in a 6-col grid at desktop          |
| Column type   | heading `#000` 12/400/18; links `#666` 12/400/18      | `type-label` heading, `type-body-sm` links    |
| Row rhythm    | 42 px                                                 | `min-h-9` links (36) with `type-body-sm`      |
| Newsletter    | label x1180 y3444; field 234×39 y3468; `SUBSCRIBE` x1335 | `Subscribe to Our Newsletter` + input + submit |
| Payment marks | none in the frame                                     | Amex, Diners, Maestro, Mastercard, RuPay, Visa |
| Currency      | none in the frame                                     | footer-only select                            |
| Legal row     | none in the frame                                     | `© 2026 · Lorem Ipsum · Website by UniPlus`   |

### 6.2 Labels and destinations

| Column        | Labels (in order)                                                | Destinations (template)                                        |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Brand block   | `Flagship Store`, address, `Open daily, 11am – 8pm`, wordmark     | `/`                                                             |
| **Help**      | `Size Guide`, `Care Instructions`, `FAQ`, `Contact Us`            | `/pages/size-guide`, `/pages/care-guide`, `/pages/faqs`, `/pages/contact-us` |
| **Policies**  | `Terms & Conditions`, `Privacy`, `Shipping`, `Returns & Exchange` | `/pages/terms-of-service`, `/pages/privacy-policies`, `/pages/shipping-returns`, `/pages/returns-exchanges` |
| **The Brand** | `Our World`, `Journal`, `Press`                                   | `/pages/about-us`, `/blogs/journal-2`, `/pages/press-v2`        |
| **Socials**   | `Instagram`, `Facebook`, `Pinterest`                              | instagram.com / facebook.com / pinterest.com (new tab, `noreferrer`) |
| Newsletter    | `Subscribe to Our Newsletter`, placeholder `Your e-mail`, `SUBSCRIBE` | local or provider POST; needs a success and error state        |

Frame copy differs: `Care Instruction` (singular), `Terms & Condition` (singular), `Subscribe to Our
Newsletters` (plural), `The Brand → About Us` (one link), and no address or payment row. The shipped
labels are the better ones; keep them.

### 6.3 Responsive behaviour

- Mobile: 2-column link groups, newsletter spans both columns, brand block spans 2, legal row stacks.
  `grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1.7fr]`.
- The wireframe's 390 footer is a copy of the 1440 one and is broken (newsletter label at x1179,
  wordmark below the field). **Do not build from it**; use the shipped stacked composition.
- Footer is the last element; `Page` owns top padding only, the footer supplies the closing gap.

---

## 7. Component mapping: Figma → new repo

Proposed files, using the folders that already exist in this repo (`components/pdp`, `components/site`,
`components/try-on`, plus `components/ui` for primitives). Data is local fixtures or a Storefront-like
`lib/product` module; no prop is optional unless stated.

### 7.1 Chrome

| Figma section / node                  | Proposed file                          | Data / props                                                                                     |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bar `Frame 5` / `2044:2718`           | `components/site/header.tsx`           | `children` slots: `nav`, `search`, `actions`; sticky 76 px                                       |
| Chips `Woman/Man/Search/Wishlist/Bag/Help/Account` | `components/site/nav-chip.ts` | `NAV_CHIP_CLASS` constant; no props                                                              |
| Category triggers + panel `1:152`     | `components/site/desktop-nav.tsx`      | `items: NavItem[]`, `openIndex`, `onOpenChange`; panel is a dialog, 592 px, scrim 20 %          |
| Mobile closed bar `16:6218`           | (inside `header.tsx`)                  | —                                                                                                |
| Mobile open panel `2022:4641/4768`    | `components/site/mobile-menu.tsx`      | `items: NavItem[]`, `utilityLinks`, `tiles: NavTile[]`                                           |
| Wordmark `Frame 4` / `IMG_0923`       | `components/site/wordmark.tsx`         | `variant: "nav" \| "footer"`, `priority?: boolean`                                               |
| Footer `2044:2685`                    | `components/site/footer.tsx`           | `columns: FooterColumn[]`, `site: SiteConfig`, `paymentMarks?: ReactNode`                        |
| Nav data `MAIN_NAV`, `FOOTER_COLUMNS` | `lib/site/nav.ts`                      | `NavItem { label, href, columns?, tiles? }`, `FooterColumn { title, links }`                      |

### 7.2 PDP

| Figma section / node              | Proposed file                            | Data / props                                                                                      |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Route shell                       | `app/products/[handle]/page.tsx`         | `params.handle`, `searchParams`; renders `<ProductPage>`                                           |
| Grid + schema `2044:2606`         | `components/pdp/product-page.tsx`        | `product: ProductDetails`, `selected: SelectedOptions`; emits JSON-LD                              |
| Gallery `2044:2608` / `16:6231`   | `components/pdp/product-gallery.tsx`     | `media: MediaItem[]`, `title`, `variantImage?`, `desktopMosaic?: GalleryLayout`                    |
| Lightbox `16:7059` interaction    | `components/pdp/product-lightbox.tsx`    | `images`, `index`, `onIndexChange`; dialog, focus trap, arrow keys                                 |
| Buy column `2044:2619`            | `components/pdp/product-info.tsx`        | `product`, `variant`, `onSelectOption`, `onOpenSizeGuide`, `tryOnSlot?`                            |
| Title + price `2044:2620`         | `components/pdp/product-heading.tsx`     | `title`, `price`, `compareAtPrice?`, `currencyCode`                                                |
| Colours `2044:2623`               | `components/pdp/color-picker.tsx`        | `option: OptionGroup`, `selected`, `onSelect`; 16 px swatch, 36 px target                          |
| Size `2044:2627`                  | `components/pdp/size-picker.tsx`         | `option`, `selected`, `onSelect`, `lowStockLabel?`, `onOpenSizeGuide`, `recommendationLabel?`      |
| Low-stock line `16:7223`          | `components/pdp/stock-notice.tsx`        | `quantityAvailable?: number \| null`, `threshold?: number`                                         |
| Primary CTA `2044:2646`           | `components/pdp/buy-buttons.tsx`         | `state: "idle" \| "unselected" \| "pending" \| "oos"`, `onAdd`, `quantityPicker?`                  |
| Disclosures `2044:2648`           | `components/pdp/disclosures.tsx`         | `descriptionHtml`, `details`, `shipping`, `defaultOpen?: "description"`                            |
| Help `2044:2660`                  | `components/pdp/help-link.tsx`           | `email` or `onOpenContact`                                                                         |
| Recommendation `2044:2661`        | `components/pdp/recommendations.tsx`     | `products: ProductCard[]`, `limit`, `captionLayout: "row"`                                         |
| Card `2050:3859`                  | `components/pdp/recommendation-card.tsx` | `product: ProductCard`, `outOfStockText`                                                           |
| Size guide `16:7450`              | `components/pdp/size-guide-sheet.tsx`    | `category`, `chart: SizeChart`, `open`, `onOpenChange`                                             |
| Notify me `16:7696`               | `components/pdp/notify-me-sheet.tsx`     | `product`, `variant`, `size`, `onSubmit(email)`, `state: "idle" \| "submitting" \| "done" \| "error"` |
| Slide-over `16:8173`              | `components/pdp/bag-confirmation.tsx`    | `line: CartLine`, `subtotal`, `onContinue`, `onViewBag`                                            |
| Loading                           | `components/pdp/product-skeleton.tsx`    | `showQuantityPicker`; mirrors 800/592 + 432                                                  |

### 7.3 Primitives to port

`components/ui/sheet.tsx` (Base UI dialog, `side: right|left|top|bottom`, overlay, `shadow-modal`),
`accordion.tsx` (`<details>`), `price.tsx`, `swatch.tsx`, `skeleton.tsx`, `image-placeholder.tsx`,
`page.tsx` (`pt-(--page-top)`), `container.tsx`, `link.tsx`. Keep primitive props only; no domain data.

### 7.4 Data model the mapping implies

```ts
type Money = { amount: string; currencyCode: string };

interface ProductDetails {
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  sku?: string;
  media: MediaItem[];          // { type: "image" | "video"; image|video: { url, width, height, altText } }
  options: OptionGroup[];      // { id, name, values: OptionValue[] }
  variants: Variant[];         // each with selectedOptions, price, compareAtPrice?, availableForSale, quantityAvailable?, image
  defaultVariant?: Variant;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange?: { minVariantPrice: Money; maxVariantPrice: Money };
  hasUniformPricing: boolean;
  allVariantsInStock: boolean;
  availableForSale: boolean;
  sizeGuideCategory?: string;
  seo: { title: string; description: string };
}

interface Variant {
  id: string;
  title: string;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  compareAtPrice?: Money;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  image?: Image | null;
}
```

### 7.5 What exists in this repo now (snapshot 2026-11-17 ~13:55)

The app was scaffolded while this document was being written. The files below already exist and mostly
follow the contract, with the deviations listed in §11.1 (C15–C18):

| Contract element        | Actual file(s)                                      | Notes |
| ----------------------- | --------------------------------------------------- | ----- |
| Route + JSON-LD         | `app/page.tsx` (not `/products/[handle]` yet)        | one product, inline `Product` schema |
| Shell, fonts, bag state | `app/layout.tsx`                                     | DM Sans 300/400/500/600, `BagProvider`, header + footer |
| Product section shell   | `components/pdp/pdp-experience.tsx`                  | grid `desktop:grid-cols-[800fr_592fr]`, mounts studio |
| Gallery                 | `components/pdp/product-media.tsx`                   | mobile snap carousel, user-photo slide 0, per-image dots |
| Buy column              | `components/pdp/buy-panel.tsx`                       | title/price, colour, size, CTA pair, 3 disclosures, help |
| Size guide              | `components/pdp/size-guide.tsx`                      | 100 lines, own sheet |
| Recommendations         | `components/pdp/recommendations.tsx`                 | rail at 390, 4-up at desktop, `250/447` tiles |
| Header                  | `components/site/header.tsx`                         | Design I text links, mobile menu inline |
| Footer                  | `components/site/footer.tsx`                         | 148 lines |
| Bag                     | `components/site/bag-provider.tsx`                   | drawer state + line items |
| Try-on                  | `components/try-on/try-on-studio.tsx`                | 321 lines, already implements upload/preview |
| Data                    | `lib/catalog.ts`                                     | `Product`, `Recommendation`, INR formatters |

Assets present: 5 product JPEGs (`dress-front/back`, `dress-detail-front/back/hem`) and 4 recommendation
JPEGs. Typography utilities added to `app/globals.css`: `pdp-title`, `pdp-price`, `pdp-cta`, `pdp-copy`,
`pdp-label`, `pdp-rec`, `nav-link`, plus `--graphite: #353535`.

---

## 8. Try-on integration points

Goal: add virtual try-on without disturbing the Design I mosaic, the buy-column rhythm, the LCP image,
or the existing state machine.

### 8.1 Placement (recommended)

Three touch points, all additive:

| # | Slot | Placement | Why it is safe |
| - | ---- | --------- | -------------- |
| 1 | **Try-on CTA** | Buy column, immediately **after the size block and before the primary CTA** | It is the one place a shopper has already chosen a size and is about to decide. The Figma already grows this block by 28 px for the low-stock line, so a 36–40 px row + `gap-10` is an accepted kind of growth. |
| 2 | **Gallery affordance** | Absolutely positioned button, bottom-right of the **first** gallery tile, 12 px inset | Does not change tile size, ratio, order or the LCP element. On mobile it floats over slide 1 of the existing snap carousel. |
| 3 | **Result surface** | Sheet: right, 592 px at desktop (the notify-me panel width), bottom sheet / full-screen at 390 | Reuses the notify-me sheet geometry instead of introducing a new rail, and keeps the page behind intact. |

Do **not**:

- prepend a try-on tile to the gallery (moves the preloaded LCP image, changes the mosaic's 800×1432
  hero, and on mobile moves slide 1);
- add a fourth column or a new section between the product area and the recommendation row (the 24 px
  gap and the full-bleed row are fixed);
- add a second sticky bar on mobile (the frames have none);
- put the CTA beside `Add to bag` in the button row (that row is 2 controls wide: quantity + primary, and
  the Figma's CTA is full-width).

If a persistent artefact is wanted later, the safe insertion is **appended after the last media item** so
tile indices 0..n−1 are untouched. Treat that as an opt-in gallery slot, not the default.

### 8.2 Control anatomy

| Control | Desktop | Mobile | Classes |
| ------- | ------- | ------ | ------- |
| Try-on CTA | 432×40, 1 px `--ink` border, transparent fill, `type-control`, label `Try it on` | 342×40, same | `flex h-10 w-full items-center justify-center border border-ink` |
| Gallery affordance | 36×36 target, white/ink chip or bottom-right text pill | 36×36 over the image | `absolute right-3 bottom-3 focus-ring` |
| Sheet header | 56 px, padding 24, title `Try it on` + 36 px close | 56 px | `type-h2`, `SheetTitle` |
| Primary action in sheet | `Add to bag` (if a size is selected) or `Choose a size` | same | `type-control h-10` |
| Secondary | `Try another photo`, `Remove photo` | same | `type-control underline` |

The CTA must never become the primary filled button. The primary filled/outlined control remains
`Add to bag` / `Notify me when available`; try-on is a secondary, outlined or underlined affordance.

### 8.3 State machine

`idle → uploading → processing → preview → (error) → idle`

| State | Visible | Data | Requirements |
| ----- | ------- | ---- | ------------ |
| `idle` | CTA; sheet explains the flow in one sentence and the privacy line | `tryOn.isEnabled`, accepted types, max bytes | Do not open a file picker until the shopper asks |
| `consent` (remote only) | Explicit "your photo is sent to X" line + checkbox/button | provider name, retention | Required before any byte leaves the device |
| `uploading` | progress or indeterminate bar, cancel | `File`, `bytesSent`, `abortController` | 36 px targets, `aria-live="polite"`, cancel works |
| `processing` | skeleton over the result frame, `Generating your look…`, elapsed hint | job id / promise | Must not block the page; cancel returns to `idle` |
| `preview` | composite image, `Add to bag`, `Download`, `Try another`, `Remove` | `resultUrl`, `productId`, `variantId` | Result must be labelled with product + colour; `alt` text |
| `error` | one message + retry; never a stack trace | `code` | Codes: `unsupported-type`, `too-large`, `no-person`, `network`, `rate-limited`, `provider-error` |
| `reset` | back to `idle` | — | Revoke object URLs, clear file input value, delete any server copy |

Rules:

- **Selection coupling.** If the product has sizes and none is selected, the try-on CTA is still visible
  but explains `Choose a size to try it on`; it does not silently guess. The result is tied to
  `(productId, colorId, sizeId)` and invalidated when the colour changes.
- **Low stock / OOS.** Try-on stays available when the item is out of stock, because it is a merchandising
  aid, not a purchase. Do not grey it with the CTA.
- **One photo per session.** Keep the photo in memory, not in `localStorage`/`IndexedDB`, unless the UX
  explicitly asks for "remember my photo". A page refresh should clear it.
- **No analytics payload.** Never send image data, object URLs, file names or dimensions to analytics.
  Log only state names.

### 8.4 Privacy / local-only processing

Two modes; make the mode a config value, not a runtime guess.

```ts
type TryOnConfig = {
  isEnabled: boolean;
  mode: "local" | "remote";
  provider?: string;         // required when mode === "remote"
  retention?: "none" | "session" | "24h";
  maxUploadBytes: number;    // e.g. 10 * 1024 * 1024
  acceptedTypes: string[];   // ["image/jpeg", "image/png", "image/webp", "image/heic"]
  maxDimension: number;      // downscale longest edge, e.g. 1600
};
```

**`mode: "local"`** — the strongest default for a demo or a PDP-only app:

- `URL.createObjectURL(file)` → `<img>`; nothing is uploaded.
- Copy must say so: `Your photo stays on this device.` This is a claim that must be true — no telemetry,
  no preview upload, no third-party script that reads the file.
- Reset = `URL.revokeObjectURL` + `input.value = ""`.
- Works offline; no server route, no API key, no rate limit.

**`mode: "remote"`** — if a model runs server-side:

- Ask for consent first; state the provider, the purpose and the retention.
- `POST` multipart or a presigned URL; strip EXIF/GPS client-side before upload; downscale first.
- Never persist the source photo beyond the job. Delete on completion and on `reset`.
- Return only the composite; do not return a stored URL that outlives the session.
- Set a body-size limit at the route and validate type by magic bytes, not by `Content-Type`.
- Rate-limit and gate with a bot check if the endpoint is public; no email is needed for try-on.

**Both modes:** the "private/local-only" indicator belongs in the sheet, above the primary action, in
`type-body-sm text-ink-muted`, not in a toast that disappears.

### 8.5 Accessibility

- The file input is real but visually hidden; the CTA is a `<button>` that calls `input.click()`.
- Announce transitions with a single `role="status"` / `aria-live="polite"` region; do not announce the
  progress percentage every tick.
- The result image needs `alt="You wearing <product> in <colour>"`.
- The sheet moves focus to the close button on open, traps focus, restores the trigger on close, and
  `Escape` cancels a job rather than leaving it running.
- Respect `prefers-reduced-motion`: no crossfade on the result, no shimmer in `processing`.
- Targets ≥ 36 px; the gallery affordance must not sit inside the lightbox trigger's click area without
  `stopPropagation`.

### 8.6 Layout guards (numbers to assert)

- Buy column content stays 432 wide at desktop, 342 at 390; adding the CTA must not exceed it.
- The 40 px rhythm (`gap-10`) between blocks is preserved; the new control is a block, not an extra
  wrapper with its own margin.
- The primary CTA remains the last control before the disclosures.
- Desktop gallery tile 0 stays 800×1432 at y75; mobile gallery stays 390×585 at y76.
- The recommendation row still starts 24 px after the product area.
- No horizontal overflow at 390; no new fixed/sticky element.
- If a result tile is ever appended to the gallery, the dot count increments and the LCP image index stays 0.

---

## 9. The Figma export plugin, in plain English

### 9.1 What it is

`docs/reference/figma/export-plugin/` is a tiny local Figma plugin (3 files, ~186 lines) that walks the
open document and dumps **geometry, layout and text** as JSON. It exists because Dev Mode PNG export is
paywalled, the browser download never lands on disk, and the REST API is metered and was exhausted. The
plugin API is free and unmetered, so this is the quota-free route to the same node tree.

### 9.2 What it exports

Every page in the file, and under each page every top-level frame, recursing into children. For each node:

| Field | Present when | Notes |
| --- | --- | --- |
| `id`, `name`, `type` | always | Figma node ids (`16:7053`) and layer names |
| `absoluteBoundingBox` | when the node has one | `{x, y, width, height}` in page coordinates |
| `layoutMode`, `itemSpacing`, `paddingTop/Right/Bottom/Left`, `primaryAxisAlignItems`, `counterAxisAlignItems` | auto-layout frames | the only layout facts that transfer to CSS |
| `cornerRadius` | rounded nodes | raw px; the design system will reject most of them |
| `fills` | non-empty | SOLID → `{color, opacity, type}`; IMAGE → `{imageRef, scaleMode, type}`; others → `{type}` |
| `strokes`, `strokeWeight` | non-empty | solids only; gradient/pattern strokes are dropped |
| `characters` | TEXT | the literal string, typos included |
| `style` | TEXT | `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeightPx`, `textAlignHorizontal` |
| `children` | containers | recursive |

Font weight is resolved from the style **name** (`Bold` → 700, `Semi Bold` → 600, `Regular` → 400, …)
through a 9-entry map, defaulting to 400 when the name is unknown or mixed. Spacing is normalised by a
`numeric()` helper that unwraps `{value, unit}` and **returns undefined for PERCENT** — so percentage
letter-spacing and line-height are lost. `lineHeightPx` is whatever the plugin API reports for
`lineHeight` in px; percentage line-heights come out undefined. Mixed-script text nodes lose their font
(`fontName === figma.mixed` → `null`).

**Images are not exported.** An image fill becomes `imageRef` (the image hash) plus `scaleMode`; the bytes
are never included. To see the image you must render the frame separately or resolve the hash through the
REST `/images` endpoint, which spends quota. The plugin also does not export: effects/shadows, individual
stroke weights, node-level `opacity` (only per-fill opacity survives), constraints, blend modes, component
instance overrides, or style names as styles (the file has none anyway).

### 9.3 JSON shape

```json
{
  "exportedAt": "2026-11-17T08:12:44.123Z",
  "file": { "name": "Lorem Ipsum Design I (Copy)" },
  "pages": [
    {
      "id": "0:1",
      "name": "All desings",
      "children": [
        {
          "id": "2044:2602",
          "name": "PDP - Default State (In Stock)",
          "type": "FRAME",
          "absoluteBoundingBox": { "x": 0, "y": 0, "width": 1440, "height": 3742 },
          "layoutMode": "VERTICAL",
          "itemSpacing": 0,
          "paddingTop": 0,
          "children": [
            { "id": "2044:2621", "name": "Racer back mini dress", "type": "TEXT",
              "characters": "Racer back mini dress",
              "style": { "fontFamily": "DM Sans", "fontSize": 12, "fontWeight": 600,
                         "letterSpacing": 0, "lineHeightPx": 16, "textAlignHorizontal": "LEFT" } }
          ]
        }
      ]
    }
  ]
}
```

The plugin shape is the **same shape the REST `/files` endpoint returns** for these fields, so anything
written against the REST export reads the plugin export unchanged. `figma-cache.mjs trim` is the tool that
reduces it (keeps ids, names, boxes, layout, paddings, fills, strokes, `characters` and text style).

> The file in **this** repo, `docs/figma/pdp-frames.json`, is **not** the raw plugin output. Its `meta`
> says it is a "trimmed geometry/style tree", and its shape is different:
> `{ meta, fonts, colors, imageRefs, frames:[{ id, name, size, tree }] }`. It was produced by a second
> pass that renamed some keys (`bbox`, `size`, `layout.padding` as `[t,r,b,l]`, `textColor`, `characters`),
> aggregated font/colour usage, and indexed `imageRef`s. It also omits `lineHeight` and `letterSpacing`,
> which the plugin does emit. Use the plugin for new exports; use this file for the two canonical trees.

### 9.4 How to run it

1. Open the file in the **Figma desktop app** (the browser build cannot install a development plugin from
   a manifest).
2. `Plugins → Development → Import plugin from manifest…`
3. Select `docs/reference/figma/export-plugin/manifest.json`. The plugin registers as
   **Lorem Ipsum spec export**.
4. Run `Plugins → Development → Lorem Ipsum spec export`.
5. The panel (560 × 300) shows the file name, top-level frame count, payload size in KB, and the first
   eight frames as `Page / Frame (id)`. Click **Save JSON** (downloads
   `<file-name>-export.json`) or **Copy to clipboard**.
6. Trim/list it through the cache helper:

```bash
# from wherever figma-cache.mjs lives (see caveat below)
node figma-cache.mjs trim ~/Downloads/lorem-ipsum-wireframe-export.json --out figma-cache/wireframe.json
node figma-cache.mjs list
```

Other documented helpers:

```bash
node figma-cache.mjs fetch <fileKey>                 # whole document, one REST request
node figma-cache.mjs fetch <fileKey> --ids 1:1090    # one subtree, still one request
node figma-cache.mjs trim <cached.json> --ids 1:1090 # re-read a frame, no request at all
node figma-cache.mjs list
```

**Caveat, and it matters:** `figma-cache.mjs` is **not in the template repo** and there is no
`figma-cache/` directory in it. The README says the cache lives "outside the repository, next to the
token", so these commands only work on the machine that holds that script. `trim` keeps `id`, `name`,
`type`, `absoluteBoundingBox`, `layoutMode`, `itemSpacing`, paddings, fills, strokes, `characters` and the
text style, and writes nothing on a partial fetch.

### 9.5 Why the plugin is the right tool here

- No REST quota. The token on the starter plan shares one bucket across `/files`, `/nodes`, `/images` and
  `/images/{key}`; a 429 carries `retry-after` in seconds (once ~380,911 s, about four days).
- It reads the **whole document in one pass**, so every frame is addressable offline afterwards, including
  the ones no spec has been written for.
- It is the only route to the node tree when Dev Mode's "Copy as PNG" is paywalled.
- It cannot export images, so pair it with one 1× render per surface if imagery matters.

---

## 10. Scaffold observations (this repo, snapshot 2026-11-17 ~13:55)

The scaffold changed while this document was written; earlier it had only `globals.css`. At snapshot time:

- `app/layout.tsx` and `app/page.tsx` exist, and `--font-dm-sans` is defined (DM Sans 300/400/500/**600**).
  The page is `/`, not `/products/[handle]`; a PDP-only app can keep that, but the contract and the
  template both assume a handle route if more than one product is ever added.
- `app/globals.css` still imports `tw-animate-css` and `@tailwindcss/typography`, and `package.json` still
  lists neither. Either add them or remove the imports; as-is the build will fail at the CSS layer.
- `lib/catalog.ts` is a single hardcoded product with `price: 10000`, `lowStockSizes`, `sizes`, and no
  per-variant availability. That is enough for the default and low-stock states, not for out-of-stock,
  waitlist, or variant-driven gallery/price changes.
- `lowStockSizes: ["XXS", "XL"]` plus the fixed copy `only 1 left in stock` is a demo affordance, not
  inventory. It should become `quantityAvailable` per size before anyone reads it as commerce data.
- `"lint": "next lint"` is stale on Next 16 (the command was removed); use `eslint`/`oxlint` directly.
- `docs/figma/pdp-frames.json` is generated and was in flux during the read (two revisions, same two
  trees); treat it as input, not as checked-in truth, and record its hash when a decision depends on it.

---

## 11. Conflicts and open questions

### 11.1 Conflicts to resolve before build

| # | Conflict | Evidence | Recommendation |
| - | -------- | -------- | -------------- |
| C1 | **Desktop buy-column order.** Wireframe puts disclosures before size; Design I, mobile, and shipped put them after the CTA. | `product-desktop-frame-16-7053.md` §Buy column vs `2044:2608` tree and `vendor` code | Build Design I: title → price → colour → size → CTA → disclosures → help. Amends the earlier spec. |
| C2 | **Default CTA semantics.** Design I desktop = unselected size + disabled `select size`; wireframe/mobile/shipped = preselected variant + `Add to bag`. | `2044:2646` fill `#DFDFDF` label `select size` vs `16:6544` `Add to bag` | Preselect first available variant, label `Add to bag`. A PDP-only app has no collection page to pre-seed a choice. |
| C3 | **Product title/price scale.** Figma 12/600 and 14/600; shipped `type-display` 22/29 uppercase. | `product-desktop-frame-16-7053.md` open question 1; `DESIGN-SYSTEM.md` §2.2 | Keep `type-display` 22/29. A 12 px title on a PDP is an editorial decision the brand owner has to make explicitly. If they want it, add a `type-title-sm` role rather than an arbitrary size. |
| C4 | **Header controls.** Wireframe/shipped = 43 px bordered chips; Design I = bare 14/700 text. | `nav-desktop-frame-1-152.md`; `2044:2720`, `2044:2729` | Keep chips. The 700 weight has no role (DM Sans ships 300/400/500) and the design gate rejects it. |
| C5 | **Header height 74 vs 76.** | Design I `Frame 65` 74; token `--header-bar-h: 76px` | 76. The sticky offsets (`top-[76px]`) and the 76 px wireframe both assume it. |
| C6 | **Gallery.** Wireframe 4 × 800×1080 stacked; Design I asymmetric mosaic; shipped 4 × `20/27` stacked. | `16:7059`, `2044:2608`, `product-media.tsx` | Ship the mosaic only if assets can fill the 800×1432 + 2×(400×535.71) slots. Otherwise keep the `20/27` stack; the mosaic with cropped stock photos will look accidental. |
| C7 | **Size chip treatment.** Wireframe 26 px bordered, Design I 44 px bordered `#DCDCDC`, shipped 36 px no border with underline. | `16:7083`, `2044:2631`, `option-picker.tsx` | Pick one. The Design I 44 px chips are the most tappable and the closest to a "real" PDP; the shipped underline style is the least like either frame. |
| C8 | **Footer.** Frames say 361/419 with no payment marks, no currency and no legal row; the shipped footer has all three and a flagship block. | `home-desktop-frame-40-313.md` open question 2; `D9` in the ledger | Footer is a global surface. Keep the shipped composition; if the new app is PDP-only, the footer can drop the currency selector (no multi-currency) and keep the legal row. |
| C9 | **Nav destinations in a PDP-only app.** `Woman / Men / Search / Wishlist / Bag / Help / Account` point at collections, search, wishlist, cart, account. | `lib/nav/index.ts` | Decide per label: keep the chrome, but either stub with `aria-disabled` + tooltip or link to real destinations. Do not ship dead `<a href="#">`. |
| C10 | **Copy casing.** Figma lowercase labels (`description`, `size`, `only 1 left in stock`, `need help? contact us`) vs design-system uppercase roles and sentence-case body. | `type-h4`/`type-control` are `text-transform: uppercase` | Let the roles uppercase the labels; write body copy in sentence case. Do not add `normal-case` overrides. |
| C11 | **`quantityAvailable` is null in the template's store.** Low stock is dormant. | `WIREFRAME-PROGRESS.md` §Product page | A standalone app with fixtures should carry a real integer so the low-stock state is actually demonstrable. |
| C12 | **Waitlist has no sink.** No Shopify surface stores a waitlist entry; no confirmation state is drawn. | `product-desktop-stock-states.md` open question 1 | In this app, either implement a local stub with a visible "demo only" note or wire a form endpoint. Do not draw a success state that pretends to have stored an email. |
| C13 | **Size-guide and slide-over have no geometry.** `16:7450` and `16:8173` are only names in the inventory; no spec file covers them. | `wireframe-inventory.md`, `WIREFRAME-EXECUTION-PLAN.md` P6.4 | Use the shipped size-guide sheet (720 px right sheet) and the cart drawer as the confirmation. Record both as the contract by default. |
| C14 | **`Men` vs `Man`.** | `1:309` says `Man`; catalogue and `f506f69` say `Men` | `Men`. |
| C15 | **The scaffold follows Design I literally, not the design system.** `pdp-title` = 12/600, `pdp-price` = 14/600 (10 px mobile), `pdp-cta` = `border-radius: 4px`, `--graphite: #353535`, low-stock `#A66100`. The template's gate rejects all of these (zero radius, `type-*` roles, one grey palette). | `app/globals.css` §PDP typography; `buy-panel.tsx` | Decide once, explicitly. If this app is a faithful Design I reproduction, say so and drop the token gate; otherwise map the roles and zero the radii. Do not keep a half-state where `type-*` and `pdp-*` disagree. |
| C16 | **Header chrome implemented as Design I text links**, with a 303 px desktop wordmark; the contract (and the wireframe) calls for 43 px chips and a 125 px mark. | `components/site/header.tsx` | Pick one generation for chrome. The mixed state looks like a bug: the mobile controls are bordered chips while desktop is bare text. |
| C17 | **Fabricated commerce copy.** `In stock · ships in 1–2 business days` has no data source; `only 1 left in stock` is driven by a hardcoded `lowStockSizes` list. | `buy-panel.tsx:100-108`, `lib/catalog.ts:64` | Either model `quantityAvailable` per size and a delivery estimate, or remove the claims. The template's own rule is "no fabricated commerce data". |
| C18 | **Try-on placement in code** is a second full-width button *below* the primary CTA, and the user photo is inserted as slide 0 of the gallery. | `buy-panel.tsx:133-140`, `product-media.tsx` | Both are acceptable, but slide 0 becomes the LCP image whenever a photo exists; prefer appending or keeping the result in the studio sheet. The button pair is fine if the outlined treatment stays secondary. |

### 11.2 Open questions for the owner

1. **Does the try-on result persist?** Session-only (recommended) or saved to a gallery/wishlist?
2. **Local-only or remote inference?** This decides whether consent copy and a server route are needed.
3. **Does try-on require a selected size?** Recommended: yes for fit-sensitive garments, no for one-size
   accessories, and explain rather than disable.
4. **Is there a real product, or is the page a demo?** The scaffold has one product's four JPEGs
   (`dress-front`, `dress-back`, `dress-detail-front`, `dress-detail-back`), which is enough for the
   `2/3` mobile carousel and the `20/27` desktop stack, not for the Design I mosaic.
5. **Should the header/footer be interactive at all?** A PDP-only demo can keep them purely visual, but
   the chips then need a disabled treatment rather than a fake link.
6. **Which file is canonical now?** Design I is newer and photographic, but only its desktop default and
   the wireframe mobile frame exist on disk. Nothing records Design I's file key, and no migration note
   exists. If the brand owner considers Design I final, the mobile frames need re-exporting from it;
   otherwise the app will keep mixing generations (as the template does).
7. **Type scale sign-off.** The 12/14 px PDP title and price, the 700 header, and the blanket uppercase
   roles cannot all be true. `D6` confined negative tracking to display roles; the weight question is
   still open.
8. **Low-stock threshold.** 5 is the template's number; the frame shows 1. Per variant or per product?

### 11.3 What is genuinely settled

- One DOM order, 800/592 desktop split, 432 px buy content, 24 px gutter at mobile and 30 at desktop.
- 76 px sticky header, three zones, 24 px gutter, 125 px wordmark.
- Gallery first on mobile; gallery left on desktop; 10 px gaps; lightbox on click.
- Buy column order (Design I variant).
- Three disclosures, description open by default.
- Recommendation row: label on the gutter, four full-bleed cards, 24 px below the product area.
- Zero radius everywhere in the template's system; `shadow-modal` is the only shadow; `type-*` roles own
  type. **This app currently overrides that with `pdp-*`** — see C15, which is the one open decision that
  changes every number in §2.
- All five state behaviours at the level described in §4, with the size-guide/slide-over caveats.

---

## 12. Source index

| Source | Used for |
| --- | --- |
| `docs/reference/figma/README.md` | Frame naming, export procedure, quota behaviour, plugin route, hard constraints |
| `docs/reference/figma/wireframe-inventory.md` | Frame ids, verdicts, duplicates, defects, "what the file does not specify" |
| `docs/reference/figma/product-desktop-frame-16-7053.md` | Desktop wireframe geometry, type, mapping, open questions |
| `docs/reference/figma/product-desktop-stock-states.md` | Low stock, out of stock, notify-me sheet geometry, copy, deviations |
| `docs/reference/figma/mobile-frames.md` | 390 header, mobile PDP order, Design I mobile menu, frame defects |
| `docs/reference/figma/nav-desktop-frame-1-152.md` | Header bar, panel, labels, shipped deviations |
| `docs/reference/figma/home-desktop-frame-40-313.md` | Footer frame, Helvetica/type conflict, full-bleed grid, image-less frames |
| `docs/WIREFRAME-EXECUTION-PLAN.md` | Phase P6 scope, decisions D1–D10, definition of done, no-fabrication rule |
| `docs/WIREFRAME-PROGRESS.md` | What shipped, decisions, capability results, Figma access, wordmark |
| `docs/DESIGN-SYSTEM.md` | Colour/type/spacing/motion/breakpoint tokens, radius and shadow rules |
| `docs/PDP-HYDRATION-AND-LOADING.md` | Loading order and the rules that protect LCP |
| `docs/reference/interactions/product-detail.md` | Live reference behaviour: lightbox, size guide, notify, tabs, sticky column |
| `docs/reference/interactions/global-nav.md` | Live reference header/footer behaviour and measurements |
| `docs/PRODUCT-DATA-REQUIREMENTS.md` | Field inventory the PDP implies |
| `docs/figma/pdp-frames.json` | Design I desktop tree + wireframe mobile tree (snapshot `6e3589df`) |
| `docs/reference/figma/export-plugin/{manifest.json,code.js,ui.html}` | Exact export shape, font weight map, UI behaviour |
