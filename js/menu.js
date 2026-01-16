(async function () {
  const API =
    (window.API_BASE && String(window.API_BASE).replace(/\/$/, "")) ||
    "https://still-haze-01c8.filosofiaefficace.workers.dev";

  // ✅ 1) LINGUA (IT / EN) — PRIMA della fetch
  let LANG = localStorage.getItem("lang") || "it";
  const langBtns = Array.from(document.querySelectorAll(".langbtn"));

  function paintLang() {
    langBtns.forEach(b => b.classList.toggle("is-active", b.dataset.lang === LANG));
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

  langBtns.forEach(btn => {
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

      sec.innerHTML = `
        <button class="menu-title js-toggle" type="button" aria-expanded="false">
          <h2>${escapeHtml(cat)}</h2>
          <span class="plus">+</span>
        </button>
        <div class="menu-content" hidden>
          ${arr.map(it => {
            const name = pickText(it, "name", "name_en");
            const desc = pickText(it, "description", "description_en");
            return `
              <div class="item">
                <div class="item-row">
                  <span>${escapeHtml(name)}</span>
                  <span>€ ${formatEuro(it.price_cents)}</span>
                </div>
                ${desc ? `<div class="item-desc">${escapeHtml(desc)}</div>` : ``}
              </div>
            `;
          }).join("")}
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
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
    }[c]));
  }
})();