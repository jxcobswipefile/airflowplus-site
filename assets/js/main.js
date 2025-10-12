// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav){
  toggle.addEventListener('click', ()=>{
    nav.style.display = nav.style.display === 'block' ? '' : 'block';
  });
}
// Year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Quote form handler (demo only)
const form = document.getElementById('quote-form');
if (form){
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    alert(`Bedankt ${data.name || ''}! We nemen snel contact op.`);
    form.reset();
  });
}
