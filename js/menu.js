(async function () {
  const API =
    (window.API_BASE && String(window.API_BASE).replace(/\/$/, "")) ||
    "https://still-haze-01c8.filosofiaefficace.workers.dev";

  // 1) Prendi i prodotti dal Worker (no cache)
  const res = await fetch(`${API}/api/menu?t=${Date.now()}`, { cache: "no-store" });
  const data = await res.json();
  const items = data.items || [];

  // 2) Raggruppa per categoria
  const byCat = new Map();
  for (const it of items) {
    const cat = it.category || "Altro";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(it);
  }
  for (const [cat, arr] of byCat.entries()) {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  // 3) Render nel <main class="menu">
  const menuEl = document.querySelector("main.menu") || document.querySelector(".menu");
  if (!menuEl) return;

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
        ${arr.map(it => `
          <div class="item">
            <div class="item-row">
              <span>${escapeHtml(it.name)}</span>
              <span>€ ${formatEuro(it.price_cents)}</span>
            </div>
            ${it.description ? `<div class="item-desc">${escapeHtml(it.description)}</div>` : ``}
          </div>
        `).join("")}
      </div>
    `;
    menuEl.appendChild(sec);
  }

  // Accordion
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

  // MENU MOBILE A TENDINA
  const burger = document.getElementById("jsHamburger");
  const mobileMenu = document.getElementById("jsMobileMenu");
  const backdrop = document.getElementById("jsMenuBackdrop");

  function openMenu() {
    mobileMenu.classList.add("is-open");
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    burger.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    backdrop.hidden = true;
    document.body.style.overflow = "";
    burger.setAttribute("aria-expanded", "false");
  }

  if (burger && mobileMenu && backdrop) {
    burger.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });

    backdrop.addEventListener("click", closeMenu);

    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

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