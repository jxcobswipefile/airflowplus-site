
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
