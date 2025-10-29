
/* ======================================================================
   Airflow+ — Keuzehulp Recommendation Image (hardened v38.2)
   Changes in v38.2:
     - Prefer CTA href slug (post brand-swap) over data attribute
     - Prioritize "assets/indoor units kh" images (indoor-only) by variant/family
     - Formats: .jpg → .png → .webp, with HEAD probes
     - Minimal inline layout to avoid container breakage (no global CSS edit)
     - More aggressive purge of legacy <img> under #kh-reco (before/after)
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
  const encodeSpaces = (s) => String(s).replace(/ /g, "%20");

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

  // Build ordered list of candidate indoor-only image URLs
  const buildCandidates = (variantSlug, titleText) => {
    const list = [];
    const family = familyFromSlug(variantSlug);

    // 0) Indoor-only folder (highest priority) — variant, then family; try common extensions
    const indoorBase = "assets/indoor units kh";
    const addIndoor = (rel) => {
      ["jpg","png","webp"].forEach(ext => list.push(joinPath(encodeSpaces(`${indoorBase}/${rel}.${ext}`))));
    };
    if (variantSlug) addIndoor(variantSlug);
    if (family) addIndoor(family);

    // 1) Family image defined in AFP.ITEMS (if any) — secondary now
    try {
      if (AFP.ITEMS && AFP.ITEMS[family] && AFP.ITEMS[family].img) {
        const rel = AFP.ITEMS[family].img.replace(BASE, "").replace(/^\//, "");
        list.push(joinPath(rel));
      }
    } catch (e) {}

    // 2) Specific variant folder hero (fallback to legacy catalog)
    if (variantSlug) list.push(joinPath(`assets/img/products/${variantSlug}/hero.jpg`));

    // 3) Family folder hero (fallback)
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
    // 1) Remove any stray <img> that are not our chosen or not within media container
    $$("img", card).forEach(img => {
      const src = img.getAttribute("src") || "";
      // remove bare hero.jpg or any image not matching chosenSrc once media exists
      if (/(^|\/)hero\.jpg$/i.test(src) || (chosenSrc && src && src !== chosenSrc)) {
        img.remove();
      }
    });

    // 2) Keep exactly one image inside .kh-reco-media; remove others
    const media = card.querySelector(".kh-reco-media");
    if (media) {
      const imgs = $$("img", media);
      if (imgs.length > 1) imgs.slice(1).forEach(n => n.remove());
      // also ensure no other images survive outside media
      $$("img", card).forEach(img => { if (!media.contains(img)) img.remove(); });
    }
  };

  // Extract the recommended variant slug & title from the current card
  const readRecoMeta = (card) => {
    // Prefer CTA href slug (brand-swap updates this reliably)
    let hrefSlug = "";
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = cta.getAttribute("href").match(/\/products\/([^\/]+)\.html/i);
      if (m) hrefSlug = m[1];
    }

    // Secondary: data attribute (older renders)
    const dataSlug = card.getAttribute("data-variant-slug") || "";

    // Title (for logging/fallbacks)
    const titleEl = card.querySelector(".kh-reco-title, h3, h2") || card;
    const titleText = (titleEl.textContent || "").trim();

    const variantSlug = hrefSlug || dataSlug || "";
    return { variantSlug, titleText };
  };

  // Ensure card structure has media/body wrappers (with minimal inline layout to avoid breakage)
  const ensureCardStructure = (card) => {
    card.classList.add("kh-reco--withimg");

    // Minimal, inline flex without touching global CSS
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
      // keep a narrow column for the image thumb
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
      while (media.nextSibling) body.appendChild(media.nextSibling);
      card.appendChild(body);
    }
    return media;
  };

  // Resolve the first existing URL from candidates
  const resolveFirst = async (cands) => {
    for (const url of cands) {
      /* eslint no-await-in-loop: 0 */
      if (await headOk(url)) return url;
    }
    return cands[cands.length - 1]; // fallback to last
  };

  // Inject image once per render
  const injectImage = async () => {
    const card = $("#kh-reco");
    if (!card) return;

    // purge any late-added legacy imgs first to avoid visible flicker
    purgeForeignImages(card);

    // Allow reinjection per render cycle (brand-swap updates mutate the card)
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
    img.setAttribute("alt", "Binnenunit");
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.src = chosen;

    if (!current) media.appendChild(img);

    // Final cleanup — ensure we keep only our media image
    purgeForeignImages(card, chosen);

    // Mark idempotent completion
    card.__khImgInjectedOnce = true;
  };

  // Observe Step-3 render and brand-swap mutations
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

    const mo = new MutationObserver(muts => {
      // If #kh-reco or its subtree changed, handle again
      for (const m of muts) {
        if (m.type === "childList") {
          handle();
          break;
        }
        if (m.type === "attributes" && m.target && (m.target.id === "kh-reco" || m.target.closest && m.target.closest("#kh-reco"))) {
          handle();
          break;
        }
      }
    });
    mo.observe(target, { childList: true, subtree: true, attributes: true });
  };

  // Kick
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();
