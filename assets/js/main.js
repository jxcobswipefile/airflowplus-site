
/* ======================================================================
   Airflow+ — Main JS (namespaced & idempotent)
   ====================================================================== */ 
(() => {
  "use strict";

  // ----------------------- Namespace + shared utils -----------------------
  const AFP = (window.AFP = window.AFP || {});
  AFP.ROOT_BASE = AFP.ROOT_BASE || "/airflowplus-site/";

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
    { slug: "haier-revive-plus",     name: "Haier Revive Plus",     img: "assets/indoor units kh/haier revive indoor.jpg",     url: "products/haier-revive-plus.html",     cool_area_m2: 25 },
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
    let down = false,
      sx = 0,
      sl = 0;
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
    let tx = 0,
      tl = 0;
    track.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches?.[0];
        if (!t) return;
        tx = t.pageX;
        tl = track.scrollLeft;
      },
      { passive: true }
    );
    track.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches?.[0];
        if (!t) return;
        track.scrollLeft = tl - (t.pageX - tx);
      },
      { passive: true }
    );

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
      const min = +range.min || 50,
        max = +range.max || 600,
        step = +range.step || 5;
      v = Math.round((+v || min) / step) * step;
      return Math.min(max, Math.max(min, v));
    };

    function positionBubble() {
      const min = +range.min || 50,
        max = +range.max || 600,
        v = +range.value || min;
      const pct = (v - min) / (max - min);
      const trackRect = range.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const w = bubble.offsetWidth || 48,
        half = w / 2;
      const x = Math.min(trackRect.width - half, Math.max(half, pct * trackRect.width));
      bubble.style.left = trackRect.left - wrapRect.left + x + "px";
      bubble.textContent = fmtEUR.format(v);
    }

    function writeTicks() {
      const min = +range.min || 50,
        max = +range.max || 600,
        step = +range.step || 5;
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
  AFP.pickVariantByArea = function pickVariantByArea(totalRooms, avgRoomM2 /* preferQuiet unused here */) {
    const totalM2 = totalRooms * avgRoomM2;
    const list = AFP.VARS.slice();

    let pool = list.filter((it) => totalM2 >= it.min_m2 && totalM2 <= it.max_m2);
    if (!pool.length) {
      // closest mid distance
      const mid = (x) => (x.min_m2 + x.max_m2) / 2;
      pool = list.sort((a, b) => Math.abs(mid(a) - totalM2) - Math.abs(mid(b) - totalM2));
    }
    if (totalRooms >= 3) {
      const big = pool.filter((it) => it.kw >= 3.5);
      if (big.length) pool = big;
    }
    return pool[0] || list[0];
  };

/* KH – prefer user/rotating brand for the same capacity (append-only wrapper) */
(function KH_PickVariantBiasFix(){
  if (!window.AFP || typeof AFP.pickVariantByArea !== 'function') return;
  const ORIGINAL = AFP.pickVariantByArea;

  const byBrand = {
    Panasonic: { '2.5': 'panasonic-tz-25kw',  '3.5': 'panasonic-tz-35kw',  '5': 'panasonic-tz-50kw' },
    Daikin:    { '2.5': 'daikin-comfora-25kw','3.5': 'daikin-comfora-35kw','5': 'daikin-comfora-50kw' },
    Haier:     { '2.5': 'haier-revive-plus-25kw','3.5':'haier-revive-plus-35kw','5':'haier-revive-plus-50kw' }
  };

  function preferredBrands(){
    try { return JSON.parse(sessionStorage.getItem('khPreferredBrands') || '[]'); }
    catch { return []; }
  }
  function rrBrand(){
    const order = ['Daikin','Panasonic','Haier'];
    let i = 0; try { i = Number(sessionStorage.getItem('khBrandRR2')||'0')||0; } catch {}
    const b = order[i % order.length];
    try { sessionStorage.setItem('khBrandRR2', String((i+1)%order.length)); } catch {}
    return b;
  }

  AFP.pickVariantByArea = function wrapped(totalRooms, avgRoomM2, preferQuiet){
    const rec = ORIGINAL(totalRooms, avgRoomM2, preferQuiet);
    if (!rec) return rec;

    // if user has preferences, try them first; otherwise round-robin
    const prefs = preferredBrands();
    const brandOrder = (prefs.length ? prefs.map(s=>s.charAt(0).toUpperCase()+s.slice(1)) : [rrBrand()]);

    const cap = String(rec.kw || rec.cap || '').replace(/\.0$/,''); // "2.5" | "3.5" | "5"
    for (const Brand of brandOrder){
      const slugKey = byBrand[Brand]?.[cap];
      if (!slugKey) continue;
      const match = (AFP.VARS || []).find(v => (v.slug||'').includes(slugKey));
      if (match) return match;
    }
    return rec; // fallback to original
  };
})();

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
      body.addEventListener(
        "change",
        (e) => {
          const input = e.target;
          if (input?.name !== "rooms") return;
          state.rooms = parseInt(input.value, 10) || 0;
          nextBtn.disabled = !complete();
        },
        { once: true }
      );
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
        const a = parseFloat(m[1]),
          b = parseFloat(m[2]);
        if (!isNaN(a) && !isNaN(b)) return (a + b) / 2;
      }
      const n = parseFloat(txt);
      return isNaN(n) ? null : n;
    }

    function renderRecoInto(target) {
      const mids = (state.sizes || []).map(midFromRange).filter((x) => typeof x === "number" && !isNaN(x));
      const totalM2 = mids.length ? mids.reduce((a, b) => a + b, 0) : 30;
      const rooms = Math.max(1, state.rooms || 1);
      const avg = totalM2 / rooms;
      const rec = AFP.pickVariantByArea(rooms, avg, false);
      if (!rec) return;
      const priceLine = (b) =>
        b === "Daikin"
          ? "vanaf € 1.800 incl. materiaal en montage"
          : b === "Panasonic"
          ? "vanaf € 1.600 incl. materiaal en montage"
          : b === "Haier"
          ? "vanaf € 1.300 incl. materiaal en montage"
          : "Prijs op aanvraag";

      target.innerHTML =
        `<div class="kh-reco-card">
           <div class="kh-reco-main">
             <div class="kh-reco-body">
               <h3>${rec.name || "Aanbevolen model"}</h3>
               <div class="muted">${priceLine(rec.brand || "")}</div>
               <a class="btn btn-green" style="margin-top:12px" href="${AFP.ROOT_BASE + (rec.slug || "")}">Bekijk aanbeveling</a>
               <p class="muted" style="margin-top:8px">Op basis van ~${Math.round(totalM2)} m².</p>
             </div>
           </div>
         </div>`;
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
(function () {
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
              '<h3>' + (rec.name || 'Aanbevolen model') + '</h3>' +
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
      // Prefer step-3 container if present, else append to card
      (document.querySelector('[data-kh-step="3"]') || card).appendChild(mount);
    }
    if (!mount.innerHTML.trim()) {
      renderRecoInto(mount, window.AFP.KH_STATE);
    }
  }

  // Observe step changes
  const card = document.querySelector('.khv2-card');
  if (card) {
    try {
      const mo = new MutationObserver(() => setTimeout(ensureReco, 60));
      mo.observe(card, { attributes: true, attributeFilter: ['data-step'] });
    } catch {}
  }

  // Also try after any obvious "Next" click and on load
  document.addEventListener('click', (e) => {
    if (e.target.closest('#kh-next,.kh-next,[data-kh-next]')) setTimeout(ensureReco, 120);
  }, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensureReco, 120), { once: true });
  } else {
    setTimeout(ensureReco, 120);
  }

  // Manual helper (handy in console): AFP.forceReco()
  window.AFP.forceReco = ensureReco;
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

  // run now and whenever Step 3 activates
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

/* === KH recommendation: add product image & nicer layout === */
(function () {
  // Derive hero image from a slug like "products/panasonic-tz-50kw.html"
  function productHeroFromSlug(slug) {
    try {
      if (!slug) return null;
      var base = String(slug).split('/')[1] || ''; // "panasonic-tz-50kw.html"
      var folder = base.split('-').slice(0, 2).join('-'); // "panasonic-tz"
      // Existing pattern in your repo: assets/img/products/<folder>/hero.jpg
      return 'assets/img/products/' + folder + '/hero.jpg';
    } catch (_) { return null; }
  }

  // keep a reference to the original renderer if you kept it somewhere
  // otherwise we just re-render after the hotfix put content in #kh-reco
  function reRenderWithImage() {
    var mount = document.getElementById('kh-reco');
    if (!mount) return;

    // Try to read what you just chose
    var st = (window.state && typeof window.state === 'object') ? window.state : {};
    var rooms = Math.max(1, st.rooms || 1);
    var sizes = Array.isArray(st.sizes) ? st.sizes : [];
    var mids = sizes.map(function (txt) {
      if (!txt) return 30;
      txt = String(txt).replace(/\s/g,'').replace('m²','').replace('m2','').replace(',', '.');
      var m = txt.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);
      if (m) { var a = parseFloat(m[1]), b = parseFloat(m[2]); return (a+b)/2; }
      var n = parseFloat(txt); return isNaN(n) ? 30 : n;
    });
    var total = mids.length ? mids.reduce((a,b)=>a+b,0) : 30;
    var avg = total / rooms;

    if (typeof pickVariantByArea !== 'function') return;
    var rec = pickVariantByArea(rooms, avg, false);
    if (!rec) return;

    var img = productHeroFromSlug(rec.slug) || 'assets/img/products/_placeholder.jpg';
    var base = (typeof ROOT_BASE !== 'undefined' ? ROOT_BASE : '/airflowplus-site/');

    mount.innerHTML =
      '<div class="kh-reco-card kh-reco--withimg">' +
        '<div class="kh-reco-media"><img alt="'+ (rec.name||'Airco') +'" src="'+ img +'"></div>' +
        '<div class="kh-reco-body">' +
          '<h3>'+ (rec.name || 'Aanbevolen model') +'</h3>' +
          '<div class="muted">'+ (rec.brand === 'Daikin' ? 'vanaf € 1.800 incl. materiaal en montage' :
                                  rec.brand === 'Panasonic' ? 'vanaf € 1.600 incl. materiaal en montage' :
                                  rec.brand === 'Haier' ? 'vanaf € 1.300 incl. materiaal en montage' :
                                  'Prijs op aanvraag') + '</div>' +
          '<a class="btn btn-green" style="margin-top:12px" href="'+ base + (rec.slug||'') +'">Bekijk aanbeveling</a>' +
          '<p class="muted" style="margin-top:8px">Op basis van ~'+ Math.round(total) +' m².</p>' +
        '</div>' +
      '</div>';
  }

  // run whenever Step 3 is visible (same triggers you wired before)
  var card = document.querySelector('.khv2-card');
  if (card) {
    try {
      new MutationObserver(function () {
        if (card.getAttribute('data-step') === '3') setTimeout(reRenderWithImage, 80);
      }).observe(card, { attributes: true, attributeFilter: ['data-step'] });
    } catch (_) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(reRenderWithImage, 120); }, { once:true });
  } else {
    setTimeout(reRenderWithImage, 120);
  }
})();

/* Replace review names with Dutch placeholders */
(function () {
  const dutchNames = [
    'Sanne V.', 'Daan J.', 'Lotte B.',
    'Milan V.', 'Noa B.', 'Jasper S.',
    'Fleur M.', 'Bram G.', 'Iris W.'
  ];

  // Adjust selectors to your markup:
  // - container has [data-reviews]
  // - each card has .rev-card
  // - the name lives in .rev-name
  const cards = document.querySelectorAll('[data-reviews] .rev-card');
  if (!cards.length) return;

  cards.forEach((card, i) => {
    const nameEl = card.querySelector('.rev-name') || card.querySelector('[data-name]');
    if (nameEl) nameEl.textContent = dutchNames[i % dutchNames.length];
  });
})();

/* Swap all review avatars for the logo */
(function () {
  const LOGO = 'assets/img/airflowplus_logo_circle.png'; // <- path to your saved logo
  const imgs = document.querySelectorAll('[data-reviews] .rev-card img, [data-reviews] .rev-avatar img');
  imgs.forEach(img => {
    img.src = LOGO;
    img.srcset = ''; // prevent srcset from overriding
    img.alt = 'AirFlow+';
    img.loading = 'lazy';
    img.decoding = 'async';
  });
})();

/* ========= Keuzehulp: inject product hero image next to recommendation ========= */

(function () {
  const MOUNT_SEL = '#kh-reco'; // your mount showed this id in the screenshot

  // map titles → folders you showed in assets/img/products/<folder>/hero.jpg
  const TITLE_MAP = [
    { test: /panasonic.*etherea.*(2\.5|25)/i, folder: 'panasonic-etherea-25kw' },
    { test: /panasonic.*etherea/i,            folder: 'panasonic-etherea' },
    { test: /panasonic.*tz/i,                 folder: 'panasonic-tz' },

    { test: /daikin.*comfora/i,               folder: 'daikin-comfora' },
    { test: /daikin.*emura.*(2\.5|25)/i,      folder: 'daikin-emura-25kw' },
    { test: /daikin.*emura/i,                 folder: 'daikin-emura' },
    { test: /daikin.*perfera/i,               folder: 'daikin-perfera' },

    { test: /haier.*flexis.*(2\.5|25)/i,      folder: 'haier-flexis-25kw' },
    { test: /haier.*expert/i,                 folder: 'haier-expert' },
    { test: /haier.*revive.*plus/i,           folder: 'haier-revive-plus' },
  ];

  // strip known -XXkw suffixes from slugs
  const stripSize = (s) => s.replace(/-(?:2\.5|25|35|40|45|50|60|70)kw$/i, '');

  // try a list of hero.jpg urls until one exists
  async function tryHero(paths) {
    for (const url of paths) {
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) return url;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function getBasePath() {
    // If site is served under /airflowplus-site/, keep it; else relative is fine.
    const p = location.pathname;
    return p.includes('/airflowplus-site') ? '/airflowplus-site' : '';
  }

  function guessFolderFromTitle(title) {
    for (const rule of TITLE_MAP) {
      if (rule.test.test(title)) return rule.folder;
    }
    return null;
  }

  function getRecoRoot() {
    const mount = document.querySelector(MOUNT_SEL);
    if (!mount) return null;
    // The recommendation content is inside the mount. We'll decorate that block.
    return mount;
  }

  function getRecoTitleAndLink(root) {
    // Title (e.g. “Panasonic TZ 3.5 kW”)
    const h3 = root.querySelector('h3, h2, .kh-reco-title');
    const title = (h3 && h3.textContent.trim()) || '';

    // The “Bekijk aanbeveling” link or any product link
    const link = root.querySelector('a[href*="products"]');
    let slug = '';
    if (link) {
      try {
        const url = new URL(link.href, location.origin);
        // last path segment without extension
        const segs = url.pathname.split('/').filter(Boolean);
        slug = (segs.pop() || '').replace(/\.(html?)$/i, '');
      } catch (_) { /* ignore */ }
    }
    return { title, slug, linkEl: link };
  }

  function ensureLayout(root) {
    // If the card already has our layout, bail
    if (root.querySelector('.kh-reco--withimg')) return root.querySelector('.kh-reco--withimg');

    // Find main body container (the block that holds text). If not obvious, wrap the whole mount.
    // We'll create: <div class="kh-reco--withimg"><div class="kh-reco-media"></div><div class="kh-reco-body">...</div></div>
    const bodyCandidate =
      root.querySelector('.kh-reco-card, .kh-reco-main, .kh-reco-body') || root;

    // Build wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'kh-reco--withimg';

    const media = document.createElement('div');
    media.className = 'kh-reco-media';

    const body = document.createElement('div');
    body.className = 'kh-reco-body';

    // Move existing children into body
    while (bodyCandidate.firstChild) {
      body.appendChild(bodyCandidate.firstChild);
    }
    bodyCandidate.appendChild(wrapper);
    wrapper.appendChild(media);
    wrapper.appendChild(body);

    return wrapper;
  }

  async function injectImage() {
    const root = getRecoRoot();
    if (!root) return;

    const { title, slug } = getRecoTitleAndLink(root);
    if (!title && !slug) return; // nothing to go on yet

    const base = getBasePath();

    // Build candidate folder list
    const candidates = [];

    if (slug) {
      candidates.push(slug);
      const withoutSize = stripSize(slug);
      if (withoutSize !== slug) candidates.push(withoutSize);
    }

    const mapped = guessFolderFromTitle(title);
    if (mapped) candidates.push(mapped);

    // Deduplicate
    const uniqueFolders = [...new Set(candidates.filter(Boolean))];

    // Build hero.jpg attempt list
    const urls = uniqueFolders.map(f => `${base}/assets/img/products/${f}/hero.jpg`);

    const found = await tryHero(urls);
    if (!found) return; // nothing to show; fail silently

    // Ensure layout and inject
    const layout = ensureLayout(root);
    const media = layout.querySelector('.kh-reco-media');
    if (!media) return;

    // Avoid double insert
    if (media.querySelector('img')) return;

    const img = document.createElement('img');
    img.alt = title || 'Productfoto';
    img.src = found;
    media.appendChild(img);
  }

  // Observe recommendation mount for changes (wizard updates)
  const start = () => {
    const mount = document.querySelector(MOUNT_SEL);
    if (!mount) return;

    // Run once now
    injectImage();

    const mo = new MutationObserver(() => injectImage());
    mo.observe(mount, { childList: true, subtree: true });
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // DevTools helper (optional): run window._khImage() to re-try
  window._khImage = injectImage;
})();

/* =========================================================
   v36 — KH: Brand diversification after recommendation render
   - Safe to paste at the end of assets/js/main.js
   - No HTML edits; no dependency on KH image script internals
   - Runs only on keuzehulp page when #kh-reco mounts
   ========================================================= */
(function KH_BrandDiversification_Main(){
  if (document.querySelector('[data-kh-step]') == null) return; // not on KH

  const PRODUCT_EQ = {
    panasonic: {
      '25kw': { slug: 'panasonic-tz-25kw',  title: 'Panasonic TZ — 2.5 kW' },
      '35kw': { slug: 'panasonic-tz-35kw',  title: 'Panasonic TZ — 3.5 kW' },
      '50kw': { slug: 'panasonic-tz-50kw',  title: 'Panasonic TZ — 5.0 kW' },
    },
    daikin: {
      '25kw': { slug: 'daikin-comfora-25kw', title: 'Daikin Comfora — 2.5 kW' },
      '35kw': { slug: 'daikin-comfora-35kw', title: 'Daikin Comfora — 3.5 kW' },
      '50kw': { slug: 'daikin-comfora-50kw', title: 'Daikin Comfora — 5.0 kW' },
    },
    haier: {
      '25kw': { slug: 'haier-revive-plus-25kw', title: 'Haier Revive Plus — 2.5 kW' },
      '35kw': { slug: 'haier-revive-plus-35kw', title: 'Haier Revive Plus — 3.5 kW' },
      '50kw': { slug: 'haier-revive-plus-50kw', title: 'Haier Revive Plus — 5.0 kW' },
    }
  };

  // --- helpers
  const brandFromSlug = (slug='')=>{
    slug = slug.toLowerCase();
    if (slug.startsWith('daikin-')) return 'daikin';
    if (slug.startsWith('panasonic-')) return 'panasonic';
    if (slug.startsWith('haier-')) return 'haier';
    return '';
  };
  const capacityKeyFrom = (s='')=>{
    s = s.toLowerCase();
    let m = s.match(/-(25|35|50)\s*kw/);
    if (m) return `${m[1]}kw`;
    m = s.match(/(\b2\.5|\b3\.5|\b5\.0)\s*kW/i);
    if (m) return m[1].replace('.','') + 'kw';
    return null;
  };
  const currentSlugFromCard = (card)=>{
    const img = card.querySelector('.kh-reco-media img');
    if (img?.src){
      const mm = img.src.match(/assets\/img\/products\/([^/]+)\/hero\.jpg/i);
      if (mm) return mm[1];
    }
    const cta = card.querySelector('a[href*="/products/"]');
    if (cta){
      const mm = cta.getAttribute('href').match(/products\/([^\.]+)\.html/i);
      if (mm) return mm[1];
    }
    return '';
  };

  // Heuristics — tweak to match your stored keys if you have them
  const getBudgetTier = ()=>{
    try {
      const v = (sessionStorage.getItem('khBudget')||'').toLowerCase();
      if (/laag|low|budget/.test(v)) return 'low';
      if (/hoog|high|premium|design/.test(v)) return 'high';
      return v ? 'mid' : null;
    } catch { return null; }
  };
  const wantsDesign   = ()=> { try { return /design|emura/i.test(sessionStorage.getItem('khPriority')||''); } catch { return false; } };
  const wantsLowNoise = ()=> { try { return /stil|quiet|low\s*noise/i.test(sessionStorage.getItem('khPriority')||''); } catch { return false; } };

  const chooseBrandByHints = ()=>{
    const budget = getBudgetTier();
    if (wantsDesign())   return 'daikin';
    if (wantsLowNoise()) return 'panasonic';
    if (budget === 'low')  return 'haier';
    if (budget === 'high') return 'daikin';
    return null;
  };

  // Round-robin fallback so we don’t always pick the same brand
  const rrBrand = ()=>{
    const order = ['daikin','panasonic','haier'];
    let i = 0;
    try { i = Number(sessionStorage.getItem('khBrandRR')||'0')||0; } catch {}
    const b = order[i % order.length];
    try { sessionStorage.setItem('khBrandRR', String((i+1)%order.length)); } catch {}
    return b;
  };

  const swapTo = (card, brand, capKey)=>{
    const cfg = PRODUCT_EQ[brand]?.[capKey];
    if (!cfg) return false;

    const newSlug = cfg.slug;
    const newTitle = cfg.title;
    const imgPath  = `assets/img/products/${newSlug}/hero.jpg`;
    const pageHref = `/airflowplus-site/products/${newSlug}.html`;

    const titleEl = card.querySelector('.kh-reco-body h4, .kh-reco-body .title, .kh-reco-title, h4');
    if (titleEl) titleEl.textContent = newTitle;

    const img = card.querySelector('.kh-reco-media img');
    if (img) { img.src = imgPath; img.alt = newTitle; img.loading='lazy'; img.decoding='async'; }

    const cta = card.querySelector('a[href*="/products/"]');
    if (cta) cta.setAttribute('href', pageHref);

    return true;
  };

  const diversify = (card)=>{
    const slug   = currentSlugFromCard(card);
    const capKey = capacityKeyFrom(slug || card.textContent || '');
    if (!capKey) return;

    const currentBrand = brandFromSlug(slug) || '';
    const hinted = chooseBrandByHints();

    if (hinted && hinted !== currentBrand && PRODUCT_EQ[hinted]?.[capKey]) {
      swapTo(card, hinted, capKey);
      return;
    }
    const next = rrBrand();
    if (next && next !== currentBrand && PRODUCT_EQ[next]?.[capKey]) {
      swapTo(card, next, capKey);
    }
  };

  // Wait for the recommendation card your other script renders/enhances
  const mount = document.querySelector('#kh-reco, .kh-reco-card');
  if (!mount) return;

  let ranOnce = false;
  const run = ()=>{
    const card = document.querySelector('.kh-reco--withimg, .kh-reco-card');
    if (!card) return;
    diversify(card);
    // prevent thrashing (still safe if recommendation re-renders)
    if (!ranOnce) ranOnce = true;
  };

  // Observe changes under the mount (plays nice with existing MutationObserver)
  const mo = new MutationObserver(run);
  mo.observe(mount, { childList:true, subtree:true });

  // Also try once on load (in case rendered synchronously)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once:true });
  } else {
    run();
  }
})();

/* =========================================================
   KH – ensure brand diversification runs when #kh-reco appears
   (append-only shim; safe even if other observers exist)
   ========================================================= */
(function KH_WaitForRecoAndDiversify(){
  // Map of brand ↔ equivalent slugs by capacity
  const PRODUCT_BY_BRAND = {
    panasonic: {
      '25kw': { slug: 'panasonic-tz-25kw',  title: 'Panasonic TZ — 2.5 kW' },
      '35kw': { slug: 'panasonic-tz-35kw',  title: 'Panasonic TZ — 3.5 kW' },
      '50kw': { slug: 'panasonic-tz-50kw',  title: 'Panasonic TZ — 5.0 kW' },
    },
    daikin: {
      '25kw': { slug: 'daikin-comfora-25kw', title: 'Daikin Comfora — 2.5 kW' },
      '35kw': { slug: 'daikin-comfora-35kw', title: 'Daikin Comfora — 3.5 kW' },
      '50kw': { slug: 'daikin-comfora-50kw', title: 'Daikin Comfora — 5.0 kW' },
    },
    haier: {
      '25kw': { slug: 'haier-revive-plus-25kw', title: 'Haier Revive Plus — 2.5 kW' },
      '35kw': { slug: 'haier-revive-plus-35kw', title: 'Haier Revive Plus — 3.5 kW' },
      '50kw': { slug: 'haier-revive-plus-50kw', title: 'Haier Revive Plus — 5.0 kW' },
    }
  };

  function brandFromSlug(slug=''){
    slug = slug.toLowerCase();
    if (slug.startsWith('daikin-')) return 'daikin';
    if (slug.startsWith('panasonic-')) return 'panasonic';
    if (slug.startsWith('haier-')) return 'haier';
    return '';
  }
  function capKeyFromSlug(s=''){
    const m = s.toLowerCase().match(/-(25|35|50)\s*kw/);
    return m ? `${m[1]}kw` : null;
  }
  function currentSlugFromCard(card){
    const img = card.querySelector('.kh-reco-media img');
    if (img?.src){
      const mm = img.src.match(/assets\/img\/products\/([^/]+)\/hero\.jpg/i);
      if (mm) return mm[1];
    }
    const cta = card.querySelector('a[href*="/products/"]');
    if (cta){
      const mm = cta.getAttribute('href')?.match(/products\/([^\.]+)\.html/i);
      if (mm) return mm[1];
    }
    return '';
  }

  // Use user-selected brand chips if present; otherwise round-robin
  function preferredBrands(){
    try { return JSON.parse(sessionStorage.getItem('khPreferredBrands') || '[]'); }
    catch { return []; }
  }
  function rrBrand(exclude){
    const order = ['daikin','panasonic','haier'];
    let i = 0; try { i = Number(sessionStorage.getItem('khBrandRR')||'0')||0; } catch {}
    // pick first that isn't the excluded current brand
    for (let n=0;n<order.length;n++){
      const b = order[(i+n)%order.length];
      if (b !== exclude) {
        try { sessionStorage.setItem('khBrandRR', String((i+n+1)%order.length)); } catch {}
        return b;
      }
    }
    return exclude || 'panasonic';
  }

  function swap(card, brand, capKey){
    const cfg = PRODUCT_BY_BRAND[brand]?.[capKey];
    if (!cfg) return false;
    const newSlug = cfg.slug;
    const newTitle = cfg.title;
    const imgPath  = `assets/img/products/${newSlug}/hero.jpg`;
    const pageHref = `/airflowplus-site/products/${newSlug}.html`;

    const titleEl = card.querySelector('.kh-reco-body h3, .kh-reco-body h4, .kh-reco-title, h3, h4');
    if (titleEl) titleEl.textContent = newTitle;

    const img = card.querySelector('.kh-reco-media img');
    if (img) { img.src = imgPath; img.alt = newTitle; img.loading='lazy'; img.decoding='async'; }

    const cta = card.querySelector('a[href*="/products/"]');
    if (cta) cta.setAttribute('href', pageHref);
    return true;
  }

  function diversify(card){
    const slug = currentSlugFromCard(card);
    if (!slug) return;
    const cap  = capKeyFromSlug(slug);
    if (!cap)  return;

    const current = brandFromSlug(slug);
    const prefs = preferredBrands();

    // 1) honor explicit preferences
    for (const b of prefs){
      if (b !== current && PRODUCT_BY_BRAND[b]?.[cap]) {
        swap(card, b, cap);
        return;
      }
    }
    // 2) otherwise rotate brands to avoid "always Panasonic"
    const target = rrBrand(current);
    if (target !== current && PRODUCT_BY_BRAND[target]?.[cap]) {
      swap(card, target, cap);
    }
  }

  function attachToMount(mount){
    // run whenever content inside #kh-reco changes
    const run = ()=> {
      const card = mount.querySelector('.kh-reco--withimg, .kh-reco-card, .kh-reco-main') || mount;
      if (card) diversify(card);
    };
    // observe mutations inside the mount
    let busy = false;
const mo = new MutationObserver(() => {
  if (busy) return;
  busy = true;
  requestAnimationFrame(() => {
    run();
    // let the DOM settle before re-allowing
    setTimeout(() => busy = false, 100);
  });
});
mo.observe(mount, { childList:true, subtree:true });
run();

  }

  function waitForMount(){
    const existing = document.querySelector('#kh-reco');
    if (existing) { attachToMount(existing); return; }

    const bodyMO = new MutationObserver(() => {
      const el = document.querySelector('#kh-reco');
      if (el) { bodyMO.disconnect(); attachToMount(el); }
    });
    bodyMO.observe(document.body, { childList:true, subtree:true });
  }

  // Only on KH screens
  if (document.querySelector('[data-kh-step]')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForMount, { once:true });
    } else {
      waitForMount();
    }
  }
})();
