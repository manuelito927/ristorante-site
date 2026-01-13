(async function () {
  const API = window.API_BASE || "https://still-haze-01c8.filosofiaefficace.workers.dev";

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

  // Ordina per position dentro ogni categoria
  for (const [cat, arr] of byCat.entries()) {
    arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  // 3) Trova il contenitore del menu nella pagina cliente
  // Usa il tuo <main class="menu"> (già presente)
  const menuEl = document.querySelector("main.menu") || document.querySelector(".menu");
  if (!menuEl) return;

  // 4) Render HTML dinamico
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

  // 5) Accordion (apri/chiudi)
  document.querySelectorAll(".js-toggle").forEach((btn) => {
    const content = btn.nextElementSibling;
    const plus = btn.querySelector(".plus");

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      content.hidden = isOpen;
      plus.textContent = isOpen ? "+" : "–";
    });
  });

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