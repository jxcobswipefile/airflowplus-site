
/* ======================================================================
   Airflow+ — KH Indoor Image Swap (v38.9 strict replace-only)
   ---------------------------------------------------------------------- */
(() => {
  "use strict";

  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP = (window.AFP = window.AFP || {});
  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Exact map to your files
  const INDOOR_FILE_MAP = {
    "daikin comfora":        "daikin comfora indoor.jpg",
    "daikin emura":          "daikin emura indoor.jpg",
    "daikin perfera":        "daikin perfera indoor.jpg",
    "haier expert":          "haier expert indoor.jpg",
    "haier flexis":          "haier flexis indoor.jpg",
    "haier revive":          "haier revive indoor.jpg",
    "haier revive plus":     "haier revive indoor.jpg",
    "panasonic etherea":     "panasonic etherea indoor.jpg",
    "panasonic tz":          "panasonic tz indoor.jpg"
  };

  function parseBrandFamilyFromSlug(slug) {
    slug = String(slug||"").trim().toLowerCase();
    const m = slug.match(/^([a-z0-9]+)-([a-z0-9\-]+)-\d+kw$/);
    if (!m) return { brand:"", family:"" };
    const brand = m[1];
    const fam = m[2].replace(/-/g," ");
    return { brand, family:fam };
  }

  function readBrandFamily(card) {
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href")||"").match(/\/products\/([a-z0-9\-]+)-\d+kw\.html/i);
      if (m) return parseBrandFamilyFromSlug(m[1] + "-00kw");
    }
    const tEl = card.querySelector(".kh-reco-title, h3, h2");
    const t = (tEl && tEl.textContent || "").trim();
    const tm = t.match(/^\s*([A-Za-z]+)[^\w]+([A-Za-z][A-Za-z0-9\s\-]+)/);
    if (tm) {
      const brand = (tm[1]||"").toLowerCase();
      const family = (tm[2]||"").replace(/\s*—.*/,"").replace(/\s*-\s*/g," ").replace(/\s+/g," ").trim().toLowerCase();
      return { brand, family };
    }
    return { brand:"", family:"" };
  }

  function indoorUrl(brand, family) {
    const file = INDOOR_FILE_MAP[(brand + " " + family).trim()] || "";
    if (!file) return "";
    const rel = ("assets/indoor units kh/" + file).replace(/ /g, "%20");
    return (BASE + "/" + rel).replace(/\/{2,}/g, "/");
  }

  // STRICT REPLACE ONLY: never insert; find best existing small image in #kh-reco
  function findCardThumb(card) {
    const imgs = card.querySelectorAll("img");
    // Prefer an image inside a known thumb container if present
    for (const img of imgs) {
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|energy|logo|favicon|outdoor/.test(src)) continue;
      // Heuristic: thumbnails usually have width <= 200px by attribute or computed style
      const wAttr = parseInt(img.getAttribute("width")||"0",10);
      if (wAttr && wAttr <= 220) return img;
      // fallback: first non-icon image
      return img;
    }
    return null;
  }

  // Remove any legacy big image blocks outside the card (one-time per attach)
  function cleanupLegacyBigs() {
    // Remove stray .kh-reco-media blocks (any origin)
    $$(".kh-reco-media").forEach(el => el.remove());
    // Remove any large hero-like image directly inside the KH stage wrapper above the card
    const stage = $(".khv2-stage .khv2-wrap") || $(".khv2-stage") || document;
    const bigs = $$("img", stage).filter(img => {
      if (img.closest("#kh-reco")) return false;
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|energy|logo|favicon/.test(src)) return false;
      const r = img.getBoundingClientRect();
      return r.width > 400 || r.height > 300;
    });
    bigs.forEach(img => img.remove());
  }

  function swap(card) {
    const { brand, family } = readBrandFamily(card);
    const key = brand && family ? `${brand}::${family}` : "";
    if (!key || key === card.__khSwapKey) return;
    card.__khSwapKey = key;

    const url = indoorUrl(brand, family);
    if (!url) return;
    const thumb = findCardThumb(card);
    if (thumb) {
      thumb.src = url;
      thumb.alt = "Binnenunit";
    }
  }

  function attach() {
    const card = $("#kh-reco");
    if (!card) return;
    cleanupLegacyBigs();
    swap(card);

    let locked = false;
    const handle = () => {
      if (locked) return;
      locked = true;
      requestAnimationFrame(() => {
        try { swap(card); } finally { setTimeout(()=>{ locked=false; }, 120); }
      });
    };
    const obs = new MutationObserver((muts) => {
      for (const m of muts) if (m.type === "attributes") { handle(); return; }
    });
    obs.observe(card, { attributes:true, subtree:true, attributeFilter:["href","data-variant-slug"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once:true });
  } else {
    attach();
  }
})();
