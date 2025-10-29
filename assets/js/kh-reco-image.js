
/* ======================================================================
   Airflow+ — Keuzehulp Recommendation Image (hardened v38.3)
   Fixes:
     - Stop infinite brand/image rotation by:
       * Observing ONLY '#kh-reco' instead of entire body
       * Reacting only when the recommended slug CHANGES
       * One-time structure wrap (no repeated child moves)
       * Minimal DOM writes to avoid triggering other observers
     - Retain indoor-unit-first image resolution
   ---------------------------------------------------------------------- */

(() => {
  "use strict";

  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP = (window.AFP = window.AFP || {});
  const log = (...args) => (AFP && AFP.log ? AFP.log(...args) : console.debug("[KH-IMG]", ...args));

  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const joinPath = (rel) => (BASE + "/" + String(rel || "").replace(/^\/+/, "")).replace(/\/{2,}/g, "/");
  const encodeSpaces = (s) => String(s).replace(/ /g, "%20");

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Debounce & lock
  const debounce = (fn, ms=120) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  let running = false;

  const headOk = async (url) => {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch { return false; }
  };

  const familyFromSlug = (slug) => {
    if (!slug) return "";
    const m = String(slug).match(/^(.*?)-\d+kw$/i);
    return m ? m[1] : String(slug);
  };

  const buildCandidates = (variantSlug, titleText) => {
    const list = [];
    const family = familyFromSlug(variantSlug);
    const indoorBase = "assets/indoor units kh";
    const addIndoor = (rel) => ["jpg","png","webp"].forEach(ext => list.push(joinPath(encodeSpaces(`${indoorBase}/${rel}.${ext}`))));
    if (variantSlug) addIndoor(variantSlug);
    if (family) addIndoor(family);

    try {
      if (AFP.ITEMS && AFP.ITEMS[family] && AFP.ITEMS[family].img) {
        const rel = AFP.ITEMS[family].img.replace(BASE, "").replace(/^\//, "");
        list.push(joinPath(rel));
      }
    } catch {}

    if (variantSlug) list.push(joinPath(`assets/img/products/${variantSlug}/hero.jpg`));
    if (family) list.push(joinPath(`assets/img/products/${family}/hero.jpg`));
    if (family) {
      list.push(joinPath(`assets/img/products/${family}/main.jpg`));
      list.push(joinPath(`assets/img/products/${family}.jpg`));
    }
    list.push(joinPath(`assets/img/products/placeholder.jpg`));

    const seen = new Set();
    return list.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  };

  const readRecoMeta = (card) => {
    let hrefSlug = "";
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href") || "").match(/\/products\/([^\/]+)\.html/i);
      if (m) hrefSlug = m[1];
    }
    const dataSlug = card.getAttribute("data-variant-slug") || "";
    const titleEl = card.querySelector(".kh-reco-title, h3, h2") || card;
    const titleText = (titleEl.textContent || "").trim();
    const variantSlug = hrefSlug || dataSlug || "";
    return { variantSlug, titleText };
  };

  const ensureCardStructure = (card) => {
    if (card.__khStructured) return card.querySelector(".kh-reco-media");
    card.classList.add("kh-reco--withimg");
    // Minimal inline layout only once
    if (getComputedStyle(card).display !== "flex") {
      card.style.display = "flex";
      card.style.gap = card.style.gap || "12px";
      card.style.alignItems = card.style.alignItems || "stretch";
    }
    let media = card.querySelector(".kh-reco-media");
    let body  = card.querySelector(".kh-reco-body");
    if (!media) {
      media = document.createElement("div");
      media.className = "kh-reco-media";
      media.style.flex = "0 0 120px";
      media.style.display = "flex";
      media.style.alignItems = "center";
      media.style.justifyContent = "center";
      media.style.padding = "8px";
      media.style.borderRadius = "12px";
      media.style.background = media.style.background || "transparent";
      card.insertBefore(media, card.firstChild);
    }
    if (!body) {
      body = document.createElement("div");
      body.className = "kh-reco-body";
      body.style.flex = "1 1 auto";
      // Move siblings only once (initial structure)
      while (media.nextSibling) body.appendChild(media.nextSibling);
      card.appendChild(body);
    }
    card.__khStructured = true;
    return media;
  };

  const resolveFirst = async (cands) => {
    for (const url of cands) { /* eslint no-await-in-loop: 0 */ if (await headOk(url)) return url; }
    return cands[cands.length - 1];
  };

  const currentSlug = (card) => readRecoMeta(card).variantSlug;

  const injectOnceForSlug = async (card, slug) => {
    const { titleText } = readRecoMeta(card);
    const cands = buildCandidates(slug, titleText);
    const chosen = await resolveFirst(cands);
    const media = ensureCardStructure(card);

    // If we already show this image, do nothing
    const existing = media.querySelector("img");
    if (existing && existing.getAttribute("src") === chosen) return;

    // Replace or insert single image (no wide purges to avoid extra mutations)
    if (existing) {
      existing.src = chosen;
      existing.alt = "Binnenunit";
    } else {
      const img = document.createElement("img");
      img.alt = "Binnenunit";
      img.loading = "lazy";
      img.decoding = "async";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.src = chosen;
      media.appendChild(img);
    }
  };

  const attachObserver = () => {
    const host = $("#kh-reco");
    if (!host) return;

    // Inject once for initial slug
    const initSlug = currentSlug(host);
    if (initSlug) {
      host.__khLastSlug = initSlug;
      injectOnceForSlug(host, initSlug);
    }

    const handle = debounce(() => {
      if (running) return;
      running = true;
      try {
        const slug = currentSlug(host);
        if (!slug) return;
        if (host.__khLastSlug === slug) return; // nothing to do
        host.__khLastSlug = slug;
        injectOnceForSlug(host, slug);
      } finally {
        // release after a short tick to coalesce cascades
        setTimeout(() => { running = false; }, 50);
      }
    }, 120);

    const mo = new MutationObserver((muts) => {
      // Only react to changes within the host itself (childList) or href/title attribute changes inside it
      for (const m of muts) {
        if (m.target === host && m.type === "childList") { handle(); return; }
        if (host.contains(m.target)) {
          if (m.type === "attributes") {
            const name = m.attributeName || "";
            if (name === "href" || name === "data-variant-slug") { handle(); return; }
          } else if (m.type === "childList") { handle(); return; }
        }
      }
    });

    mo.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "data-variant-slug"]
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachObserver, { once: true });
  } else {
    attachObserver();
  }
})();
