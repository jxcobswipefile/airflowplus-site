/* ======================================================================
   Airflow+ — Main JS (clean & de-duped)
   ====================================================================== */

/* ---------------------------- 01) Header/nav ---------------------------- */
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.style.display = nav.style.display === 'block' ? '' : 'block';
    });
  }
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* ------------------------- 02) Simple quote form ------------------------ */
(() => {
  const form = document.getElementById('quote-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw 0;
      alert('Bedankt! We nemen snel contact op.');
      form.reset();
    } catch {
      alert('Er ging iets mis. Probeer opnieuw of bel ons.');
    }
  });
})();

/* ------------------------ 03) Sticky header glow ------------------------ */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () =>
    (window.scrollY > 10
      ? header.classList.add('scrolled')
      : header.classList.remove('scrolled'));
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ------------------------- 04) Reviews carousel ------------------------- */
(() => {
  const wrap = document.querySelector('[data-reviews]');
  if (!wrap) return;
  const track = wrap.querySelector('[data-track]');
  const prev  = wrap.querySelector('.rev-prev');
  const next  = wrap.querySelector('.rev-next');
  const cards = track ? [...track.querySelectorAll('.rev-card')] : [];
  if (!track || !cards.length) return;

  const gap = () => parseFloat(getComputedStyle(track).gap || '0') || 0;
  const step = () => (cards[0]?.getBoundingClientRect().width || 0) + gap();

  let timer;
  const auto = () => {
    const s = step(); if (!s) return;
    const max = track.scrollWidth - track.clientWidth;
    const nextLeft = Math.min(track.scrollLeft + s, max);
    track.scrollTo({ left: nextLeft, behavior: 'smooth' });
    if (Math.abs(nextLeft - max) < 2) {
      setTimeout(() => track.scrollTo({ left: 0, behavior: 'smooth' }), 800);
    }
  };
  const start = () => { stop(); timer = setInterval(auto, 3200); };
  const stop  = () => { if (timer) clearInterval(timer); timer = null; };

  prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left:  step(), behavior: 'smooth' }));
  ['mouseenter','touchstart','focusin'].forEach(ev => track.addEventListener(ev, stop, { passive: true }));
  ['mouseleave','touchend','focusout'].forEach(ev => track.addEventListener(ev, start, { passive: true }));
  window.addEventListener('resize', () => { stop(); start(); });

  // drag to scroll
  let down=false, sx=0, sl=0;
  track.addEventListener('mousedown', e => { down=true; sx=e.pageX; sl=track.scrollLeft; track.classList.add('dragging'); });
  window.addEventListener('mousemove', e => { if(!down) return; e.preventDefault(); track.scrollLeft = sl - (e.pageX - sx); });
  window.addEventListener('mouseup',   () => { down=false; track.classList.remove('dragging'); });

  // touch
  let tx=0, tl=0;
  track.addEventListener('touchstart', e => { const t=e.touches?.[0]; if(!t) return; tx=t.pageX; tl=track.scrollLeft; }, { passive:true });
  track.addEventListener('touchmove',  e => { const t=e.touches?.[0]; if(!t) return; track.scrollLeft = tl - (t.pageX - tx); }, { passive:true });

  start();
})();

/* --------------------- 05) Savings calculator (clean) -------------------- */
/* Expects the markup used on your homepage:
   #savings, #save-bill, #save-bill-input, #save-profile,
   .save-systems .chip[data-system], #save-amount, #save-rate, .save-result
*/
(() => {
  const root = document.getElementById('savings');
  if (!root) return;

  const range  = root.querySelector('#save-bill');
  const number = root.querySelector('#save-bill-input');
  const profileSel = root.querySelector('#save-profile');
  const chips  = [...root.querySelectorAll('.save-systems .chip')];
  const outAmt = root.querySelector('#save-amount');
  const outPct = root.querySelector('#save-rate');
  const result = root.querySelector('.save-result');
  const wrap   = root.querySelector('.save-bill-wrap');

  if (!range || !number || !outAmt || !outPct || !wrap) return;

  // create bubble & ticks (once)
  const bubble = document.createElement('div');
  bubble.className = 'save-bubble';
  wrap.style.position = 'relative';
  wrap.appendChild(bubble);

  const ticks = document.createElement('div');
  ticks.className = 'save-ticks';
  wrap.parentElement.insertBefore(ticks, wrap.nextSibling);

  // tooltip
  const tipWrap = document.createElement('span');
  tipWrap.className = 'save-tip-wrap';
  const tipBtn = Object.assign(document.createElement('button'), { className:'save-tip', type:'button', textContent:'i' });
  const tipBox = document.createElement('div');
  tipBox.className = 'save-tip-bubble';
  tipBox.innerHTML = `<h5>Hoe we dit schatten</h5>
    <p id="save-tip-copy"></p>
    <p class="muted">Indicatie, geen offerte. Werkelijk verbruik en tarieven kunnen variëren.</p>`;
  tipWrap.appendChild(tipBtn); tipWrap.appendChild(tipBox);
  result?.appendChild(tipWrap);
  tipBtn.addEventListener('click', e => { e.stopPropagation(); tipWrap.classList.toggle('is-open'); });
  document.addEventListener('click',   () => tipWrap.classList.remove('is-open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tipWrap.classList.remove('is-open'); });

  const fmtEUR = new Intl.NumberFormat('nl-NL', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
  const fmtINT = new Intl.NumberFormat('nl-NL');

  const RATES = {
    split:{ cooling:0.18, mixed:0.14, heating:0.06 },
    multi:{ cooling:0.22, mixed:0.18, heating:0.10 },
    hp:   { cooling:0.20, mixed:0.28, heating:0.40 }
  };
  const TIP = {
    split:{ cooling:'Single-split: ~18% besparing bij koelen.',
            mixed:'Single-split: gemengd gebruik ~14% besparing.',
            heating:'Single-split als bijverwarming: ~6% besparing.' },
    multi:{ cooling:'Multi-split: ~22% besparing bij meerdere ruimtes.',
            mixed:'Multi-split gemengd: ~18% besparing.',
            heating:'Multi-split als (bij)verwarming: ~10% besparing.' },
    hp:   { cooling:'Warmtepomp-airco (koelen): ~20% besparing.',
            mixed:'Warmtepomp-airco gemengd: ~28% besparing.',
            heating:'Warmtepomp-airco (verwarmen): ~40% besparing.' }
  };

  let system  = chips.find(c => c.classList.contains('active'))?.dataset.system || 'split';
  let profile = profileSel?.value || 'mixed';

  const clamp = (v) => {
    const min=+range.min||50, max=+range.max||600, step=+range.step||5;
    v = Math.round((+v||min)/step)*step;
    return Math.min(max, Math.max(min, v));
  };

  function positionBubble() {
    const min=+range.min||50, max=+range.max||600, v=+range.value||min;
    const pct = (v-min)/(max-min);
    const trackRect = range.getBoundingClientRect();
    const wrapRect  = wrap.getBoundingClientRect();
    const w = bubble.offsetWidth || 48, half = w/2;
    const x = Math.min(trackRect.width-half, Math.max(half, pct*trackRect.width));
    bubble.style.left = (trackRect.left - wrapRect.left + x) + 'px';
    bubble.textContent = fmtEUR.format(v);
  }

  function writeTicks() {
    const min=+range.min||50, max=+range.max||600, step=+range.step||5;
    const mid = Math.round(((min+max)/2)/step)*step;
    ticks.innerHTML = `<span>€${min.toLocaleString('nl-NL')}</span>
                       <span>€${mid.toLocaleString('nl-NL')}</span>
                       <span>€${max.toLocaleString('nl-NL')}</span>`;
    ticks.style.width = range.getBoundingClientRect().width + 'px';
  }

  function updateTip() {
    const t = TIP[system]?.[profile] || 'Indicatieve schatting op basis van gemiddelde profielen.';
    const slot = tipBox.querySelector('#save-tip-copy'); if (slot) slot.textContent = t;
  }

  function calc() {
    const bill = clamp(number.value || range.value || 0);
    const rate = RATES[system]?.[profile] ?? 0.15;
    const monthly = Math.round(bill * rate);
    outAmt.textContent = fmtINT.format(monthly);
    outPct.textContent = Math.round(rate * 100);
    positionBubble();
    updateTip();
  }

  // wire
  range.addEventListener('input', () => { number.value = range.value; calc(); });
  number.addEventListener('input', () => { const v = clamp(number.value); number.value = v; range.value = v; calc(); });
  profileSel?.addEventListener('change', e => { profile = e.target.value; calc(); });
  chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); system = c.dataset.system || 'split'; calc(); }));
  window.addEventListener('resize', () => { writeTicks(); positionBubble(); });

  // init
  number.value = clamp(number.value || range.value || 180);
  range.value  = number.value;
  writeTicks();
  calc();
})();

/* ---------------- 06) FAQ deep-linking + persistence + schema ------------ */
(() => {
  const faq = document.querySelector('.faq');
  if (!faq) return;
  const items = [...faq.querySelectorAll('details[id]')];
  const KEY = 'airflow_faq_open';

  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el?.tagName === 'DETAILS') el.open = true;
  } else {
    const last = localStorage.getItem(KEY);
    if (last) document.getElementById(last)?.setAttribute('open','');
  }

  items.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) {
      localStorage.setItem(KEY, d.id);
      history.replaceState(null, '', '#' + d.id);
    }
  }));

  // light schema.org injection
  const qa = items.map(d => {
    const q = d.querySelector('summary')?.textContent?.trim() || '';
    const a = d.querySelector('summary + *')?.textContent?.trim() || '';
    return { '@type':'Question', name:q, acceptedAnswer:{ '@type':'Answer', text:a } };
  });
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify({ '@context':'https://schema.org', '@type':'FAQPage', mainEntity: qa });
  document.head.appendChild(s);
})();

/* -------- 07) Contact/Offerte form (inline feedback, Formspree) --------- */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const err = (key, msg) => (form.querySelector(`[data-err="${key}"]`) || {}).textContent = msg || '';
  const clear = () => form.querySelectorAll('.error').forEach(e => e.textContent = '');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = v => !v || /^[0-9+()\-\s]{6,}$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); clear(); status.textContent = '';
    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email= (fd.get('email')||'').toString().trim();
    const phone= (fd.get('phone')||'').toString().trim();
    const msg  = (fd.get('message')||'').toString().trim();
    const ok = !!name && isEmail(email) && isPhone(phone) && !!msg && form.querySelector('#cf-consent')?.checked;
    if (!ok) {
      if (!name) err('name','Vul je naam in.');
      if (!isEmail(email)) err('email','Vul een geldig e-mailadres in.');
      if (!isPhone(phone)) err('phone','Vul een geldig telefoonnummer in.');
      if (!msg) err('message','Schrijf kort je vraag/aanvraag.');
      if (!form.querySelector('#cf-consent')?.checked) err('consent','Vink deze aan om te kunnen versturen.');
      return;
    }
    try {
      const res = await fetch(form.action, { method:'POST', body:fd, headers:{Accept:'application/json'} });
      if (!res.ok) throw 0;
      form.reset(); form.classList.add('is-sent');
      status.innerHTML = `<div class="success-card"><h3>Bedankt! 🎉</h3><p>We hebben je bericht ontvangen en nemen snel contact op.</p></div>`;
      form.scrollIntoView({ behavior:'smooth', block:'start' });
    } catch {
      status.innerHTML = `<div class="error-card"><strong>Er ging iets mis.</strong> Probeer het opnieuw of bel ons even.</div>`;
    }
  });
})();

/* -------------------- 08) Keuzehulp v2 (3-step wizard) ------------------- */
/*
  Expected markup:
    .khv2-card
      … <div class="khv2-actions"><button id="kh-next">Volgende →</button></div>
    <nav class="khv2-steps"><button class="dot">1</button><button class="dot">2</button><button class="dot">3</button></nav>
  Redirects to contact.html#offerte only on the LAST step.
*/
(() => {
  const card = document.querySelector('.khv2-card');
  let nextBtn = document.getElementById('kh-next');
  const dots = Array.from(document.querySelectorAll('.khv2-steps .dot'));
  if (!card || !nextBtn || dots.length === 0) return;

  // Ensure a dedicated render body
  let body = card.querySelector('.khv2-body');
  const actions = card.querySelector('.khv2-actions') || null;
  if (!body) {
    body = document.createElement('div');
    body.className = 'khv2-body';
    card.insertBefore(body, actions);
  }

  // 🔧 Kill any static Step-1 markup that sits outside the render body
  card.querySelectorAll('.khv2-q, .kh-grid-rooms').forEach(el => {
    if (!body.contains(el)) el.remove();
  });

  // 🔧 Kill ALL old listeners on the Next button (clone + replace)
  const fresh = nextBtn.cloneNode(true);
  nextBtn.replaceWith(fresh);
  nextBtn = document.getElementById('kh-next') || fresh; // re-grab by id

  // ---------- State ----------
  const state = { step: 1, rooms: 0, sizes: [] };

  // ---------- Helpers ----------
  const setDot = (n) => dots.forEach((d, i) => d.classList.toggle('is-active', i === (n - 1)));
  const complete = () =>
    state.step === 1 ? state.rooms > 0 :
    state.step === 2 ? (state.sizes.length === state.rooms && state.sizes.every(Boolean)) :
    true;

  const sizeOptions = [
    { val: '1-30',  label: '1–30 m²' },
    { val: '30-40', label: '30–40 m²' },
    { val: '40-50', label: '40–50 m²' },
  ];
  const roomCard = (i) => `
    <div class="khv2-room-card" data-room="${i}">
      <h4>Kamer ${i}</h4>
      <div class="khv2-sizes">
        ${sizeOptions.map(p => `
          <label class="kh-pill">
            <input type="radio" name="room-${i}-size" value="${p.val}" hidden>
            <span>${p.label}</span>
          </label>`).join('')}
      </div>
    </div>`;

  // ---------- Renderers ----------
  function renderStep1() {
    state.step = 1; state.rooms = 0; setDot(1);
    body.innerHTML = `
      <h2 class="khv2-q">In hoeveel ruimtes wil je airco?</h2>
      <div class="kh-grid-rooms" style="justify-content:center; grid-template-columns:repeat(4,72px); gap:14px;">
        ${[1,2,3,4].map(n => `
          <label class="chip round">
            <input type="radio" name="rooms" value="${n}">
            <span>${n}</span>
          </label>`).join('')}
      </div>`;
    body.addEventListener('change', onRoomsChange, { once: true });
    nextBtn.textContent = 'Volgende →';
    nextBtn.disabled = true;
  }

  function renderStep2() {
    state.step = 2; setDot(2);
    state.sizes = new Array(state.rooms).fill(null);
    body.innerHTML = `
      <h2 class="khv2-q">Hoe groot zijn de ruimtes?</h2>
      <p class="kh-sub">Kies de oppervlakte per kamer. Dit helpt ons het juiste vermogen te adviseren.</p>
      <div class="kh-size-grid">
        ${Array.from({ length: state.rooms }, (_, i) => roomCard(i + 1)).join('')}
      </div>`;
    body.addEventListener('change', onSizeChange);
    nextBtn.textContent = 'Volgende →';
    nextBtn.disabled = true;
  }

  function renderStep3() {
    state.step = 3; setDot(3);
    const list = state.sizes.map((sz, i) => `<li>Kamer ${i + 1}: <strong>${sz.replace('-', '–')} m²</strong></li>`).join('');
    body.innerHTML = `
      <h2 class="khv2-q">Overzicht</h2>
      <p class="kh-sub">Op basis van jouw keuzes stellen we een advies op maat samen.</p>
      <div id="khv2-summary" class="kh-result">
        <h3>Je keuzes</h3>
        <ul class="kh-out">${list}</ul>
        <p class="muted">Klaar? Ga door voor een vrijblijvende offerte.</p>
      </div>`;
    nextBtn.textContent = 'Afronden →';
    nextBtn.disabled = false;
  }

  // ---------- Handlers ----------
  function onRoomsChange(e) {
    const input = e.target;
    if (input?.name !== 'rooms') return;
    state.rooms = parseInt(input.value, 10) || 0;
    nextBtn.disabled = !complete();
    // keep listening if user clicks different option before Next
    body.addEventListener('change', onRoomsChange, { once: true });
  }

  function onSizeChange(e) {
    const input = e.target;
    if (!input || input.type !== 'radio') return;
    if (!input.name.startsWith('room-') || !input.name.endsWith('-size')) return;
    const idx = parseInt(input.name.split('-')[1], 10);
    if (Number.isFinite(idx) && idx >= 1 && idx <= state.rooms) {
      state.sizes[idx - 1] = input.value;
      // pill visual
      const c = input.closest('.khv2-room-card');
      c?.querySelectorAll('.kh-pill').forEach(l => l.classList.remove('active'));
      input.closest('.kh-pill')?.classList.add('active');
      nextBtn.disabled = !complete();
    }
  }

  // Dots allow jumping (with simple guards)
  document.addEventListener('click', (e) => {
    const dot = e.target.closest('.khv2-steps .dot');
    if (!dot) return;
    const i = dots.indexOf(dot);
    if (i === 0) renderStep1();
    if (i === 1 && state.rooms) renderStep2();
    if (i === 2 && state.rooms && state.sizes.length) renderStep3();
  });

  // Next button — ensure ours is the ONLY active listener
  nextBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    if (!complete()) return;
    if (state.step === 1) { renderStep2(); return; }
    if (state.step === 2) { renderStep3(); return; }
    if (state.step === 3) { window.location.href = 'contact.html#offerte'; }
  }, true); // capture to pre-empt legacy handlers

  // Close (×)
  const closeBtn = document.querySelector('.khv2-close');
  closeBtn?.addEventListener('click', () => (window.location.href = 'index.html'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.location.href = 'index.html'; });

  // Boot
  renderStep1();
})();

/* ==========================================================
   10) Unified Formspree handler + redirect to /thank-you.html
   - Works only on forms with [data-fs] to avoid conflicts.
   - Preserves all existing non-[data-fs] forms.
   ========================================================== */
(() => {
  const FORMS = document.querySelectorAll('form[data-fs]');
  if (!FORMS.length) return;

  const toQuery = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

  FORMS.forEach((form) => {
    const endpoint = form.getAttribute('action');
    if (!endpoint || !/^https:\/\/formspree\.io\/f\//.test(endpoint)) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const spinnerAttr = 'data-loading';
      submitBtn?.setAttribute(spinnerAttr, '1');

      try {
        const formData = new FormData(form);
        // Optional hidden fields you can include in HTML:
        // <input type="hidden" name="source" value="diensten-optin">
        const meta = {
          source: formData.get('source') || form.getAttribute('data-source') || 'site',
          type: form.getAttribute('data-type') || 'lead'
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const thanksURL = form.getAttribute('data-thanks') || '/thank-you.html';
          const qp = toQuery(meta);
          window.location.href = `${thanksURL}?${qp}`;
        } else {
          // Fallback: show a lightweight inline error
          alert('Er is iets misgegaan bij het versturen. Probeer het opnieuw.');
        }
      } catch (err) {
        console.error(err);
        alert('Netwerkfout. Controleer uw verbinding en probeer opnieuw.');
      } finally {
        submitBtn?.removeAttribute(spinnerAttr);
      }
    });
  });
})();

/* ==========================================================
   11) Page fade transition (Homepage → Keuzehulp, etc.)
   - Add data-transition to links you want to fade on navigate
   ========================================================== */
(() => {
  const links = document.querySelectorAll('a[data-transition]');
  if (!links.length) return;

  const fadeAndGo = (url) => {
    document.documentElement.classList.add('is-fading');
    // small delay to let the fade apply before navigation
    setTimeout(() => (window.location.href = url), 180);
  };

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const url = a.getAttribute('href');
      if (!url || url.startsWith('#') || a.target === '_blank') return;
      e.preventDefault();
      fadeAndGo(url);
    });
  });
})();

/* ==========================================================
   12) Reveal-on-scroll for .reveal elements
   - Add .reveal to any block you want to animate in.
   ========================================================== */
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach((el) => io.observe(el));
})();

/* === Airflow+: thin rotating checkmark ticker ============================== */
(function () {
  const raf = window.requestAnimationFrame;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.afp-ticker').forEach(ticker => {
    const track = ticker.querySelector('.afp-ticker__track');
    if (!track) return;

    // Duplicate items until we can loop seamlessly
    const baseItems = Array.from(track.children);
    const ensureLoopWidth = () => {
      const target = ticker.clientWidth * 2; // 2x viewport width = safe loop
      while (track.scrollWidth < target) {
        baseItems.forEach(n => track.appendChild(n.cloneNode(true)));
      }
    };
    ensureLoopWidth();
    window.addEventListener('resize', ensureLoopWidth, { passive: true });

    if (prefersReduced) return; // no motion; content still visible

    let lastTs, x = 0, id;
    const speed = Number(ticker.dataset.speed || 40); // px/s
    const halfWidth = () => track.scrollWidth / 2;

    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      // move left
      x -= speed * dt;
      if (-x > halfWidth()) x += halfWidth();
      track.style.transform = `translateX(${x}px)`;
      id = raf(step);
    };

    const play = () => { ticker.dataset.paused = "false"; lastTs = undefined; id = raf(step); };
    const pause = () => { ticker.dataset.paused = "true"; if (id) cancelAnimationFrame(id); };

    play();
    ticker.addEventListener('mouseenter', pause);
    ticker.addEventListener('mouseleave', play);
  });
})();


/* Hero video mute toggle v2 */
window.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.hero-video');
  const btn = document.getElementById('muteToggle');
  if (!video || !btn) return;
  try{ video.muted = true; }catch(e){}
  const update = () => { btn.setAttribute('data-state', video.muted ? 'muted' : 'unmuted'); btn.textContent = video.muted ? '🔇' : '🔊'; };
  update();
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    video.muted = !video.muted;
    update();
  });
});


/* v2994 calc patch */
(() => {
  const root = document.getElementById('savings');
  if (!root) return;
  const number = root.querySelector('#save-bill-input');
  const range  = root.querySelector('#save-bill');
  const chips  = [...root.querySelectorAll('.save-systems .chip')];
  const profileSel = root.querySelector('#save-profile');
  const outAmt = root.querySelector('#save-amount');
  if (!number || !range || !chips.length || !outAmt) return;
  // ensure change is captured (some browsers fire change on spinner clicks)
  const trigger = () => number.dispatchEvent(new Event('input', {bubbles:true}));
  number.addEventListener('change', () => { trigger(); });
  // make active state visible
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  }));
})();


// =========================================================
// SECTION: Hero video mute toggle (v29.9.5)
// - Looks for [data-hero-video] and [data-hero-mute]
// - Toggles the `muted` state and updates button label/icon
// =========================================================
(function(){
  try {
    var video = document.querySelector('[data-hero-video]') || document.querySelector('.hero video');
    var btn = document.querySelector('[data-hero-mute]') || document.querySelector('.hero-mute, .btn-mute');
    if (!video || !btn) return;

    // initial sync
    function syncLabel() {
      var isMuted = !!video.muted;
      var label = btn.getAttribute('data-label-muted') || 'Unmute';
      var label2 = btn.getAttribute('data-label-unmuted') || 'Mute';
      // If muted, show "Unmute"; if not, show "Mute"
      btn.textContent = isMuted ? label : label2;
      btn.setAttribute('aria-pressed', (!isMuted).toString());
    }

    // If the video is allowed to autoplay muted, ensure muted by default
    if (typeof video.muted === 'boolean') {
      video.muted = video.muted !== false; // default true if absent
    }

    btn.addEventListener('click', function(e){
      try {
        video.muted = !video.muted;
        syncLabel();
      } catch (err) {}
    }, { passive: true });

    // Also sync when volume/muted changes (e.g., programmatic)
    video.addEventListener('volumechange', syncLabel);
    syncLabel();
  } catch (e) {
    // no-op (defensive)
  }
})();
