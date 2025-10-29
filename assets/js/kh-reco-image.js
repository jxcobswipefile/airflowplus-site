/*! Airflow+ — Keuzehulp recommendation image injector (safe, idempotent) */
(function () {
  // ---------------------- small util ----------------------
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  // ---------------------- shared helpers (MUST be outside ready(...)) ----------------------
  // Base path (works whether you serve under /airflowplus-site or root)
  var BASE = (window.AFP && AFP.ROOT_BASE) || (location.pathname.includes('/airflowplus-site') ? '/airflowplus-site' : '');

  function joinPath(p) {
    return (BASE.replace(/\/$/, '') + '/' + String(p || '').replace(/^\//, '')).replace(/\/{2,}/g, '/');
  }

  // from a variant slug like "daikin-comfora-35kw" → "daikin-comfora"
  function familyFromSlug(slug) {
    if (!slug) return '';
    slug = String(slug).toLowerCase();
    return slug
      .replace(/-(?:2\.5|3\.5|5\.0)\s*kw$/i, '')
      .replace(/-(?:25|35|50)\s*kw$/i, '')
      .replace(/-\d+(?:\.\d+)?kw$/i, '');
  }

  // look up an AFP.ITEMS entry by family slug and return its img (if present)
  function afpImgForFamily(fam) {
    try {
      if (!fam || !window.AFP || !Array.isArray(AFP.ITEMS)) return '';
      var m = AFP.ITEMS.find(function (it) { return String(it.slug).toLowerCase() === fam; });
      return (m && m.img) ? joinPath(m.img) : '';
    } catch (_) { return ''; }
  }

  // test a list of URLs (HEAD) and resolve to the first that exists (or null)
  function firstExisting(paths) {
    var p = Promise.resolve(null);
    paths.forEach(function (path) {
      p = p.then(function (found) {
        if (found) return found;
        return fetch(path, { method: 'HEAD', cache: 'no-cache' })
          .then(function (r) { return r.ok ? path : null; })
          .catch(function () { return null; });
      });
    });
    return p;
  }

  // title heuristics → fallback folder
  function mapTitleToFolder(s) {
    if (!s) return '';
    s = (s || '').toLowerCase();
    if (s.includes('panasonic') && s.includes('tz')) return 'panasonic-tz';
    if (s.includes('panasonic') && s.includes('etherea') && /25\s*kw/.test(s)) return 'panasonic-etherea-25kw';
    if (s.includes('panasonic') && s.includes('etherea')) return 'panasonic-etherea';
    if (s.includes('daikin') && s.includes('comfora')) return 'daikin-comfora';
    if (s.includes('daikin') && s.includes('emura') && /25\s*kw/.test(s)) return 'daikin-emura-25kw';
    if (s.includes('daikin') && s.includes('emura')) return 'daikin-emura';
    if (s.includes('daikin') && s.includes('perfera')) return 'daikin-perfera';
    if (s.includes('haier') && s.includes('expert')) return 'haier-expert';
    if (s.includes('haier') && s.includes('flexis') && /25\s*kw/.test(s)) return 'haier-flexis-25kw';
    if (s.includes('haier') && (s.includes('revive plus') || s.includes('revive'))) return 'haier-revive-plus';
    return '';
  }

  // ---------------------- image resolver (Promise) ----------------------
  function resolveImage(title, href) {
    var slug = '';
    if (href) {
      try {
        slug = href.split('?')[0].split('#')[0].split('/').pop().replace(/\.html?$/i, '');
      } catch (_) { slug = ''; }
    }

    var candidates = [];
    function push(u) { if (u) candidates.push(u); }

    // 1) Prefer AFP.ITEMS image for the *family* (so your AFP edits take effect)
    var fam = familyFromSlug(slug);
    var afpImg = afpImgForFamily(fam);
    if (afpImg) push(afpImg);

    // 2) Usual hero guesses from slug and title
    if (slug) {
      push(joinPath('/assets/img/products/' + slug + '/hero.jpg'));
      var baseSlug = slug.replace(/-(\d+(?:\.\d+)?)\s*kw$/i, '').replace(/-\d+kw$/i, '');
      if (baseSlug && baseSlug !== slug) {
        push(joinPath('/assets/img/products/' + baseSlug + '/hero.jpg'));
      }
    }
    var folder = mapTitleToFolder(title);
    if (folder) push(joinPath('/assets/img/products/' + folder + '/hero.jpg'));

    // 3) Additional common file names
    if (slug) {
      push(joinPath('/assets/img/products/' + slug + '/main.jpg'));
      push(joinPath('/assets/img/products/' + slug + '.jpg'));
    }
    if (folder) {
      push(joinPath('/assets/img/products/' + folder + '/main.jpg'));
      push(joinPath('/assets/img/products/' + folder + '.jpg'));
    }

    // de-dupe in order
    var seen = Object.create(null);
    var list = candidates.filter(function (p) { if (!p || seen[p]) return false; seen[p] = 1; return true; });

    return firstExisting(list); // → Promise<string|null>
  }

  // ---------------------- injector ----------------------
  ready(function () {
    var mount = document.querySelector('#kh-reco') || document.querySelector('.kh-card, .khv2-card, .khv2-stage');
    if (!mount) return;

    var triedOnce = false;

    function tryInject() {
      var card = mount.querySelector('.kh-reco-card') ||
                 mount.querySelector('.kh-reco-main') ||
                 mount.querySelector('.kh-card') ||
                 mount;
      if (!card || card.dataset.imgInjected) return;

      var titleEl = card.querySelector('h3, h2, .kh-title, .kh-reco-title') || mount.querySelector('h3, h2');
      var linkEl  = card.querySelector('a[href*="/products/"]') || mount.querySelector('a[href*="/products/"]');
      var title   = titleEl ? (titleEl.textContent || '').trim() : '';
      var href    = linkEl ? (linkEl.getAttribute('href') || '') : '';

      resolveImage(title, href).then(function (src) {
        if (!src) { card.dataset.imgInjected = 'noimg'; return; }

        // layout wrapper
        var wrapper = document.createElement('div');
        wrapper.className = 'kh-reco--withimg';

        var media = document.createElement('div');
        media.className = 'kh-reco-media';

        var img = new Image();
        img.alt = title || 'Aanbevolen model';
        img.src = src;
        img.loading = 'lazy';
        img.decoding = 'async';
        media.appendChild(img);

        var body = document.createElement('div');
        body.className = 'kh-reco-body';

        var mover = document.createDocumentFragment();
        while (card.firstChild) mover.appendChild(card.firstChild);
        body.appendChild(mover);

        wrapper.appendChild(media);
        wrapper.appendChild(body);
        card.appendChild(wrapper);

        card.dataset.imgInjected = 'true';
      });

      triedOnce = true;
    }

    var mo = new MutationObserver(function () { tryInject(); });
    mo.observe(mount, { childList: true, subtree: true });

    tryInject();
    setTimeout(function () { if (!triedOnce) tryInject(); }, 300);
  });
})();
