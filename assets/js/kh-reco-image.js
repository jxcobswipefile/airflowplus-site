
/* ======================================================================
   Airflow+ — Keuzehulp Recommendation Image (hardened v38.1)
   Purpose:
     - SINGLE source of truth for Step‑3 image next to recommendation
     - Remove legacy/duplicate <img> (incl. bare "hero.jpg" placeholders)
     - Resolve correct image by variant → family with HEAD probes
     - Remain idempotent across re-renders
   ---------------------------------------------------------------------- */

(() => {
  "use strict";

  // -------------------------------------------------------------------
  // Global coordination flag (legacy injectors should early-return if set)
  // -------------------------------------------------------------------
  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  // -------------------------------------------------------------------
  // Small shared helpers
  // -------------------------------------------------------------------
  const AFP = (window.AFP = window.AFP || {});
  const log = (...args) => (AFP && AFP.log ? AFP.log(...args) : console.debug("[KH-IMG]", ...args));

  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const joinPath = (rel) => (BASE + "/" + String(rel || "").replace(/^\/+/, "")).replace(/\/{2,}/g, "/");

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Simple debounce
  const debounce = (fn, ms=50) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // HEAD probe, returns true/false
  const headOk = async (url) => {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  // Given variant slug like "haier-revive-plus-35kw" → "haier-revive-plus"
  const familyFromSlug = (slug) => {
    if (!slug) return "";
    const m = String(slug).match(/^(.*?)-\d+kw$/i);
    return m ? m[1] : String(slug);
  };

  // Build ordered list of candidate image URLs
  const buildCandidates = (variantSlug, titleText) => {
    const list = [];
    const family = familyFromSlug(variantSlug);

    // 1) Family image defined in AFP.ITEMS (if any)
    try {
      if (AFP.ITEMS && AFP.ITEMS[family] && AFP.ITEMS[family].img) {
        const rel = AFP.ITEMS[family].img.replace(BASE, "").replace(/^\//, "");
        list.push(joinPath(rel));
      }
    } catch (e) {}

    // 2) Specific variant folder hero
    if (variantSlug) list.push(joinPath(`assets/img/products/${variantSlug}/hero.jpg`));

    // 3) Family folder hero
    if (family) list.push(joinPath(`assets/img/products/${family}/hero.jpg`));

    // 4) Conservative fallbacks
    if (family) {
      list.push(joinPath(`assets/img/products/${family}/main.jpg`));
      list.push(joinPath(`assets/img/products/${family}.jpg`));
    }
    // last-resort placeholder (should exist in repo)
    list.push(joinPath(`assets/img/products/placeholder.jpg`));

    // Dedup while preserving order
    const seen = new Set();
    return list.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
  };

  // Remove duplicate/legacy images inside the recommendation card
  const purgeForeignImages = (card, chosenSrc) => {
    // 1) Remove any stray bare hero.jpg placeholders not ours
    $$("img", card).forEach(img => {
      const src = img.getAttribute("src") || "";
      if (/(^|\/)hero\.jpg$/i.test(src) && src !== chosenSrc) {
        img.remove();
      }
    });
    // 2) Keep exactly one image inside .kh-reco-media; remove others
    const media = card.querySelector(".kh-reco-media");
    if (media) {
      const imgs = $$("img", card);
      imgs.forEach(img => {
        if (!media.contains(img)) {
          // any <img> not inside our media is legacy → remove
          img.remove();
        }
      });
      const mediaImgs = $$("img", media);
      if (mediaImgs.length > 1) {
        mediaImgs.slice(1).forEach(n => n.remove());
      }
    } else {
      // If no media yet, also remove ALL legacy img under card to avoid double‑render
      $$("img", card).forEach(img => img.remove());
    }
  };

  // Extract the recommended variant slug & title from the current card
  const readRecoMeta = (card) => {
    // Primary: data attributes if present
    const dataSlug = card.getAttribute("data-variant-slug") || "";
    const titleEl = card.querySelector(".kh-reco-title, h3, h2") || card;
    const titleText = (titleEl.textContent || "").trim();
    // Fallback: look for href to product page
    let hrefSlug = "";
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = cta.getAttribute("href").match(/\/products\/([^\/]+)\.html/i);
      if (m) hrefSlug = m[1];
    }
    const variantSlug = dataSlug || hrefSlug || "";
    return { variantSlug, titleText };
  };

  // Ensure card structure has media/body wrappers
  const ensureCardStructure = (card) => {
    card.classList.add("kh-reco--withimg");
    let media = card.querySelector(".kh-reco-media");
    let body  = card.querySelector(".kh-reco-body");
    if (!media) {
      media = document.createElement("div");
      media.className = "kh-reco-media";
      card.insertBefore(media, card.firstChild);
    }
    if (!body) {
      body = document.createElement("div");
      body.className = "kh-reco-body";
      while (media.nextSibling) body.appendChild(media.nextSibling);
      card.appendChild(body);
    }
    return media;
  };

  // Resolve the first existing URL from candidates
  const resolveFirst = async (cands) => {
    for (const url of cands) {
      // Avoid probing obviously duplicated placeholder twice
      // Probe with HEAD to keep it light
      // Using await sequentially so we stop at the first OK
      /* eslint no-await-in-loop: 0 */
      if (await headOk(url)) return url;
    }
    return cands[cands.length - 1]; // fallback to last
  };

  // Inject image once
  const injectImage = async () => {
    const card = $("#kh-reco");
    if (!card) return;

    // Bail out if we've already finalized for this render cycle
    if (card.__khImgInjectedOnce) return;

    const { variantSlug, titleText } = readRecoMeta(card);
    // If we still can't resolve, do not proceed yet
    if (!variantSlug && !titleText) return;

    const cands = buildCandidates(variantSlug, titleText);
    const chosen = await resolveFirst(cands);
    log("candidates", cands, "chosen:", chosen);

    // Sanitize any legacy images before insertion
    purgeForeignImages(card, chosen);

    const media = ensureCardStructure(card);

    // If the same image already present, mark done and exit
    const current = media.querySelector("img");
    if (current && current.getAttribute("src") === chosen) {
      card.__khImgInjectedOnce = true;
      return;
    }

    // Replace/insert our single image
    const img = current || document.createElement("img");
    img.setAttribute("alt", "Product hero");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = chosen;

    if (!current) media.appendChild(img);

    // Final cleanup — ensure we keep only our media image
    purgeForeignImages(card, chosen);

    // Mark idempotent completion
    card.__khImgInjectedOnce = true;
  };

  // Observe Step‑3 render and mutations
  const startObserver = () => {
    const target = document.body;
    if (!target) return;

    const handle = debounce(() => {
      const node = $("#kh-reco");
      if (!node) return;
      // fresh render → allow reinjection
      node.__khImgInjectedOnce = false;
      injectImage();
    }, 40);

    // Initial attempt (in case DOM is already there)
    handle();

    const mo = new MutationObserver(handle);
    mo.observe(target, { childList: true, subtree: true });
  };

  // Kick
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();
