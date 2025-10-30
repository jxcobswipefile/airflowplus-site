/* Airflow+ — KH Indoor Image Swap (final) */
(() => {
  "use strict";
  try { window.__KH_IMAGE_INJECTOR_ACTIVE__ = true; } catch(e) {}

  const AFP  = (window.AFP = window.AFP || {});
  const BASE = ((AFP && AFP.ROOT_BASE) || "/airflowplus-site").replace(/\/+$/,"");
  const $    = (s, r=document) => r.querySelector(s);
  const $$   = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Exact filenames you provided
  const MAP = {
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

  function readBrandFamily(card){
    // Prefer CTA slug: /products/<brand>-<family>-<kw>kw.html
    const cta = card.querySelector("a[href*='/products/']");
    if (cta) {
      const m = (cta.getAttribute("href")||"").match(/\/products\/([a-z0-9]+)-([a-z0-9\-]+)-\d+kw\.html/i);
      if (m) return { brand:m[1].toLowerCase(), family:m[2].replace(/-/g," ").toLowerCase() };
    }
    // Fallback: title "Brand Family — X.X kW"
    const t = (card.querySelector(".kh-reco-title, h3, h2")?.textContent || "").trim();
    const tm = t.match(/^\s*([A-Za-z]+)[^\w]+([A-Za-z][A-Za-z0-9\s\-]+)/);
    if (tm) return { brand:tm[1].toLowerCase(), family:tm[2].replace(/\s*—.*/,"").replace(/\s*-\s*/g," ").trim().toLowerCase() };
    return { brand:"", family:"" };
  }

  function urlFor(brand,family){
    const file = MAP[(brand+" "+family).trim()];
    if (!file) return "";
    const rel = ("assets/indoor units kh/"+file).replace(/ /g,"%20");
    return (BASE+"/"+rel).replace(/\/{2,}/g,"/");
  }

  // Find an existing small img to replace (keeps size). If none, insert a 120px slot once.
  function findOrMakeThumb(card){
    // Prefer an existing non-icon image inside the reco block
    const imgs = card.querySelectorAll("img:not([data-kh-injected='1'])");
    for (const img of imgs){
      const src = (img.getAttribute("src")||"").toLowerCase();
      if (/label|energy|logo|favicon|products\/.+\/hero\.jpg/.test(src)) continue; // ignore icons & old product hero
      return img;
    }
    // Create a controlled small thumb if none exists
    let media = card.querySelector(".kh-reco-media[data-kh-injected='1']");
    if (!media){
      media = document.createElement("div");
      media.className = "kh-reco-media";
      media.setAttribute("data-kh-injected","1");
      media.style.flex = "0 0 120px";
      media.style.padding = "8px";
      media.style.borderRadius = "12px";
      card.insertBefore(media, card.firstChild);
    }
    let img = media.querySelector("img");
    if (!img){
      img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      media.appendChild(img);
    }
    return img;
  }

  // One-time cleanup: remove any legacy big images above the card
  function cleanupLegacy(){
    $$(".kh-reco--withimg, .kh-reco-media:not([data-kh-injected='1'])").forEach(el => {
      // If it contains a products/hero.jpg, it’s from the old injector → remove container
      const hasLegacy = el.querySelector("img[src*='/assets/img/products/']");
      if (hasLegacy) el.remove();
    });
  }

  function swap(card){
    const { brand, family } = readBrandFamily(card);
    const key = brand && family ? brand+"::"+family : "";
    if (!key || key === card.__khImgKey) return;
    card.__khImgKey = key;

    const url = urlFor(brand,family);
    if (!url) return;

    const img = findOrMakeThumb(card);
    img.src = url;
    img.alt = "Binnenunit";
  }

  function attach(){
    const card = $("#kh-reco");
    if (!card) return;
    cleanupLegacy();
    swap(card);

    // Attribute-only observer; debounce via lock
    let locked = false;
    const handle = () => {
      if (locked) return;
      locked = true;
      requestAnimationFrame(() => {
        try { swap(card); } finally { setTimeout(()=>locked=false,120); }
      });
    };
    const mo = new MutationObserver((muts)=>{
      for (const m of muts) if (m.type === "attributes") { handle(); return; }
    });
    mo.observe(card, { attributes:true, subtree:true, attributeFilter:["href","data-variant-slug"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once:true });
  } else {
    attach();
  }
})();
