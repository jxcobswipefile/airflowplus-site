/*! Airflow+ — Keuzehulp recommendation image injector (safe, idempotent) */
(function () {
  function ready(fn){ if(document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn, {once:true}); } }
  ready(function(){
    // === Base-path + AFP image helpers (append-only) =========================
var BASE = (window.AFP && AFP.ROOT_BASE) || '/airflowplus-site';
function joinPath(p){ return (BASE.replace(/\/$/,'') + '/' + String(p||'').replace(/^\//,'')).replace(/\/{2,}/g,'/'); }

// from a variant slug like "daikin-comfora-35kw" → "daikin-comfora"
function familyFromSlug(slug){
  if(!slug) return '';
  slug = String(slug).toLowerCase();
  return slug
    .replace(/-(?:2\.5|3\.5|5\.0)\s*kw$/,'')
    .replace(/-(?:25|35|50)\s*kw$/,'')
    .replace(/-\d+(?:\.\d+)?kw$/,'');
}

// look up an AFP.ITEMS entry by family slug and return its img (if present)
function afpImgForFamily(fam){
  try {
    if(!window.AFP || !Array.isArray(AFP.ITEMS)) return '';
    var m = AFP.ITEMS.find(function(it){ return String(it.slug).toLowerCase() === fam; });
    return m && m.img ? joinPath(m.img) : '';
  } catch(_) { return ''; }
}

    var mount = document.querySelector('#kh-reco') || document.querySelector('.kh-card, .khv2-card, .khv2-stage');
    if(!mount) return;
    var triedOnce = false;
    function tryInject(){
      var card = mount.querySelector('.kh-reco-card') ||
                 mount.querySelector('.kh-reco-main') ||
                 mount.querySelector('.kh-card') ||
                 mount;
      if(!card || card.dataset.imgInjected) return;
      var titleEl = card.querySelector('h3, h2, .kh-title, .kh-reco-title') || mount.querySelector('h3, h2');
      var linkEl  = card.querySelector('a[href*="/products/"]') || mount.querySelector('a[href*="/products/"]');
      var title   = titleEl ? (titleEl.textContent || '').trim() : '';
      var href    = linkEl ? (linkEl.getAttribute('href') || '') : '';
      resolveImage(title, href).then(function(src){
        if(!src){ card.dataset.imgInjected = 'noimg'; return; }
        var wrapper = document.createElement('div');
        wrapper.className = 'kh-reco--withimg';
        var media = document.createElement('div');
        media.className = 'kh-reco-media';
        var img = new Image();
        img.alt = title || 'Aanbevolen model';
        img.src = src;
        media.appendChild(img);
        var body = document.createElement('div');
        body.className = 'kh-reco-body';
        var mover = document.createDocumentFragment();
        while(card.firstChild){ mover.appendChild(card.firstChild); }
        body.appendChild(mover);
        wrapper.appendChild(media);
        wrapper.appendChild(body);
        card.appendChild(wrapper);
        card.dataset.imgInjected = 'true';
      });
      triedOnce = true;
    }
    var mo = new MutationObserver(function(){ tryInject(); });
    mo.observe(mount, {childList:true, subtree:true});
    tryInject();
    setTimeout(function(){ if(!triedOnce) tryInject(); }, 300);
  });
  function resolveImage(title, href){
    var slug = '';
    if(href){
      try{ slug = href.split('?')[0].split('#')[0].split('/').pop().replace(/\.html$/i,''); }catch(e){ slug = ''; }
    }
    var candidates = [];
    if(slug){
      candidates.push('/assets/img/products/' + slug + '/hero.jpg');
      var baseSlug = slug.replace(/-(\d+(?:\.\d+)?)\s*kw$/i,'').replace(/-\d+kw$/i,'');
      if(baseSlug && baseSlug !== slug){
        candidates.push('/assets/img/products/' + baseSlug + '/hero.jpg');
      }
    }
    function resolveImage(title, href){
  var slug = '';
  if(href){
    try{ slug = href.split('?')[0].split('#')[0].split('/').pop().replace(/\.html$/i,''); }catch(e){ slug = ''; }
  }

  var candidates = [];
  function push(p){ if(p) candidates.push(p); }

  // Prefer the AFP.ITEMS image for the *family* (e.g. "daikin-comfora") if available
  var fam = familyFromSlug(slug);
  var afpImg = afpImgForFamily(fam);
  if(afpImg) push(afpImg);

  // Your original slug/title-based guesses (but normalized through joinPath)
  if(slug){
    push(joinPath('/assets/img/products/' + slug + '/hero.jpg'));
    var baseSlug = slug.replace(/-(\d+(?:\.\d+)?)\s*kw$/i,'').replace(/-\d+kw$/i,'');
    if(baseSlug && baseSlug !== slug){
      push(joinPath('/assets/img/products/' + baseSlug + '/hero.jpg'));
    }
  }
  var folder = mapTitleToFolder(title);
  if(folder){ push(joinPath('/assets/img/products/' + folder + '/hero.jpg')); }

  // Additional common filenames
  if(slug){
    push(joinPath('/assets/img/products/' + slug + '/main.jpg'));
    push(joinPath('/assets/img/products/' + slug + '.jpg'));
  }
  if(folder){
    push(joinPath('/assets/img/products/' + folder + '/main.jpg'));
    push(joinPath('/assets/img/products/' + folder + '.jpg'));
  }

  // Deduplicate while preserving order
  var seen = Object.create(null);
  var list = candidates.filter(function(p){ if(!p || seen[p]) return false; seen[p]=1; return true; });

  return firstExisting(list);
}

  }
  function firstExisting(paths){
    var p = Promise.resolve(null);
    paths.forEach(function(path){
      p = p.then(function(found){
        if(found) return found;
        return fetch(path, {method:'HEAD', cache:'no-cache'}).then(function(r){
          return r.ok ? path : null;
        }).catch(function(){ return null; });
      });
    });
    return p;
  }
  function mapTitleToFolder(s){
    if(!s) return '';
    s = (s||'').toLowerCase();
    if(s.includes('panasonic') && s.includes('tz')) return 'panasonic-tz';
    if(s.includes('panasonic') && s.includes('etherea') && /25\s*kw/.test(s)) return 'panasonic-etherea-25kw';
    if(s.includes('panasonic') && s.includes('etherea')) return 'panasonic-etherea';
    if(s.includes('daikin') && s.includes('comfora')) return 'daikin-comfora';
    if(s.includes('daikin') && s.includes('emura') && /25\s*kw/.test(s)) return 'daikin-emura-25kw';
    if(s.includes('daikin') && s.includes('emura')) return 'daikin-emura';
    if(s.includes('daikin') && s.includes('perfera')) return 'daikin-perfera';
    if(s.includes('haier') && s.includes('expert')) return 'haier-expert';
    if(s.includes('haier') && s.includes('flexis') && /25\s*kw/.test(s)) return 'haier-flexis-25kw';
    if(s.includes('haier') && (s.includes('revive') || s.includes('revive plus'))) return 'haier-revive-plus';
    return '';
  }
})();

/* =========================================================
   v36 — KH Step 3: Brand preference chips (JS-only mount)
   - No HTML edits required.
   - Renders above #kh-reco when step 3 becomes visible.
   - Persists to sessionStorage under "khPreferredBrands".
   - Dispatches "kh:brand-preferences-changed" on document.
   ========================================================= */

(function KH_BrandChips(){
  const STEP_SEL = 'section[data-kh-step="3"]';
  const RECO_MOUNT_SEL = '#kh-reco';
  const STORAGE_KEY = 'khPreferredBrands';
  const BRANDS = [
    { key: 'daikin',    label: 'Daikin',    logo: 'assets/img/brands/daikin.placeholder.svg' },
    { key: 'panasonic', label: 'Panasonic', logo: 'assets/img/brands/panasonic.placeholder.svg' },
    { key: 'haier',     label: 'Haier',     logo: 'assets/img/brands/haier.placeholder.svg' },
    // add more here later
  ];

  const state = (window.khState = window.khState || {});
  state.preferredBrands = state.preferredBrands || [];

  const load = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const save = () => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.preferredBrands)); } catch {}
    document.dispatchEvent(new CustomEvent('kh:brand-preferences-changed', {
      detail: { preferredBrands: state.preferredBrands.slice() }
    }));
  };

  // Build the chip bar
  function createChipBar() {
    const bar = document.createElement('div');
    bar.className = 'kh-brands';
    BRANDS.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brand-chip';
      btn.dataset.brand = b.key;

      const img = document.createElement('img');
      img.src = b.logo; img.alt = b.label; img.loading = 'lazy';
      btn.append(img, document.createTextNode(' ' + b.label));

      btn.addEventListener('click', () => {
        const i = state.preferredBrands.indexOf(b.key);
        if (i >= 0) state.preferredBrands.splice(i, 1);
        else state.preferredBrands.push(b.key);
        sync(bar);
        save();
      });

      bar.appendChild(btn);
    });
    return bar;
  }

  function sync(bar) {
    const chips = bar.querySelectorAll('.brand-chip');
    chips.forEach(chip => {
      chip.classList.toggle('is-selected', state.preferredBrands.includes(chip.dataset.brand));
    });
  }

  function ensureMounted() {
    const step = document.querySelector(STEP_SEL);
    const mount = document.querySelector(RECO_MOUNT_SEL);
    if (!step || !mount) return;

    // mount once, above #kh-reco
    if (!step.querySelector('.kh-brands')) {
      state.preferredBrands = load();
      const bar = createChipBar();
      mount.parentNode.insertBefore(bar, mount);
      sync(bar);
    }
  }

  // 1) Run once on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureMounted, { once: true });
  } else {
    ensureMounted();
  }

  // 2) If your wizard toggles visibility via "hidden" attribute, react to mutations
  const host = document.querySelector(STEP_SEL)?.parentElement || document.body;
  const mo = new MutationObserver(() => ensureMounted());
  mo.observe(host, { attributes: true, childList: true, subtree: true });
})();

/* =========================================================
   v36 — KH: Prefer user-selected brands in the recommendation
   - Non-breaking: only intervenes if preferred brand(s) exist
     and the current pick is from a different brand.
   - Works by swapping to an equivalent capacity in that brand.
   ========================================================= */

(function KH_PreferBrands() {
  const MOUNT_SEL = '#kh-reco, .kh-reco-card';

  // Read preferred brands (set by the Step-3 chips code)
  const getPreferred = () => {
    try { return JSON.parse(sessionStorage.getItem('khPreferredBrands') || '[]'); }
    catch { return []; }
  };

  // Infer brand & capacity from slug/title
  const brandFromText = (s='') => {
    s = s.toLowerCase();
    if (s.includes('daikin'))    return 'daikin';
    if (s.includes('panasonic')) return 'panasonic';
    if (s.includes('haier'))     return 'haier';
    return '';
  };
  const capKeyFromSlug = (s='') => {
    // expect ...-25kw / -35kw / -50kw
    const m = s.toLowerCase().match(/-(25|35|50)\s*kw/);
    return m ? `${m[1]}kw` : null;
  };

  // Map: for each brand + capacity, where to link and how to label
  const PRODUCT_BY_BRAND = {
    panasonic: {
      '25kw': { slug: 'panasonic-tz-25kw',  title: 'Panasonic TZ — 2.5 kW' },
      '35kw': { slug: 'panasonic-tz-35kw',  title: 'Panasonic TZ — 3.5 kW' },
      '50kw': { slug: 'panasonic-tz-50kw',  title: 'Panasonic TZ — 5.0 kW' },
    },
    daikin: {
      '25kw': { slug: 'daikin-comfora-25kw', title: 'Daikin Comfora — 2.5 kW' },
      '35kw': { slug: 'daikin-comfora-35kw', title: 'Daikin Comfora — 3.5 kW' },
      '50kw': { slug: 'daikin-comfora-50kw', title: 'Daikin Comfora — 5.0 kW' },
    },
    haier: {
      '25kw': { slug: 'haier-revive-plus-25kw', title: 'Haier Revive Plus — 2.5 kW' },
      '35kw': { slug: 'haier-revive-plus-35kw', title: 'Haier Revive Plus — 3.5 kW' },
      '50kw': { slug: 'haier-revive-plus-50kw', title: 'Haier Revive Plus — 5.0 kW' },
    }
  };

  function currentSlugFromCard(card) {
    // Try from image path first (we already inject hero images by slug)
    const img = card.querySelector('.kh-reco-media img');
    if (img && img.src) {
      const m = img.src.match(/assets\/img\/products\/([^/]+)\/hero\.jpg/i);
      if (m) return m[1];
    }
    // Fallback: look for a known href on "Bekijk aanbeveling" button
    const cta = card.querySelector('a[href*="/products/"]');
    if (cta) {
      const m = cta.getAttribute('href').match(/products\/([^\.]+)\.html/i);
      if (m) return m[1];
    }
    return '';
  }

  function brandFromSlug(slug='') {
    slug = slug.toLowerCase();
    if (slug.startsWith('daikin-')) return 'daikin';
    if (slug.startsWith('panasonic-')) return 'panasonic';
    if (slug.startsWith('haier-')) return 'haier';
    return '';
  }

  function swapToBrand(card, targetBrand, capacityKey) {
    const cfg = PRODUCT_BY_BRAND[targetBrand]?.[capacityKey];
    if (!cfg) return;

    const newSlug = cfg.slug;
    const newTitle = cfg.title;
    const imgPath  = `assets/img/products/${newSlug}/hero.jpg`;
    const pageHref = `/airflowplus-site/products/${newSlug}.html`;

    // Update title text
    const titleEl = card.querySelector('.kh-reco-body h4, .kh-reco-body .title, .kh-reco-title, h4');
    if (titleEl) titleEl.textContent = newTitle;

    // Update image
    const img = card.querySelector('.kh-reco-media img');
    if (img) { img.src = imgPath; img.alt = newTitle; img.loading = 'lazy'; img.decoding = 'async'; }

    // Update details link (e.g., "Bekijk aanbeveling")
    const cta = card.querySelector('a[href*="/products/"]');
    if (cta) cta.setAttribute('href', pageHref);
  }

  function maybePreferBrands(card) {
    const preferred = getPreferred();
    if (!preferred.length) return;

    const slug = currentSlugFromCard(card);
    if (!slug) return;

    const currentBrand = brandFromSlug(slug) || brandFromText(card.textContent || '');
    const capacityKey  = capKeyFromSlug(slug) || (card.textContent.match(/(\b2\.5|\b3\.5|\b5\.0)\s*kW/i)?.[1]
                             ?.replace('.', '') + 'kw');

    if (!capacityKey) return; // can’t compute equivalent

    // If current brand already preferred, keep it
    if (preferred.includes(currentBrand)) return;

    // Otherwise switch to the first preferred brand that has an equivalent
    for (const b of preferred) {
      if (PRODUCT_BY_BRAND[b]?.[capacityKey]) {
        swapToBrand(card, b, capacityKey);
        return;
      }
    }
  }

  // Observe recommendation rendering (reuse your existing pattern)
  const mount = document.querySelector(MOUNT_SEL);
  if (!mount) return;

  const mo = new MutationObserver(() => {
    const card = document.querySelector('.kh-reco--withimg, .kh-reco-card');
    if (card) maybePreferBrands(card);
  });
  mo.observe(mount, { childList: true, subtree: true });

  // Also run once in case the card is already present
  const initial = document.querySelector('.kh-reco--withimg, .kh-reco-card');
  if (initial) maybePreferBrands(initial);
})();
