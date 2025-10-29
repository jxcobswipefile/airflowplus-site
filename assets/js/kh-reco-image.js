
/* ======================================================================
   Airflow+ — KH Recommendation Indoor Image (v38.5 minimalist)
   Spec:
     - Image source is ONLY:
       assets/indoor units kh/<brand> <family> indoor.jpg
       (lowercase filename, spaces between tokens)
     - No other fallbacks. No products/hero.jpg. No probing spam.
     - Update image only if the brand+family changed.
     - Observe only #kh-reco; do nothing else.
   ---------------------------------------------------------------------- */

(() => {
  "use strict";

  // Signal legacy blocks to stand down (if they check it)
  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP = (window.AFP = window.AFP || {});
  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");

  const $ = (s, r=document) => r.querySelector(s);

  // Extract brand, family from either CTA href slug or visible title text
  function readBrandFamily(card) {
    // 1) Try CTA slug: /products/<brand-family-xxkw>.html
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href")||"").match(/\/products\/([a-z0-9\-]+)-\d+kw\.html/i);
      if (m) {
        const slug = m[1]; // brand-family
        const parts = slug.split("-");
        const brand = parts.shift();
        const family = parts.join(" "); // turn hyphens into spaces
        if (brand && family) return { brand: brand.toLowerCase(), family: family.toLowerCase() };
      }
    }
    // 2) Fallback: parse title like "Panasonic TZ — 3.5 kW"
    const tEl = card.querySelector(".kh-reco-title, h3, h2");
    const t = (tEl && tEl.textContent || "").trim();
    const tm = t.match(/^\s*([A-Za-z]+)[^\w]+([A-Za-z][A-Za-z0-9\s\-]+)/);
    if (tm) {
      const brand = (tm[1]||"").toLowerCase();
      // normalize family tokens: collapse multiple spaces & hyphens to spaces
      const family = (tm[2]||"").replace(/\s*—.*/,"").replace(/\s*-\s*/g," ").replace(/\s+/g," ").trim().toLowerCase();
      if (brand && family) return { brand, family };
    }
    return { brand:"", family:"" };
  }

  // Build SINGLE absolute URL for indoor image
  function indoorUrl(brand, family) {
    if (!brand || !family) return "";
    const filename = `${brand} ${family} indoor.jpg`; // lower-case with spaces
    const path = `assets/indoor units kh/${filename}`
      .replace(/\/{2,}/g, "/");
    // URL-encode spaces only
    const encoded = path.replace(/ /g, "%20");
    return `${BASE}/${encoded}`.replace(/\/{2,}/g, "/");
  }

  // Set or update the image inside .kh-reco-media without touching layout
  function setImage(card, url) {
    if (!url) return;
    const media = card.querySelector(".kh-reco-media") || (function(){
      const d = document.createElement("div");
      d.className = "kh-reco-media";
      // Insert as first child but do NOT alter card display
      card.insertBefore(d, card.firstChild);
      return d;
    })();

    let img = media.querySelector("img");
    if (img && img.getAttribute("src") === url) return; // already correct
    if (!img) {
      img = document.createElement("img");
      img.alt = "Binnenunit";
      img.loading = "lazy";
      img.decoding = "async";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      media.appendChild(img);
    }
    img.src = url;
  }

  function currentKey(card) {
    const { brand, family } = readBrandFamily(card);
    return brand && family ? `${brand}::${family}` : "";
  }

  function updateOnce(card) {
    const key = currentKey(card);
    if (!key || key === card.__khIndoorKey) return;
    card.__khIndoorKey = key;
    const [brand, family] = key.split("::");
    const url = indoorUrl(brand, family);
    setImage(card, url);
  }

  function attach() {
    const card = $("#kh-reco");
    if (!card) return;

    // initial
    updateOnce(card);

    // Observe ONLY #kh-reco; react when slug/brand-family changes
    const obs = new MutationObserver(() => updateOnce(card));
    obs.observe(card, { childList:true, subtree:true, attributes:true, attributeFilter:["href", "data-variant-slug"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once:true });
  } else {
    attach();
  }
})();
