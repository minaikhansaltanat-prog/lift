/* =========================================================
   SURAPID Elevator KZ — site behaviour
========================================================= */
(function () {
  "use strict";

  const LANG_KEY = "surapid_lang";
  const LANGS = ["ru", "kz", "kg"];
  const LANG_LABEL = { ru: "РУС", kz: "ҚАЗ", kg: "КЫР" };
  const LANG_NAME = { ru: "Русский", kz: "Қазақша", kg: "Кыргызча" };
  const LANG_HTML_TAG = { ru: "ru", kz: "kk", kg: "ky" };
  let currentLang = localStorage.getItem(LANG_KEY) || "ru";
  if (!LANGS.includes(currentLang)) currentLang = "ru";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function t(key, lang) {
    const dict = TRANSLATIONS[lang || currentLang];
    return (dict && dict[key]) || key;
  }

  function resolveField(field, lang) {
    if (field == null) return "";
    if (typeof field === "string") return field;
    return field[lang] || field.ru || "";
  }

  /* ---------------------------------------------------------
     i18n
  --------------------------------------------------------- */
  function applyStaticTranslations(lang) {
    $$("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"), lang);
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder"), lang));
    });
    $$("[data-lang-label]").forEach((el) => {
      el.textContent = LANG_LABEL[lang];
    });
    document.documentElement.lang = LANG_HTML_TAG[lang] || "ru";
    document.documentElement.classList.toggle("lang-kz", lang === "kz");
    document.documentElement.classList.toggle("lang-kg", lang === "kg");
  }

  function setLanguage(lang, opts) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyStaticTranslations(lang);
    renderProducts(lang);
    renderFooterProducts(lang);
    renderGallery(lang);
    renderReviews(lang);
    renderVideos(lang);
    renderLangDropdowns();
    if (!(opts && opts.silent)) {
      resetAiChat(lang);
    }
  }

  /* ---------------------------------------------------------
     Language dropdown widgets (desktop + mobile)
  --------------------------------------------------------- */
  const langWidgets = $$("[data-lang-widget]");

  function closeLangDropdowns() {
    langWidgets.forEach((w) => {
      const dropdown = $("[data-lang-dropdown]", w);
      const toggle = $("[data-lang-toggle]", w);
      const chevron = $("[data-lang-chevron]", w);
      dropdown.classList.add("opacity-0", "scale-95", "-translate-y-1", "pointer-events-none");
      toggle.setAttribute("aria-expanded", "false");
      if (chevron) chevron.style.transform = "";
    });
  }

  function openLangDropdown(widget) {
    closeLangDropdowns();
    const dropdown = $("[data-lang-dropdown]", widget);
    const toggle = $("[data-lang-toggle]", widget);
    const chevron = $("[data-lang-chevron]", widget);
    dropdown.classList.remove("opacity-0", "scale-95", "-translate-y-1", "pointer-events-none");
    toggle.setAttribute("aria-expanded", "true");
    if (chevron) chevron.style.transform = "rotate(180deg)";
  }

  function renderLangDropdowns() {
    langWidgets.forEach((widget) => {
      const dropdown = $("[data-lang-dropdown]", widget);
      dropdown.innerHTML = LANGS.filter((l) => l !== currentLang)
        .map(
          (l) =>
            `<button type="button" data-lang-option="${l}" role="option" class="w-full text-left px-4 py-2.5 text-[13.5px] font-semibold text-navy-950 hover:bg-metal-100 hover:text-accent-dark transition-colors duration-150">${LANG_NAME[l]}</button>`
        )
        .join("");
      $$("[data-lang-option]", dropdown).forEach((opt) => {
        opt.addEventListener("click", () => {
          setLanguage(opt.getAttribute("data-lang-option"));
          closeLangDropdowns();
        });
      });
    });
  }

  langWidgets.forEach((widget) => {
    const toggle = $("[data-lang-toggle]", widget);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeLangDropdowns();
      else openLangDropdown(widget);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-lang-widget]")) closeLangDropdowns();
  });

  /* ---------------------------------------------------------
     Mobile menu
  --------------------------------------------------------- */
  const burgerBtn = $("#burger-btn");
  const mobilePanel = $("#mobile-panel");
  const mobileBackdrop = $("#mobile-backdrop");

  function openMenu() {
    document.documentElement.classList.add("menu-open-state", "no-scroll");
    document.body.classList.add("no-scroll");
    burgerBtn.classList.add("menu-open");
    burgerBtn.setAttribute("aria-expanded", "true");
    mobileBackdrop.classList.remove("pointer-events-none");
    mobileBackdrop.classList.add("opacity-100");
  }
  function closeMenu() {
    document.documentElement.classList.remove("menu-open-state", "no-scroll");
    document.body.classList.remove("no-scroll");
    burgerBtn.classList.remove("menu-open");
    burgerBtn.setAttribute("aria-expanded", "false");
    mobileBackdrop.classList.add("pointer-events-none");
    mobileBackdrop.classList.remove("opacity-100");
  }
  burgerBtn.addEventListener("click", () => {
    document.documentElement.classList.contains("menu-open-state") ? closeMenu() : openMenu();
  });
  mobileBackdrop.addEventListener("click", closeMenu);
  $$(".mobile-link").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeProductModal();
      closeAiPanel();
      closeCertModal();
      closeLangDropdowns();
    }
  });

  /* ---------------------------------------------------------
     Header scroll shadow
  --------------------------------------------------------- */
  const header = $("#site-header");
  function onScrollHeader() {
    header.classList.toggle("shadow-elev-2", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------------------------------------------------
     Reveal on scroll
  --------------------------------------------------------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  function observeReveals(root) {
    $$("[data-reveal]", root).forEach((el) => revealIO.observe(el));
  }

  /* ---------------------------------------------------------
     Counters
  --------------------------------------------------------- */
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-count"), 10);
        const start = performance.now();
        const duration = 1500;
        function step(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$(".counter").forEach((el) => counterIO.observe(el));

  /* ---------------------------------------------------------
     Products grid + modal
  --------------------------------------------------------- */
  const productGrid = $("#product-grid");
  const footerProducts = $("#footer-products");

  const MORE_LABEL = { ru: "Подробнее", kz: "Толығырақ", kg: "Кеӊири" };

  function renderProducts(lang) {
    productGrid.innerHTML = PRODUCTS.map(
      (p, i) => `
      <button type="button" data-reveal data-product-id="${p.id}" class="product-card group text-left bg-white hover:bg-metal-50 border border-metal-200 rounded-3xl overflow-hidden shadow-elev-1 hover:shadow-elev-2 transition-all duration-300">
        <div class="aspect-[4/3] overflow-hidden relative">
          <img src="${p.img}" alt="${resolveField(p.title, lang)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/5 to-transparent"></div>
          <span class="absolute top-3 left-3 text-[10.5px] font-bold tracking-wide bg-accent text-white px-2.5 py-1 rounded-full">${resolveField(p.tag, lang)}</span>
        </div>
        <div class="p-5">
          <h3 class="font-display font-semibold text-[15.5px] text-navy-950 leading-snug">${resolveField(p.title, lang)}</h3>
          <p class="mt-2 text-[13px] text-metal-600 line-clamp-2">${resolveField(p.desc, lang)}</p>
          <span class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-dark">
            ${MORE_LABEL[lang] || MORE_LABEL.ru}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform duration-200"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </div>
      </button>`
    ).join("");
    $$(".product-card", productGrid).forEach((card) => {
      card.addEventListener("click", () => openProductModal(card.getAttribute("data-product-id")));
    });
    observeReveals(productGrid);
  }

  function renderFooterProducts(lang) {
    footerProducts.innerHTML = PRODUCTS.slice(0, 6)
      .map((p) => `<li><a href="#products" class="hover:text-white transition-colors">${resolveField(p.title, lang)}</a></li>`)
      .join("");
  }

  const productModal = $("#product-modal");
  const productModalCard = $(".modal-card", productModal);
  const productModalImg = $("#product-modal-img");
  const productModalTitle = $("#product-modal-title");
  const productModalDesc = $("#product-modal-desc");
  const productModalSpecs = $("#product-modal-specs");
  const productModalCta = $("#product-modal-cta");

  function openProductModal(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    productModalImg.innerHTML = `<img src="${p.img}" alt="${resolveField(p.title, currentLang)}" class="w-full h-full object-cover" />`;
    productModalTitle.textContent = resolveField(p.title, currentLang);
    productModalDesc.textContent = resolveField(p.desc, currentLang);
    productModalSpecs.innerHTML = p.specs
      .map(
        (row, i) => `
        <div class="spec-row flex justify-between gap-4 px-5 py-3 text-[13.5px]">
          <span class="text-metal-500">${resolveField(row.k, currentLang)}</span>
          <span class="text-navy-950 font-semibold text-right">${resolveField(row.v, currentLang)}</span>
        </div>`
      )
      .join("");
    productModalCta.onclick = () => {
      const typeSelect = $("#rfq-type");
      if (typeSelect) typeSelect.selectedIndex = 0;
      const msg = $('textarea[name="message"]');
      if (msg) {
        const labels = { ru: "Модель, которая заинтересовала", kz: "Қызығушылық танытқан модель", kg: "Кызыккан модель" };
        const label = labels[currentLang] || labels.ru;
        msg.value = `${label}: ${resolveField(p.title, currentLang)}`;
      }
      closeProductModal();
    };
    productModal.classList.remove("hidden");
    requestAnimationFrame(() => {
      productModal.classList.remove("opacity-0");
      productModal.classList.add("flex");
      productModalCard.classList.remove("opacity-0", "translate-y-4");
    });
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
  }
  function closeProductModal() {
    if (productModal.classList.contains("hidden")) return;
    productModal.classList.add("opacity-0");
    productModalCard.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => {
      productModal.classList.add("hidden");
      productModal.classList.remove("flex");
    }, 260);
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
  }
  $("#product-modal-close").addEventListener("click", closeProductModal);
  $("#product-modal-backdrop").addEventListener("click", closeProductModal);

  /* ---------------------------------------------------------
     Gallery + Reviews render (content only; carousel engine below)
  --------------------------------------------------------- */
  const galleryTrack = $("#gallery-track");
  const reviewsTrack = $("#reviews-track");

  function galleryCardHTML(item, lang) {
    return `
      <div class="carousel-item shrink-0 w-[210px] sm:w-[260px] rounded-2xl overflow-hidden bg-white border border-metal-200 shadow-elev-1">
        <div class="aspect-[4/5] overflow-hidden">
          <img src="Photo/${item.img}" alt="${resolveField(item.cap, lang)}" loading="lazy" class="w-full h-full object-cover" draggable="false" />
        </div>
        <div class="px-3.5 py-3">
          <p class="text-[12.5px] font-semibold text-navy-950 truncate">${resolveField(item.cap, lang)}</p>
        </div>
      </div>`;
  }

  function reviewCardHTML(item, lang) {
    return `
      <div class="carousel-item shrink-0 w-[280px] sm:w-[360px] bg-white border border-metal-200 rounded-3xl p-6 shadow-elev-1">
        <svg width="26" height="20" viewBox="0 0 32 24" fill="none" class="text-accent mb-3"><path d="M0 24V13.6C0 6 4.8 1 12.8 0l1.6 3.6C9.2 5.2 6.8 8 6.8 12h6.4v12H0zm18.4 0V13.6C18.4 6 23.2 1 31.2 0l1.6 3.6c-5.2 1.6-7.6 4.4-7.6 8.4h6.4v12H18.4z" fill="currentColor"/></svg>
        <p class="text-[14px] text-metal-700 leading-relaxed">${resolveField(item.text, lang)}</p>
        <div class="mt-5 flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-display font-bold text-[13px] shrink-0">${resolveField(item.role, lang).charAt(0)}</div>
          <p class="text-[12.5px] text-metal-500 font-medium">${resolveField(item.role, lang)}</p>
        </div>
      </div>`;
  }

  function renderGallery(lang) {
    const html = GALLERY.map((g) => galleryCardHTML(g, lang)).join("");
    galleryTrack.innerHTML = html + html; // duplicate set for seamless loop
    initCarousel("gallery-viewport", "gallery-track", GALLERY.length, { speed: 26, dir: 1 });
  }
  function renderReviews(lang) {
    const html = REVIEWS.map((r) => reviewCardHTML(r, lang)).join("");
    reviewsTrack.innerHTML = html + html;
    initCarousel("reviews-viewport", "reviews-track", REVIEWS.length, { speed: 22, dir: -1 });
  }

  /* ---------------------------------------------------------
     Video showcase (official SURAPID YouTube videos)
  --------------------------------------------------------- */
  const videoGrid = $("#video-grid");
  function renderVideos(lang) {
    if (!videoGrid) return;
    videoGrid.innerHTML = VIDEOS.map(
      (v) => `
      <div data-reveal class="rounded-3xl overflow-hidden shadow-elev-2 border border-metal-200 bg-navy-950">
        <div class="aspect-video">
          <iframe
            class="w-full h-full"
            src="https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1"
            title="${resolveField(v.title, lang)}"
            loading="lazy"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <p class="px-5 py-4 text-[13.5px] font-semibold text-navy-950 bg-white">${resolveField(v.title, lang)}</p>
      </div>`
    ).join("");
    observeReveals(videoGrid);
  }

  /* ---------------------------------------------------------
     Certificate lightbox
  --------------------------------------------------------- */
  const certModal = $("#cert-modal");
  const certModalCard = $("#cert-modal-card");
  function openCertModal() {
    certModal.classList.remove("hidden");
    requestAnimationFrame(() => {
      certModal.classList.remove("opacity-0");
      certModal.classList.add("flex");
      certModalCard.classList.remove("opacity-0", "translate-y-4");
    });
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
  }
  function closeCertModal() {
    if (certModal.classList.contains("hidden")) return;
    certModal.classList.add("opacity-0");
    certModalCard.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => {
      certModal.classList.add("hidden");
      certModal.classList.remove("flex");
    }, 260);
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
  }
  const certThumb = $("#cert-thumb");
  const certViewBtn = $("#cert-view-btn");
  if (certThumb) certThumb.addEventListener("click", openCertModal);
  if (certViewBtn) certViewBtn.addEventListener("click", openCertModal);
  $("#cert-modal-close").addEventListener("click", closeCertModal);
  $("#cert-modal-backdrop").addEventListener("click", closeCertModal);

  /* ---------------------------------------------------------
     Infinite draggable carousel engine
  --------------------------------------------------------- */
  const carousels = {};

  function initCarousel(viewportId, trackId, itemCount, opts) {
    const viewport = document.getElementById(viewportId);
    const track = document.getElementById(trackId);
    if (!viewport || !track) return;

    // tear down previous instance if re-rendered
    if (carousels[trackId] && carousels[trackId].cancel) carousels[trackId].cancel();

    const state = {
      pos: 0,
      dragging: false,
      startX: 0,
      startPos: 0,
      targetPos: null,
      hovering: false,
      realWidth: 0,
      itemWidth: 0,
      lastTime: null,
      raf: null,
      dir: opts.dir || 1,
      speed: opts.speed || 30,
    };

    function measure() {
      const items = $$(".carousel-item", track);
      if (items.length < itemCount * 2) return;
      const firstOfSetA = items[0];
      const firstOfSetB = items[itemCount];
      state.realWidth = firstOfSetB.offsetLeft - firstOfSetA.offsetLeft;
      state.itemWidth = state.realWidth / itemCount;
    }
    measure();

    function wrap(p) {
      if (state.realWidth <= 0) return p;
      while (p <= -state.realWidth) p += state.realWidth;
      while (p > 0) p -= state.realWidth;
      return p;
    }

    function loop(now) {
      if (state.lastTime == null) state.lastTime = now;
      const dt = Math.min(0.05, (now - state.lastTime) / 1000);
      state.lastTime = now;

      if (!state.dragging) {
        if (state.targetPos != null) {
          state.pos += (state.targetPos - state.pos) * 0.16;
          if (Math.abs(state.targetPos - state.pos) < 0.6) {
            state.pos = state.targetPos;
            state.targetPos = null;
          }
        } else if (!state.hovering) {
          state.pos -= state.speed * dt * state.dir;
        }
      }
      state.pos = wrap(state.pos);
      track.style.transform = `translateX(${state.pos}px)`;
      state.raf = requestAnimationFrame(loop);
    }
    state.raf = requestAnimationFrame(loop);

    function onPointerDown(e) {
      state.dragging = true;
      state.targetPos = null;
      state.startX = e.clientX;
      state.startPos = state.pos;
      viewport.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e) {
      if (!state.dragging) return;
      state.pos = state.startPos + (e.clientX - state.startX);
    }
    function onPointerUp() {
      if (!state.dragging) return;
      state.dragging = false;
      const iw = state.itemWidth || 1;
      state.targetPos = Math.round(state.pos / iw) * iw;
    }
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("mouseenter", () => (state.hovering = true));
    viewport.addEventListener("mouseleave", () => (state.hovering = false));

    function onResize() {
      measure();
    }
    window.addEventListener("resize", onResize);

    carousels[trackId] = {
      state,
      cancel() {
        cancelAnimationFrame(state.raf);
        window.removeEventListener("resize", onResize);
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointermove", onPointerMove);
        viewport.removeEventListener("pointerup", onPointerUp);
        viewport.removeEventListener("pointercancel", onPointerUp);
      },
    };
  }

  $$(".carousel-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const trackId = btn.getAttribute("data-target");
      const dirClick = Number(btn.getAttribute("data-dir"));
      const c = carousels[trackId];
      if (!c) return;
      const iw = c.state.itemWidth || 1;
      const base = c.state.targetPos != null ? c.state.targetPos : c.state.pos;
      c.state.targetPos = base - iw * dirClick;
    });
  });

  /* ---------------------------------------------------------
     RFQ form
  --------------------------------------------------------- */
  const rfqForm = $("#rfq-form");
  const rfqSuccess = $("#rfq-success");
  rfqForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!rfqForm.checkValidity()) {
      rfqForm.reportValidity();
      return;
    }
    rfqForm.classList.add("hidden");
    rfqSuccess.classList.remove("hidden");
    rfqSuccess.classList.add("flex");
    rfqForm.reset();
  });

  /* ---------------------------------------------------------
     AI Assistant
  --------------------------------------------------------- */
  const aiToggle = $("#ai-toggle");
  const aiPanel = $("#ai-panel");
  const aiClose = $("#ai-close");
  const aiMessages = $("#ai-messages");
  const aiForm = $("#ai-form");
  const aiInput = $("#ai-input");
  const aiSuggestions = $("#ai-suggestions");
  const aiIconChat = $("#ai-icon-chat");
  const aiIconClose = $("#ai-icon-close");

  let aiOpen = false;

  function openAiPanel() {
    aiOpen = true;
    aiPanel.classList.remove("hidden");
    requestAnimationFrame(() => {
      aiPanel.classList.remove("opacity-0", "translate-y-3");
      aiPanel.classList.add("flex", "flex-col");
    });
    aiIconChat.classList.add("hidden");
    aiIconClose.classList.remove("hidden");
    aiToggle.setAttribute("aria-expanded", "true");
    if (!aiMessages.dataset.greeted) {
      resetAiChat(currentLang);
    }
    setTimeout(() => aiInput.focus(), 300);
  }
  function closeAiPanel() {
    if (!aiOpen) return;
    aiOpen = false;
    aiPanel.classList.add("opacity-0", "translate-y-3");
    setTimeout(() => {
      aiPanel.classList.add("hidden");
      aiPanel.classList.remove("flex", "flex-col");
    }, 250);
    aiIconChat.classList.remove("hidden");
    aiIconClose.classList.add("hidden");
    aiToggle.setAttribute("aria-expanded", "false");
  }
  aiToggle.addEventListener("click", () => (aiOpen ? closeAiPanel() : openAiPanel()));
  aiClose.addEventListener("click", closeAiPanel);

  function addBubble(text, from) {
    const wrap = document.createElement("div");
    wrap.className = `chat-bubble-in flex ${from === "user" ? "justify-end" : "justify-start"}`;
    const bubble = document.createElement("div");
    bubble.className =
      from === "user"
        ? "max-w-[80%] bg-navy-950 text-white text-[13.5px] leading-relaxed rounded-2xl rounded-br-md px-4 py-2.5"
        : "max-w-[80%] bg-white border border-metal-200 text-navy-950 text-[13.5px] leading-relaxed rounded-2xl rounded-bl-md px-4 py-2.5 shadow-elev-1";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    aiMessages.appendChild(wrap);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "chat-bubble-in flex justify-start";
    wrap.id = "ai-typing";
    wrap.innerHTML = `<div class="bg-white border border-metal-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-elev-1 flex items-center gap-1.5">
      <span class="typing-dot w-1.5 h-1.5 rounded-full bg-metal-400"></span>
      <span class="typing-dot w-1.5 h-1.5 rounded-full bg-metal-400"></span>
      <span class="typing-dot w-1.5 h-1.5 rounded-full bg-metal-400"></span>
    </div>`;
    aiMessages.appendChild(wrap);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    return wrap;
  }

  function matchKB(text) {
    const norm = text.toLowerCase();
    let best = null;
    let bestScore = 0;
    AI_KB.forEach((entry) => {
      let score = 0;
      entry.keywords.forEach((kw) => {
        if (norm.includes(kw)) score += kw.length; // longer/more specific keyword hits weigh more
      });
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });
    return best;
  }

  function botReply(userText) {
    const typing = addTyping();
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      typing.remove();
      const entry = matchKB(userText);
      const answer = entry ? resolveField(entry.answer, currentLang) : t("ai.fallback");
      addBubble(answer, "bot");
    }, delay);
  }

  function sendUserMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    addBubble(clean, "user");
    botReply(clean);
  }

  aiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = aiInput.value;
    aiInput.value = "";
    sendUserMessage(val);
  });

  const SUGGESTION_IDS = ["products", "price", "warranty", "contact"];
  function renderAiSuggestions(lang) {
    const labels = {
      products: { ru: "Продукция", kz: "Өнімдер" },
      price: { ru: "Цена", kz: "Бағасы" },
      warranty: { ru: "Гарантия", kz: "Кепілдік" },
      contact: { ru: "Контакты", kz: "Байланыс" },
    };
    aiSuggestions.innerHTML = SUGGESTION_IDS.map(
      (id) => `<button type="button" data-kb="${id}" class="ai-chip text-[12px] font-semibold text-navy-950 bg-white border border-metal-300 hover:border-accent hover:text-accent-dark rounded-full px-3 py-1.5 transition-colors duration-200">${labels[id][lang]}</button>`
    ).join("");
    $$(".ai-chip", aiSuggestions).forEach((chip) => {
      chip.addEventListener("click", () => {
        const entry = AI_KB.find((x) => x.id === chip.getAttribute("data-kb"));
        if (!entry) return;
        addBubble(chip.textContent, "user");
        const typing = addTyping();
        setTimeout(() => {
          typing.remove();
          addBubble(resolveField(entry.answer, currentLang), "bot");
        }, 450 + Math.random() * 350);
      });
    });
  }

  function resetAiChat(lang) {
    aiMessages.innerHTML = "";
    aiMessages.dataset.greeted = "1";
    addBubble(t("ai.greeting", lang), "bot");
    renderAiSuggestions(lang);
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  setLanguage(currentLang, { silent: true });
  observeReveals(document);
  aiMessages.dataset.greeted = "";

  // Safety net: guarantee content is never permanently invisible.
  setTimeout(() => {
    $$("[data-reveal]:not(.in-view)").forEach((el) => el.classList.add("in-view"));
  }, 2500);
})();
