(function () {
  const API = window.API_BASE;
  const $ = (id) => document.getElementById(id);

  const statusEl = $("status");
  const loginCard = $("loginCard");
  const appCard = $("appCard");

  const tokenInput = $("tokenInput");
  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");

  const createBtn = $("createBtn");
  const grid = $("itemsGrid");

  let token = localStorage.getItem("admin_token") || "";

  function setStatus(text) { statusEl.textContent = text; }

  function authHeaders() {
    return token ? { authorization: "Bearer " + token } : {};
  }

  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        "content-type": "application/json",
        ...(opts.headers || {}),
        ...authHeaders()
      }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    return data;
  }

  function showApp(yes) {
    loginCard.classList.toggle("hidden", yes);
    appCard.classList.toggle("hidden", !yes);
    setStatus(yes ? "Connesso" : "Non connesso");
  }

  function toCents(euroStr) {
    const n = Number(String(euroStr).replace(",", "."));
    return Math.round(n * 100);
  }

  function fromCents(c) {
    return (c / 100).toFixed(2);
  }

  async function loadItems() {
    grid.innerHTML = "Caricamento...";
    const { items } = await api("/api/menu");

    // raggruppa per categoria
    grid.innerHTML = "";
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="item-head">
          <strong>${escapeHtml(it.name)}</strong>
          <span>€ ${fromCents(it.price_cents)}</span>
        </div>
        <div style="opacity:.75; font-size:14px; margin-top:6px;">
          ${escapeHtml(it.category || "")} • pos ${it.position}
        </div>
        <div style="margin-top:8px; font-size:14px; opacity:.85;">
          ${escapeHtml(it.description || "")}
        </div>

        <div class="row" style="margin-top:12px;">
          <div style="flex:1; min-width:180px;">
            <label>Nome</label>
            <input data-k="name" value="${escapeAttr(it.name)}"/>
          </div>
          <div style="width:160px; min-width:140px;">
            <label>Prezzo (€)</label>
            <input data-k="price" type="number" step="0.01" value="${fromCents(it.price_cents)}"/>
          </div>
          <div style="flex:1; min-width:180px;">
            <label>Categoria</label>
            <input data-k="category" value="${escapeAttr(it.category || "")}"/>
          </div>
          <div style="width:130px; min-width:110px;">
            <label>Pos</label>
            <input data-k="position" type="number" step="1" value="${it.position}"/>
          </div>
          <div style="flex:1; min-width:240px;">
            <label>Immagine URL</label>
            <input data-k="image_url" value="${escapeAttr(it.image_url || "")}"/>
          </div>
          <div style="flex:1; min-width:240px;">
            <label>Descrizione</label>
            <textarea data-k="description">${escapeHtml(it.description || "")}</textarea>
          </div>
          <div style="width:170px; min-width:150px;">
            <label>Disponibile</label>
            <select data-k="is_available">
              <option value="true" ${it.is_available ? "selected":""}>Si</option>
              <option value="false" ${!it.is_available ? "selected":""}>No</option>
            </select>
          </div>
        </div>

        <div class="row" style="margin-top:10px;">
          <button class="btn" data-act="save">Salva</button>
          <button class="btn danger" data-act="del">Elimina</button>
        </div>
        <div style="margin-top:10px; opacity:.7; font-size:14px;" data-msg=""></div>
      `;

      card.querySelector('[data-act="save"]').onclick = async () => {
        const msg = card.querySelector('[data-msg=""]');
        msg.textContent = "Salvataggio...";
        try {
          const payload = readPayload(card);
          await api("/api/admin/menu/" + it.id, { method: "PUT", body: JSON.stringify(payload) });
          msg.textContent = "✅ Salvato";
          await loadItems();
        } catch (e) {
          msg.textContent = "❌ " + e.message;
        }
      };

      card.querySelector('[data-act="del"]').onclick = async () => {
        const ok = confirm("Eliminare '" + it.name + "'?");
        if (!ok) return;
        const msg = card.querySelector('[data-msg=""]');
        msg.textContent = "Eliminazione...";
        try {
          await api("/api/admin/menu/" + it.id, { method: "DELETE" });
          msg.textContent = "✅ Eliminato";
          await loadItems();
        } catch (e) {
          msg.textContent = "❌ " + e.message;
        }
      };

      grid.appendChild(card);
    });

    if (!items.length) grid.innerHTML = "<div class='card'>Nessun prodotto. Aggiungine uno sopra.</div>";
  }

  function readPayload(card) {
    const get = (k) => card.querySelector(`[data-k="${k}"]`);
    return {
      name: get("name").value.trim(),
      description: get("description").value.trim(),
      price_cents: toCents(get("price").value),
      category: get("category").value.trim(),
      position: Number(get("position").value || 0),
      is_available: get("is_available").value === "true",
      image_url: get("image_url").value.trim() || null
    };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
    }[c]));
  }
  function escapeAttr(s){ return escapeHtml(s).replace(/"/g, "&quot;"); }

  // LOGIN
  loginBtn.onclick = async () => {
    token = tokenInput.value.trim();
    localStorage.setItem("admin_token", token);
    try {
      // test: prova a leggere menu (pubblico) e poi salva un update finto? no.
      // Qui basta caricare items e se admin token è sbagliato lo scopri quando salvi.
      showApp(true);
      await loadItems();
    } catch (e) {
      showApp(false);
      alert("Errore: " + e.message);
    }
  };

  logoutBtn.onclick = () => {
    token = "";
    localStorage.removeItem("admin_token");
    tokenInput.value = "";
    showApp(false);
  };

  // CREA
  createBtn.onclick = async () => {
    const payload = {
      name: $("name").value.trim(),
      description: $("description").value.trim(),
      price_cents: toCents($("price").value),
      category: $("category").value.trim(),
      position: Number($("position").value || 0),
      is_available: $("is_available").value === "true",
      image_url: $("image_url").value.trim() || null
    };

    if (!payload.name) return alert("Nome obbligatorio");
    if (!Number.isFinite(payload.price_cents)) return alert("Prezzo non valido");

    try {
      await api("/api/admin/menu", { method: "POST", body: JSON.stringify(payload) });
      $("name").value = "";
      $("description").value = "";
      $("price").value = "";
      $("category").value = "";
      $("position").value = "0";
      $("image_url").value = "";
      $("is_available").value = "true";
      await loadItems();
      alert("✅ Aggiunto");
    } catch (e) {
      alert("❌ " + e.message);
    }
  };

  // AUTO START se token già salvato
  if (token) {
    tokenInput.value = token;
    showApp(true);
    loadItems().catch(() => showApp(false));
  } else {
    showApp(false);
  }
})();