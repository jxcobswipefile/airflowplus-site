/*! Airflow+ — KH Step 3 image injector (single-source, idempotent) */
(function () {
  // 0) Announce we are the only injector
  window.__KH_IMAGE_INJECTOR_ACTIVE__ = true;

  // 1) Base + helpers (no trailing/leading double slashes)
  var BASE = (window.AFP && AFP.ROOT_BASE) || '/airflowplus-site';
  function joinPath(p) {
    return (BASE.replace(/\/$/, '') + '/' + String(p || '').replace(/^\//, '')).replace(/\/{2,}/g, '/');
  }

  // 2) Family detection from full variant slug, e.g. "haier-revive-plus-50kw" → "haier-revive-plus"
  function familyFromVariantSlug(slug) {
    if (!slug) return '';
    slug = String(slug).toLowerCase();
    // remove “-2.5kw / -3.5kw / -5.0kw / -25kw / -35kw / -50kw …”
    return slug
      .replace(/-(?:2\.5|3\.5|5\.0)\s*kw$/i, '')
      .replace(/-(?:25|35|50)\s*kw$/i, '')
      .replace(/-\d+(?:\.\d+)?kw$/i, '');
  }

  // 3) Prefer the image you defined in AFP.ITEMS by matching the family slug to it.slug
  function afpImageForFamily(fam) {
    try {
      if (!window.AFP || !Array.isArray(AFP.ITEMS)) return '';
      var hit = AFP.ITEMS.find(function (it) {
        return String(it.slug || '').toLowerCase() === fam;
      });
      return hit && hit.img ? joinPath(hit.img) : '';
    } catch { return ''; }
  }

  // 4) Build a clean list of image candidates
  function buildCandidates(title, href) {
    var candidates = [];
    function push(p) { if (p) candidates.push(p); }

    // Try to read product variant slug from href “…/products/<slug>.html”
    var variant = '';
    try {
      if (href) {
        var m = String(href).match(/products\/([^\/#?]+)\.html/i);
        if (m) variant = m[1]; // e.g. "haier-revive-plus-50kw"
      }
    } catch {}

    // A) If AFP has an image for the family, use that first
    var fam = familyFromVariantSlug(variant);             // "haier-revive-plus"
    var afpImg = afpImageForFamily(fam);
    if (afpImg) push(afpImg);

    // B) Then try the strict variant folder hero
    if (variant) {
      push(joinPath('/assets/img/products/' + variant + '/hero.jpg'));  // …/haier-revive-plus-50kw/hero.jpg
      // and the family folder hero
      if (fam && fam !== variant) {
        push(joinPath('/assets/img/products/' + fam + '/hero.jpg'));     // …/haier-revive-plus/hero.jpg
      }
      // common alternates
      push(joinPath('/assets/img/products/' + variant + '/main.jpg'));
      push(joinPath('/assets/img/products/' + variant + '.jpg'));
      if (fam) {
        push(joinPath('/assets/img/products/' + fam + '/main.jpg'));
        push(joinPath('/assets/img/products/' + fam + '.jpg'));
      }
    }

    // C) Title mapping (very loose safety net)
    var folder = mapTitleToFolder(title);
    if (folder) {
      push(joinPath('/assets/img/products/' + folder + '/hero.jpg'));
      push(joinPath('/assets/img/products/' + folder + '/main.jpg'));
      push(joinPath('/assets/img/products/' + folder + '.jpg'));
    }

    // De-dupe preserving order
    var seen = Object.create(null);
    return candidates.filter(function (p) {
      if (!p || seen[p]) return false; seen[p] = 1; return true;
    });
  }

  // 5) HEAD-probe candidates in sequence and return the first that exists
  function firstExisting(urls) {
    var chain = Promise.resolve(null);
    urls.forEach(function (u) {
      chain = chain.then(function (found) {
        if (found) return found;
        return fetch(u, { method: 'HEAD', cache: 'no-store' })
          .then(function (r) { return r.ok ? u : null; })
          .catch(function () { return null; });
      });
    });
    return chain;
  }

  // 6) Ultra-simple title→folder mapper (last resort)
  function mapTitleToFolder(s) {
    if (!s) return '';
    s = String(s).toLowerCase();
    if (s.includes('panasonic') && s.includes('tz')) return 'panasonic-tz';
    if (s.includes('panasonic') && s.includes('etherea')) return 'panasonic-etherea';
    if (s.includes('daikin') && s.includes('comfora')) return 'daikin-comfora';
    if (s.includes('daikin') && s.includes('emura')) return 'daikin-emura';
    if (s.includes('daikin') && s.includes('perfera')) return 'daikin-perfera';
    if (s.includes('haier') && s.includes('expert')) return 'haier-expert';
    if (s.includes('haier') && (s.includes('revive plus') || s.includes('revive'))) return 'haier-revive-plus';
    return '';
  }

  // 7) One-time inject (and clean any previous media)
  function injectOnce() {
    var mount = document.querySelector('#kh-reco') || document.querySelector('.khv2-card, .kh-card');
    if (!mount) return;

    // Locate the recommendation block (or use mount)
    var card = mount.querySelector('.kh-reco-card, .kh-reco-main, .kh-card') || mount;

    // Title + product link (we prefer href to derive the variant)
    var titleEl = card.querySelector('h3, h2, .kh-reco-title, .kh-title') || mount.querySelector('h3, h2');
    var linkEl  = card.querySelector('a[href*="/products/"]') || mount.querySelector('a[href*="/products/"]');
    var title   = titleEl ? (titleEl.textContent || '').trim() : '';
    var href    = linkEl ? linkEl.getAttribute('href') : '';

    // If we already injected correctly, bail
    if (card.dataset.imgInjected === 'true') return;

    // Clean any previously inserted media/placeholder images (prevents duplicates)
    card.querySelectorAll('.kh-reco-media, .kh-reco--withimg').forEach(function (n) { n.remove(); });
    // Also nuke any stray <img src="hero.jpg"> placeholders
    card.querySelectorAll('img').forEach(function (img) {
      if (/(^|\/)hero\.jpg$/i.test(img.getAttribute('src') || '')) img.remove();
    });

    var candidates = buildCandidates(title, href);
    if (!candidates.length) { card.dataset.imgInjected = 'noimg'; return; }

    firstExisting(candidates).then(function (src) {
      if (!src) { card.dataset.imgInjected = 'noimg'; return; }

      // Build final layout wrapper only once
      var wrapper = document.createElement('div');
      wrapper.className = 'kh-reco--withimg';

      var media = document.createElement('div');
      media.className = 'kh-reco-media';
      var img = new Image();
      img.src = src;
      img.alt = title || 'Aanbevolen model';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);

      var body = document.createElement('div');
      body.className = 'kh-reco-body';

      // Move current children into body
      var frag = document.createDocumentFragment();
      while (card.firstChild) frag.appendChild(card.firstChild);
      body.appendChild(frag);

      wrapper.appendChild(media);
      wrapper.appendChild(body);
      card.appendChild(wrapper);

      card.dataset.imgInjected = 'true';
    });
  }

  // 8) Run once now, and again whenever #kh-reco changes
  function start() {
    var mount = document.querySelector('#kh-reco');
    if (!mount) return;
    injectOnce();
    var mo = new MutationObserver(injectOnce);
    mo.observe(mount, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
