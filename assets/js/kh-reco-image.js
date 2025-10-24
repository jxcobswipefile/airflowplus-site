
/*! Airflow+ — Keuzehulp recommendation image injector (v2)
 *  Safe, idempotent, zero-deps. Works even when #kh-reco mounts later.
 *  1) Waits for the recommendation box to appear (MutationObserver).
 *  2) Derives a product slug from the CTA href OR title text.
 *  3) Tries several image paths; if one loads it renders a media block.
 *  4) Adds .kh-reco--withimg to activate existing CSS layout.
 */
(function () {
  const STATE_FLAG = 'data-reco-img-ready';

  // Small helper: debounce microtasks
  const raf = (fn) => requestAnimationFrame(fn);

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  // Attempt to infer slug from link or title
  function inferSlug(recoEl) {
    // 1) CTA href wins
    const a = recoEl.querySelector('a[href*="/products/"]');
    if (a) {
      try {
        const url = new URL(a.href, location.origin);
        const m = url.pathname.match(/\/products\/([^\/]+)\.html?/i);
        if (m && m[1]) return m[1].toLowerCase();
      } catch (e) {}
    }

    // 2) From title text
    const h = recoEl.querySelector('h3, h2, .title, .kh-reco-title');
    const txt = (h && h.textContent || '').trim().toLowerCase();

    if (txt) {
      // Known mappings first
      const map = {
        'panasonic tz 3.5 kw': 'panasonic-tz-35kw',
        'panasonic tz 5.0 kw': 'panasonic-tz-50kw',
        'panasonic tz 2.5 kw': 'panasonic-tz-25kw',
        'panasonic tz 7.1 kw': 'panasonic-tz-71kw'
      };
      if (map[txt]) return map[txt];

      // Fallback: make a slug-ish string
      let s = txt
        .replace(/[\s\/_]+/g, '-')
        .replace(/[^\w\-\.]+/g, '')       // keep letters, numbers, dash, dot
        .replace(/\.+/g, '-')             // 3.5 -> 3-5
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/g, '');
      // normalize kw patterns: 3-5-kw -> 35kw
      s = s.replace(/(\d)-(\d)-?kw/, (_m, a, b) => `${a}${b}kw`);
      // common prefix
      if (!/^panasonic-/.test(s) && /panasonic/.test(s)) {
        s = s.replace(/^panasonic-?/, 'panasonic-');
      }
      return s;
    }

    return null;
  }

  // Try image candidates until one loads
  function tryLoadImage(slug) {
    if (!slug) return Promise.resolve(null);
    const candidates = [
      `/assets/img/products/${slug}/hero.jpg`,
      `/assets/img/products/${slug}/main.jpg`,
      `/assets/img/products/${slug}.jpg`,
      `/products/${slug}.jpg`
    ];

    return new Promise((resolve) => {
      let idx = 0;
      const probe = () => {
        if (idx >= candidates.length) return resolve(null);
        const src = candidates[idx++];
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = probe;
        img.src = src;
      };
      probe();
    });
  }

  // Render the media block once
  async function renderMedia(recoEl) {
    if (!recoEl || recoEl.hasAttribute(STATE_FLAG)) return;
    const slug = inferSlug(recoEl);
    const found = await tryLoadImage(slug);
    if (!found) return; // fail quietly

    // Ensure a body wrapper exists
    let body = recoEl.querySelector('.kh-reco-body, .kh-reco-main');
    if (!body) {
      // wrap everything into a body container
      body = document.createElement('div');
      body.className = 'kh-reco-body';
      while (recoEl.firstChild) body.appendChild(recoEl.firstChild);
      recoEl.appendChild(body);
    }

    // If media already present, stop
    if (recoEl.querySelector('.kh-reco-media')) return;

    // Create media block
    const media = document.createElement('div');
    media.className = 'kh-reco-media';
    const img = document.createElement('img');
    img.src = found;
    img.alt = 'Aanbevolen airco';
    img.decoding = 'async';
    img.loading = 'lazy';
    media.appendChild(img);

    // Insert media before body
    recoEl.insertBefore(media, body);
    // Activate layout
    recoEl.classList.add('kh-reco--withimg');
    // Mark as done
    recoEl.setAttribute(STATE_FLAG, '1');
  }

  // Find the recommendation mount (supports #kh-reco or .kh-reco-mount)
  function findReco() {
    return document.getElementById('kh-reco') ||
           document.querySelector('.kh-reco-mount') ||
           null;
  }

  function initWhenReady() {
    const first = findReco();
    if (first) renderMedia(first);

    // Observe for later mounts / content updates
    const obs = new MutationObserver(() => {
      const el = findReco();
      if (el) renderMedia(el);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady, { once: true });
  } else {
    initWhenReady();
  }
})();
