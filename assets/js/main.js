
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
// Run only on keuzehulp page with the v2 card present
const card = document.querySelector('.khv2-card');
const nextBtn = document.querySelector('#kh-next');
const dots = Array.from(document.querySelectorAll('.khv2-steps .dot'));

if (!card || !nextBtn) return;

// --- Create/normalize a body container we can re-render into ---
let body = card.querySelector('.khv2-body');
const actions = card.querySelector('.khv2-actions');

if (!body) {
body = document.createElement('div');
body.className = 'khv2-body';

// Move current “h2 + room radios grid” into the body so we don’t lose your initial markup
// (We’ll reconstruct Step 1 exactly, then overwrite for Step 2/3 when needed.)
const h2 = card.querySelector('h2.khv2-q');
const grid = card.querySelector('.kh-grid-rooms');
if (h2) body.appendChild(h2);
if (grid) body.appendChild(grid);

// Insert body right before actions
card.insertBefore(body, actions);
}

// ---------- State ----------
const state = {
step: 1,
rooms: 0,
sizes: [] // e.g. ['1-30', '30-40', ...]
};

// ---------- Helpers ----------
const setDot = (n) => {
dots.forEach((d, i) => d.classList.toggle('is-active', i === (n - 1)));
};

const isStepComplete = () => {
if (state.step === 1) {
return state.rooms > 0;
}
if (state.step === 2) {
return state.sizes.length === state.rooms && state.sizes.every(Boolean);
}
return true;
};

const syncNextDisabled = () => {
nextBtn.disabled = !isStepComplete();
};

// ---------- Step renderers ----------
const renderStep1 = () => {
state.step = 1;
setDot(1);

body.innerHTML = `
     <h2 class="khv2-q">In hoeveel ruimtes wil je airco?</h2>
     <div class="kh-grid-rooms" style="justify-content:center; grid-template-columns: repeat(4, 72px); gap:14px;">
       ${[1,2,3,4].map(n => `
         <label class="chip round">
           <input type="radio" name="rooms" value="${n}">
           <span>${n}</span>
         </label>
       `).join('')}
     </div>
   `;

body.addEventListener('change', onRoomsChange, { once: true });
syncNextDisabled();
};

const sizeOptions = [
{ val: '1-30',  label: '1–30 m²' },
{ val: '30-40', label: '30–40 m²' },
{ val: '40-50', label: '40–50 m²' },
];

const renderRoomCard = (idx) => `
   <div class="khv2-room-card" data-room="${idx}">
     <h4>Kamer ${idx}</h4>
     <div class="khv2-sizes">
       ${sizeOptions.map(p => `
         <label class="kh-pill">
           <input type="radio" name="room-${idx}-size" value="${p.val}" hidden>
           <span>${p.label}</span>
         </label>
       `).join('')}
     </div>
   </div>
 `;

const renderStep2 = () => {
state.step = 2;
setDot(2);

state.sizes = new Array(state.rooms).fill(null);

body.innerHTML = `
     <h2 class="khv2-q">Hoe groot zijn de ruimtes?</h2>
     <p class="kh-sub">Kies de oppervlakte per kamer. Dit helpt ons een passend vermogen te adviseren.</p>
     <div class="kh-size-grid">
       ${Array.from({ length: state.rooms }, (_, i) => renderRoomCard(i + 1)).join('')}
     </div>
   `;

// Delegate changes to the container
body.addEventListener('change', onSizeChange);
syncNextDisabled();
};

const renderStep3 = () => {
state.step = 3;
setDot(3);

const list = state.sizes
.map((sz, i) => `<li>Kamer ${i + 1}: <strong>${sz.replace('-', '–')} m²</strong></li>`)
.join('');

body.innerHTML = `
     <h2 class="khv2-q">Overzicht</h2>
     <p class="kh-sub">Op basis van jouw keuze stellen we een advies op maat samen.</p>
     <div id="khv2-summary">
       <ul class="kh-out">${list}</ul>
     </div>
     <p class="muted">Klaar! Je kunt dit doorgeven of direct contact met ons opnemen.</p>
   `;

syncNextDisabled(); // always enabled here but keeps logic consistent
};

// ---------- Event handlers ----------
const onRoomsChange = (e) => {
const input = e.target;
if (!input || input.name !== 'rooms') return;

state.rooms = parseInt(input.value, 10) || 0;
syncNextDisabled();

// Keep listening if user changes mind before pressing Next
body.addEventListener('change', onRoomsChange, { once: true });
};

const onSizeChange = (e) => {
const input = e.target;
if (!input || input.type !== 'radio') return;
if (!input.name.startsWith('room-') || !input.name.endsWith('-size')) return;

const roomIdx = parseInt(input.name.split('-')[1], 10); // room-X-size
if (Number.isFinite(roomIdx) && roomIdx >= 1 && roomIdx <= state.rooms) {
state.sizes[roomIdx - 1] = input.value;

// Visual “active” mark on the selected pill
const cardEl = input.closest('.khv2-room-card');
if (cardEl) {
cardEl.querySelectorAll('.kh-pill').forEach(l => l.classList.remove('active'));
input.closest('.kh-pill')?.classList.add('active');
}
syncNextDisabled();
}
};

// ---------- Next button flow ----------
nextBtn.addEventListener('click', (e) => {
e.preventDefault();

if (!isStepComplete()) return;

if (state.step === 1) {
renderStep2();
return;
}
if (state.step === 2) {
renderStep3();
return;
}
if (state.step === 3) {
// TODO: final submit / navigate / show contact
// For now do nothing (or redirect to contact page)
// window.location.href = 'contact.html';
}
});

// ---------- Init ----------
// Make sure Next starts disabled until a room count is chosen
nextBtn.disabled = true;
renderStep1();
})();

// Close (×) -> go back to homepage
const closeBtn = document.querySelector('.khv2-close');
if (closeBtn) {
closeBtn.addEventListener('click', () => {
window.location.href = 'index.html';
});
// Close on ESC
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') window.location.href = 'index.html';
});
}

(() => {
const root = document.querySelector('#savings');
if (!root) return;

// Elements
const range = root.querySelector('#save-bill');
const number = root.querySelector('#save-bill-input');
const profileSel = root.querySelector('#save-profile');
const chips = [...root.querySelectorAll('.save-systems .chip')];
const outAmount = root.querySelector('#save-amount');
const outRate = root.querySelector('#save-rate');

// Add bubble + ticks (no HTML changes needed)
const wrap = root.querySelector('.save-bill-wrap');
let bubble = document.createElement('div');
bubble.className = 'save-bubble';
wrap.style.position = 'relative';
wrap.appendChild(bubble);

let ticks = document.createElement('div');
ticks.className = 'save-ticks';
ticks.innerHTML = `<span>€50</span><span>€325</span><span>€600</span>`;
wrap.parentElement.appendChild(ticks); // below the slider/number row

// Annual line
let annual = document.createElement('div');
annual.className = 'save-annual';
// will fill in calc()

// Slot annual just under the result
const resultBox = root.querySelector('.save-result');
if (resultBox) resultBox.appendChild(annual);

// Formatters
const fmtEUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtINT = new Intl.NumberFormat('nl-NL');

// Rates (same defaults; tweak as you like)
const RATES = {
split: { cooling: 0.18, mixed: 0.14, heating: 0.06 },
multi: { cooling: 0.22, mixed: 0.18, heating: 0.10 },
hp:    { cooling: 0.20, mixed: 0.28, heating: 0.40 }
};

let system = chips.find(c => c.classList.contains('active'))?.dataset.system || 'split';
let profile = profileSel?.value || 'mixed';

// ---- Tooltip: inject button + bubble into the result box ----
const tipWrap = document.createElement('span');
tipWrap.className = 'save-tip-wrap';

const tipBtn = document.createElement('button');
tipBtn.className = 'save-tip';
tipBtn.type = 'button';
tipBtn.setAttribute('aria-label','Uitleg besparing');
tipBtn.textContent = 'i';

const tipBubble = document.createElement('div');
tipBubble.className = 'save-tip-bubble';
tipBubble.innerHTML = `
   <h5>Hoe we dit schatten</h5>
   <p id="save-tip-body">We gebruiken gemiddelde besparingspercentages per systeem & gebruiksprofiel.</p>
   <p class="muted">Indicatie, geen offerte. Werkelijk verbruik en tarieven kunnen variëren.</p>
 `;

tipWrap.appendChild(tipBtn);
tipWrap.appendChild(tipBubble);

// Place it next to the little badge at the left of the result row if present,
// otherwise append to the right end of the result box.
const badge = resultBox?.querySelector('.save-badge');
if (badge) {
badge.after(tipWrap);
} else if (resultBox) {
resultBox.appendChild(tipWrap);
}

// Toggle open/close
tipBtn.addEventListener('click', (e) => {
e.stopPropagation();
tipWrap.classList.toggle('is-open');
});
document.addEventListener('click', () => tipWrap.classList.remove('is-open'));
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') tipWrap.classList.remove('is-open');
});

// Copy for assumptions per system/profile (keep in sync with RATES)
const TIP_TEXT = {
split: {
cooling: 'Single-split: koelen bespaart ~18% van je huidige energiekosten bij regelmatig koelen.',
mixed:   'Single-split: gemengd gebruik (koelen + verwarmen voor-/naseizoen) ~14% besparing.',
heating: 'Single-split als bijverwarming: ~6% besparing t.o.v. alleen cv/elektra.'
},
multi: {
cooling: 'Multi-split: meerdere ruimtes efficiënt koelen → ~22% besparing.',
mixed:   'Multi-split gemengd gebruik: ~18% besparing bij normaal gebruik.',
heating: 'Multi-split als (bij)verwarming: ~10% besparing, afhankelijk van isolatie.'
},
hp: {
cooling: 'Warmtepomp-airco met nadruk op koelen: ~20% besparing.',
mixed:   'Warmtepomp-airco gemengd gebruik: ~28% besparing (hogere COP in tussenseizoen).',
heating: 'Warmtepomp-airco als hoofdverwarming: ~40% besparing t.o.v. convectie/elektra.'
}
};

function updateTip(){
const t = TIP_TEXT[system]?.[profile] || 'Indicatieve schatting op basis van gemiddelde profielen.';
const el = tipBubble.querySelector('#save-tip-body');
if (el) el.textContent = t;
}


// Helpers
function clampBill(val){
const min = Number(range.min || 50);
const max = Number(range.max || 600);
if (!isFinite(val)) return min;
return Math.min(max, Math.max(min, Math.round(val)));
}

function bubblePos(){
// Position bubble centered over the thumb
const min = Number(range.min), max = Number(range.max), v = Number(range.value);
const pct = (v - min) / (max - min);
const x = range.getBoundingClientRect().width * pct;
bubble.style.left = `${x}px`;
bubble.textContent = fmtEUR.format(v);
}

function calc(){
const bill = clampBill(Number(number.value || range.value || 0));
const rate = (RATES[system] && RATES[system][profile]) ? RATES[system][profile] : 0.15;
const saving = Math.round(bill * rate);
const annualSaving = saving * 12;

if (outAmount) outAmount.textContent = fmtINT.format(saving);
if (outRate) outRate.textContent = Math.round(rate * 100);

annual.innerHTML = `Indicatie per jaar: <strong>${fmtEUR.format(annualSaving)}</strong> (uitgaande van huidige keuzes)`;

bubblePos();
updateTip();   // ← keep tooltip text in sync
}

// Wire inputs
function fromRange(){
number.value = clampBill(Number(range.value));
calc();
}
function fromNumber(){
const v = clampBill(Number(number.value));
number.value = v;
range.value = String(v);
calc();
}

range?.addEventListener('input', fromRange);
number?.addEventListener('input', fromNumber);
profileSel?.addEventListener('change', (e) => { profile = e.target.value; calc(); });

chips.forEach(btn => {
btn.addEventListener('click', () => {
chips.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
system = btn.dataset.system || 'split';
calc();
});
});

// Resize observer to keep bubble positioned on layout changes
const ro = new ResizeObserver(() => bubblePos());
ro.observe(range);

// Init
// Ensure sane defaults
number.value = clampBill(Number(number.value || range.value || 180));
range.value = String(number.value);
calc();
})();

/* =========================================================
  Savings calc polish — matches your CSS & HTML
  (.save-card, #save-bill, #save-bill-input, .save-bubble, .save-ticks)
  ========================================================= */
(() => {
const card = document.querySelector('.save-card');
if (!card) return;

const rangeWrap   = card.querySelector('.save-range') || card;
const range       = card.querySelector('#save-bill');        // slider
const numberField = card.querySelector('#save-bill-input');  // numeric field (right)
const bubble      = card.querySelector('.save-bubble');      // € chip above thumb
const ticks       = card.querySelectorAll('.save-ticks span'); // 3 spans: min, mid, max

if (!range) return;

// ---- keep number-field bounds synced to the slider
if (numberField) {
numberField.min = range.min;
numberField.max = range.max;
numberField.step = range.step || numberField.step || 5;
}

// ---- write min/mid/max tick labels from the actual slider bounds
const min = Number(range.min || 0);
const max = Number(range.max || 100);
const step = Number(range.step || 1);

if (ticks.length >= 3) {
const midRaw = (min + max) / 2;
// round mid to the nearest step for a tidy label (e.g. 325)
const mid = Math.round(midRaw / step) * step;

ticks[0].textContent = `€${min.toLocaleString('nl-NL')}`;
ticks[1].textContent = `€${mid.toLocaleString('nl-NL')}`;
ticks[2].textContent = `€${max.toLocaleString('nl-NL')}`;
}

// ---- position the floating € bubble so it never clips
function positionBubble() {
if (!bubble) return;

const v   = Number(range.value || min);
const pct = (v - min) / (max - min);

// geometry relative to the slider (track) & its wrapper
const trackRect = range.getBoundingClientRect();
const wrapRect  = (rangeWrap.getBoundingClientRect ? rangeWrap.getBoundingClientRect() : trackRect);

const bubbleW   = bubble.offsetWidth || 48;
const half      = bubbleW / 2;

// x along the track
const x = pct * trackRect.width;

// clamp so bubble never overflows either edge
const clamped = Math.min(trackRect.width - half, Math.max(half, x));

// place relative to the wrapper
const left = (trackRect.left - wrapRect.left) + clamped;
bubble.style.left = `${left}px`;

// small vertical nudge (you already set top in CSS; this ensures it stays above the track)
bubble.style.top  = '-34px';

// update the text to match current value
bubble.textContent = `€ ${v.toLocaleString('nl-NL')}`;
}

// ---- keep slider and number field in lockstep
function fromRange() {
if (numberField) numberField.value = range.value;
positionBubble();
}
function fromNumber() {
if (!numberField) return;
let v = Number(numberField.value);
if (!isFinite(v)) v = min;
v = Math.max(min, Math.min(max, v));
// snap to step
const snapped = Math.round(v / step) * step;
range.value = snapped.toString();
numberField.value = snapped.toString();
positionBubble();
}

// listeners
range.addEventListener('input', fromRange);
if (numberField) numberField.addEventListener('input', fromNumber);
window.addEventListener('resize', positionBubble);

// initial
if (numberField) numberField.value = range.value;
positionBubble();
})();

/* =========================================================
  Savings calc polish (defensive version)
  Works with: .save-card, #save-bill, #save-bill-input,
              .save-bubble (or .bill-tag/.range-tag), .save-ticks
  ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
const card = document.querySelector('.save-card') ||
document.querySelector('#savings .save-card');
if (!card) return;

const rangeWrap   = card.querySelector('.save-range') || card;
const range       = card.querySelector('#save-bill');
const numberField = card.querySelector('#save-bill-input');
// bubble may be named differently in some versions:
const bubble      = card.querySelector('.save-bubble, .bill-tag, .range-tag');
const ticks       = card.querySelectorAll('.save-ticks span, .range-scale span');

if (!range || !bubble) return;

// ---- Sync number field bounds with the slider
const min  = Number(range.min || 0);
const max  = Number(range.max || 100);
const step = Number(range.step || 1);

if (numberField) {
numberField.min  = min;
numberField.max  = max;
numberField.step = step;
}

// ---- Write min/mid/max tick labels from the slider’s true bounds
if (ticks.length >= 3) {
const midRaw = (min + max) / 2;
const mid    = Math.round(midRaw / step) * step;

ticks[0].textContent = `€${min.toLocaleString('nl-NL')}`;
ticks[1].textContent = `€${mid.toLocaleString('nl-NL')}`;
ticks[2].textContent = `€${max.toLocaleString('nl-NL')}`;
}

// ---- Position the floating € bubble; keep it inside the rail
function positionBubble() {
const v   = Number(range.value || min);
const pct = (v - min) / (max - min);

const trackRect = range.getBoundingClientRect();
const wrapRect  = (rangeWrap.getBoundingClientRect ? rangeWrap.getBoundingClientRect() : trackRect);
const bubbleW   = bubble.offsetWidth || 48;
const half      = bubbleW / 2;

const x = pct * trackRect.width;
const clamped = Math.min(trackRect.width - half, Math.max(half, x));
const left = (trackRect.left - wrapRect.left) + clamped;

bubble.style.position = 'absolute';
bubble.style.left = `${left}px`;
// nudged down so it doesn’t sit on the heading:
bubble.style.top  = '-28px';

bubble.textContent = `€ ${v.toLocaleString('nl-NL')}`;
}
  
// Savings slider: keep tick labels under the slider lane (not the number input)
(function fixSavingsTicks() {
  const root = document.getElementById('savings');
  if (!root) return;

  const wrap  = root.querySelector('.save-bill-wrap');   // grid: [ slider | input ]
  const ticks = root.querySelector('.save-ticks');       // the 50 / 325 / 600 labels
  const range = root.querySelector('#save-bill');        // the <input type="range">

  if (!wrap || !ticks || !range) return;

  // 1) Move ticks inside the grid wrap so we can place them under column 1
  if (ticks.parentElement !== wrap) wrap.appendChild(ticks);

  // 2) Grid placement: under the slider column, second row
  ticks.style.gridColumn = '1';
  ticks.style.gridRow    = '2';
  ticks.style.marginTop  = '6px';

  // 3) Match the ticks’ width to the actual slider lane width
  function sizeTicks() {
    const rect = range.getBoundingClientRect();
    // Use the rendered width of the slider control
    ticks.style.width = rect.width + 'px';
  }

  sizeTicks();
  window.addEventListener('resize', sizeTicks);
})();

// ---- Keep slider <-> number field in sync
function fromRange() {
if (numberField) numberField.value = range.value;
positionBubble();
}
function fromNumber() {
if (!numberField) return;
let v = Number(numberField.value);
if (!isFinite(v)) v = min;
v = Math.max(min, Math.min(max, v));
const snapped = Math.round(v / step) * step;
range.value = String(snapped);
numberField.value = String(snapped);
positionBubble();
}

range.addEventListener('input', fromRange);
if (numberField) numberField.addEventListener('input', fromNumber);
window.addEventListener('resize', positionBubble);

// initial
if (numberField) numberField.value = range.value;
positionBubble();

// simple debug helper
window.__savingsDebug = { range, numberField, bubble, ticks };
});

// --- Savings slider & tick sync (safe to append at bottom) ---
(function(){
const wrap  = document.querySelector('.save-card');
if (!wrap) return;
const rng   = wrap.querySelector('#save-bill');
const num   = wrap.querySelector('#save-bill-input');
const ticks = wrap.querySelectorAll('.range-scale span');
const bubble = wrap.querySelector('.save-bubble');

if (!rng || !num) return;

// Ensure attributes are honored across UI
const min = +rng.min || 50, max = +rng.max || 600, step = +rng.step || 5;
rng.min = min; rng.max = max; rng.step = step;
num.min = min; num.max = max; num.step = step;

function clamp(v){ v = Math.round(v/step)*step; return Math.min(max, Math.max(min, v)); }
function syncFromRange(){
const v = clamp(+rng.value || min);
num.value = v;
if (bubble){
const pct = (v - min) / (max - min);
bubble.style.left = `calc(${pct*100}% + 12px)`; // 12px ≈ left padding before track
bubble.textContent = `€ ${v}`;
}
}
function syncFromNumber(){
rng.value = clamp(+num.value || min);
syncFromRange();
}

// Set ticks to min/mid/max
if (ticks.length >= 3){
ticks[0].textContent = `€${min}`;
ticks[1].textContent = `€${Math.round((min+max)/2)}`;
ticks[2].textContent = `€${max}`;
}

rng.addEventListener('input', syncFromRange);
num.addEventListener('input', syncFromNumber);
syncFromRange();
})();

// --- Keep tick labels the same width as the slider track ---
(function alignTickScaleToSlider(){
const slider = document.getElementById('save-bill');
const scale  = document.querySelector('#savings .range-scale');
if (!slider || !scale) return;

function sizeScale(){
// Use the rendered width of the range control
const w = slider.getBoundingClientRect().width;
scale.style.width = w + 'px';
}
// Size now and on resize (debounced for performance)
let raf;
function onResize(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(sizeScale); }
window.addEventListener('resize', onResize);
sizeScale();
})();

// Savings: keep tick labels exactly under the slider lane
(function () {
const range = document.getElementById('save-bill');
if (!range) return;
// ticks element: either the sibling right after .save-bill-wrap or the nearest in the group
const ticks = range.closest('.save-bill-wrap')?.nextElementSibling?.classList.contains('save-ticks')
? range.closest('.save-bill-wrap').nextElementSibling
: document.querySelector('.save-ticks');

function syncTicksWidth() {
if (!ticks) return;
const w = range.getBoundingClientRect().width;
ticks.style.width = w + 'px';
}
window.addEventListener('resize', syncTicksWidth, { passive: true });
// run after layout
requestAnimationFrame(syncTicksWidth);
})();
