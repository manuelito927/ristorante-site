(async function () {
  const API =
    (window.API_BASE && String(window.API_BASE).replace(/\/$/, "")) ||
    "https://still-haze-01c8.filosofiaefficace.workers.dev";

  // ✅ 1) LINGUA (IT / EN) — PRIMA della fetch
  let LANG = localStorage.getItem("lang") || "it";
  const langBtns = Array.from(document.querySelectorAll(".langbtn"));

  function paintLang() {
    langBtns.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.lang === LANG)
    );
  }

  // ============================
  // 1.b ALLERGENI (ICONE + LABEL)
  // ============================
  const ALLERGENS = {
    glutine: { label_it: "Glutine", label_en: "Gluten", icon: "🌾" },
    crostacei: { label_it: "Crostacei", label_en: "Crustaceans", icon: "🦐" },
    uova: { label_it: "Uova", label_en: "Eggs", icon: "🥚" },
    pesce: { label_it: "Pesce", label_en: "Fish", icon: "🐟" },
    arachidi: { label_it: "Arachidi", label_en: "Peanuts", icon: "🥜" },
    soia: { label_it: "Soia", label_en: "Soy", icon: "🌱" },
    latte: { label_it: "Latte", label_en: "Milk", icon: "🥛" },
    frutta_a_guscio: { label_it: "Frutta a guscio", label_en: "Nuts", icon: "🌰" },
    sedano: { label_it: "Sedano", label_en: "Celery", icon: "🥬" },
    senape: { label_it: "Senape", label_en: "Mustard", icon: "🟡" },
    sesamo: { label_it: "Sesamo", label_en: "Sesame", icon: "⚪️" },
    solfiti: { label_it: "Solfiti", label_en: "Sulphites", icon: "🍷" },
    lupini: { label_it: "Lupini", label_en: "Lupin", icon: "🫘" },
    molluschi: { label_it: "Molluschi", label_en: "Molluscs", icon: "🦪" },
    nichel: { label_it: "Nichel", label_en: "Nickel", icon: "🧲" }
  };

  function allergenLabel(k) {
    const x = ALLERGENS[k];
    if (!x) return "";
    return LANG === "en" ? x.label_en : x.label_it;
  }

  function renderAllergensInline(arr) {
    const a = Array.isArray(arr) ? arr : [];
    const filtered = a.filter((k) => !!ALLERGENS[k]);
    if (!filtered.length) return "";
    return `
      <div class="alg-row">
        ${filtered
          .map((k) => {
            const x = ALLERGENS[k];
            const label = allergenLabel(k);
            return `<span class="alg-chip" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${x.icon}</span>`;
          })
          .join("")}
      </div>
    `;
  }

  function uniqueAllergensFromItems(arr) {
    const set = new Set();
    (arr || []).forEach((it) => {
      (Array.isArray(it.allergens) ? it.allergens : []).forEach((k) => {
        if (ALLERGENS[k]) set.add(k);
      });
    });
    return Array.from(set);
  }

  function renderLegend(keys) {
    const list = (keys || []).filter((k) => ALLERGENS[k]);
    if (!list.length) return "";

    const title = LANG === "en" ? "Allergens legend" : "Legenda allergeni";

    return `
      <div class="alg-legend">
        <div class="alg-legend__title">${escapeHtml(title)}</div>
        <div class="alg-legend__grid">
          ${list
            .map((k) => {
              const x = ALLERGENS[k];
              const label = allergenLabel(k);
              return `
                <div class="alg-legend__item">
                  <span class="alg-chip" title="${escapeHtml(label)}">${x.icon}</span>
                  <span class="alg-legend__label">${escapeHtml(label)}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // ============================
  // 2) RECUPERO DATI DAL WORKER
  // ============================
  let items = [];
  try {
    const res = await fetch(`${API}/api/menu?lang=${LANG}&t=${Date.now()}`, {
      cache: "no-store"
    });
    const data = await res.json();
    items = data.items || [];
  } catch (err) {
    console.error("Errore nel caricamento del menu:", err);
  }

  function pickText(it, itField, enField) {
    if (LANG === "en") {
      const v = it[enField];
      if (v && String(v).trim()) return String(v);
    }
    return String(it[itField] || "");
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      LANG = btn.dataset.lang || "it";
      localStorage.setItem("lang", LANG);
      paintLang();
      renderMenu();
    });
  });

  paintLang();

  // ============================
  // 3) RENDER MENU (ACCORDION)
  // ============================
  const menuEl =
    document.querySelector("main.menu") || document.querySelector(".menu");

  function renderMenu() {
    if (!menuEl) return;

    // Raggruppa per categoria (in base alla lingua)
    const byCat = new Map();
    for (const it of items) {
      const cat = pickText(it, "category", "category_en") || "Altro";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(it);
    }

    // Ordina per position dentro categoria
    for (const arr of byCat.values()) {
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    // Render HTML
    menuEl.innerHTML = "";

    for (const [cat, arr] of byCat.entries()) {
      const sec = document.createElement("section");
      sec.className = "menu-section";

      const legendKeys = uniqueAllergensFromItems(arr);

      sec.innerHTML = `
        <button class="menu-title js-toggle" type="button" aria-expanded="false">
          <h2>${escapeHtml(cat)}</h2>
          <span class="plus">+</span>
        </button>

        <div class="menu-content" hidden>
          ${arr
            .map((it) => {
              const name = pickText(it, "name", "name_en");
              const desc = pickText(it, "description", "description_en");
              return `
                <div class="item">
                  <div class="item-row">
                    <span>${escapeHtml(name)}</span>
                    <span>€ ${formatEuro(it.price_cents)}</span>
                  </div>
                  ${desc ? `<div class="item-desc">${escapeHtml(desc)}</div>` : ``}
                  ${renderAllergensInline(it.allergens)}
                </div>
              `;
            })
            .join("")}

          ${renderLegend(legendKeys)}
        </div>
      `;

      menuEl.appendChild(sec);
    }

    // Attiva accordion
    document.querySelectorAll(".js-toggle").forEach((btn) => {
      const content = btn.nextElementSibling;
      const plus = btn.querySelector(".plus");

      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (content) content.hidden = isOpen;
        if (plus) plus.textContent = isOpen ? "+" : "–";
      });
    });
  }

  renderMenu();

  /* ==========================================
     4) GESTIONE MENU MOBILE (STILE 400 GRADI)
     ========================================== */
  const burger = document.getElementById("jsHamburger");
  const mobileMenu = document.getElementById("jsMobileMenu");
  const backdrop = document.getElementById("jsMenuBackdrop");

  function openMenu() {
    if (!mobileMenu) return;

    // mostra menu + backdrop SEMPRE
    mobileMenu.hidden = false;
    mobileMenu.classList.add("is-open");

    if (backdrop) backdrop.hidden = false;

    document.body.style.overflow = "hidden";
    if (burger) burger.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    if (!mobileMenu) return;

    // chiude animazione
    mobileMenu.classList.remove("is-open");

    // chiude SEMPRE backdrop + nasconde menu dopo la transizione
    const ms = 320; // leggermente > 300ms del css
    setTimeout(() => {
      // se nel frattempo non è stato riaperto
      if (!mobileMenu.classList.contains("is-open")) {
        mobileMenu.hidden = true;
        if (backdrop) backdrop.hidden = true;
        document.body.style.overflow = "";
        if (burger) burger.setAttribute("aria-expanded", "false");
      }
    }, ms);
  }

  // stato iniziale “pulito” (evita overlay fantasma se la pagina ricarica)
  if (mobileMenu) mobileMenu.hidden = true;
  if (backdrop) backdrop.hidden = true;
  if (burger) burger.setAttribute("aria-expanded", "false");

  if (burger && mobileMenu) {
    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });

    if (backdrop) backdrop.addEventListener("click", closeMenu);

    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // ============================
  // Utility
  // ============================
  function formatEuro(cents) {
    const n = Number(cents || 0) / 100;
    return n.toFixed(2);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }
})();