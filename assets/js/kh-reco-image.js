
/* ======================================================================
   Airflow+ — KH Indoor Image Replace-In-Place (v38.6)
   - Remove any previously injected .kh-reco-media (big image)
   - Find existing card image and replace its src with indoor-only file
   - No probes, no fallbacks, no layout changes
   - Triggers only when brand+family changes
   ---------------------------------------------------------------------- */
(() => {
  "use strict";

  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}
  const AFP = (window.AFP = window.AFP || {});
  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const $ = (s, r=document) => r.querySelector(s);

  function readBrandFamily(card) {
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href")||"").match(/\/products\/([a-z0-9\-]+)-\d+kw\.html/i);
      if (m) {
        const slug = m[1]; // brand-family
        const parts = slug.split("-");
        const brand = parts.shift();
        const family = parts.join(" ");
        if (brand && family) return { brand: brand.toLowerCase(), family: family.toLowerCase() };
      }
    }
    const tEl = card.querySelector(".kh-reco-title, h3, h2");
    const t = (tEl && tEl.textContent || "").trim();
    const tm = t.match(/^\s*([A-Za-z]+)[^\w]+([A-Za-z][A-Za-z0-9\s\-]+)/);
    if (tm) {
      const brand = (tm[1]||"").toLowerCase();
      const family = (tm[2]||"").replace(/\s*—.*/,"").replace(/\s*-\s*/g," ").replace(/\s+/g," ").trim().toLowerCase();
      if (brand && family) return { brand, family };
    }
    return { brand:"", family:"" };
  }

  function buildIndoorUrl(brand, family) {
    if (!brand || !family) return "";
    const filename = `${brand} ${family} indoor.jpg`; // exactly this format
    const rel = `assets/indoor units kh/${filename}`.replace(/ /g,"%20");
    return `${BASE}/${rel}`.replace(/\/{2,}/g,"/");
  }

  // Remove any previously injected big image block
  function cleanupInjected(card) {
    const media = card.querySelector(".kh-reco-media");
    if (media && media.dataset.injected === "kh") {
      media.remove();
    }
  }

  // Choose the primary image already inside the card:
  // - visible
  // - not tiny icon (min 48x48)
  // - pick the largest by rendered area
  function findPrimaryImg(card) {
    const imgs = Array.from(card.querySelectorAll("img"));
    let best = null, bestA = 0;
    for (const img of imgs) {
      const r = img.getBoundingClientRect();
      const A = Math.round(r.width * r.height);
      if (!A || r.width < 48 || r.height < 48) continue;
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|icon|energy|logo|outdoor|favicon/.test(src)) continue;
      if (A > bestA) { bestA = A; best = img; }
    }
    return best;
  }

  function updateOnce(card) {
    const meta = readBrandFamily(card);
    const key = meta.brand && meta.family ? `${meta.brand}::${meta.family}` : "";
    if (!key || key === card.__khIndoorKey) return;
    card.__khIndoorKey = key;

    // ensure we don't keep our old injected block
    cleanupInjected(card);

    const url = buildIndoorUrl(meta.brand, meta.family);
    const target = findPrimaryImg(card);
    if (target) {
      target.src = url; // replace in place; preserves size/styling
      target.alt = "Binnenunit";
    } else {
      // Fallback: create a small, clearly-marked injected media only if none exists
      const media = document.createElement("div");
      media.className = "kh-reco-media";
      media.dataset.injected = "kh";
      const img = document.createElement("img");
      img.alt = "Binnenunit";
      img.loading = "lazy";
      img.decoding = "async";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.src = url;
      media.appendChild(img);
      card.insertBefore(media, card.firstChild);
    }
  }

  function attach() {
    const card = $("#kh-reco");
    if (!card) return;
    updateOnce(card);
    const obs = new MutationObserver(() => updateOnce(card));
    obs.observe(card, { childList:true, subtree:true, attributes:true, attributeFilter:["href","data-variant-slug"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once:true });
  } else {
    attach();
  }
})();
