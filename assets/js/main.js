
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav){
  toggle.addEventListener('click', ()=>{
    nav.style.display = nav.style.display === 'block' ? '' : 'block';
  });
}
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
const form = document.getElementById('quote-form');
if (form){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    try {
      const res = await fetch(form.action, { method:'POST', body: data, headers:{'Accept':'application/json'}});
      if (res.ok){ alert('Bedankt! We nemen snel contact op.'); form.reset(); }
      else { alert('Er ging iets mis. Probeer opnieuw of bel ons.'); }
    } catch (err){
      alert('Netwerkfout. Controleer uw verbinding of bel ons.');
    }
  });
}
// --- Keuzehulp v2 (rooms -> dynamic sizes -> result) ---
(function(){
  const form = document.getElementById('keuzehulp-form');
  if(!form) return;

  const stepRooms = document.getElementById('kh-step-rooms');
  const stepSizes = document.getElementById('kh-step-sizes');
  const sizeGrid  = document.getElementById('kh-size-grid');
  const stepBadge = document.querySelector('[data-kh-step]');
  const resultBox = document.getElementById('kh-result');

  let roomCount = 0;
  const sizeChoices = {}; // {1:'1-30', 2:'30-40', ...}

  function toStep(n){
    stepBadge.textContent = n;
    if (n === 1){
      stepRooms.hidden = false;
      stepSizes.hidden = true;
      resultBox.hidden = true;
    } else {
      stepRooms.hidden = true;
      stepSizes.hidden = false;
      resultBox.hidden = true;
    }
  }

  // Build size blocks for N rooms
  function renderSizeBlocks(n){
    sizeGrid.innerHTML = '';
    for (let i=1;i<=n;i++){
      const wrap = document.createElement('div');
      wrap.className = 'kh-room';
      wrap.setAttribute('data-room', String(i));
      wrap.innerHTML = `
        <h4>Kamer ${i}</h4>
        <div class="kh-size-row">
          <button type="button" class="kh-pill" data-size="1-30">1 tot 30 m²</button>
          <button type="button" class="kh-pill" data-size="30-40">30 tot 40 m²</button>
          <button type="button" class="kh-pill" data-size="40-50">40 tot 50 m²</button>
        </div>`;
      sizeGrid.appendChild(wrap);
    }
  }

  // Step 1 -> Step 2
  form.addEventListener('click', (e)=>{
    const nextBtn = e.target.closest('[data-kh-next]');
    const prevBtn = e.target.closest('[data-kh-prev]');
    if (nextBtn){
      const picked = form.querySelector('input[name="rooms"]:checked');
      if(!picked){ alert('Kies het aantal kamers.'); return; }
      roomCount = Number(picked.value);
      renderSizeBlocks(roomCount);
      Object.keys(sizeChoices).forEach(k=>delete sizeChoices[k]); // reset
      toStep(2);
      return;
    }
    if (prevBtn){
      toStep(1);
      return;
    }
  });

  // Select size per room (toggle active)
  sizeGrid.addEventListener('click', (e)=>{
    const pill = e.target.closest('.kh-pill');
    if(!pill) return;
    const size = pill.getAttribute('data-size');
    const room = pill.closest('.kh-room').getAttribute('data-room');
    // clear siblings
    pill.parentElement.querySelectorAll('.kh-pill').forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    sizeChoices[room] = size;
  });

  // Submit -> compute result
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // ensure all chosen
    for (let i=1;i<=roomCount;i++){
      if(!sizeChoices[i]){ alert(`Kies de oppervlakte voor kamer ${i}.`); return; }
    }

    // Convert size buckets to kW per room (typical splits)
    const bucketToKW = (bucket)=>{
      if (bucket === '1-30')  return 2.5;
      if (bucket === '30-40') return 3.5;
      return 5.0; // 40-50
    };
    let totalKW = 0;
    for (let i=1;i<=roomCount;i++) totalKW += bucketToKW(sizeChoices[i]);

    // Round to 0.1
    totalKW = Math.round(totalKW * 10) / 10;

    // Proposal
    let voorstel = 'Single-split';
    if (roomCount >= 2) voorstel = `Multi-split (${roomCount} binnendelen)`;

    // Output
    resultBox.querySelector('[data-kh="rooms"]').textContent = roomCount;
    resultBox.querySelector('[data-kh="kw"]').textContent     = totalKW.toFixed(1);
    resultBox.querySelector('[data-kh="voorstel"]').textContent = voorstel;
    resultBox.hidden = false;
    resultBox.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();

/* ================================
   Sticky header glow on scroll
==================================*/
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ================================================
   Reviews carousel (auto + arrows + drag) — FIXED
   Uses .rev-track as the scroller (matches your CSS)
===================================================*/
(function () {
  const wrap = document.querySelector('[data-reviews]');
  if (!wrap) return;

  const viewport = wrap.querySelector('[data-viewport]');
  const track = wrap.querySelector('[data-track]'); // <-- SCROLLER
  const prevBtn = wrap.querySelector('.rev-prev');
  const nextBtn = wrap.querySelector('.rev-next');
  const cards = track ? Array.from(track.querySelectorAll('.rev-card')) : [];

  if (!viewport || !track || cards.length === 0) return;

  // Helper: gap between cards
  const getGap = () => {
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    return isNaN(gap) ? 0 : gap;
  };

  // Step size = one card + gap
  const getStep = () => {
    const first = cards[0];
    if (!first) return 0;
    return first.getBoundingClientRect().width + getGap();
  };

  const maxScroll = () => track.scrollWidth - track.clientWidth;

  // Auto-advance
  let intervalMs = 3200;
  let timer = null;

  const stepOnce = () => {
    const step = getStep();
    if (step <= 0) return;
    const max = maxScroll();
    const next = Math.min(track.scrollLeft + step, max);

    track.scrollTo({ left: next, behavior: 'smooth' });

    // Wrap to start when we hit the end
    if (Math.abs(next - max) < 2) {
      setTimeout(() => track.scrollTo({ left: 0, behavior: 'smooth' }), 800);
    }
  };

  const startAuto = () => { stopAuto(); timer = setInterval(stepOnce, intervalMs); };
  const stopAuto  = () => { if (timer) { clearInterval(timer); timer = null; } };

  // Pause/resume on interaction
  ['mouseenter', 'touchstart', 'focusin'].forEach((ev) =>
    track.addEventListener(ev, stopAuto, { passive: true })
  );
  ['mouseleave', 'touchend', 'focusout'].forEach((ev) =>
    track.addEventListener(ev, startAuto, { passive: true })
  );

  // Arrows
  const jump = (dir) => {
    const step = getStep();
    if (step <= 0) return;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  if (prevBtn) prevBtn.addEventListener('click', () => jump(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => jump(1));

  // Drag-to-scroll (mouse)
  let isDown = false, startX = 0, startLeft = 0;
  const onMouseDown = (e) => {
    isDown = true;
    startX = e.pageX;
    startLeft = track.scrollLeft;
    track.classList.add('dragging');
  };
  const onMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const dx = e.pageX - startX;
    track.scrollLeft = startLeft - dx;
  };
  const onMouseUp = () => {
    isDown = false;
    track.classList.remove('dragging');
  };
  track.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Drag-to-scroll (touch)
  let tStartX = 0, tStartLeft = 0;
  const onTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    tStartX = t.pageX;
    tStartLeft = track.scrollLeft;
  };
  const onTouchMove = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.pageX - tStartX;
    track.scrollLeft = tStartLeft - dx;
  };
  track.addEventListener('touchstart', onTouchStart, { passive: true });
  track.addEventListener('touchmove', onTouchMove, { passive: true });

  // Keyboard support
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); jump(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); jump(1); }
  });

  // Recalc on resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startAuto, 150);
  });

  // Go!
  startAuto();
})();

(() => {
  // Guard if the section isn't on this page yet
  const root = document.querySelector('#savings');
  if (!root) return;

  // Baseline saving rates (fraction of current monthly bill).
  // Conservative/realistic, tweak any time.
  const RATES = {
    split: {     // split airco
      cooling: 0.18,  // mainly cooling
      mixed:   0.14,  // 50/50
      heating: 0.06   // mostly heating (less impact vs gas/radiators)
    },
    multi: {     // multi-split
      cooling: 0.22,
      mixed:   0.18,
      heating: 0.10
    },
    hp: {        // warmtepomp airco (lucht-lucht) met goede COP
      cooling: 0.20,
      mixed:   0.28,
      heating: 0.40   // grootste winst bij verwarmen
    }
  };

  const billRange   = root.querySelector('#save-bill');
  const billInput   = root.querySelector('#save-bill-input');
  const profileSel  = root.querySelector('#save-profile');
  const sysButtons  = [...root.querySelectorAll('.save-systems .chip')];
  const outAmount   = root.querySelector('#save-amount');
  const outRate     = root.querySelector('#save-rate');

  let system = 'split';   // default
  let profile = profileSel?.value || 'mixed';

  // Sync range <-> number
  const syncFromRange = () => { billInput.value = billRange.value; calc(); };
  const syncFromInput = () => {
    const val = Math.max(0, Number(billInput.value || 0));
    billRange.value = String(Math.min(Math.max(val, billRange.min), billRange.max));
    calc();
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

  function calc(){
    const bill = Number(billInput.value || billRange.value || 0);
    const rate = (RATES[system] && RATES[system][profile]) ? RATES[system][profile] : 0.15;
    const saving = Math.round(bill * rate);

    outAmount.textContent = saving.toLocaleString('nl-NL');
    outRate.textContent = Math.round(rate * 100);
  }

  // Initial run
  syncFromRange();
})();

(() => {
  // ---- SELECTORS (adjust here if your HTML differs) ----
  const STEP_SEL = '.khv2-step';
  const BTN_NEXT_SEL = '.khv2-next';
  const BTN_PREV_SEL = '.khv2-prev';
  const ROOMS_INPUT_SEL = 'input[name="rooms"]'; // step 1 radios
  const ROOMS_WRAP_ID = '#khv2-rooms-wrap';      // step 2 mount point
  const SUMMARY_ID = '#khv2-summary';            // step 3 mount point

  // Bail if we’re not on the keuzehulp page
  const steps = Array.from(document.querySelectorAll(STEP_SEL));
  if (!steps.length) return;

  // ---- STATE ----
  const state = {
    step: 1,
    rooms: 0,
    sizes: [] // e.g. ["1-30", "30-40", ...]
  };

  // ---- HELPERS ----
  const getStepEl = (n) => steps.find(s => String(s.dataset.step) === String(n));
  const setActiveStep = (n) => {
    steps.forEach(s => s.classList.toggle('is-active', String(s.dataset.step) === String(n)));
    state.step = n;
    syncNextButton();
  };

  const currentStepComplete = () => {
    if (state.step === 1) {
      const checked = document.querySelector(`${ROOMS_INPUT_SEL}:checked`);
      return !!checked;
    }
    if (state.step === 2) {
      return state.sizes.length === state.rooms && state.sizes.every(Boolean);
    }
    return true;
  };

  const syncNextButton = () => {
    const nextBtn = document.querySelector(BTN_NEXT_SEL);
    if (!nextBtn) return;
    nextBtn.disabled = !currentStepComplete();
  };

  // Build one room card (step 2)
  const sizePills = [
    { val: '1-30', label: '1–30 m²' },
    { val: '30-40', label: '30–40 m²' },
    { val: '40-50', label: '40–50 m²' }
  ];

  const roomCardHTML = (idx) => {
    const roomName = `room-${idx}-size`;
    return `
      <div class="khv2-room-card" data-room="${idx}">
        <h4>Kamer ${idx}</h4>
        <div class="khv2-sizes">
          ${sizePills.map(p => `
            <label class="kh-pill">
              <input type="radio" name="${roomName}" value="${p.val}" hidden />
              <span>${p.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderRooms = (roomsCount) => {
    const mount = document.querySelector(ROOMS_WRAP_ID);
    if (!mount) return;
    mount.innerHTML = '';
    state.sizes = new Array(roomsCount).fill(null);

    const grid = document.createElement('div');
    grid.className = 'kh-size-grid';
    for (let i = 1; i <= roomsCount; i++) {
      grid.insertAdjacentHTML('beforeend', roomCardHTML(i));
    }
    mount.appendChild(grid);

    // Enable pill selection + state updates
    mount.addEventListener('change', (e) => {
      const input = e.target;
      if (input && input.name && input.name.startsWith('room-') && input.type === 'radio') {
        const roomIdx = parseInt(input.name.split('-')[1], 10); // room-X-size
        state.sizes[roomIdx - 1] = input.value;

        // Visual "active" state
        const card = input.closest('.khv2-room-card');
        if (card) {
          card.querySelectorAll('.kh-pill').forEach(l => l.classList.remove('active'));
          input.closest('.kh-pill')?.classList.add('active');
        }
        syncNextButton();
      }
    }, { once: false });
  };

  const renderSummary = () => {
    const mount = document.querySelector(SUMMARY_ID);
    if (!mount) return;
    const list = state.sizes.map((sz, i) => `<li>Kamer ${i+1}: <strong>${sz.replace('-', '–')} m²</strong></li>`).join('');
    mount.innerHTML = `
      <h3>Jouw keuze</h3>
      <ul class="kh-out">${list}</ul>
      <p class="muted">We gebruiken dit om een passend advies te geven.</p>
    `;
  };

  // ---- WIRING: step 1 (room count) ----
  document.addEventListener('change', (e) => {
    const roomsChecked = e.target?.matches?.(`${ROOMS_INPUT_SEL}`);
    if (!roomsChecked) return;
    const checked = document.querySelector(`${ROOMS_INPUT_SEL}:checked`);
    state.rooms = checked ? parseInt(checked.value, 10) : 0;
    syncNextButton();
  });

  // ---- NEXT / PREV ----
  document.addEventListener('click', (e) => {
    const nextBtn = e.target.closest(BTN_NEXT_SEL);
    const prevBtn = e.target.closest(BTN_PREV_SEL);

    if (nextBtn) {
      e.preventDefault();
      if (!currentStepComplete()) return;

      if (state.step === 1) {
        // prepare step 2
        renderRooms(state.rooms);
        setActiveStep(2);
        return;
      }

      if (state.step === 2) {
        // prepare step 3
        renderSummary();
        setActiveStep(3);
        return;
      }

      // step 3 could submit or go to contact; do nothing here
      return;
    }

    if (prevBtn) {
      e.preventDefault();
      if (state.step > 1) setActiveStep(state.step - 1);
      return;
    }
  });

  // Kick things off
  setActiveStep(1);
})();
