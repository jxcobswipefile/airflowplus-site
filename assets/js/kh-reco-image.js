
/*! Airflow+ — Keuzehulp recommendation image injector (v3) */
(function(){
  const IMG_ROOT = "/assets/img/products";
  const HERO_NAME = "hero.jpg";

  const ALIASES = {
    "panasonic tz": "panasonic-tz",
    "panasonic- tz": "panasonic-tz",
    "panasonic etherea": "panasonic-etherea",
    "panasonic etherea 25kw": "panasonic-etherea-25kw",
    "daikin comfora": "daikin-comfora",
    "daikin emura": "daikin-emura",
    "daikin emura 25kw": "daikin-emura-25kw",
    "daikin perfera": "daikin-perfera",
    "haier expert": "haier-expert",
    "haier flexis 25kw": "haier-flexis-25kw",
    "haier revive plus": "haier-revive-plus"
  };

  const qs = (s, el=document)=>el.querySelector(s);

  function norm(s){
    return (s||"").toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,'-');
  }
  function stripSizeSuffix(slug){
    return slug.replace(/-?\d+(\.\d+)?-?k?w?$/,'').replace(/-+$/,'');
  }

  function deriveFolder(rootEl){
    const cta = qs('a[href*="products/"]', rootEl);
    if (cta){
      try{
        const url = new URL(cta.href, location.href);
        let last = (url.pathname.split('/').pop()||'').replace(/\.html?$/,'');
        let folder = stripSizeSuffix(last);
        if (folder) return folder;
      }catch(e){}
    }
    const h3 = qs('h3, .kh-reco-title, .kh-title, .title, h2', rootEl);
    if (h3){
      let txt = (h3.textContent||'').replace(/op basis.*$/i,'').trim();
      let basic = norm(txt);
      if (ALIASES[basic]) return ALIASES[basic];
      basic = stripSizeSuffix(basic.replace(/-?\d+(\.\d+)?-?k?w?/,'').replace(/--+/g,'-'));
      if (ALIASES[basic]) return ALIASES[basic];
      if (basic) return basic;
    }
    return null;
  }

  function candidates(folder){
    const base = folder.replace(/\/+$/,'');
    const baseNo = stripSizeSuffix(base);
    const set = new Set();
    const add = (p)=>{ if(p) set.add(p); };
    add(`${IMG_ROOT}/${base}/${HERO_NAME}`);
    add(`${IMG_ROOT}/${baseNo}/${HERO_NAME}`);
    add(`${IMG_ROOT}/${base}/main.jpg`);
    add(`${IMG_ROOT}/${baseNo}/main.jpg`);
    add(`${IMG_ROOT}/${base}.jpg`);
    add(`${IMG_ROOT}/${baseNo}.jpg`);
    return Array.from(set);
  }

  async function firstExisting(urls){
    for (const u of urls){
      try{
        const res = await fetch(u, { method: 'HEAD', cache:'no-store' });
        if (res.ok) return u;
      }catch(e){}
    }
    return null;
  }

  function ensureStructure(rootEl){
    if (rootEl.dataset.recoImgReady === '1') return rootEl;
    if (!qs('.kh-reco-body', rootEl)){
      const body = document.createElement('div');
      body.className = 'kh-reco-body';
      while (rootEl.firstChild) body.appendChild(rootEl.firstChild);
      rootEl.appendChild(body);
    }
    if (!qs('.kh-reco-media', rootEl)){
      const media = document.createElement('div');
      media.className = 'kh-reco-media';
      rootEl.insertBefore(media, rootEl.firstChild);
    }
    rootEl.classList.add('kh-reco--withimg');
    rootEl.dataset.recoImgReady = '1';
    return rootEl;
  }

  function mountImage(rootEl, url){
    const media = qs('.kh-reco-media', rootEl);
    if (!media) return;
    const img = media.querySelector('img');
    if (img && img.src && img.src.includes(url)) return;
    media.innerHTML = '';
    const im = new Image();
    im.alt = 'Aanbevolen model';
    im.loading = 'lazy';
    im.decoding = 'async';
    im.src = url;
    media.appendChild(im);
  }

  async function tryRender(rootEl){
    try{
      const folder = deriveFolder(rootEl);
      if (!folder) return;
      const url = await firstExisting(candidates(folder));
      if (!url) return;
      ensureStructure(rootEl);
      mountImage(rootEl, url);
    }catch(e){}
  }

  function findMount(){
    return document.querySelector('#kh-reco, .kh-reco-mount, .kh-result');
  }

  function setupObserver(){
    const obs = new MutationObserver(()=>{
      const t = findMount();
      if (t) tryRender(t);
    });
    obs.observe(document.body, { childList:true, subtree:true });
    window.addEventListener('load', ()=>{
      const t = findMount();
      if (t) tryRender(t);
      setTimeout(()=>{ const t2 = findMount(); if (t2) tryRender(t2); }, 400);
      setTimeout(()=>{ const t3 = findMount(); if (t3) tryRender(t3); }, 1000);
    }, { once:true });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setupObserver();
  }else{
    document.addEventListener('DOMContentLoaded', setupObserver, { once:true });
  }
})();
