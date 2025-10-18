/* ======================================================================
   Airflow+ — Main JS (clean, de-duped, and organized)
   ----------------------------------------------------------------------
   Sections:
    01) Header/nav basics
    02) Quote form (simple Formspree handler)
    03) Sticky header glow
    04) Reviews carousel
    05) Savings calculator (single, clean implementation)
    06) FAQ deep-linking + persistence + schema
    07) Contact form (Formspree + inline feedback)
    08) Keuzehulp v2 (original 3-step wizard + redirect only on last step)
   ====================================================================== */

/* ----------------------------------------------------------------------
  01) Header/nav basics
---------------------------------------------------------------------- */
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

/* ----------------------------------------------------------------------
  02) Quote form (simple Formspree handler)
  - Form id: #quote-form
---------------------------------------------------------------------- */
(() => {
  const form = document.getElementById('quote-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        alert('Bedankt! We nemen snel contact op.');
        form.reset();
      } else {
        alert('Er ging iets mis. Probeer opnieuw of bel ons.');
      }
    } catch {
      alert('Netwerkfout. Controleer uw verbinding of bel ons.');
    }
  });
})();

/* ----------------------------------------------------------------------
  03) Sticky header glow on scroll
---------------------------------------------------------------------- */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ----------------------------------------------------------------------
  04) Reviews carousel (auto + arrows + drag)
  - Uses .rev-track as scroller
---------------------------------------------------------------------- */
(() => {
  const wrap = document.querySelector('[data-reviews]');
  if (!wrap) return;

  const viewport = wrap.querySelector('[data-viewport]');
  const track = wrap.querySelector('[data-track]');
  const prevBtn = wrap.querySelector('.rev-prev');
  const nextBtn = wrap.querySelector('.rev-next');
  const cards = track ? Array.from(track.querySelectorAll('.rev-card')) : [];
  if (!viewport || !track || cards.length === 0) return;

  const getGap = () => {
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    return isNaN(gap) ? 0 : gap;
  };
  const getStep = () => {
    const first = cards[0];
    return first ? first.getBoundingClientRect().width + getGap() : 0;
  };
  const maxScroll = () => track.scrollWidth - track.clientWidth;

  let timer = null;
  const stepOnce = () => {
    const step = getStep();
    if (!step) return;
    const max = maxScroll();
    const next = Math.min(track.scrollLeft + step, max);
    track.scrollTo({ left: next, behavior: 'smooth' });
    if (Math.abs(next - max) < 2) {
      setTimeout(() => track.scrollTo({ left: 0, behavior: 'smooth' }), 800);
    }
  };
  const startAuto = () => { stopAuto(); timer = setInterval(stepOnce, 3200); };
  const stopAuto  = () => { if (timer) clearInterval(timer); timer = null; };

  ['mouseenter', 'touchstart', 'focusin'].forEach(ev =>
    track.addEventListener(ev, stopAuto, { passive: true })
  );
  ['mouseleave', 'touchend', 'focusout'].forEach(ev =>
    track.addEventListener(ev, startAuto, { passive: true })
  );

  const jump = (dir) => {
    const step = getStep();
    if (!step) return;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  prevBtn?.addEventListener('click', () => jump(-1));
  nextBtn?.addEventListener('click', () => jump(1));

  // Drag-to-scroll (mouse)
  let isDown = false, startX = 0, startLeft = 0;
  track.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX;
    startLeft = track.scrollLeft;
    track.classList.add('dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const dx = e.pageX - startX;
    track.scrollLeft = startLeft - dx;
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  // Drag-to-scroll (touch)
  let tStartX = 0, tStartLeft = 0;
  track.addEventListener('touchstart', (e) => {
    const t = e.touches?.[0]; if (!t) return;
    tStartX = t.pageX; tStartLeft = track.scrollLeft;
  }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    const t = e.touches?.[0]; if (!t) return;
    const dx = t.pageX - tStartX;
    track.scrollLeft = tStartLeft - dx;
  }, { passive: true });

  // Keyboard
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); jump(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); jump(1); }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startAuto, 150);
  });

  startAuto();
})();

/* ----------------------------------------------------------------------
  05) Savings calculator (single implementation)
  - Section: #savings
  - Elements: #save-bill, #save-bill-input, #save-profile, .save-systems .chip
  - Adds: € bubble, tick labels, “annual” line, tooltip “i”
---------------------------------------------------------------------- */
(() => {
  const root = document.querySelector('#savings');
  if (!root) return;

  const billRange   = root.querySelector('#save-bill');
  const billInput   = root.querySelector('#save-bill-input');
  const profileSel  = root.querySelector('#save-profile');
  const sysButtons  = [...root.querySelectorAll('.save-systems .chip')];
  const outAmount   = root.querySelector('#save-amount');
  const outRate     = root.querySelector('#save-rate');
  const resultBox   = root.querySelector('.save-result');
  const wrap        = root.querySelector('.save-bill-wrap');

  // Inject bubble
  let bubble = document.createElement('div');
  bubble.className = 'save-bubble';
  wrap.style.position = 'relative';
  wrap.appendChild(bubble);

  // Inject ticks (min/mid/max)
  let ticks = document.createElement('div');
  ticks.className = 'save-ticks';
  wrap.insertAdjacentElement('afterend', ticks);

  // Annual line (inside result)
  let annual = document.createElement('div');
  annual.className = 'save-annual';
  resultBox?.appendChild(annual);

  // Tooltip “i”
  const tipWrap = document.createElement('span');
  tipWrap.className = 'save-tip-wrap';
  const tipBtn = document.createElement('button');
  tipBtn.className = 'save-tip'; tipBtn.type = 'button'; tipBtn.textContent = 'i';
  tipBtn.setAttribute('aria-label', 'Uitleg besparing');
  const tipBubble = document.createElement('div');
  tipBubble.className = 'save-tip-bubble';
  tipBubble.innerHTML = `
    <h5>Hoe we dit schatten</h5>
    <p id="save-tip-body">Indicatieve schatting op basis van gemiddelde profielen.</p>
    <p class="muted">Indicatie, geen offerte. Werkelijk verbruik en tarieven kunnen variëren.</p>
  `;
  tipWrap.appendChild(tipBtn);
  tipWrap.appendChild(tipBubble);
  resultBox?.appendChild(tipWrap);
  tipBtn.addEventListener('click', (e) => { e.stopPropagation(); tipWrap.classList.toggle('is-open'); });
  document.addEventListener('click', () => tipWrap.classList.remove('is-open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tipWrap.classList.remove('is-open'); });

  const fmtEUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtINT = new Intl.NumberFormat('nl-NL');

  const RATES = {
    split: { cooling: 0.18, mixed: 0.14, heating: 0.06 },
    multi: { cooling: 0.22, mixed: 0.18, heating: 0.10 },
    hp:    { cooling: 0.20, mixed: 0.28, heating: 0.40 }
  };
  const TIP = {
    split: {
      cooling: 'Single-split: koelen ~18% besparing bij regelmatig koelen.',
      mixed:   'Single-split: gemengd gebruik ~14% besparing.',
      heating: 'Single-split als bijverwarming: ~6% besparing.'
    },
    multi: {
      cooling: 'Multi-split: meer ruimtes efficiënt koelen → ~22% besparing.',
      mixed:   'Multi-split gemengd gebruik: ~18% besparing.',
      heating: 'Multi-split als (bij)verwarming: ~10% besparing.'
    },
    hp: {
      cooling: 'Warmtepomp-airco focus op koelen: ~20% besparing.',
      mixed:   'Warmtepomp-airco gemengd: ~28% besparing.',
      heating: 'Warmtepomp-airco als hoofdverwarming: ~40% besparing.'
    }
  };

  let system  = sysButtons.find(b => b.classList.contains('active'))?.dataset.system || 'split';
  let profile = profileSel?.value || 'mixed';

  // Sync controls
  const clamp = (v) => {
    const min = +billRange.min || 50, max = +billRange.max || 600, step = +billRange.step || 5;
    v = Math.round((+v || min) / step) * step;
    return Math.min(max, Math.max(min, v));
  };
  const syncFromRange = () => { billInput.value = billRange.value; calc(); };
  const syncFromInput = () => {
    const v = clamp(billInput.value);
    billRange.value = String(v); billInput.value = String(v); calc();
  };

  billRange?.addEventListener('input', syncFromRange);
  billInput?.addEventListener('input', syncFromInput);
  profileSel?.addEventListener('change', e => { profile = e.target.value; calc(); });
  sysButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sysButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      system = btn.dataset.system || 'split';
      calc();
    });
  });

  const positionBubble = () => {
    const min = +billRange.min || 50, max = +billRange.max || 600;
    const v = +billRange.value || min;
    const pct = (v - min) / (max - min);
    const trackRect = billRange.getBoundingClientRect();
    const wrapRect  = wrap.getBoundingClientRect();
    const bubbleW   = bubble.offsetWidth || 48;
    const half      = bubbleW / 2;
    const x = pct * trackRect.width;
    const clamped = Math.min(trackRect.width - half, Math.max(half, x));
    const left = (trackRect.left - wrapRect.left) + clamped;
    bubble.style.left = `${left}px`;
    bubble.textContent = fmtEUR.format(v);
  };

  const writeTicks = () => {
    const min = +billRange.min || 50, max = +billRange.max || 600, step = +billRange.step || 5;
    const mid = Math.round(((min + max) / 2) / step) * step;
    ticks.innerHTML = `
      <span>€${min.toLocaleString('nl-NL')}</span>
      <span>€${mid.toLocaleString('nl-NL')}</span>
      <span>€${max.toLocaleString('nl-NL')}</span>`;
    // match width to slider track
    const rect = billRange.getBoundingClientRect();
    ticks.style.width = rect.width + 'px';
  };

  const updateTip = () => {
    const el = tipBubble.querySelector('#save-tip-body');
    el.textContent = TIP[system]?.[profile] || 'Indicatieve schatting.';
  };

  function calc() {
    const bill = clamp(billInput.value || billRange.value || 0);
    const rate = (RATES[system] && RATES[system][profile]) ? RATES[system][profile] : 0.15;
    const saving = Math.round(bill * rate);
    const annualSaving = saving * 12;

    outAmount.textContent = fmtINT.format(saving);
    outRate.textContent = Math.round(rate * 100);
    annual.innerHTML = `Indicatie per jaar: <strong>${fmtEUR.format(annualSaving)}</strong>`;

    positionBubble();
    updateTip();
  }

  // Init
  billInput.value = clamp(billInput.value || billRange.value || 180);
  billRange.value = String(billInput.value);
  writeTicks();
  calc();

  window.addEventListener('resize', () => {
    writeTicks();
    positionBubble();
  });
})();

/* ----------------------------------------------------------------------
  06) FAQ deep-linking + persistence + schema
---------------------------------------------------------------------- */
(() => {
  const faq = document.querySelector('.faq');
  if (!faq) return;

  const items = Array.from(faq.querySelectorAll('details[id]'));
  const KEY = 'airflow_faq_open';

  // Open from URL hash
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el && el.tagName === 'DETAILS') el.open = true;
  }

  // Restore last open item if no hash present
  const last = localStorage.getItem(KEY);
  if (!location.hash && last) {
    const el = document.getElementById(last);
    if (el) el.open = true;
  }

  // Persist and update location hash
  items.forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        localStorage.setItem(KEY, d.id);
        history.replaceState(null, '', '#' + d.id);
      }
    });
  });

  // Minimal schema injection
  const qa = items.map(d => {
    const q = d.querySelector('summary')?.textContent?.trim() || '';
    const a = d.querySelector('summary + *')?.textContent?.trim() || '';
    return { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } };
  });
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context':'https://schema.org', '@type':'FAQPage', mainEntity: qa });
  document.head.appendChild(script);
})();

/* ----------------------------------------------------------------------
  07) Contact form (Formspree + inline feedback)
  - Form id: #contact-form
---------------------------------------------------------------------- */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusBox = form.querySelector('.form-status');
  const setErr = (key, msg) => {
    const slot = form.querySelector(`[data-err="${key}"]`);
    if (slot) slot.textContent = msg || '';
  };
  const clearErrs = () => form.querySelectorAll('.error').forEach(e => e.textContent = '');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = v => !v || /^[0-9+()\-\s]{6,}$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrs();
    statusBox.textContent = '';

    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();
    const consent = form.querySelector('#cf-consent')?.checked;

    let ok = true;
    if (!name)            { setErr('name', 'Vul je naam in.'); ok = false; }
    if (!isEmail(email))  { setErr('email', 'Vul een geldig e-mailadres in.'); ok = false; }
    if (!isPhone(phone))  { setErr('phone', 'Vul een geldig telefoonnummer in.'); ok = false; }
    if (!message)         { setErr('message', 'Schrijf kort je vraag/aanvraag.'); ok = false; }
    if (!consent)         { setErr('consent', 'Vink deze aan om te kunnen versturen.'); ok = false; }
    if (!ok) return;

    try {
      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' }});
      if (!res.ok) throw new Error('HTTP ' + res.status);

      form.reset();
      form.classList.add('is-sent');
      statusBox.innerHTML = `
        <div class="success-card">
          <h3>Bedankt! 🎉</h3>
          <p>We hebben je bericht ontvangen en nemen snel contact op.</p>
        </div>`;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      statusBox.innerHTML = `
        <div class="error-card">
          <strong>Er ging iets mis.</strong> Probeer het opnieuw of bel ons even.
        </div>`;
    }
  });
})();

/* ----------------------------------------------------------------------
  08) Keuzehulp v2 — original 3-step wizard (robust advance)
---------------------------------------------------------------------- */
(() => {
  const card  = document.querySelector('.khv2-card');
  const btnEl = document.getElementById('kh-next');
  const dots  = Array.from(document.querySelectorAll('.khv2-steps .dot'));
  if (!card || !btnEl || dots.length === 0) return;

  // Replace button to clear any old listeners
  const nextBtn = btnEl.cloneNode(true);
  btnEl.replaceWith(nextBtn);

  // Ensure a body container
  let body = card.querySelector('.khv2-body');
  const actions = card.querySelector('.khv2-actions');
  if (!body) {
    body = document.createElement('div');
    body.className = 'khv2-body';
    card.insertBefore(body, actions || null);
  }

  // Remove any stray static step-1 blocks sitting directly in the card
  card.querySelectorAll(':scope > .khv2-q, :scope > .kh-grid-rooms, :scope > .kh-size-grid, :scope > #khv2-summary')
      .forEach(n => n.remove());

  const state = { step: 1, rooms: 0, sizes: [] };

  const setDot   = (n) => dots.forEach((d,i)=>d.classList.toggle('is-active', i===n-1));
  const complete = () => (
    state.step === 1 ? state.rooms > 0 :
    state.step === 2 ? (state.sizes.length === state.rooms && state.sizes.every(Boolean)) :
    true
  );
  const syncNext = () => { nextBtn.disabled = !complete(); nextBtn.textContent = (state.step === 3) ? 'Afronden →' : 'Volgende →'; };

  const SIZE_OPTS = [
    { val:'1-30',  label:'1–30 m²' },
    { val:'30-40', label:'30–40 m²' },
    { val:'40-50', label:'40–50 m²' },
  ];
  const roomCard = (i) => `
    <div class="khv2-room-card" data-room="${i}">
      <h4>Kamer ${i}</h4>
      <div class="khv2-sizes">
        ${SIZE_OPTS.map(p => `
          <label class="kh-pill">
            <input type="radio" name="room-${i}-size" value="${p.val}" hidden>
            <span>${p.label}</span>
          </label>`).join('')}
      </div>
    </div>`;

  // ---------- RENDERERS ----------
  function renderStep1(){
    state.step = 1; setDot(1);
    body.innerHTML = `
      <h2 class="khv2-q">In hoeveel ruimtes wil je airco?</h2>
      <div class="kh-grid-rooms" style="justify-content:center; grid-template-columns:repeat(4,72px); gap:14px;">
        ${[1,2,3,4].map(n => `
          <label class="chip round">
            <input type="radio" name="rooms" value="${n}">
            <span>${n}</span>
          </label>`).join('')}
      </div>`;

    // Enable button immediately


  function renderStep2(){
    state.step = 2; setDot(2);
    state.sizes = new Array(state.rooms).fill(null);
    body.innerHTML = `
      <h2 class="khv2-q">Hoe groot zijn de ruimtes?</h2>
      <p class="kh-sub">Kies de oppervlakte per kamer. Dit helpt ons het juiste vermogen te adviseren.</p>
      <div class="kh-size-grid">
        ${Array.from({length: state.rooms}, (_,i)=>roomCard(i+1)).join('')}
      </div>`;
    body.addEventListener('change', onSizeChange);
    syncNext();
  }

  function renderStep3(){
    state.step = 3; setDot(3);
    const list = state.sizes.map((sz,i)=>`<li>Kamer ${i+1}: <strong>${sz.replace('-', '–')} m²</strong></li>`).join('');
    body.innerHTML = `
      <h2 class="khv2-q">Overzicht</h2>
      <p class="kh-sub">Op basis van jouw keuzes stellen we een advies op maat samen.</p>
      <div id="khv2-summary" class="kh-result">
        <h3>Je keuzes</h3>
        <ul class="kh-out">${list}</ul>
        <p class="muted">Klaar? Ga door voor een vrijblijvende offerte.</p>
      </div>`;
    syncNext();
  }

  // ------- Handlers -------
  function onRoomsChange(e){
    const input = e.target;
    if (input?.name !== 'rooms') return;
    state.rooms = parseInt(input.value, 10) || 0;
    syncNext();
    body.addEventListener('change', onRoomsChange, { once:true });
  }

  function onSizeChange(e){
    const input = e.target;
    if (!input || input.type !== 'radio') return;
    const m = input.name.match(/^room-(\d+)-size$/);
    if (!m) return;
    const idx = parseInt(m[1], 10) - 1;
    if (idx < 0 || idx >= state.sizes.length) return;

    state.sizes[idx] = input.value;

    const cardEl = input.closest('.khv2-room-card');
    if (cardEl) {
      cardEl.querySelectorAll('.kh-pill').forEach(l => l.classList.remove('active'));
      input.closest('.kh-pill')?.classList.add('active');
    }
    syncNext();
  }

  // Dots: allow back/forward only when data for target step exists
  document.addEventListener('click', (e) => {
    const dot = e.target.closest('.khv2-steps .dot');
    if (!dot) return;
    const i = dots.indexOf(dot) + 1; // 1-based
    if (i === 1) return renderStep1();
    if (i === 2 && state.rooms > 0) return renderStep2();
    if (i === 3 && state.rooms > 0 && state.sizes.length === state.rooms && state.sizes.every(Boolean)) return renderStep3();
  });

  // Next button: advance, or redirect on last step
  newNext.addEventListener('click', (e) => {
    e.preventDefault();
    if (!canAdvance()) return;
    if (state.step === 1) return renderStep2();
    if (state.step === 2) return renderStep3();
    // step 3 -> quote page
    window.location.href = newNext.getAttribute('data-final-href') || 'contact.html#offerte';
  });

  // Optional close (×)
  const closeBtn = document.querySelector('.khv2-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.location.href = 'index.html'; });
  }

  // ------- Init -------
  newNext.disabled = true;
  renderStep1();
})();


  // Renderers
  const renderStep1 = () => {
    state.step = 1; setDot(1);
    body.innerHTML = `
      <h2 class="khv2-q">In hoeveel ruimtes wil je airco?</h2>
      <div class="kh-grid-rooms" style="justify-content:center; grid-template-columns: repeat(4, 72px); gap:14px;">
        ${[1,2,3,4].map(n => `
          <label class="chip round">
            <input type="radio" name="rooms" value="${n}">
            <span>${n}</span>
          </label>`).join('')}
      </div>`;
    body.addEventListener('change', onRoomsChange, { once: true });
    syncNextDisabled();
    newNext.textContent = 'Volgende →';
  };

  const renderStep2 = () => {
    state.step = 2; setDot(2);
    state.sizes = new Array(state.rooms).fill(null);
    body.innerHTML = `
      <h2 class="khv2-q">Hoe groot zijn de ruimtes?</h2>
      <p class="kh-sub">Kies de oppervlakte per kamer. Dit helpt ons het juiste vermogen te adviseren.</p>
      <div class="kh-size-grid">
        ${Array.from({ length: state.rooms }, (_, i) => roomCard(i + 1)).join('')}
      </div>`;
    body.addEventListener('change', onSizeChange);
    syncNextDisabled();
    newNext.textContent = 'Volgende →';
  };

  const renderStep3 = () => {
    state.step = 3; setDot(3);
    const list = state.sizes.map((sz, i) => `<li>Kamer ${i+1}: <strong>${sz.replace('-', '–')} m²</strong></li>`).join('');
    body.innerHTML = `
      <h2 class="khv2-q">Overzicht</h2>
      <p class="kh-sub">Op basis van jouw keuzes stellen we een advies op maat samen.</p>
      <div id="khv2-summary" class="kh-result">
        <h3>Je keuzes</h3>
        <ul class="kh-out">${list}</ul>
        <p class="muted">Klaar? Ga door voor een vrijblijvende offerte.</p>
      </div>`;
    syncNextDisabled();         // enabled here
    newNext.textContent = 'Afronden →';
  };

  // Handlers
  const onRoomsChange = (e) => {
    const input = e.target;
    if (input?.name !== 'rooms') return;
    state.rooms = parseInt(input.value, 10) || 0;
    syncNextDisabled();
    body.addEventListener('change', onRoomsChange, { once: true });
  };

  const onSizeChange = (e) => {
    const input = e.target;
    if (!input || input.type !== 'radio') return;
    if (!input.name.startsWith('room-') || !input.name.endsWith('-size')) return;
    const roomIdx = parseInt(input.name.split('-')[1], 10);
    if (Number.isFinite(roomIdx) && roomIdx >= 1 && roomIdx <= state.rooms) {
      state.sizes[roomIdx - 1] = input.value;
      const cardEl = input.closest('.khv2-room-card');
      if (cardEl) {
        cardEl.querySelectorAll('.kh-pill').forEach(l => l.classList.remove('active'));
        input.closest('.kh-pill')?.classList.add('active');
      }
      syncNextDisabled();
    }
  };

  // Dots click
  document.addEventListener('click', (e) => {
    const dot = e.target.closest('.khv2-steps .dot');
    if (!dot) return;
    const idx = dots.indexOf(dot); // 0-based
    if (idx === 0) renderStep1();
    if (idx === 1) renderStep2();
    if (idx === 2) renderStep3();
  });

  // Next button flow — ONLY redirect on last step
  newNext.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isComplete()) return;

    if (state.step === 1) { renderStep2(); return; }
    if (state.step === 2) { renderStep3(); return; }
    if (state.step === 3) {
      window.location.href = 'contact.html#offerte'; // final redirect
    }
  });

  // Optional close (×)
  const closeBtn = document.querySelector('.khv2-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.location.href = 'index.html'; });
  }

  // Init
  renderStep1();
})();

