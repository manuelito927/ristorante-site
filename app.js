// METTI QUI il tuo dominio Worker (API)
const API_BASE = "https://still-haze-01c8.filosofiaefficace.workers.dev";

const euro = (cents) => {
  const v = (Number(cents || 0) / 100).toFixed(2);
  return v.replace(".", ",") + " €";
};

function groupByCategory(items) {
  const map = new Map();
  for (const it of items) {
    const cat = (it.category && String(it.category).trim()) || "Altro";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(it);
  }
  return [...map.entries()];
}

function el(tag, cls, text){
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

async function loadMenu(){
  const root = document.getElementById("menuRoot");
  root.innerHTML = "Caricamento...";

  const res = await fetch(`${API_BASE}/api/menu`);
  const data = await res.json();

  const items = Array.isArray(data.items) ? data.items : [];
  const groups = groupByCategory(items);

  root.innerHTML = "";

  for (const [category, list] of groups) {
    const item = el("div", "acc-item");
    const head = el("button", "acc-head");
    head.type = "button";
    head.style.width = "100%";
    head.style.border = "none";
    head.style.background = "transparent";
    head.style.cursor = "pointer";

    const title = el("div", "", category);
    const plus = el("div", "acc-plus", "+");
    head.appendChild(title);
    head.appendChild(plus);

    const body = el("div", "acc-body");

    for (const mi of list) {
      const row = el("div", "menu-row");

      const imgWrap = el("div", "mi-img");
      if (mi.image_url) {
        const img = document.createElement("img");
        img.src = mi.image_url;
        img.alt = mi.name || "Piatto";
        imgWrap.appendChild(img);
      }
      const main = el("div", "mi-main");
      const name = el("p", "mi-name", mi.name || "");
      const desc = el("p", "mi-desc", mi.description || "");
      main.appendChild(name);
      if (mi.description) main.appendChild(desc);

      const price = el("div", "mi-price", euro(mi.price_cents));

      row.appendChild(imgWrap);
      row.appendChild(main);
      row.appendChild(price);

      body.appendChild(row);
    }

    item.appendChild(head);
    item.appendChild(body);

    head.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      plus.textContent = open ? "−" : "+";
    });

    root.appendChild(item);
  }

  if (!groups.length) {
    root.innerHTML = "Nessun prodotto nel menù (items è vuoto).";
  }
}

// Drawer
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
document.getElementById("openMenu").addEventListener("click", () => {
  drawer.classList.add("open");
  backdrop.classList.add("show");
});
document.getElementById("closeMenu").addEventListener("click", () => {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
});
backdrop.addEventListener("click", () => {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
});

loadMenu().catch(err => {
  document.getElementById("menuRoot").innerHTML =
    "Errore nel caricare il menù. Controlla API_BASE e /api/menu.";
  console.error(err);
});