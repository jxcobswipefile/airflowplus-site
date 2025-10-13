
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
