/* ======================================================================
   Airflow+ — Main JS (namespaced & idempotent)
   ====================================================================== */ 
(() => {
  "use strict";

  // ----------------------- Namespace + shared utils -----------------------
  const AFP = (window.AFP = window.AFP || {});
  AFP.ROOT_BASE = AFP.ROOT_BASE || "/airflowplus-site/";

  // ---- NEW: global guard so legacy KH injectors/safetynet won’t run ----
  window.__KH_IMAGE_INJECTOR_ACTIVE__ = true;

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const onReady = (fn) =>
    (document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn());

  // Guarded log
  AFP.log = (...a) => (window.AFP_DEBUG ? console.log("[AFP]", ...a) : void 0);

  // ---------------------------- Data (guarded) ----------------------------
  // Product cards used on general pages (small list)
  AFP.ITEMS = AFP.ITEMS || [
    { slug: "panasonic-tz",          name: "Panasonic TZ",          img: "assets/indoor units kh/panasonic tz indoor.jpg",          url: "products/panasonic-tz.html",          cool_area_m2: 25 },
    { slug: "daikin-comfora",        name: "Daikin Comfora",        img: "assets/indoor units kh/daikin comfora indoor.jpg",        url: "products/daikin-comfora.html",        cool_area_m2: 25 },
    { slug: "haier-revive-plus",     name: "Haier Revive Plus",     img: "assets/indoor units kh/haier revive indoor.jpg",          url: "products/haier-revive-plus.html",     cool_area_m2: 25 },
    { slug: "daikin-perfera",        name: "Daikin Perfera",        img: "assets/indoor units kh/daikin perfera indoor.jpg",        url: "products/daikin-perfera.html",        cool_area_m2: 25 },
    { slug: "panasonic-etherea",     name: "Panasonic Etherea",     img: "assets/indoor units kh/panasonic etherea indoor.jpg",     url: "products/panasonic-etherea.html",     cool_area_m2: 25 },
    { slug: "haier-expert",          name: "Haier Expert",          img: "assets/indoor units kh/haier expert indoor.jpg",          url: "products/haier-expert.html",          cool_area_m2: 26 },
    { slug: "daikin-emura",          name: "Daikin Emura",          img: "assets/indoor units kh/daikin emura indoor.jpg",          url: "products/daikin-emura.html",          cool_area_m2: 25 }
  ];

  // Variants used by the recommender (capacity-based)
  AFP.VARS = AFP.VARS || [
    { slug:"products/panasonic-tz-25kw.html",        name:"Panasonic TZ 2.5 kW",        brand:"Panasonic", kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/panasonic-tz-35kw.html",        name:"Panasonic TZ 3.5 kW",        brand:"Panasonic", kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/panasonic-tz-50kw.html",        name:"Panasonic TZ 5.0 kW",        brand:"Panasonic", kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/panasonic-etherea-25kw.html",   name:"Panasonic Etherea 2.5 kW",   brand:"Panasonic", kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/panasonic-etherea-35kw.html",   name:"Panasonic Etherea 3.5 kW",   brand:"Panasonic", kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/panasonic-etherea-50kw.html",   name:"Panasonic Etherea 5.0 kW",   brand:"Panasonic", kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/daikin-comfora-25kw.html",      name:"Daikin Comfora 2.5 kW",      brand:"Daikin",    kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/daikin-comfora-35kw.html",      name:"Daikin Comfora 3.5 kW",      brand:"Daikin",    kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/daikin-comfora-50kw.html",      name:"Daikin Comfora 5.0 kW",      brand:"Daikin",    kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/daikin-perfera-25kw.html",      name:"Daikin Perfera 2.5 kW",      brand:"Daikin",    kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/daikin-perfera-35kw.html",      name:"Daikin Perfera 3.5 kW",      brand:"Daikin",    kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/daikin-perfera-50kw.html",      name:"Daikin Perfera 5.0 kW",      brand:"Daikin",    kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/daikin-emura-25kw.html",        name:"Daikin Emura 2.5 kW",        brand:"Daikin",    kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/daikin-emura-35kw.html",        name:"Daikin Emura 3.5 kW",        brand:"Daikin",    kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/daikin-emura-50kw.html",        name:"Daikin Emura 5.0 kW",        brand:"Daikin",    kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/haier-revive-plus-25kw.html",   name:"Haier Revive Plus 2.5 kW",   brand:"Haier",     kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/haier-revive-plus-35kw.html",   name:"Haier Revive Plus 3.5 kW",   brand:"Haier",     kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 },
    { slug:"products/haier-revive-plus-50kw.html",   name:"Haier Revive Plus 5.0 kW",   brand:"Haier",     kw:5.0, min_m2:30, max_m2:50, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:5.0 },
    { slug:"products/haier-expert-nordic-25kw.html", name:"Haier Expert Nordic 2.5 kW", brand:"Haier",     kw:2.5, min_m2:10, max_m2:25, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:2.5 },
    { slug:"products/haier-expert-nordic-35kw.html", name:"Haier Expert Nordic 3.5 kW", brand:"Haier",     kw:3.5, min_m2:20, max_m2:35, seer:"A++", scop:"A+", noise_in:20, noise_out:46, cap:3.5 }
  ];

  // ------------------------------ Header/nav ------------------------------
  onReady(() => {
    const toggle = $(".nav-toggle");
    const nav = $(".nav");
    toggle?.addEventListener("click", () => {
      nav.style.display = nav.style.display === "block" ? "" : "block";
    });
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  });

  // --------------------------- Sticky header glow -------------------------
  onReady(() => {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () =>
      window.scrollY > 10 ? header.classList.add("scrolled") : header.classList.remove("scrolled");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  // ------------------------------ Reviews rail ----------------------------
  onReady(() => {
    const wrap = $("[data-reviews]");
    if (!wrap) return;
    const track = $("[data-track]", wrap);
    if (!track) return;
    const prev = $(".rev-prev", wrap);
    const next = $(".rev-next", wrap);
    const cards = $$(".rev-card", track);
    if (!cards.length) return;

    const gap = () => parseFloat(getComputedStyle(track).gap || "0") || 0;
    const step = () => (cards[0]?.getBoundingClientRect().width || 0) + gap();

    let timer;
    const auto = () => {
      const s = step();
      if (!s) return;
      const max = track.scrollWidth - track.clientWidth;
      const nextLeft = Math.min(track.scrollLeft + s, max);
      track.scrollTo({ left: nextLeft, behavior: "smooth" });
      if (Math.abs(nextLeft - max) < 2) setTimeout(() => track.scrollTo({ left: 0, behavior: "smooth" }), 800);
    };
    const start = () => {
      stop();
      timer = setInterval(auto, 3200);
    };
    const stop = () => (timer ? clearInterval(timer) : 0);

    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    ["mouseenter", "touchstart", "focusin"].forEach((ev) => track.addEventListener(ev, stop, { passive: true }));
    ["mouseleave", "touchend", "focusout"].forEach((ev) => track.addEventListener(ev, start, { passive: true }));
    window.addEventListener("resize", () => {
      stop();
      start();
    });

    // drag
    let down = false, sx = 0, sl = 0;
    track.addEventListener("mousedown", (e) => {
      down = true;
      sx = e.pageX;
      sl = track.scrollLeft;
      track.classList.add("dragging");
    });
    window.addEventListener("mousemove", (e) => {
      if (!down) return;
      e.preventDefault();
      track.scrollLeft = sl - (e.pageX - sx);
    });
    window.addEventListener("mouseup", () => {
      down = false;
      track.classList.remove("dragging");
    });

    // touch
    let tx = 0, tl = 0;
    track.addEventListener("touchstart", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      tx = t.pageX;
      tl = track.scrollLeft;
    }, { passive: true });
    track.addEventListener("touchmove", (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      track.scrollLeft = tl - (t.pageX - tx);
    }, { passive: true });

    start();
  });

  // --------------------------- Savings calculator -------------------------
  onReady(() => {
    const root = $("#savings");
    if (!root) return;

    const range = $("#save-bill", root);
    const number = $("#save-bill-input", root);
    const profileSel = $("#save-profile", root);
    const chips = $$(".save-systems .chip", root);
    const outAmt = $("#save-amount", root);
    const outPct = $("#save-rate", root);
    const result = $(".save-result", root);
    const wrap = $(".save-bill-wrap", root);
    if (!range || !number || !outAmt || !outPct || !wrap) return;

    const bubble = document.createElement("div");
    bubble.className = "save-bubble";
    wrap.style.position = "relative";
    wrap.appendChild(bubble);

    const ticks = document.createElement("div");
    ticks.className = "save-ticks";
    wrap.parentElement.insertBefore(ticks, wrap.nextSibling);

    const tipWrap = document.createElement("span");
    tipWrap.className = "save-tip-wrap";
    const tipBtn = Object.assign(document.createElement("button"), { className: "save-tip", type: "button", textContent: "i" });
    const tipBox = document.createElement("div");
    tipBox.className = "save-tip-bubble";
    tipBox.innerHTML =
      `<h5>Hoe we dit schatten</h5><p id="save-tip-copy"></p><p class="muted">Indicatie, geen offerte. Werkelijk verbruik en tarieven kunnen variëren.</p>`;
    tipWrap.appendChild(tipBtn);
    tipWrap.appendChild(tipBox);
    result?.appendChild(tipWrap);
    tipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      tipWrap.classList.toggle("is-open");
    });
    document.addEventListener("click", () => tipWrap.classList.remove("is-open"));
    document.addEventListener("keydown", (e) => (e.key === "Escape" ? tipWrap.classList.remove("is-open") : 0));

    const fmtEUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
    const fmtINT = new Intl.NumberFormat("nl-NL");

    const RATES = {
      split: { cooling: 0.18, mixed: 0.14, heating: 0.06 },
      multi: { cooling: 0.22, mixed: 0.18, heating: 0.1 },
      hp: { cooling: 0.2, mixed: 0.28, heating: 0.4 }
    };
    const TIP = {
      split: {
        cooling: "Single-split: ~18% besparing bij koelen.",
        mixed: "Single-split: gemengd gebruik ~14% besparing.",
        heating: "Single-split als bijverwarming: ~6% besparing."
      },
      multi: {
        cooling: "Multi-split: ~22% besparing bij meerdere ruimtes.",
        mixed: "Multi-split gemengd: ~18% besparing.",
        heating: "Multi-split als (bij)verwarming: ~10% besparing."
      },
      hp: {
        cooling: "Warmtepomp-airco (koelen): ~20% besparing.",
        mixed: "Warmtepomp-airco gemengd: ~28% besparing.",
        heating: "Warmtepomp-airco (verwarmen): ~40% besparing."
      }
    };

    let system = chips.find((c) => c.classList.contains("active"))?.dataset.system || "split";
    let profile = profileSel?.value || "mixed";

    const clamp = (v) => {
      const min = +range.min || 50, max = +range.max || 600, step = +range.step || 5;
      v = Math.round((+v || min) / step) * step;
      return Math.min(max, Math.max(min, v));
    };

    function positionBubble() {
      const min = +range.min || 50, max = +range.max || 600, v = +range.value || min;
      const pct = (v - min) / (max - min);
      const trackRect = range.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const w = bubble.offsetWidth || 48, half = w / 2;
      const x = Math.min(trackRect.width - half, Math.max(half, pct * trackRect.width));
      bubble.style.left = trackRect.left - wrapRect.left + x + "px";
      bubble.textContent = fmtEUR.format(v);
    }

    function writeTicks() {
      const min = +range.min || 50, max = +range.max || 600, step = +range.step || 5;
      const mid = Math.round((min + max) / 2 / step) * step;
      ticks.innerHTML = `<span>€${min.toLocaleString("nl-NL")}</span><span>€${mid.toLocaleString("nl-NL")}</span><span>€${max.toLocaleString("nl-NL")}</span>`;
      ticks.style.width = range.getBoundingClientRect().width + "px";
    }

    function updateTip() {
      const t = TIP[system]?.[profile] || "Indicatieve schatting op basis van gemiddelde profielen.";
      const slot = tipBox.querySelector("#save-tip-copy");
      if (slot) slot.textContent = t;
    }

    function calc() {
      const bill = clamp(number.value || range.value || 0);
      const rate = RATES[system]?.[profile] ?? 0.15;
      const monthly = Math.round(bill * rate);
      outAmt.textContent = fmtINT.format(monthly);
      outPct.textContent = Math.round(rate * 100);
      positionBubble();
      updateTip();
    }

    range.addEventListener("input", () => {
      number.value = range.value;
      calc();
    });
    number.addEventListener("input", () => {
      const v = clamp(number.value);
      number.value = v;
      range.value = v;
      calc();
    });
    profileSel?.addEventListener("change", (e) => {
      profile = e.target.value;
      calc();
    });
    chips.forEach((c) =>
      c.addEventListener("click", () => {
        chips.forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        system = c.dataset.system || "split";
        calc();
      })
    );
    window.addEventListener("resize", () => {
      writeTicks();
      positionBubble();
    });

    number.value = clamp(number.value || range.value || 180);
    range.value = number.value;
    writeTicks();
    calc();

    // small patch: ensure input 'change' fires calc too (for steppers)
    number.addEventListener("change", () => number.dispatchEvent(new Event("input", { bubbles: true })));
  });

  // ------------------------ FAQ deep-link + schema ------------------------
  onReady(() => {
    const faq = $(".faq");
    if (!faq) return;
    const items = $$("details[id]", faq);
    const KEY = "airflow_faq_open";

    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el?.tagName === "DETAILS") {
        el.open = true;
        history.replaceState(null, "", location.pathname + location.search);
      }
    } else {
      const last = localStorage.getItem(KEY);
      if (last) document.getElementById(last)?.setAttribute("open", "");
    }

    items.forEach((d) =>
      d.addEventListener("toggle", () => {
        if (d.open) localStorage.setItem(KEY, d.id);
      })
    );

    // schema.org
    const qa = items.map((d) => {
      const q = d.querySelector("summary")?.textContent?.trim() || "";
      const a = d.querySelector("summary + *")?.textContent?.trim() || "";
      return { "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } };
    });
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa });
    document.head.appendChild(s);
  });

  // ----------------------------- Contact form -----------------------------
  onReady(() => {
    const form = $("#contact-form");
    if (!form) return;

    const status = $(".form-status", form);
    const err = (key, msg) => {
      const slot = form.querySelector(`[data-err="${key}"]`);
      if (slot) slot.textContent = msg || "";
    };
    const clear = () => $$(".error", form).forEach((e) => (e.textContent = ""));

    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isPhone = (v) => !v || /^[0-9+()\-\s]{6,}$/.test(v);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clear();
      status.textContent = "";
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const msg = (fd.get("message") || "").toString().trim();
      const ok = !!name && isEmail(email) && isPhone(phone) && !!msg && form.querySelector("#cf-consent")?.checked;

      if (!ok) {
        if (!name) err("name", "Vul je naam in.");
        if (!isEmail(email)) err("email", "Vul een geldig e-mailadres in.");
        if (!isPhone(phone)) err("phone", "Vul een geldig telefoonnummer in.");
        if (!msg) err("message", "Schrijf kort je vraag/aanvraag.");
        if (!form.querySelector("#cf-consent")?.checked) err("consent", "Vink deze aan om te kunnen versturen.");
        return;
      }

      try {
        const res = await fetch(form.action, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!res.ok) throw 0;
        form.reset();
        form.classList.add("is-sent");
        status.innerHTML =
          `<div class="success-card"><h3>Bedankt! 🎉</h3><p>We hebben je bericht ontvangen en nemen snel contact op.</p></div>`;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        status.innerHTML =
          `<div class="error-card"><strong>Er ging iets mis.</strong> Probeer het opnieuw of bel ons even.</div>`;
      }
    });
  });

  // ----------------------------- Page fade nav ----------------------------
  onReady(() => {
    $$(".site a[data-transition]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const url = a.getAttribute("href");
        if (!url || url.startsWith("#") || a.target === "_blank") return;
        e.preventDefault();
        document.documentElement.classList.add("is-fading");
        setTimeout(() => (window.location.href = url), 180);
      });
    });
  });

  // --------------------------- Reveal-on-scroll ---------------------------
  onReady(() => {
    const els = $$(".reveal");
    if (!els.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
  });

  // ----------------------- Ticker (rotating checkmarks) -------------------
  onReady(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $$(".afp-ticker").forEach((ticker) => {
      const track = $(".afp-ticker__track", ticker);
      if (!track) return;

      const baseItems = Array.from(track.children);
      const ensureLoopWidth = () => {
        const target = ticker.clientWidth * 2;
        while (track.scrollWidth < target) baseItems.forEach((n) => track.appendChild(n.cloneNode(true)));
      };
      ensureLoopWidth();
      window.addEventListener("resize", ensureLoopWidth, { passive: true });

      if (prefersReduced) return;

      const raf = window.requestAnimationFrame;
      let lastTs, x = 0, id;
      const speed = Number(ticker.dataset.speed || 40);
      const halfWidth = () => track.scrollWidth / 2;
      const step = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        x -= speed * dt;
        if (-x > halfWidth()) x += halfWidth();
        track.style.transform = `translateX(${x}px)`;
        id = raf(step);
      };
      const play = () => { lastTs = undefined; id = raf(step); };
      const pause = () => id && cancelAnimationFrame(id);
      play();
      ticker.addEventListener("mouseenter", pause);
      ticker.addEventListener("mouseleave", play);
    });
  });

  // -------------------------- Hero video mute toggle ----------------------
  onReady(() => {
    const video =
      $("[data-hero-video]") ||
      $(".hero video") ||
      $(".hero-wrap video") ||
      $("#hero video, video#hero-video") ||
      $("video[autoplay]");
    const btn =
      $("#muteToggle") ||
      $(".mute-btn") ||
      $(".hero [data-mute]") ||
      $(".hero .btn-mute") ||
      $(".hero .mute-toggle");

    if (!video || !btn) return;

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true;

    const render = () => {
      const muted = video.muted || video.volume === 0;
      btn.textContent = muted ? "🔇" : "🔊";
      btn.setAttribute("aria-pressed", (!muted).toString());
      btn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    };

    const unmute = () => {
      video.muted = false;
      try {
        if (video.volume === 0) video.volume = 0.5;
      } catch {}
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    btn.addEventListener(
      "click",
      (ev) => {
        ev.stopPropagation();
        if (video.muted || video.volume === 0) unmute();
        else video.muted = true;
        render();
      },
      { passive: true }
    );
    video.addEventListener("volumechange", render, { passive: true });
    render();
  });

  // --------------------- Compare rail + product crosslinks ----------------
  onReady(() => {
    // Fill "Bekijk ook" scrollers if present (uses AFP.ITEMS)
    AFP.ITEMS.forEach((a) => {
      const scroller = document.getElementById("also-" + a.slug);
      if (!scroller) return;
      AFP.ITEMS.filter((b) => b.slug !== a.slug)
        .slice(0, 6)
        .forEach((b) => {
          const el = document.createElement("a");
          el.className = "scroll-card";
          el.href = "../" + b.url;
          el.innerHTML = `<img src="../${b.img}"><span>${b.name}</span>`;
          scroller.appendChild(el);
        });
    });

    // Compare rails
    const rails = $$('.compare-rail[data-compare="auto"]');
    if (!rails.length) return;
    rails.forEach((rail) => {
      rail.innerHTML = AFP.ITEMS.map((it) => {
        const url = AFP.ROOT_BASE + it.url;
        return (
          `<a class="compare-card" href="${url}">` +
          `<h3>${it.name}</h3>` +
          `<div class="compare-spec"><strong>${it.kw || ""} kW</strong> • ${it.min_m2 || ""}-${it.max_m2 || ""} m²</div>` +
          `<div class="compare-spec">Binnen ${it.noise_in || ""} dB(A) • Buiten ${it.noise_out || ""} dB(A)</div>` +
          `<div class="card-energy">` +
          `<span class="eu-chip" data-grade="${it.seer || "A++"}">Koelen: ${it.seer || "A++"}</span>` +
          `<span class="eu-chip" data-grade="${it.scop || "A+"}">Verwarmen: ${it.scop || "A+"}</span>` +
          `</div>` +
          `</a>`
        );
      }).join("");
    });
  });

  // ------------------------------ Catalog filters -------------------------
  onReady(() => {
    const root = $("#cards");
    if (!root) return;
    const cards = $$(".model-card", root);
    const brandInputs = $$(".flt-brand");
    const capInputs = $$(".flt-cap");
    const priceMin = $("#priceMin");
    const priceMax = $("#priceMax");
    const btnReset = $("#btnResetFilters");

    const apply = () => {
      const brands = brandInputs.filter((i) => i.checked).map((i) => i.value);
      const caps = capInputs.filter((i) => i.checked).map((i) => i.value);
      const min = parseInt(priceMin?.value || "0", 10);
      const max = parseInt(priceMax?.value || "999999", 10);

      cards.forEach((c) => {
        const b = c.getAttribute("data-brand");
        const k = c.getAttribute("data-capacity");
        const okBrand = !brands.length || brands.includes(b);
        const okCap = !caps.length || caps.includes(k);
        const okPrice = true; // vanaf-prijzen, we laten alles zien
        c.style.display = okBrand && okCap && okPrice ? "" : "none";
      });
    };

    [...brandInputs, ...capInputs].forEach((i) => i.addEventListener("change", apply));
    ["input", "change"].forEach((ev) => {
      priceMin?.addEventListener(ev, apply);
      priceMax?.addEventListener(ev, apply);
    });
    btnReset?.addEventListener("click", () => {
      [...brandInputs, ...capInputs].forEach((i) => (i.checked = false));
      if (priceMin) priceMin.value = "0";
      if (priceMax) priceMax.value = "10000";
      apply();
    });
    apply();
  });

    // ----------------------- Recommender (capacity pick) --------------------
  // Diversified: same sizing logic, then pick brand by (1) user prefs, else (2) round-robin
  AFP.pickVariantByArea = function pickVariantByArea(totalRooms, avgRoomM2 /* preferQuiet unused */) {
    try {
      const list = Array.isArray(AFP.VARS) ? AFP.VARS.slice() : [];
      if (!list.length) return null;

      const totalM2 = Math.max(1, (totalRooms || 1) * (avgRoomM2 || 1));

      // 1) Base pool by area range (fallback: nearest mid)
      let pool = list.filter(it => totalM2 >= it.min_m2 && totalM2 <= it.max_m2);
      if (!pool.length) {
        const mid = (x) => (x.min_m2 + x.max_m2) / 2;
        pool = list.slice().sort((a,b) => Math.abs(mid(a)-totalM2) - Math.abs(mid(b)-totalM2));
      }

      // If many rooms, prefer >=3.5kW (but don’t empty the pool)
      if ((totalRooms||1) >= 3) {
        const big = pool.filter(it => (it.kw||it.cap||0) >= 3.5);
        if (big.length) pool = big;
      }

      // “Best fit” by closeness to pool mid; use its kW as the target capacity
      const mid = (x) => (x.min_m2 + x.max_m2) / 2;
      const best = pool.slice().sort((a,b) => Math.abs(mid(a)-totalM2) - Math.abs(mid(b)-totalM2))[0] || pool[0] || list[0];
      const targetKW = Number((best.kw ?? best.cap) || 0);
      const eqKW = (v) => Math.abs(Number((v.kw ?? v.cap) || 0) - targetKW) < 0.05; // float-safe

      // 2) Brand order = user prefs (if any) else round-robin across sessions
      function getPreferredBrands() {
        try {
          const raw = sessionStorage.getItem('khPreferredBrands') || "[]";
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          return arr.map(s => String(s).trim()).filter(Boolean).map(s => s.charAt(0).toUpperCase()+s.slice(1).toLowerCase());
        } catch { return []; }
      }
      function nextBrandRR() {
        const order = ['Daikin','Panasonic','Haier'];
        let i = 0;
        try { i = Number(sessionStorage.getItem('khBrandRRv3')||'0')||0; } catch {}
        const b = order[i % order.length];
        try { sessionStorage.setItem('khBrandRRv3', String((i+1)%order.length)); } catch {}
        return [b, ...order.filter(x => x !== b)]; // start from RR pick, then others
      }

      const brandOrder = (getPreferredBrands().length ? getPreferredBrands() : nextBrandRR());

      // 3) Try to return same capacity from the chosen brand(s)
      for (const brand of brandOrder) {
        const exact = pool.find(v => v.brand === brand && eqKW(v));
        if (exact) return exact;

        // closest capacity within same brand, if exact isn’t available
        const brandAlts = pool.filter(v => v.brand === brand);
        if (brandAlts.length) {
          const closest = brandAlts.slice().sort((a,b) =>
            Math.abs((a.kw??a.cap??0) - targetKW) - Math.abs((b.kw??b.cap??0) - targetKW)
          )[0];
          if (closest) return closest;
        }
      }

      // 4) Fallbacks
      return best || pool[0] || list[0];
    } catch {
      // absolute safety fallback (keep site working)
      const all = Array.isArray(AFP.VARS) ? AFP.VARS : [];
      return all[0] || null;
    }
  };


  // --------------------------- Keuzehulp v2 wizard ------------------------
  onReady(() => {
    const card = $(".khv2-card");
    let nextBtn = $("#kh-next");
    const dots = $$(".khv2-steps .dot");
    if (!card || !nextBtn || !dots.length) return;

    // Ensure a dedicated render body
    let body = $(".khv2-body", card);
    const actions = $(".khv2-actions", card);
    if (!body) {
      body = document.createElement("div");
      body.className = "khv2-body";
      card.insertBefore(body, actions || null);
    }

    // Remove stray static step DOM outside body (prevents overlaying/blocks)
    $$(".khv2-q, .kh-grid-rooms", card).forEach((el) => {
      if (!body.contains(el)) el.remove();
    });

    // Replace Next to kill legacy listeners that blocked clicks before
    const fresh = nextBtn.cloneNode(true);
    nextBtn.replaceWith(fresh);
    nextBtn = $("#kh-next") || fresh;

    const state = (AFP.KH_STATE = { step: 1, rooms: 0, sizes: [] });

    const setDot = (n) => dots.forEach((d, i) => d.classList.toggle("is-active", i === n - 1));
    const complete = () =>
      state.step === 1 ? state.rooms > 0 : state.step === 2 ? state.sizes.length === state.rooms && state.sizes.every(Boolean) : true;

    const sizeOptions = [
      { val: "1-30", label: "1–30 m²" },
      { val: "30-40", label: "30–40 m²" },
      { val: "40-50", label: "40–50 m²" }
    ];
    const roomCard = (i) =>
      `<div class="khv2-room-card" data-room="${i}">
         <h4>Kamer ${i}</h4>
         <div class="khv2-sizes">
           ${sizeOptions
             .map(
               (p) =>
                 `<label class="kh-pill"><input type="radio" name="room-${i}-size" value="${p.val}" hidden><span>${p.label}</span></label>`
             )
             .join("")}
         </div>
       </div>`;

    function renderStep1() {
      state.step = 1;
      state.rooms = 0;
      setDot(1);
      body.innerHTML =
        `<h2 class="khv2-q">In hoeveel ruimtes wil je airconditioning?</h2>
         <div class="kh-grid-rooms" style="justify-content:center; grid-template-columns:repeat(4,72px); gap:14px;">
           ${[1, 2, 3, 4]
             .map((n) => `<label class="chip round"><input type="radio" name="rooms" value="${n}"><span>${n}</span></label>`)
             .join("")}
         </div>`;
      body.addEventListener("change", (e) => {
        const input = e.target;
        if (input?.name !== "rooms") return;
        state.rooms = parseInt(input.value, 10) || 0;
        nextBtn.disabled = !complete();
      });
      nextBtn.textContent = "Volgende →";
      nextBtn.disabled = true;
      card.setAttribute("data-step", "1");
    }

    function renderStep2() {
      state.step = 2;
      state.sizes = new Array(state.rooms).fill(null);
      setDot(2);
      body.innerHTML =
        `<h2 class="khv2-q">Hoe groot zijn de ruimtes?</h2>
         <p class="kh-sub">Kies de oppervlakte per kamer. Dit helpt ons het juiste vermogen te adviseren.</p>
         <div class="kh-size-grid">
           ${Array.from({ length: state.rooms }, (_, i) => roomCard(i + 1)).join("")}
         </div>`;
      body.addEventListener("change", (e) => {
        const input = e.target;
        if (!input || input.type !== "radio") return;
        if (!input.name.startsWith("room-") || !input.name.endsWith("-size")) return;
        const idx = parseInt(input.name.split("-")[1], 10);
        if (Number.isFinite(idx) && idx >= 1 && idx <= state.rooms) {
          state.sizes[idx - 1] = input.value;
          const c = input.closest(".khv2-room-card");
          c?.querySelectorAll(".kh-pill").forEach((l) => l.classList.remove("active"));
          input.closest(".kh-pill")?.classList.add("active");
          nextBtn.disabled = !complete();
        }
      });
      nextBtn.textContent = "Volgende →";
      nextBtn.disabled = true;
      card.setAttribute("data-step", "2");
    }

    function midFromRange(txt) {
      if (!txt) return null;
      txt = String(txt).replace(/\s/g, "").replace("m²", "").replace("m2", "").replace(",", ".");
      const m = txt.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
      if (m) {
        const a = parseFloat(m[1]), b = parseFloat(m[2]);
        if (!isNaN(a) && !isNaN(b)) return (a + b) / 2;
      }
      const n = parseFloat(txt);
      return isNaN(n) ? null : n;
    }

    function renderRecoInto(target) {
      // --- helpers ----------------------------------------------------------
      function baseFromSlug(slug) {
        if (!slug) return "";
        const last = String(slug).split("/").pop() || "";
        const noExt = last.replace(/\.(html?)$/i, "");
        return noExt.replace(/-(?:2\.5|25|3\.5|35|5\.0|50)kw$/i, "");
      }
      function indoorImageFor(rec) {
        const base = baseFromSlug(rec.slug || "");
        if (!base || !Array.isArray(AFP.ITEMS)) return null;
        let hit = AFP.ITEMS.find(it => base.startsWith(it.slug));
        if (!hit) {
          const nm = String(rec.name || "").toLowerCase();
          hit = AFP.ITEMS.find(it => nm.includes(it.name.toLowerCase()));
        }
        return hit?.img || null;
      }
      function priceLine(b) {
        return b === "Daikin" ? "vanaf € 1.800 incl. materiaal en montage" :
          b === "Panasonic" ? "vanaf € 1.600 incl. materiaal en montage" :
            b === "Haier" ? "vanaf € 1.300 incl. materiaal en montage" :
              "Prijs op aanvraag";
      }
      function midFromRange(txt) {
        if (!txt) return null;
        txt = String(txt).replace(/\s/g, "").replace("m²", "").replace("m2", "").replace(",", ".");
        const m = txt.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
        if (m) { const a = parseFloat(m[1]), b = parseFloat(m[2]); if (!isNaN(a) && !isNaN(b)) return (a + b) / 2; }
        const n = parseFloat(txt);
        return isNaN(n) ? null : n;
      }
      // ---------------------------------------------------------------------

      const mids = (state.sizes || []).map(midFromRange).filter(x => typeof x === "number" && !isNaN(x));
      const totalM2 = mids.length ? mids.reduce((a, b) => a + b, 0) : 30;
      const rooms = Math.max(1, state.rooms || 1);
      const avg = totalM2 / rooms;

      const rec = AFP.pickVariantByArea(rooms, avg, false);
      if (!rec) return;

      const imgPath = indoorImageFor(rec);
      const href = (AFP.ROOT_BASE || "/airflowplus-site/") + (rec.slug || "");

      // Brand logo mapping
      const BASE = ((AFP.ROOT_BASE || "/airflowplus-site/").replace(/\/+$/, "")) + "/";
      const brandKey = String(rec.brand || "").toLowerCase();
      const LOGOS = {
        daikin: `${BASE}assets/img/brands/daikin.placeholder.svg`,
        panasonic: `${BASE}assets/img/brands/panasonic.placeholder.svg`,
        haier: `${BASE}assets/img/brands/haier.palaceholder.svg` // (filename as in repo)
      };
      const brandLogo = LOGOS[brandKey] || null;

      // Flex row: [ product image ] [ brand logo ] [ text ]
      target.innerHTML =
        `<div class="kh-reco-card">
       <div class="kh-reco-main" style="display:flex;align-items:center;gap:12px;">
         ${imgPath ? `
         <div class="kh-reco-media" style="flex:0 0 auto;">
           <img src="${imgPath}" alt="${rec.name || "Airco"}"
                style="width:240px;height:auto;object-fit:contain" loading="lazy" decoding="async">
         </div>` : ``}
         ${brandLogo ? `
         <div class="kh-reco-brand" style="flex:0 0 auto;display:flex;align-items:center;justify-content:center;">
           <img src="${brandLogo}" alt="${rec.brand || 'Merk'} logo"
                style="height:28px;width:auto;display:block;">
         </div>` : ``}
         <div class="kh-reco-body" style="flex:1 1 auto;">
           <h3 class="kh-reco-title">${rec.name || "Aanbevolen model"}</h3>
           <div class="muted">${priceLine(rec.brand || "")}</div>
           <a class="btn btn-green" style="margin-top:12px" href="${href}">Bekijk aanbeveling</a>
           <p class="muted" style="margin-top:8px">Op basis van ~${Math.round(totalM2)} m².</p>
         </div>
       </div>
     </div>`;
    }

// --- KH: inject brand logo next to the product image (robust) -------------
    function khInjectBrandLogo() {
      try {
        const host = document.getElementById("kh-reco");
        if (!host) return;

        // Prefer the wrapper if your image injector adds it; otherwise use the main card
        const wrapper = host.querySelector(".kh-reco--withimg") ||
          host.querySelector(".kh-reco-main") ||
          host;

        // Avoid duplicates
        if (wrapper.querySelector(".kh-brand-badge")) return;

        // Detect brand from title / CTA / image src
        const title = (host.querySelector(".kh-reco-title, .kh-reco-body h3, h3")?.textContent || "").toLowerCase();
        const href = (host.querySelector('a[href*="/products/"]')?.getAttribute("href") || "").toLowerCase();
        const img = (host.querySelector(".kh-reco-media img")?.getAttribute("src") || "").toLowerCase();
        const blob = `${title} ${href} ${img}`;

        let brand = "panasonic";
        if (blob.includes("daikin")) brand = "daikin";
        else if (blob.includes("haier")) brand = "haier";

        const base = ((window.AFP?.ROOT_BASE) || "/airflowplus-site/").replace(/\/+$/, "");
        const logos = {
          daikin: `${base}/assets/img/brands/daikin.placeholder.svg`,
          panasonic: `${base}/assets/img/brands/panasonic.placeholder.svg`,
          // use your actual filename; you mentioned "palaceholder"—keep it if that’s the file on disk
          haier: `${base}/assets/img/brands/haier.palaceholder.svg`
        };

        // Ensure positioned host so absolute badge anchors correctly
        const positioned = wrapper;
        const prevPos = positioned.style.position;
        if (!prevPos || prevPos === "static") positioned.style.position = "relative";

        // Create badge
        const badge = document.createElement("img");
        badge.className = "kh-brand-badge";
        badge.alt = `${brand} logo`;
        badge.src = logos[brand] || logos.panasonic;
        Object.assign(badge.style, {
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "96px",
          height: "auto",
          pointerEvents: "none",
          opacity: "0.92"
        });

        // Prefer placing right after the media block, else append to wrapper
        const media = wrapper.querySelector(".kh-reco-media");
        if (media && media.parentNode) {
          media.parentNode.insertBefore(badge, media.nextSibling);
        } else {
          wrapper.appendChild(badge);
        }
      } catch { /* never break wizard */ }
    }

    function ensureRecoMount() {
      let el = $("#kh-reco");
      if (!el) {
        const host = $('[data-kh-step="3"]') || card;
        el = document.createElement("div");
        el.id = "kh-reco";
        el.style.marginTop = "16px";
        host.appendChild(el);
      }
      return el;
    }

    // KH brand logo: place it NEXT TO the product image, vertically centered
    function khInjectBrandLogo() {
      try {
        const host = document.getElementById("kh-reco");
        if (!host) return;

        // Image injector wraps into: .kh-reco--withimg > (.kh-reco-media + .kh-reco-body)
        const wrapper = host.querySelector(".kh-reco--withimg");
        const media = wrapper?.querySelector(".kh-reco-media");
        if (!wrapper || !media) return;

        // Avoid dupes
        if (wrapper.querySelector(".kh-reco-brand")) return;

        // Brand (prefer explicit data-brand from render; then fallbacks)
        let brand = (host.getAttribute("data-brand") || "").toLowerCase();
        if (!brand) {
          const title = (host.querySelector(".kh-reco-title, .kh-reco-body h3, h3")?.textContent || "").toLowerCase();
          const href = (host.querySelector('a[href*="/products/"]')?.getAttribute("href") || "").toLowerCase();
          const img = (media.querySelector("img")?.getAttribute("src") || "").toLowerCase();
          const blob = `${title} ${href} ${img}`;
          if (blob.includes("daikin")) brand = "daikin";
          else if (blob.includes("panasonic")) brand = "panasonic";
          else if (blob.includes("haier")) brand = "haier";
        }
        if (!brand) return;

        // Ensure a ROW wrapper so brand sits *next to* the image
        let row = wrapper.querySelector(".kh-reco-mediaRow");
        if (!row) {
          row = document.createElement("div");
          row.className = "kh-reco-mediaRow";
          media.parentNode.insertBefore(row, media);
          row.appendChild(media); // move media into row
        }

        // Build badge with robust path + fallback (haier "palaceholder" typo)
        const BASE = ((window.AFP?.ROOT_BASE) || "/airflowplus-site/").replace(/\/+$/, "");
        const LOGO1 = `${BASE}/assets/img/brands/${brand}.placeholder.svg`;
        const LOGO2 = brand === "haier"
          ? `${BASE}/assets/img/brands/haier.palaceholder.svg`
          : LOGO1;

        const brandBox = document.createElement("div");
        brandBox.className = "kh-reco-brand";
        const badge = document.createElement("img");
        badge.alt = `${brand} logo`;
        badge.src = LOGO1;
        badge.loading = "lazy";
        badge.decoding = "async";
        badge.addEventListener("error", () => {
          if (badge.src !== LOGO2) badge.src = LOGO2;
        }, { once: true });

        brandBox.appendChild(badge);
        row.appendChild(brandBox);

        // One-time CSS injection for alignment
        if (!document.getElementById("kh-brand-css")) {
          const css = `
        .kh-reco--withimg .kh-reco-mediaRow { display:flex; align-items:center; gap:16px; }
        .kh-reco--withimg .kh-reco-media img { display:block; width:240px; height:auto; object-fit:contain; }
        .kh-reco--withimg .kh-reco-brand img { display:block; height:28px; width:auto; opacity:.95; }
        @media (max-width: 520px) {
          .kh-reco--withimg .kh-reco-mediaRow { gap:10px; }
          .kh-reco--withimg .kh-reco-brand img { height:24px; }
        }
      `.trim();
          const style = Object.assign(document.createElement("style"), { id: "kh-brand-css", textContent: css });
          document.head.appendChild(style);
        }
      } catch (_) { /* never break the wizard */ }
    }




    function renderStep3() {
      state.step = 3;
      setDot(3);
      const list = state.sizes.map((sz, i) => `<li>Kamer ${i + 1}: <strong>${sz.replace("-", "–")} m²</strong></li>`).join("");
      body.innerHTML =
        `<h2 class="khv2-q">Overzicht</h2>
         <p class="kh-sub">Op basis van jouw keuzes stellen we een advies op maat samen.</p>
         <div id="khv2-summary" class="kh-result">
           <h3>Je keuzes</h3>
           <ul class="kh-out">${list}</ul>
           <p class="muted">Klaar? Ga door voor een vrijblijvende offerte.</p>
         </div>`;
      nextBtn.textContent = "Afronden →";
      nextBtn.disabled = false;
      card.setAttribute("data-step", "3");

      const mount = ensureRecoMount();
      renderRecoInto(mount);
      // Let the image injector wrap, then add/maintain the brand logo
      setTimeout(() => {
        try { khInjectBrandLogo(); } catch {}
        try {
          const mo = new MutationObserver(() => { try { khInjectBrandLogo(); } catch {} });
          mo.observe(document.getElementById("kh-reco"), { childList: true, subtree: true });
        } catch {}
      }, 0);
      khInjectBrandLogo(); // add brand logo beside the product image
    }


    // Dots jump
    document.addEventListener("click", (e) => {
      const dot = e.target.closest(".khv2-steps .dot");
      if (!dot) return;
      const i = dots.indexOf(dot);
      if (i === 0) renderStep1();
      if (i === 1 && state.rooms) renderStep2();
      if (i === 2 && state.rooms && state.sizes.length) renderStep3();
    });

    // Next
    nextBtn.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        if (!complete()) return;
        if (state.step === 1) return renderStep2();
        if (state.step === 2) return renderStep3();
        if (state.step === 3) window.location.href = "contact.html#offerte";
      },
      true
    );

    // Close (×)
    const closeBtn = $(".khv2-close");
    closeBtn?.addEventListener("click", () => (window.location.href = "index.html"));
    document.addEventListener("keydown", (e) => e.key === "Escape" && (window.location.href = "index.html"));

    // Boot
    renderStep1();
  });

  // -------------------- Legacy Formspree (data-fs only) -------------------
  onReady(() => {
    const FORMS = $$("form[data-fs]");
    if (!FORMS.length) return;

    const toQuery = (obj) => Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

    FORMS.forEach((form) => {
      const endpoint = form.getAttribute("action");
      if (!endpoint || !/^https:\/\/formspree\.io\/f\//.test(endpoint)) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn?.setAttribute("data-loading", "1");

        try {
          const formData = new FormData(form);
          const meta = {
            source: formData.get("source") || form.getAttribute("data-source") || "site",
            type: form.getAttribute("data-type") || "lead"
          };
          const res = await fetch(endpoint, { method: "POST", body: formData, headers: { Accept: "application/json" } });
          if (res.ok) {
            const thanksURL = form.getAttribute("data-thanks") || "/thank-you.html";
            window.location.href = `${thanksURL}?${toQuery(meta)}`;
          } else {
            alert("Er is iets misgegaan bij het versturen. Probeer het opnieuw.");
          }
        } catch (err) {
          console.error(err);
          alert("Netwerkfout. Controleer uw verbinding en probeer opnieuw.");
        } finally {
          submitBtn?.removeAttribute("data-loading");
        }
      });
    });
  });
})();

/* === Keuzehulp recommendation safety net (re-renders if missing) ======= */
/* DISABLED by guard to avoid collisions with the main wizard render */
(function () {
  if (window.__KH_IMAGE_INJECTOR_ACTIVE__) return; // <-- added
  if (!window.AFP) return;

  function midFromRange(txt) {
    if (!txt) return null;
    txt = String(txt).replace(/\s/g, '').replace('m²','').replace('m2','').replace(',', '.');
    const m = txt.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
    if (m) { const a = parseFloat(m[1]), b = parseFloat(m[2]); if (!isNaN(a) && !isNaN(b)) return (a + b) / 2; }
    const n = parseFloat(txt);
    return isNaN(n) ? null : n;
  }

  function renderRecoInto(mount, state) {
    try {
      const sizes = Array.isArray(state?.sizes) ? state.sizes : [];
      const mids = sizes.map(midFromRange).filter(x => typeof x === 'number' && !isNaN(x));
      const totalM2 = mids.length ? mids.reduce((a,b) => a+b, 0) : 30;
      const rooms   = Math.max(1, state?.rooms || 1);
      const avg     = totalM2 / rooms;

      const pick = (window.AFP.pickVariantByArea || function (r,a){ return (AFP.VARS||[])[0]; });
      const rec  = pick(rooms, avg, false);
      if (!rec) return;

      const price = (b) =>
        b === 'Daikin'    ? 'vanaf € 1.800 incl. materiaal en montage' :
        b === 'Panasonic' ? 'vanaf € 1.600 incl. materiaal en montage' :
        b === 'Haier'     ? 'vanaf € 1.300 incl. materiaal en montage' :
                            'Prijs op aanvraag';

      const base = AFP.ROOT_BASE || '/airflowplus-site/';
      mount.innerHTML =
        '<div class="kh-reco-card">' +
          '<div class="kh-reco-main">' +
            '<div class="kh-reco-body">' +
              '<h3 class="kh-reco-title">' + (rec.name || 'Aanbevolen model') + '</h3>' +
              '<div class="muted">' + price(rec.brand || '') + '</div>' +
              '<a class="btn btn-green" style="margin-top:12px" href="' + base + (rec.slug || '') + '">Bekijk aanbeveling</a>' +
              '<p class="muted" style="margin-top:8px">Op basis van ~' + Math.round(totalM2) + ' m².</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    } catch (e) {
      console.warn('KH safety net render error', e);
    }
  }


  function ensureReco() {
    const card = document.querySelector('.khv2-card');
    if (!card || card.getAttribute('data-step') !== '3') return;

    let mount = document.getElementById('kh-reco');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'kh-reco';
      mount.style.marginTop = '16px';
      (document.querySelector('[data-kh-step="3"]') || card).appendChild(mount);
    }
    if (!mount.innerHTML.trim()) {
      renderRecoInto(mount, window.AFP.KH_STATE);
    }
  }

  const card = document.querySelector('.khv2-card');
  if (card) {
    try {
      const mo = new MutationObserver(() => setTimeout(ensureReco, 60));
      mo.observe(card, { attributes: true, attributeFilter: ['data-step'] });
    } catch {}
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#kh-next,.kh-next,[data-kh-next]')) setTimeout(ensureReco, 120);
  }, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensureReco, 120), { once: true });
  } else {
    setTimeout(ensureReco, 120);
  }
  window.AFP && (window.AFP.forceReco = ensureReco);
})();

/* Place recommendation inside the Step-3 summary box */
(function () {
  function relocateReco() {
    var mount = document.getElementById('kh-reco');
    var summary = document.getElementById('khv2-summary'); // the visible Step-3 panel
    if (mount && summary && !summary.contains(mount)) {
      summary.insertAdjacentElement('afterend', mount);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', relocateReco, { once: true });
  } else {
    relocateReco();
  }
  var card = document.querySelector('.khv2-card');
  if (card) {
    try {
      new MutationObserver(relocateReco).observe(card, { attributes: true, attributeFilter: ['data-step'] });
    } catch {}
  }
})();

/* === Keuzehulp: inject product hero image next to recommendation ========= */
/* DISABLED: we now use kh-reco-image.js to swap INDOOR images only */
(function () {
  if (window.__KH_IMAGE_INJECTOR_ACTIVE__) return; // <-- added: kill legacy products/hero.jpg injector
  // (dead code below intentionally left for future reference)
})();



/* ---------------- Product Gallery (prijzen.html) — seamless loop, live slider ---------------- */
(function () {
  function ready(fn){ if (document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn,{once:true}); }
  ready(function(){
    var track = document.querySelector(".gallery-track");
    if (!track || track.dataset.init==="1") return;
    track.dataset.init = "1";

    var slider = document.getElementById("gallery-slider");
    var prev   = document.querySelector(".gallery-btn.prev");
    var next   = document.querySelector(".gallery-btn.next");

    var isHovering = false;
    var isAnimating = false;        // blocks double moves
    var suppressScroll = false;     // ignore scroll handler during programmatic jumps
    var autoplayId = null;

    function gap(){ var cs=getComputedStyle(track); var g=parseFloat(cs.gap||cs.columnGap||0); return (isFinite(g)&&g>=0)?g:16; }
    function cardW(){ var f=track.querySelector("img"); return (f&&(f.clientWidth||f.naturalWidth))?(f.clientWidth||f.naturalWidth):320; }
    function step(){ var s=cardW()+gap(), v=track.clientWidth*0.6; return Math.max(160, Math.min(Math.round(s), Math.round(v))); }
    function maxScroll(){ return Math.max(0, track.scrollWidth - track.clientWidth); }
    function atStart(){ return track.scrollLeft <= 1; }
    function atEnd(){ return track.scrollLeft >= maxScroll() - 1; }

    function ensureImages(cb){
      var imgs = track.querySelectorAll("img");
      if (!imgs.length) return cb();
      var left = imgs.length, done=false;
      function tick(){ if(!done && --left<=0){ done=true; cb(); } }
      imgs.forEach(function(img){
        if (img.complete) tick();
        else { img.addEventListener("load",tick,{once:true}); img.addEventListener("error",tick,{once:true}); }
      });
      setTimeout(function(){ if(!done) cb(); }, 1200);
    }

    function setSliderFromScroll(){
      if (!slider) return;
      var m = maxScroll();
      var r = m>0 ? (track.scrollLeft/m) : 0;
      slider.value = Math.max(0, Math.min(100, Math.round(r*100)));
    }

    function updateSlider(){ if (!suppressScroll) setSliderFromScroll(); }

    // NEW: while smooth scrolling, keep slider in sync via rAF (since we suppress scroll events)
    function monitorDuringAnimation(durationMs){
      var end = performance.now() + (durationMs||420) + 60;
      function raf(now){
        setSliderFromScroll();
        if (isAnimating && now < end) requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    function scrollToX(x, smooth){
      var m = maxScroll();
      var target = Math.max(0, Math.min(m, x));
      suppressScroll = true;
      isAnimating = !!smooth;
      if (smooth) monitorDuringAnimation(420);   // <— keep slider moving during the smooth scroll
      track.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
      setTimeout(function(){ isAnimating=false; suppressScroll=false; setSliderFromScroll(); }, smooth ? 420 : 0);
    }

    function loopToStartThenAdvance() {
      // For autoplay: jump to the FIRST image and STOP there.
      // The next autoplay tick (in ~4s) will move to image 2.
      if (isAnimating) return;
      suppressScroll = true;
      isAnimating = true;

      track.scrollTo({ left: 0, behavior: "auto" });
      // ensure slider/UI sync without advancing
      requestAnimationFrame(function () {
        setSliderFromScroll();
        // end of animation state (no forward step here)
        isAnimating = false;
        suppressScroll = false;
      });
    }


    function nextSlide(){
      if (isAnimating) return;
      var m = maxScroll();
      var s = step();
      if (atEnd()) { loopToStartThenAdvance(); return; }
      scrollToX(Math.min(track.scrollLeft + s, m), true);
    }
    function prevSlide(){
      if (isAnimating) return;
      var s = step();
      if (atStart()) { scrollToX(maxScroll(), false); return; }
      scrollToX(Math.max(track.scrollLeft - s, 0), true);
    }

    next && next.addEventListener("click", nextSlide, {passive:true});
    prev && prev.addEventListener("click", prevSlide, {passive:true});
    track.addEventListener("scroll", updateSlider, {passive:true});
    slider && slider.addEventListener("input", function(e){
      if (isAnimating) return;
      var v = Math.max(0, Math.min(100, parseFloat(e.target.value||0)))/100;
      scrollToX(maxScroll()*v, true);
    }, {passive:true});

    function startAuto(){ stopAuto(); autoplayId = setInterval(function(){ if(!isHovering) nextSlide(); }, 4000); }
    function stopAuto(){ if (autoplayId) clearInterval(autoplayId); autoplayId=null; }

    track.addEventListener("mouseenter", function(){ isHovering=true; }, {passive:true});
    track.addEventListener("mouseleave", function(){ isHovering=false; }, {passive:true});

    ensureImages(function(){
      setSliderFromScroll();
      startAuto();
      window.addEventListener("resize", setSliderFromScroll, {passive:true});
    });
  });
})();

/* ---------------- Product Page Thumbnails → Main image swap (true swap) ---------------- */
(function () {
  function ready(fn){ if (document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn,{once:true}); }
  ready(function(){
    try {
      if ((location.pathname||"").indexOf("/products/") === -1) return;

      function findMain(scope){
        return scope.querySelector(".gallery-main img, img#product-main, .product-hero img, .product-media img, .product-gallery .main img")
            || (function(){
                 var best=null, area=0;
                 scope.querySelectorAll("img").forEach(function(img){
                   var a = img.clientWidth*img.clientHeight;
                   if (a>area){ area=a; best=img; }
                 });
                 return best;
               })();
      }

      function swapImage(a, b, attr){
        var tmp = a.getAttribute(attr);
        if (b.getAttribute(attr) != null) a.setAttribute(attr, b.getAttribute(attr));
        if (tmp != null) b.setAttribute(attr, tmp);
      }

      function setup(container){
        if (!container || container.dataset.pgSwapInit==="1") return;
        container.dataset.pgSwapInit = "1";

        var main = findMain(document);
        if (!main) return;
        var mainLink = main.closest("a");

        var thumbs = container.querySelectorAll("img");
        thumbs.forEach(function(t){
          t.style.cursor = "pointer";
          t.addEventListener("click", function(e){
            e.preventDefault(); e.stopPropagation();

            // Determine “full” sources
            var thumbFull = t.getAttribute("data-full") || t.getAttribute("data-src") || t.currentSrc || t.src;
            var mainFull  = main.getAttribute("data-full") || main.getAttribute("data-src") || main.currentSrc || main.src;

            // Display src we’ll swap (so the thumb visually becomes the old main)
            var oldMainDisplay = main.src;
            var oldThumbDisplay = t.src;

            // 1) Swap display src
            main.src = thumbFull;          // main shows clicked image (full if provided)
            t.src    = oldMainDisplay;     // thumb shows previous main (what the user saw)

            // 2) Swap alt (keep semantics correct)
            var tmpAlt = main.alt;
            main.alt = t.alt || main.alt;
            t.alt = tmpAlt || t.alt;

            // 3) Swap data-full / data-src so future clicks stay consistent
            // (swap both attributes if present)
            ["data-full","data-src","srcset"].forEach(function(attr){
              swapImage(main, t, attr);
            });

            // 4) If main is wrapped in a link, keep href in sync with current main
            if (mainLink) mainLink.href = (main.getAttribute("data-full") || main.src);

            // 5) Optional: active state — remove to avoid mismatch after swap
            thumbs.forEach(function(n){ n.classList.remove("is-active"); n.removeAttribute("aria-current"); });
          }, {passive:true});
        });
      }

      // Common thumbnail containers
      var strips = document.querySelectorAll(".thumbs, .thumbnails, .product-thumbs, .gallery-thumbs, .product-gallery .thumbs, .image-strip, [data-thumb-strip]");
      strips.forEach(setup);
    } catch(e){
      if (window && window.console) console.warn("Product gallery swap init skipped:", e);
    }
  });
})();

// ---------------- Mobile menu toggle (injected, non-breaking) ----------------
(function(){
  function ready(fn){ if (document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded",fn,{once:true}); }
  ready(function(){
    try {
      var header = document.querySelector("header");
      if (!header || header.dataset.mobileToggleInit==="1") return;
      header.dataset.mobileToggleInit = "1";

      // Insert toggle button if not present
      var btn = header.querySelector(".mobile-toggle");
      if (!btn) {
        btn = document.createElement("button");
        btn.className = "mobile-toggle";
        btn.setAttribute("aria-label","Menu");
        btn.setAttribute("aria-expanded","false");
        btn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
        var logo = header.querySelector(".logo, a[aria-label*=logo], a[href*='index']");
        if (logo && logo.parentNode) logo.parentNode.insertBefore(btn, logo.nextSibling);
        else header.insertBefore(btn, header.firstChild);
      }

      function toggleMenu(open){
        var wantOpen = (typeof open === "boolean") ? open : !document.documentElement.classList.contains("mobile-nav-open");
        document.documentElement.classList.toggle("mobile-nav-open", wantOpen);
        btn.setAttribute("aria-expanded", wantOpen ? "true" : "false");
      }

      btn.addEventListener("click", function(e){ e.preventDefault(); toggleMenu(); });
      header.addEventListener("click", function(e){
        var a = e.target.closest("a");
        if (a && document.documentElement.classList.contains("mobile-nav-open")) toggleMenu(false);
      });
      document.addEventListener("keydown", function(e){
        if (e.key === "Escape") toggleMenu(false);
      });
    } catch(e){ console && console.warn && console.warn("Mobile menu init skipped:", e); }
  });
})();
