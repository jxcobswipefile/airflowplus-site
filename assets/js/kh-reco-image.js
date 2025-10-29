
/* ======================================================================
   Airflow+ — KH Indoor Image Swap (v38.8 mapped)
   - Uses EXACT filenames user provided in `assets/indoor units kh/`
   - Maps variant slugs to those filenames; no probing, no fallbacks
   - Replaces the existing small image in-place; no layout changes
   - Observes only attributes on #kh-reco
   ---------------------------------------------------------------------- */
(() => {
  "use strict";

  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP = (window.AFP = window.AFP || {});
  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const $ = (s, r=document) => r.querySelector(s);

  // Map families/variants to the exact indoor filenames
  const INDOOR_FILE_MAP = {
    // Daikin
    "daikin comfora":   "daikin comfora indoor.jpg",
    "daikin perfera":   "daikin perfera indoor.jpg",
    "daikin emura":     "daikin emura indoor.jpg",
    // Haier
    "haier revive":     "haier revive indoor.jpg",
    "haier revive plus":"haier revive indoor.jpg",    // plus uses same image
    "haier expert":     "haier expert indoor.jpg",
    "haier expert nordic":"haier expert indoor.jpg",
    "haier flexis":     "haier flexis indoor.jpg",
    // Panasonic
    "panasonic tz":     "panasonic tz indoor.jpg",
    "panasonic etherea":"panasonic etherea indoor.jpg"
  };

  function parseBrandFamilyFromSlug(slug) {
    // slug like: panasonic-tz-25kw -> brand=panasonic, family=tz
    slug = String(slug||"").trim().toLowerCase();
    const m = slug.match(/^([a-z0-9]+)-([a-z0-9\-]+)-\d+kw$/);
    if (!m) return { brand:"", family:"" };
    const brand = m[1];
    const fam = m[2].replace(/-/g," ");
    return { brand, family: fam };
  }

  function readBrandFamily(card) {
    // Prefer CTA slug
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href")||"").match(/\/products\/([a-z0-9\-]+)-\d+kw\.html/i);
      if (m) return parseBrandFamilyFromSlug(m[1] + "-00kw"); // append fake kw to reuse parser
    }
    // Fallback: parse title "Brand Name — X.X kW"
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

  function filenameFor(brand, family) {
    const key = (brand + " " + family).trim();
    const file = INDOOR_FILE_MAP[key] || "";
    if (!file) return "";
    const rel = ("assets/indoor units kh/" + file).replace(/ /g, "%20");
    return (BASE + "/" + rel).replace(/\/{2,}/g, "/");
  }

  // Find first suitable existing small image inside the card
  function findThumb(card) {
    const imgs = card.querySelectorAll("img:not([data-kh-injected='1'])");
    for (const img of imgs) {
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|energy|logo|favicon|outdoor/.test(src)) continue;
      return img;
    }
    return null;
  }

  function swapToIndoor(card) {
    const { brand, family } = readBrandFamily(card);
    const key = brand && family ? `${brand}::${family}` : "";
    if (!key || key === card.__khSwapKey) return;
    card.__khSwapKey = key;

    const url = filenameFor(brand, family);
    if (!url) return; // no image available for this family

    const target = findThumb(card);
    if (target) {
      target.src = url;
      target.alt = "Binnenunit";
      return;
    }

    // If no existing image was found, add a small injected thumbnail once
    let media = card.querySelector(".kh-reco-media[data-kh-injected='1']");
    if (!media) {
      media = document.createElement("div");
      media.className = "kh-reco-media";
      media.setAttribute("data-kh-injected","1");
      media.style.flex = "0 0 120px";
      media.style.display = "block";
      media.style.padding = "8px";
      media.style.borderRadius = "12px";
      card.insertBefore(media, card.firstChild);
    }
    let img = media.querySelector("img");
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

  function attach() {
    const card = $("#kh-reco");
    if (!card) return;
    swapToIndoor(card);

    // Attribute-only observer; debounce with simple lock
    let locked = false;
    const handle = () => {
      if (locked) return;
      locked = true;
      requestAnimationFrame(() => {
        try { swapToIndoor(card); } finally {
          setTimeout(() => { locked = false; }, 120);
        }
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
