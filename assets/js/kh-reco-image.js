/*! kh-reco-image.js — progressive enhancement (non‑breaking)
 *  Adds an image next to the recommendation inside #kh-reco by inferring the product slug.
 */
(function () {
  'use strict';
  function ready(fn){ 
    if (document.readyState !== 'loading') fn(); 
    else document.addEventListener('DOMContentLoaded', fn); 
  }
  ready(function(){
    var mount = document.getElementById('kh-reco');
    if(!mount) return;
    if (mount.dataset.enhanced === 'img') return;

    // Find CTA href that likely points to a product page
    var cta = mount.querySelector('a[href*="/products/"]') || mount.querySelector('a[href*="products/"]');
    if(!cta) return;

    var slug = null;
    try {
      var href = (cta.getAttribute('href') || '').split('#')[0].split('?')[0];
      var m = href.match(/products\/([^\/]+?)(?:\.html|$)/i);
      if (m && m[1]) slug = m[1];
    } catch(e){}

    if(!slug) return;

    var primary = "/assets/img/products/" + slug + "/hero.jpg";
    var secondary = "/assets/img/products/" + slug + ".jpg";

    var media = document.createElement('div');
    media.className = 'kh-reco-media';
    var img = document.createElement('img');
    img.alt = '';  // decorative here
    img.loading = 'lazy';
    img.decoding = 'async';

    img.src = primary;
    img.onerror = function(){
      if (img.dataset.triedSecondary) {
        media.remove();
      } else {
        img.dataset.triedSecondary = '1';
        img.src = secondary;
      }
    };
    media.appendChild(img);

    var body = mount.querySelector('.kh-reco-body');
    if(!body){
      body = document.createElement('div');
      body.className = 'kh-reco-body';
      while (mount.firstChild) body.appendChild(mount.firstChild);
      mount.appendChild(body);
    }

    if (!mount.classList.contains('kh-reco--withimg')) {
      mount.classList.add('kh-reco--withimg');
    }
    if (!mount.querySelector('.kh-reco-media')) {
      mount.insertBefore(media, body);
    }
    mount.dataset.enhanced = 'img';
  });
})();
