(async function () {
const API =
  (window.API_BASE && String(window.API_BASE).replace(/\/$/, "")) ||
  "";
  
  // ✅ 1) LINGUA (IT / EN) — PRIMA della fetch
  let LANG = localStorage.getItem("lang") || "it";
  const langBtns = Array.from(document.querySelectorAll(".langbtn"));

  function paintLang() {
    langBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.lang === LANG));
  }

  // ============================
  // 2) RECUPERO DATI DAL WORKER
  // ============================
  let items = [];
  try {
    const res = await fetch(`${API}/api/menu?lang=${LANG}&t=${Date.now()}`, { cache: "no-store" });
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
  const menuEl = document.querySelector("main.menu") || document.querySelector(".menu");

  // ✅ Mappa allergeni -> icona + label (IT/EN)
  const ALLERGENS = {
    glutine: { icon: "🌾", it: "Glutine", en: "Gluten" },
    crostacei: { icon: "🦐", it: "Crostacei", en: "Crustaceans" },
    uova: { icon: "🥚", it: "Uova", en: "Eggs" },
    pesce: { icon: "🐟", it: "Pesce", en: "Fish" },
    arachidi: { icon: "🥜", it: "Arachidi", en: "Peanuts" },
    soia: { icon: "🫘", it: "Soia", en: "Soy" },
    latte: { icon: "🥛", it: "Latte", en: "Milk" },
    frutta_a_guscio: { icon: "🌰", it: "Frutta a guscio", en: "Nuts" },
    sedano: { icon: "🥬", it: "Sedano", en: "Celery" },
    senape: { icon: "🟡", it: "Senape", en: "Mustard" },
    sesamo: { icon: "⚪", it: "Sesamo", en: "Sesame" },
    solfiti: { icon: "🍷", it: "Solfiti", en: "Sulphites" },
    lupini: { icon: "🫘", it: "Lupini", en: "Lupin" },
    molluschi: { icon: "🦪", it: "Molluschi", en: "Molluscs" },
    nichel: { icon: "🧲", it: "Nichel", en: "Nickel" }
  };

  function labelForAllergen(key) {
    const a = ALLERGENS[key];
    if (!a) return key;
    return LANG === "en" ? a.en : a.it;
  }

  function iconForAllergen(key) {
    const a = ALLERGENS[key];
    return a ? a.icon : "•";
  }

  function renderMenu() {
    if (!menuEl) return;

    // ✅ raccoglie TUTTI gli allergeni del menu (per legenda unica in fondo)
    const usedAllergens = new Set();

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

const rawAll = Array.isArray(it.allergens) ? it.allergens : [];

// ✅ deduplica + pulizia (niente doppioni, niente valori vuoti)
const itemAll = Array.from(new Set(rawAll.map(String).map(s => s.trim()).filter(Boolean)));

// ✅ aggiunge alla legenda (una sola volta) solo i puliti
itemAll.forEach((k) => usedAllergens.add(k));

const iconsRow =
  itemAll.length
    ? `<div class="item-allergens" style="margin-top:6px; font-size:18px; line-height:1;">
         ${itemAll
           .map((k) => `<span title="${escapeHtml(labelForAllergen(k))}">${iconForAllergen(k)}</span>`)
           .join(" ")}
       </div>`
    : "";

              return `
  <div class="item">

    <div class="item-row">
      <span>${escapeHtml(name)}</span>
      <span>€ ${formatEuro(it.price_cents)}</span>
    </div>
                  ${iconsRow}
                  ${desc ? `<div class="item-desc">${escapeHtml(desc)}</div>` : ``}
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      menuEl.appendChild(sec);
    }

    // ✅ LEGENDA UNA SOLA VOLTA IN FONDO
    const list = Array.from(usedAllergens).filter(Boolean);
    if (list.length) {
      // opzionale: ordine “stabile” secondo la mappa
      const order = Object.keys(ALLERGENS);
      list.sort((a, b) => order.indexOf(a) - order.indexOf(b));

      const legendTitle = LANG === "en" ? "Allergen legend" : "Legenda allergeni";

      const legend = document.createElement("section");
      legend.className = "menu-legend";
      legend.innerHTML = `
        <div style="margin-top:18px; padding-top:14px; border-top:1px solid rgba(0,0,0,.12);">
          <h3 style="margin:0 0 10px 0;">${legendTitle}</h3>
          <div style="display:grid; gap:8px;">
            ${list
              .map(
                (k) => `
                  <div style="display:flex; gap:10px; align-items:center;">
                    <span style="font-size:20px;">${iconForAllergen(k)}</span>
                    <span>${escapeHtml(labelForAllergen(k))}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `;
      menuEl.appendChild(legend);
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

    mobileMenu.hidden = false;
    mobileMenu.classList.add("is-open");

    if (backdrop) backdrop.hidden = false;

    document.body.style.overflow = "hidden";
    if (burger) burger.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    if (!mobileMenu) return;

    mobileMenu.classList.remove("is-open");

    const ms = 320;
    setTimeout(() => {
      if (!mobileMenu.classList.contains("is-open")) {
        mobileMenu.hidden = true;
        if (backdrop) backdrop.hidden = true;
        document.body.style.overflow = "";
        if (burger) burger.setAttribute("aria-expanded", "false");
      }
    }, ms);
  }

window.addEventListener("pageshow", closeMenu);
window.addEventListener("pagehide", closeMenu);

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
      "\"": "&quot;",
      "'": "&#039;"
    }[c]));
  }
})();
