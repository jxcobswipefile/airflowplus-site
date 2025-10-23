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
    if (el?.tagName === 'DETAILS') { el.open = true; history.replaceState(null, '', location.pathname + location.search); }
  } else {
    const last = localStorage.getItem(KEY);
    if (last) document.getElementById(last)?.setAttribute('open','');
  }

  items.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) {
      localStorage.setItem(KEY, d.id);
      // (patched) no URL hash update on toggle
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


// SECTION: #muteToggle binding (v29.9.10)
(function(){
  try{
    var v=document.querySelector('.hero-video')||document.querySelector('[data-hero-video]');
    var b=document.getElementById('muteToggle');
    if(!v||!b)return;
    function s(){ if(v.muted){ b.textContent='🔇'; b.setAttribute('aria-label','Unmute'); } else { b.textContent='🔊'; b.setAttribute('aria-label','Mute'); } }
    v.muted=true; s();
    b.addEventListener('click', function(){ v.muted=!v.muted; s(); }, {passive:true});
    v.addEventListener('volumechange', s);
  }catch(e){}
})();


// SECTION: #muteToggle harden (v29.9.11)
(function(){
  try{
    var video = document.querySelector('.hero-video') || document.querySelector('[data-hero-video]');
    var btn = document.getElementById('muteToggle') || document.querySelector('.mute-btn');
    if(!video || !btn) return;

    function sync(){
      if(video.muted || video.volume === 0){
        btn.textContent = '🔇';
        btn.setAttribute('aria-label','Unmute');
      }else{
        btn.textContent = '🔊';
        btn.setAttribute('aria-label','Mute');
      }
    }

    // Default: start muted for autoplay
    video.muted = true;
    sync();

    btn.addEventListener('click', function(){
      try{
        if(video.muted || video.volume === 0){
          video.muted = false;
          if(video.volume === 0) video.volume = 0.5;
          var p = video.play();
          if(p && typeof p.catch === 'function'){ p.catch(function(){ /* ignore */ }); }
        } else {
          video.muted = true;
        }
        sync();
      }catch(e){}
    }, {passive:true});

    video.addEventListener('volumechange', sync);
  }catch(e){}
})();


// Hero video mute/unmute — bulletproof (v29.9.17)
(function(){
  try{
    var video = document.querySelector('.hero-video') || document.querySelector('[data-hero-video]');
    var btn = document.getElementById('muteToggle') || document.querySelector('.mute-btn');
    if(!video || !btn) return;

    // Start muted for autoplay policy
    video.muted = true;
    video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline','');

    function render(){
      var muted = video.muted || video.volume === 0;
      btn.textContent = muted ? '🔇' : '🔊';
      btn.setAttribute('aria-pressed', (!muted).toString());
      btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    }
    function unmute(){
      video.muted = false;
      if (video.volume === 0) video.volume = 0.5;
      var p = video.play(); if (p && p.catch) p.catch(function(){});
    }

    btn.addEventListener('click', function(){
      if (video.muted || video.volume === 0) { unmute(); } else { video.muted = true; }
      render();
    }, {passive:true});

    video.addEventListener('volumechange', render, {passive:true});
    render();
  }catch(e){}
})();


// SECTION: Hero video mute/unmute — hardened (v29.9.18)
(function(){
  try{
    // Try several ways to find the hero video
    var video = document.querySelector('[data-hero-video]')
             || document.querySelector('.hero video')
             || document.querySelector('.hero-wrap video')
             || document.querySelector('#hero video, video#hero-video')
             || document.querySelector('video[autoplay]');

    // Try several ways to find the existing right-side mute button
    var btn = document.querySelector('#muteToggle')
          || document.querySelector('.mute-btn')
          || document.querySelector('.hero [data-mute]')
          || document.querySelector('.hero .btn-mute')
          || document.querySelector('.hero .mute-toggle');

    if(!video || !btn) return;

    // Autoplay requirements
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    // Start muted for autoplay
    video.muted = true;

    function render(){
      var muted = video.muted || video.volume === 0;
      btn.setAttribute('aria-pressed', (!muted).toString());
      btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
      // Show a clear icon/text
      btn.textContent = muted ? '🔇' : '🔊';
    }

    function unmute(){
      // Fully enable sound
      video.muted = false;
      try { if (video.volume === 0) video.volume = 0.5; } catch(e){}
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function(){}); }
    }

    btn.addEventListener('click', function(ev){
      try {
        ev.stopPropagation();
        if (video.muted || video.volume === 0) { unmute(); }
        else { video.muted = true; }
        render();
      } catch(e){}
    }, {passive:true});

    video.addEventListener('volumechange', render, {passive:true});
    render();
  }catch(e){}
})();


// === SECTION: Product list and cross-links (auto-filled) ===
(function(){
  try{
    var items = [
      {slug:'panasonic-tz', name:'Panasonic TZ', img:'assets/img/products/panasonic-tz/hero.jpg', url:'products/panasonic-tz.html', cool_area_m2:25},
      {slug:'daikin-comfora', name:'Daikin Comfora', img:'assets/img/products/daikin-comfora/hero.jpg', url:'products/daikin-comfora.html', cool_area_m2:25},
      {slug:'haier-revive-plus', name:'Haier Revive Plus', img:'assets/img/products/haier-revive-plus/hero.jpg', url:'products/haier-revive-plus.html', cool_area_m2:25},
      {slug:'daikin-perfera', name:'Daikin Perfera', img:'assets/img/products/daikin-perfera/hero.jpg', url:'products/daikin-perfera.html', cool_area_m2:25},
      {slug:'panasonic-etherea', name:'Panasonic Etherea', img:'assets/img/products/panasonic-etherea/hero.jpg', url:'products/panasonic-etherea.html', cool_area_m2:25},
      {slug:'haier-expert', name:'Haier Expert', img:'assets/img/products/haier-expert/hero.jpg', url:'products/haier-expert.html', cool_area_m2:26},
      {slug:'daikin-emura', name:'Daikin Emura', img:'assets/img/products/daikin-emura/hero.jpg', url:'products/daikin-emura.html', cool_area_m2:25}
    ];

    // Fill "Bekijk ook" scrollers if present
    items.forEach(function(a){
      var scroller = document.getElementById('also-'+a.slug);
      if(scroller){
        items.filter(function(b){ return b.slug!==a.slug; }).slice(0,6).forEach(function(b){
          var el = document.createElement('a'); el.className='scroll-card'; el.href='../'+b.url;
          el.innerHTML = '<img src="../'+b.img+'"><span>'+b.name+'</span>';
          scroller.appendChild(el);
        });
      }
    });

    // Keuzehulp mapping enhancement (if kh-reco exists)
    var kh = document.getElementById('kh-reco');
    if(kh){
      // improve pick logic once we have exact m2 per model; placeholder uses cool_area_m2
      function totalM2(){
        var total=0;
        document.querySelectorAll('[data-room-m2], .save-room-size, input[name^="room-"]').forEach(function(el){
          var v=parseFloat(el.value||el.getAttribute('data-room-m2')||'0'); if(!isNaN(v)) total+=v;
        });
        var slider=document.querySelector('.save-slider'); if(total===0&&slider){var s=parseFloat(slider.value); if(!isNaN(s)) total=s;}
        return total;
      }
      function pick(total){
        var sorted = items.slice().sort(function(a,b){return a.cool_area_m2-b.cool_area_m2;});
        for(var i=0;i<sorted.length;i++) if(sorted[i].cool_area_m2>=total) return sorted[i];
        return sorted[sorted.length-1];
      }
      function render(){
        var m = pick(totalM2());
        kh.querySelector('.kh-reco-content').innerHTML = '<div class="kh-reco-box">'
          + '<img class="kh-reco-img" src="'+m.img+'" alt="'+m.name+'">'
          + '<div class="kh-reco-text"><strong>'+m.name+'</strong><br><span class="muted small">Schatting op basis van m²</span><br>'
          + '<a class="btn btn--green" href="'+m.url+'">Bekijk product</a></div></div>';
      }
      document.addEventListener('DOMContentLoaded', render);
      document.addEventListener('input', render, true);
    }
  }catch(e){}
})();

/* === Phase 2.3 injected === */
const ROOT_BASE = '/airflowplus-site/';

const items = [
  {slug:'products/panasonic-tz.html', name:'Panasonic TZ', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, tags:['single']},
  {slug:'products/panasonic-etherea.html', name:'Panasonic Etherea', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:19, noise_out:48, tags:['single','quiet']},
  {slug:'products/daikin-comfora.html', name:'Daikin Comfora', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, tags:['single']},
  {slug:'products/daikin-perfera.html', name:'Daikin Perfera', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:19, noise_out:48, tags:['single','quiet']},
  {slug:'products/daikin-emura.html', name:'Daikin Emura', kw:2.5, min_m2:15, max_m2:30, seer:'A++', scop:'A+', noise_in:19, noise_out:46, tags:['design','quiet']},
  {slug:'products/haier-revive-plus.html', name:'Haier Revive Plus', kw:2.5, min_m2:12, max_m2:28, seer:'A++', scop:'A+', noise_in:21, noise_out:47, tags:['single']},
  {slug:'products/haier-expert-nordic.html', name:'Haier Expert Nordic', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:19, noise_out:48, tags:['lowtemp']}
];

function renderCompareRail() {
  const rails = document.querySelectorAll('.compare-rail[data-compare="auto"]');
  rails.forEach(rail => {
    rail.innerHTML = items.map(it => {
      const url = (typeof ROOT_BASE !== 'undefined' ? ROOT_BASE : '/airflowplus-site/') + it.slug;
      return (
        '<a class="compare-card" href="'+ url +'">'+
          '<h3>'+ it.name +'</h3>'+
          '<div class="compare-spec"><strong>'+ it.kw +' kW</strong> • '+ it.min_m2 +'-'+ it.max_m2 +' m²</div>'+
          '<div class="compare-spec">Binnen '+ it.noise_in +' dB(A) • Buiten '+ it.noise_out +' dB(A)</div>'+
          '<div class="card-energy">'+
            '<span class="eu-chip" data-grade="'+ it.seer +'">Koelen: '+ it.seer +'</span>'+
            '<span class="eu-chip" data-grade="'+ it.scop +'">Verwarmen: '+ it.scop +'</span>'+
          '</div>'+
        '</a>'
      );
    }).join('');
  });
}
document.addEventListener('DOMContentLoaded', renderCompareRail);

function pickRecommendation(totalRooms, avgRoomM2, preferQuiet){
  var totalM2 = totalRooms * avgRoomM2;
  if (totalRooms >= 3){
    var pool = items.filter(function(it){ return it.kw >= 3.5; });
    if (preferQuiet){
      var q = pool.filter(function(it){ return (it.tags||[]).indexOf('quiet')>-1; });
      if (q.length) pool = q;
    }
    return pool[0] || items[0];
  }
  var pool2 = items.filter(function(it){
    return (totalM2 >= it.min_m2 && totalM2 <= it.max_m2) ||
           (avgRoomM2 >= it.min_m2 && avgRoomM2 <= it.max_m2);
  });
  if (preferQuiet){
    var q2 = pool2.filter(function(it){ return (it.tags||[]).indexOf('quiet')>-1; });
    if (q2.length) pool2 = q2;
  }
  if (!pool2.length){
    pool2 = items.slice().sort(function(a,b){
      function mid(x){ return (x.min_m2 + x.max_m2)/2; }
      return Math.abs(mid(a)-totalM2) - Math.abs(mid(b)-totalM2);
    });
  }
  return pool2[0] || items[0];
}

function onKeuzeSubmit(){
  try{
    var roomsEl = document.querySelector('[name="rooms"]');
    var sizeEl = document.querySelector('[name="room_size"]');
    var quietEl = document.querySelector('[name="quiet"]');
    var rooms = parseInt((roomsEl && roomsEl.value) || '1', 10);
    var avg = parseInt((sizeEl && sizeEl.value) || '20', 10);
    var quiet = !!(quietEl && (quietEl.checked || quietEl.value === 'true'));
    var rec = pickRecommendation(rooms, avg, quiet);
    var node = document.getElementById('kh-reco');
    var reason = 'Gekozen omdat '+ rooms +' kamer(s) × '+ avg +' m² ⇒ ~'+ (rooms*avg) +' m² totaal.';
    if (node){
      var urlBase = (typeof ROOT_BASE !== 'undefined' ? ROOT_BASE : '/airflowplus-site/');
      node.innerHTML = ''+
        '<div class="kh-reco">'+
          '<h3>'+ rec.name +'</h3>'+
          '<p class="muted">'+ reason +'</p>'+
          '<a class="btn btn-green" href="'+ urlBase + rec.slug +'">Bekijk product</a>'+
          '<div class="card-energy" style="margin-top:10px">'+
            '<span class="eu-chip" data-grade="'+ rec.seer +'">Koelen: '+ rec.seer +'</span>'+
            '<span class="eu-chip" data-grade="'+ rec.scop +'">Verwarmen: '+ rec.scop +'</span>'+
          '</div>'+
        '</div>';
    }
  }catch(e){ console.warn('Keuzehulp fallback', e); }
}
document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('kh-submit');
  if (btn){ btn.addEventListener('click', function(e){ e.preventDefault(); onKeuzeSubmit(); }); }
});

/* === Phase 2.5 injected === */
const VARS = [
  {slug:'products/panasonic-tz-25kw.html', name:'Panasonic TZ 2.5 kW', brand:'Panasonic', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/panasonic-tz-35kw.html', name:'Panasonic TZ 3.5 kW', brand:'Panasonic', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/panasonic-tz-50kw.html', name:'Panasonic TZ 5.0 kW', brand:'Panasonic', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/panasonic-etherea-25kw.html', name:'Panasonic Etherea 2.5 kW', brand:'Panasonic', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/panasonic-etherea-35kw.html', name:'Panasonic Etherea 3.5 kW', brand:'Panasonic', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/panasonic-etherea-50kw.html', name:'Panasonic Etherea 5.0 kW', brand:'Panasonic', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/daikin-comfora-25kw.html', name:'Daikin Comfora 2.5 kW', brand:'Daikin', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/daikin-comfora-35kw.html', name:'Daikin Comfora 3.5 kW', brand:'Daikin', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/daikin-comfora-50kw.html', name:'Daikin Comfora 5.0 kW', brand:'Daikin', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/daikin-perfera-25kw.html', name:'Daikin Perfera 2.5 kW', brand:'Daikin', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/daikin-perfera-35kw.html', name:'Daikin Perfera 3.5 kW', brand:'Daikin', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/daikin-perfera-50kw.html', name:'Daikin Perfera 5.0 kW', brand:'Daikin', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/daikin-emura-25kw.html', name:'Daikin Emura 2.5 kW', brand:'Daikin', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/daikin-emura-35kw.html', name:'Daikin Emura 3.5 kW', brand:'Daikin', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/daikin-emura-50kw.html', name:'Daikin Emura 5.0 kW', brand:'Daikin', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/haier-revive-plus-25kw.html', name:'Haier Revive Plus 2.5 kW', brand:'Haier', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/haier-revive-plus-35kw.html', name:'Haier Revive Plus 3.5 kW', brand:'Haier', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5},
  {slug:'products/haier-revive-plus-50kw.html', name:'Haier Revive Plus 5.0 kW', brand:'Haier', kw:5.0, min_m2:30, max_m2:50, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:5.0},
  {slug:'products/haier-expert-nordic-25kw.html', name:'Haier Expert Nordic 2.5 kW', brand:'Haier', kw:2.5, min_m2:10, max_m2:25, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:2.5},
  {slug:'products/haier-expert-nordic-35kw.html', name:'Haier Expert Nordic 3.5 kW', brand:'Haier', kw:3.5, min_m2:20, max_m2:35, seer:'A++', scop:'A+', noise_in:20, noise_out:46, cap:3.5}
];

function setupCatalogFilters(){
  var root = document.getElementById('cards');
  if (!root) return;
  var cards = Array.from(root.querySelectorAll('.model-card'));
  var brandInputs = Array.from(document.querySelectorAll('.flt-brand'));
  var capInputs = Array.from(document.querySelectorAll('.flt-cap'));
  var priceMin = document.getElementById('priceMin');
  var priceMax = document.getElementById('priceMax');
  var btnReset = document.getElementById('btnResetFilters');
  function apply(){
    var brands = brandInputs.filter(i=>i.checked).map(i=>i.value);
    var caps = capInputs.filter(i=>i.checked).map(i=>i.value);
    var min = parseInt(priceMin.value||'0',10);
    var max = parseInt(priceMax.value||'999999',10);
    cards.forEach(function(c){
      var b = c.getAttribute('data-brand');
      var k = c.getAttribute('data-capacity');
      // price is brand vanaf; we treat as ok for all
      var okBrand = !brands.length || brands.indexOf(b) > -1;
      var okCap = !caps.length || caps.indexOf(k) > -1;
      var okPrice = true;
      c.style.display = (okBrand && okCap && okPrice) ? '' : 'none';
    });
  }
  brandInputs.concat(capInputs).forEach(i=>i.addEventListener('change', apply));
  ['input','change'].forEach(ev=>{ if(priceMin) priceMin.addEventListener(ev, apply); if(priceMax) priceMax.addEventListener(ev, apply); });
  if (btnReset) btnReset.addEventListener('click', function(){ brandInputs.concat(capInputs).forEach(i=> i.checked=false); if(priceMin) priceMin.value='0'; if(priceMax) priceMax.value='10000'; apply(); });
  apply();
}
document.addEventListener('DOMContentLoaded', setupCatalogFilters);

function pickVariantByArea(totalRooms, avgRoomM2, preferQuiet){
  var totalM2 = totalRooms * avgRoomM2;
  var pool = VARS.filter(function(it){ return totalM2 >= it.min_m2 && totalM2 <= it.max_m2; });
  if (!pool.length){
    pool = VARS.slice().sort(function(a,b){
      function mid(x){ return (x.min_m2 + x.max_m2)/2; }
      return Math.abs(mid(a)-totalM2) - Math.abs(mid(b)-totalM2);
    });
  }
  if (totalRooms>=3){
    var big = pool.filter(function(it){ return it.kw>=3.5; });
    if (big.length) pool = big;
  }
  return pool[0] || VARS[0];
}

function onKeuzeSubmit(){
  try{
    var rooms = parseInt(document.querySelector('[name="rooms"]')?.value||'1',10);
    var avg = parseInt(document.querySelector('[name="room_size"]')?.value||'20',10);
    var rec = pickVariantByArea(rooms, avg, false);
    var node = document.getElementById('kh-reco');
    var urlBase = (typeof ROOT_BASE !== 'undefined' ? ROOT_BASE : '/airflowplus-site/');
    if (node){
      node.innerHTML = ''+
        '<div class="kh-reco">'+
          '<h3>'+ rec.name +'</h3>'+
          '<p class="muted">Gekozen op basis van ~'+ (rooms*avg) +' m² en '+ rooms +' kamer(s).</p>'+
          '<a class="btn btn-green" href="'+ urlBase + rec.slug +'">Bekijk aanbeveling</a>'+
          '<div class="card-energy" style="margin-top:10px">'+
            '<span class="eu-chip" data-grade="'+ (rec.seer||'A++') +'">Koelen: '+ (rec.seer||'A++') +'</span>'+
            '<span class="eu-chip" data-grade="'+ (rec.scop||'A+') +'">Verwarmen: '+ (rec.scop||'A+') +'</span>'+
          '</div>'+
        '</div>';
    }
  }catch(e){ console.warn('Keuzehulp submit fallback', e); }
}
document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('kh-submit');
  if (btn){ btn.addEventListener('click', function(e){ e.preventDefault(); onKeuzeSubmit(); }); }
});
/* resilient 'Volgende' */
(function ensureKhNext(){
  function nextStep(){
    var steps = Array.prototype.slice.call(document.querySelectorAll('.kh-step'));
    if (!steps.length) return;
    var idx = steps.findIndex(function(s){ return s.classList.contains('is-active'); });
    var next = (idx>=0 && steps[idx+1]) ? steps[idx+1] : steps[0];
    if (next){
      steps.forEach(function(s){ s.classList.remove('is-active'); });
      next.classList.add('is-active');
      var dots = document.querySelectorAll('.kh-dots .dot');
      if (dots && dots.length){
        Array.prototype.forEach.call(dots, function(d){ d.classList.remove('is-active'); });
        if (dots[idx+1]) dots[idx+1].classList.add('is-active');
      }
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    var btns = document.querySelectorAll('#kh-next, .kh-next, [data-kh-next]');
    Array.prototype.forEach.call(btns, function(btn){
      btn.addEventListener('click', function(e){
        if (!(this.tagName==='A' && (this.getAttribute('href')||'').charAt(0)==='#')){ e.preventDefault(); }
        nextStep();
      });
    });
  });
})();

/* === KH Step 2 parser: derive total m² from selected room ranges (Phase 2.6e) === */
(function(){
  function parseRangeLabelToMid(text){
    if (!text) return null;
    text = text.replace(/\s/g,'').replace(',', '.').toLowerCase();
    // Expect formats like '1–30m²', '30-40m2', '40–50 m²'
    var m = text.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
    if (m){
      var a = parseFloat(m[1]), b = parseFloat(m[2]);
      if (!isNaN(a) && !isNaN(b)) return (a+b)/2;
    }
    // Single number fallback
    var n = parseFloat((text.match(/\d+(?:\.\d+)?/)||[''])[0]);
    return isNaN(n) ? null : n;
  }
  function isSelected(el){
    return el.classList.contains('is-selected') || el.classList.contains('selected') ||
           el.classList.contains('active') || el.getAttribute('aria-pressed')==='true' ||
           el.getAttribute('aria-checked')==='true' || el.checked === true;
  }
  function collectRoomSizes(){
    var step2 = document.querySelector('[data-kh-step="2"]') || document.querySelector('.kh-step.step-2');
    if (!step2) return null;
    var rooms = [];
    // Strategy A: containers per room with buttons inside
    var roomBlocks = step2.querySelectorAll('[data-room], .room, .kh-room, .room-block');
    if (roomBlocks.length){
      roomBlocks.forEach(function(block){
        var chosen = null;
        var options = block.querySelectorAll('button, a, label, input[type="radio"], input[type="checkbox"]');
        options.forEach(function(opt){
          if (isSelected(opt) && !chosen){
            chosen = opt.getAttribute('data-size') || opt.textContent || opt.value;
          }
        });
        if (!chosen && options.length){
          // if none explicitly selected, take first .is-active or first button
          var firstActive = Array.prototype.find.call(options, function(o){ return o.classList.contains('is-active'); });
          var source = firstActive || options[0];
          chosen = source.getAttribute('data-size') || source.textContent || source.value;
        }
        var mid = parseRangeLabelToMid(chosen);
        if (mid==null) mid = 30; // default per room if parsing fails
        rooms.push(mid);
      });
      return rooms;
    }
    // Strategy B: flat buttons labeled "Kamer 1", "Kamer 2" groups
    var groups = step2.querySelectorAll('fieldset, .btn-group, .choice-group');
    if (groups.length){
      groups.forEach(function(g){
        var chosen = null;
        var opts = g.querySelectorAll('button, a, label, input[type="radio"], input[type="checkbox"]');
        Array.prototype.forEach.call(opts, function(opt){
          if (isSelected(opt) && !chosen){
            chosen = opt.getAttribute('data-size') || opt.textContent || opt.value;
          }
        });
        if (chosen){
          var mid = parseRangeLabelToMid(chosen);
          rooms.push(mid==null?30:mid);
        }
      });
      if (rooms.length) return rooms;
    }
    // Strategy C: just read any selected range-like button
    var opts = step2.querySelectorAll('button, a, label, .btn');
    var picked = Array.prototype.filter.call(opts, function(o){
      return /(m2|m²|\d+\D+\d+)/i.test(o.textContent||'') && isSelected(o);
    });
    if (picked.length){
      picked.forEach(function(p){
        var mid = parseRangeLabelToMid(p.textContent||'');
        rooms.push(mid==null?30:mid);
      });
      return rooms;
    }
    return null;
  }

  // Public helper for the recommender
  window.khGetTotalAreaFromStep2 = function(){
    var arr = collectRoomSizes();
    if (!arr || !arr.length){
      // Fallback to a single room around 30m² if nothing is detected
      return 30;
    }
    return arr.reduce(function(a,b){ return a + (isNaN(b)?0:b); }, 0);
  };

  // Hook into step changes to pre-compute and render on step 3
  document.addEventListener('DOMContentLoaded', function(){
    var wrap = document.getElementById('khv2');
    function tryRender(){
      var step = (wrap && wrap.dataset && wrap.dataset.step) ? parseInt(wrap.dataset.step,10) : null;
      if (step===3 && typeof renderRecommendation==='function'){
        // Provide virtual values derived from step2
        var total = window.khGetTotalAreaFromStep2();
        var roomsCount = 1; // we don’t need exact count; recommender uses total m²
        // Ensure the recommendation card mounts
        var mount = document.getElementById('kh-reco');
        if (!mount){
          var step3 = document.querySelector('[data-kh-step="3"]') || document.querySelector('.kh-step.step-3') || document.body;
          mount = document.createElement('div'); mount.id='kh-reco'; mount.style.marginTop='16px';
          step3.appendChild(mount);
        }
        renderRecommendation();
      }
    }
    if (wrap){
      var mo = new MutationObserver(tryRender);
      mo.observe(wrap, {attributes:true, attributeFilter:['data-step']});
    }
    // Backstop: also attempt after any obvious "Next" click
    document.querySelectorAll('#kh-next, .kh-next, [data-kh-next]').forEach(function(btn){
      btn.addEventListener('click', function(){ setTimeout(tryRender, 120); });
    });
  });
})();

/* === Airflow+ KH v2: self-healing recommendation injector (debug id: AFP_RECO_V33B) === */
(function(){
  if (window.__AFP_RECO_V33B__) return; window.__AFP_RECO_V33B__ = true;
  try { console.log('[Airflow+] KH recommender loaded (AFP_RECO_V33B)'); } catch(e){}
  function parseRangeMid(txt){
    if (!txt) return null;
    txt = (''+txt).replace(/\s/g,'').replace('m²','').replace('m2','').replace(',', '.');
    var m = txt.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
    if (m){ var a=parseFloat(m[1]), b=parseFloat(m[2]); if(!isNaN(a)&&!isNaN(b)) return (a+b)/2; }
    var n = parseFloat(txt); return isNaN(n)?null:n;
  }
  function computeTotalM2(){
    try{
      var sizes = (window.state && state.sizes) || [];
      if (!sizes.length) return null;
      var mids = sizes.map(parseRangeMid).filter(function(x){ return typeof x==='number' && !isNaN(x); });
      if (!mids.length) return null;
      return mids.reduce(function(a,b){ return a+b; }, 0);
    }catch(e){ return null; }
  }
  function pick(){
    try{
      var rooms = (window.state && state.rooms) || 1;
      var total = computeTotalM2(); if (total==null) total = 30;
      var avg = total / Math.max(1, rooms);
      if (typeof pickVariantByArea !== 'function') return null;
      return { rec: pickVariantByArea(Math.max(1, rooms), avg, false), total: total };
    }catch(e){ return null; }
  }
  function ensureMount(){
    var host = document.querySelector('.khv2-card') || document.querySelector('[data-kh-step="3"]') || document.querySelector('#khv2');
    if (!host) return null;
    var mount = document.getElementById('kh-reco');
    if (!mount){
      mount = document.createElement('div');
      mount.id = 'kh-reco'; mount.className = 'kh-reco-mount'; mount.style.marginTop = '16px';
      host.appendChild(mount);
    }
    return mount;
  }
  function priceByBrand(b){
    if (b==='Daikin') return 'vanaf € 1.800 incl. materiaal en montage';
    if (b==='Panasonic') return 'vanaf € 1.600 incl. materiaal en montage';
    if (b==='Haier') return 'vanaf € 1.300 incl. materiaal en montage';
    return 'Prijs op aanvraag';
  }
  function renderOnce(){
    var wrap = document.getElementById('khv2');
    var step = wrap && wrap.getAttribute('data-step');
    if (step != '3') return;
    var target = ensureMount(); if (!target) return;
    var got = pick(); if (!got || !got.rec) return;
    var rec = got.rec, total = got.total;
    var urlBase = (typeof ROOT_BASE !== 'undefined' ? ROOT_BASE : '/airflowplus-site/');
    if (target.getAttribute('data-rendered') === (rec.slug||'')) return;
    target.setAttribute('data-rendered', rec.slug||'');
    target.innerHTML = ''
      + '<div class="kh-reco-card">'
      + '  <div class="kh-reco-main">'
      + '    <div class="kh-reco-body">'
      + '      <h3>'+ (rec.name||'Aanbevolen model') +'</h3>'
      + '      <div class="muted">'+ priceByBrand(rec.brand||'') +'</div>'
      + '      <a class="btn btn-green" style="margin-top:12px" href="'+ urlBase + (rec.slug||'') +'">Bekijk aanbeveling</a>'
      + '      <p class="muted" style="margin-top:8px">Op basis van ~'+ Math.round(total||30) +' m².</p>'
      + '    </div>'
      + '  </div>'
      + '</div>';
  }
  function startObserver(){
    var host = document.querySelector('#khv2') || document.body;
    var obs = new MutationObserver(function(){ try{ renderOnce(); }catch(e){} });
    obs.observe(host, {subtree:true, childList:true, attributes:true, attributeFilter:['data-step','class']});
    var ticks = 0, iv = setInterval(function(){ try{ renderOnce(); }catch(e){} if (++ticks>80) clearInterval(iv); }, 100);
  }
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ renderOnce(); startObserver(); }, 80);
    document.querySelectorAll('#kh-next,.kh-next,[data-kh-next]').forEach(function(btn){
      btn.addEventListener('click', function(){ setTimeout(renderOnce, 160); }, true);
    });
  });
})();