
# Airco Product Pages (Static)

This package contains product pages generated from your provided files. The layout mirrors the structure of the KH Installaties product page you referenced (hero with gallery, right-hand specs/price box, sections for specs, description, included items, accessories, documents, and related products).

## Files
- `index.html` → overview of all products
- `*.html` → one page per product
- `assets/img/` → images (copied from your zip when available)
- `assets/docs/` → PDFs/documents (if present)

## How to integrate
1. Drop the contents of this folder into your website repo (e.g., `/producten/`).
2. Link to `producten/index.html` from your main nav or category pages.
3. Update the header/logo and CTA links if needed.
4. If you already have a site-wide header/footer, keep the main `<main>` of each file and merge the body content accordingly.

## Data mapping
I parsed columns using heuristics. Recognized keys include:
`name, brand, series, capacity_kw, btuh, price, energy_label, seer, scop, noise_indoor_db, noise_outdoor_db, refrigerant, dimensions_indoor, dimensions_outdoor, wifi, short_description, long_description, images, docs, included, accessories`.

Anything missing defaults to `"—"` or a sensible placeholder. Images were auto-copied into `assets/img/` when found.

## Theming
Colors currently use your brand blues (`#0091F0` / `#0292F1`). You can change them in the `:root` variables at the top of the inline CSS of each page.

---
