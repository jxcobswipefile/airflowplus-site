
/* ======================================================================
   Airflow+ — KH Indoor Image Swap (v38.7 crash-safe)
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

  function indoorUrl(brand, family) {
    if (!brand || !family) return "";
    const filename = `${brand} ${family} indoor.jpg`;
    const rel = `assets/indoor units kh/${filename}`.replace(/ /g, "%20");
    return `${BASE}/${rel}`.replace(/\/{2,}/g, "/");
  }

  // Find the first suitable existing image in the card (cheap selection)
  function findThumb(card) {
    // ignore labels, logos, energy icons, and any previously injected block
    const cands = card.querySelectorAll("img:not([data-kh-injected='1'])");
    for (const img of cands) {
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|energy|logo|favicon|outdoor/.test(src)) continue;
      return img;
    }
    return null;
  }

  function ensureSmallMedia(card) {
    let media = card.querySelector(".kh-reco-media[data-kh-injected='1']");
    if (media) return media;
    media = document.createElement("div");
    media.className = "kh-reco-media";
    media.setAttribute("data-kh-injected","1");
    media.style.flex = "0 0 120px";
    media.style.display = "block";
    media.style.padding = "8px";
    media.style.borderRadius = "12px";
    card.insertBefore(media, card.firstChild);
    return media;
  }

  function swapToIndoor(card) {
    const { brand, family } = readBrandFamily(card);
    const key = brand && family ? `${brand}::${family}` : "";
    if (!key || key === card.__khSwapKey) return;
    card.__khSwapKey = key;

    const url = indoorUrl(brand, family);
    if (!url) return;

    const target = findThumb(card);
    if (target) {
      // Replace in place
      target.src = url;
      target.alt = "Binnenunit";
      return;
    }

    // If no existing image was found, add a small 120px img once
    const media = ensureSmallMedia(card);
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

    // Initial
    swapToIndoor(card);

    // Crash-safe observer: attributes only on subtree; no childList
    let locked = false;
    const handle = () => {
      if (locked) return;
      locked = true;
      // debounce via rAF then timeout
      requestAnimationFrame(() => {
        try { swapToIndoor(card); } finally {
          setTimeout(() => { locked = false; }, 120);
        }
      });
    };

    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes") { handle(); return; }
      }
    });
    obs.observe(card, { attributes: true, subtree: true, attributeFilter: ["href", "data-variant-slug"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }
})();
