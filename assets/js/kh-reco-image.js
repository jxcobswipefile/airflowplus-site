
/* ======================================================================
   Airflow+ — Keuzehulp Recommendation Image (hardened v38.4)
   ---------------------------------------------------------------------- */

(() => {
  "use strict";

  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP = (window.AFP = window.AFP || {});
  const log = (...args) => (AFP && AFP.log ? AFP.log(...args) : console.debug("[KH-IMG]", ...args));

  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const joinPath = (rel) => (BASE + "/" + String(rel || "").replace(/^\/+/, "")).replace(/\/{2,}/g, "/");
  const enc = (s) => String(s).replace(/ /g, "%20");

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const debounce = (fn, ms=120) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
  let running = false;

  const headOk = async (url) => { try { const r = await fetch(url, {method:"HEAD", cache:"no-store"}); return r.ok; } catch { return false; } };

  const familyFromSlug = (slug) => {
    if (!slug) return "";
    const m = String(slug).match(/^(.*?)-\d+kw$/i);
    return m ? m[1] : String(slug);
  };

  const saneSlug = (slug) => {
    slug = (slug||"").trim().toLowerCase();
    if (!slug || slug.startsWith("-")) return ""; // malformed
    return slug;
  };

  const INDOOR_DIRS = [
    "assets/indoor units kh",
    "assets/img/indoor units kh",
    "assets/indoor-units-kh",
    "assets/img/indoor-units-kh",
    "assets/indoor_units_kh",
    "assets/img/indoor_units_kh"
  ];

  const buildCandidates = (variantSlug) => {
    const list = [];
    const v = saneSlug(variantSlug);
    const fam = familyFromSlug(v);

    const pushIndoor = (rel) => {
      if (!rel) return;
      for (const dir of INDOOR_DIRS) {
        for (const ext of ["jpg","png","webp"]) {
          list.push(joinPath(enc(`${dir}/${rel}.${ext}`)));
        }
      }
    };

    // Indoor-first
    if (v) pushIndoor(v);
    if (fam && fam !== v) pushIndoor(fam);

    // AFP.ITEMS family image (secondary)
    try {
      if (AFP.ITEMS && AFP.ITEMS[fam] && AFP.ITEMS[fam].img) {
        const rel = AFP.ITEMS[fam].img.replace(BASE, "").replace(/^\//, "");
        list.push(joinPath(rel));
      }
    } catch {}

    // Legacy product fallbacks only if slug is sane
    if (v) {
      list.push(joinPath(`assets/img/products/${v}/hero.jpg`));
      if (fam) list.push(joinPath(`assets/img/products/${fam}/hero.jpg`));
      if (fam) {
        list.push(joinPath(`assets/img/products/${fam}/main.jpg`));
        list.push(joinPath(`assets/img/products/${fam}.jpg`));
      }
    }

    list.push(joinPath(`assets/img/products/placeholder.jpg`));

    // Dedup
    const seen = new Set();
    return list.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  };

  const readRecoMeta = (card) => {
    // Prefer CTA href slug
    let hrefSlug = "";
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href") || "").match(/\/products\/([^\/]+)\.html/i);
      if (m) hrefSlug = m[1];
    }
    // Secondary: data attribute
    const dataSlug = card.getAttribute("data-variant-slug") || "";
    const variantSlug = saneSlug(hrefSlug || dataSlug);
    return { variantSlug };
  };

  const ensureCardStructure = (card) => {
    if (card.__khStructured) return card.querySelector(".kh-reco-media");
    card.classList.add("kh-reco--withimg");
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
    }
    if (!body) {
      body = document.createElement("div");
      body.className = "kh-reco-body";
      body.style.flex = "1 1 auto";
      while (card.firstChild && card.firstChild !== media) {
        body.appendChild(card.firstChild);
      }
      card.appendChild(media);
      card.appendChild(body);
    } else if (!media.parentNode) {
      card.insertBefore(media, card.firstChild);
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
    const cands = buildCandidates(slug);
    const chosen = await resolveFirst(cands);
    const media = ensureCardStructure(card);
    const existing = media.querySelector("img");
    if (existing && existing.getAttribute("src") === chosen) return;
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

    // Initial
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
        if (!slug || slug === host.__khLastSlug) return;
        host.__khLastSlug = slug;
        injectOnceForSlug(host, slug);
      } finally {
        setTimeout(() => { running = false; }, 60);
      }
    }, 140);

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.target === host && m.type === "childList") { handle(); return; }
        if (host.contains(m.target)) {
          if (m.type === "attributes") {
            const n = m.attributeName || "";
            if (n === "href" || n === "data-variant-slug") { handle(); return; }
          } else if (m.type === "childList") { handle(); return; }
        }
      }
    });
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "data-variant-slug"] });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachObserver, { once: true });
  } else {
    attachObserver();
  }
})();
