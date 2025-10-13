
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
// --- Keuzehulp wizard ---
(function(){
  const form = document.getElementById('keuzehulp-form');
  if(!form) return;

  const steps = [...form.querySelectorAll('.kh-step')];
  let idx = 0;

  function show(i){
    steps.forEach((s, n)=> s.hidden = n !== i);
    idx = i;
  }

  form.addEventListener('click', (e)=>{
    if(e.target.classList.contains('kh-next')){
      // simple required check within this step
      const req = steps[idx].querySelectorAll('[required]');
      for (const el of req){ if (el.type==='radio'){ 
          const any = steps[idx].querySelector(`input[name="${el.name}"]:checked`);
          if(!any){ alert('Maak een keuze.'); return; }
        } else if(!el.value){ alert('Vul een waarde in.'); return; }
      }
      show(Math.min(idx+1, steps.length-1));
    }
    if(e.target.classList.contains('kh-prev')) show(Math.max(idx-1, 0));
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const ruimte = form.querySelector('input[name="ruimte"]:checked')?.value;
    const opp = Number(form.opp.value || 0);
    const isolatie = form.isolatie.value;
    const kamers = Number(form.querySelector('input[name="kamers"]:checked')?.value || 1);

    // kW berekening (ruwe indicatie)
    let wPerM2 = 100; // 0.1 kW/m²
    if (isolatie === 'gemiddeld') wPerM2 = 130;
    if (isolatie === 'matig') wPerM2 = 160;
    let watts = opp * wPerM2;
    if (ruimte === 'woonkamer') watts *= 1.1; // iets zwaarder
    let kw = (watts/1000) * kamers;

    // rond af naar 0.1
    kw = Math.round(kw*10)/10;

    // voorstel labels
    let voorstel = 'Single-split 2.5 kW';
    if (kw > 3.2 && kw <= 4.2) voorstel = 'Single-split 3.5 kW';
    else if (kw > 4.2 && kamers === 1) voorstel = 'Single-split 5.0 kW';
    else if (kamers >= 2) voorstel = 'Multi-split (2–3 binnendelen)';

    const box = document.getElementById('kh-result');
    box.querySelector('[data-kh="kw"]').textContent = kw.toFixed(1);
    box.querySelector('[data-kh="voorstel"]').textContent = voorstel;
    box.querySelector('.kh-out').hidden = false;
    // scroll into view for mobile
    box.scrollIntoView({behavior:'smooth', block:'center'});
  });
})();
