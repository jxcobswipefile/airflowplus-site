
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
