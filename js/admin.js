(function () {
  const API = window.API_BASE;
  const $ = (id) => document.getElementById(id);

  const statusEl = $("status");
  const loginCard = $("loginCard");
  const appCard = $("appCard");

  const tokenInput = $("tokenInput");
  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");

  // MENU
  const createBtn = $("createBtn");
  const grid = $("itemsGrid");

  // COME FUNZIONA
  const cfSaveBtn = $("saveComeFunziona");

  // PRENOTAZIONI
  const reservationsGrid = $("reservationsGrid");
  const refreshReservationsBtn = $("refreshReservations");
  const reservationsMsg = $("reservationsMsg");

  // COME FUNZIONA FIELDS
  const cf_phone = $("cf_phone");
  const cf_address = $("cf_address");
  const cf_hours_it = $("cf_hours_it");
  const cf_hours_en = $("cf_hours_en");
  const cf_takeaway = $("cf_takeaway");
  const cf_gluten = $("cf_gluten");
  const cf_lactose = $("cf_lactose");
  const cf_pets = $("cf_pets");

// ✅ GALLERY (UPLOAD FILE)
const galSaveBtn = $("saveGallery");
const gal_files = $("gal_files");     // <input type="file" ...>
const galPreview = $("galPreview");   // div dove mostriamo anteprime (opzionale)

  let token = localStorage.getItem("admin_token") || "";

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

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
    if (loginCard) loginCard.classList.toggle("hidden", yes);
    if (appCard) appCard.classList.toggle("hidden", !yes);
    setStatus(yes ? "Connesso" : "Non connesso");
  }

  function toCents(euroStr) {
    const n = Number(String(euroStr).replace(",", "."));
    return Math.round(n * 100);
  }

  function fromCents(c) {
    return (c / 100).toFixed(2);
  }

  /* =========================================================
     MENU DIGITALE - CRUD
     ========================================================= */

  async function loadItems() {
    if (!grid) return;

    grid.innerHTML = "Caricamento...";
    const { items } = await api("/api/menu");

    grid.innerHTML = "";
    (items || []).forEach((it) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <strong>${escapeHtml(it.name)}</strong>
          <span>€ ${fromCents(it.price_cents)}</span>
        </div>

        <div style="opacity:.75; font-size:14px; margin-top:6px;">
          IT: ${escapeHtml(it.category || "")} • pos ${it.position}
        </div>
        <div style="opacity:.7; font-size:13px; margin-top:4px;">
          EN: ${escapeHtml(it.category_en || "")}
        </div>

        <div style="margin-top:8px; font-size:14px; opacity:.85;">
          <div><strong>IT</strong> — ${escapeHtml(it.description || "")}</div>
          <div style="margin-top:6px;"><strong>EN</strong> — ${escapeHtml(it.description_en || "")}</div>
        </div>

        <div class="row" style="margin-top:12px;">
          <div style="flex:1; min-width:180px;">
            <label>Nome (IT)</label>
            <input data-k="name" value="${escapeAttr(it.name)}"/>
          </div>

          <div style="flex:1; min-width:180px;">
            <label>Name (EN)</label>
            <input data-k="name_en" value="${escapeAttr(it.name_en || "")}"/>
          </div>

          <div style="width:160px; min-width:140px;">
            <label>Prezzo (€)</label>
            <input data-k="price" type="number" step="0.01" value="${fromCents(it.price_cents)}"/>
          </div>

          <div style="flex:1; min-width:180px;">
            <label>Categoria (IT)</label>
            <input data-k="category" value="${escapeAttr(it.category || "")}"/>
          </div>

          <div style="flex:1; min-width:180px;">
            <label>Categoria (EN)</label>
            <input data-k="category_en" value="${escapeAttr(it.category_en || "")}"/>
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
            <label>Descrizione (IT)</label>
            <textarea data-k="description">${escapeHtml(it.description || "")}</textarea>
          </div>

          <div style="flex:1; min-width:240px;">
            <label>Description (EN)</label>
            <textarea data-k="description_en">${escapeHtml(it.description_en || "")}</textarea>
          </div>

          <div style="width:170px; min-width:150px;">
            <label>Disponibile</label>
            <select data-k="is_available">
              <option value="true" ${it.is_available ? "selected" : ""}>Si</option>
              <option value="false" ${!it.is_available ? "selected" : ""}>No</option>
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
          await api("/api/admin/menu/" + it.id, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
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

    if (!items || items.length === 0) {
      grid.innerHTML = "<div class='card'>Nessun prodotto. Aggiungine uno sopra.</div>";
    }
  }

  function readPayload(card) {
    const get = (k) => card.querySelector(`[data-k="${k}"]`);
    return {
      name: get("name").value.trim(),
      name_en: get("name_en").value.trim(),
      description: get("description").value.trim(),
      description_en: get("description_en").value.trim(),
      price_cents: toCents(get("price").value),
      category: get("category").value.trim(),
      category_en: get("category_en").value.trim(),
      position: Number(get("position").value || 0),
      is_available: get("is_available").value === "true",
      image_url: get("image_url").value.trim() || null
    };
  }

  // CREA nuovo prodotto
  if (createBtn) {
    createBtn.onclick = async () => {
      const payload = {
        name: $("name").value.trim(),
        name_en: ($("name_en") ? $("name_en").value.trim() : ""),
        description: $("description") ? $("description").value.trim() : "",
        description_en: $("description_en") ? $("description_en").value.trim() : "",
        price_cents: toCents($("price").value),
        category: $("category").value.trim(),
        category_en: $("category_en") ? $("category_en").value.trim() : "",
        position: Number($("position").value || 0),
        is_available: $("is_available").value === "true",
        image_url: $("image_url").value.trim() || null
      };

      if (!payload.name) return alert("Nome (IT) obbligatorio");
      if (!payload.name_en) return alert("Name (EN) obbligatorio");
      if (!Number.isFinite(payload.price_cents)) return alert("Prezzo non valido");

      try {
        await api("/api/admin/menu", { method: "POST", body: JSON.stringify(payload) });

        $("name").value = "";
        if ($("name_en")) $("name_en").value = "";
        if ($("description")) $("description").value = "";
        if ($("description_en")) $("description_en").value = "";
        $("price").value = "";
        $("category").value = "";
        if ($("category_en")) $("category_en").value = "";
        $("position").value = "0";
        $("image_url").value = "";
        $("is_available").value = "true";

        await loadItems();
        alert("✅ Aggiunto");
      } catch (e) {
        alert("❌ " + e.message);
      }
    };
  }

  /* =========================================================
     COME FUNZIONA - CARICA + SALVA
     ========================================================= */

  async function loadComeFunziona() {
    const res = await api("/api/page/come-funziona");
    const d = (res && res.data) ? res.data : {};

    if (cf_phone) cf_phone.value = d.phone || "";
    if (cf_address) cf_address.value = d.address || "";

    if (cf_hours_it) cf_hours_it.value = d.hours_it_text || "";
    if (cf_hours_en) cf_hours_en.value = d.hours_en_text || "";

    if (cf_takeaway) cf_takeaway.value = d.takeaway_text || "";
    if (cf_gluten) cf_gluten.value = d.gluten_text || "";
    if (cf_lactose) cf_lactose.value = d.lactose_text || "";
    if (cf_pets) cf_pets.value = d.pets_text || "";
  }

  async function saveComeFunziona() {
    const payload = {
      phone: cf_phone ? cf_phone.value.trim() : "",
      address: cf_address ? cf_address.value.trim() : "",

      hours_it_title: "Orari di apertura",
      hours_it_text: cf_hours_it ? cf_hours_it.value.trim() : "",
      hours_en_text: cf_hours_en ? cf_hours_en.value.trim() : "",

      takeaway_title: "Take Away// Servizio di asporto",
      takeaway_text: cf_takeaway ? cf_takeaway.value.trim() : "",

      gluten_title: "Senza glutine e senza lattosio//",
      gluten_text: cf_gluten ? cf_gluten.value.trim() : "",
      lactose_text: cf_lactose ? cf_lactose.value.trim() : "",

      pets_title: "Amici a 4 zampe //",
      pets_text: cf_pets ? cf_pets.value.trim() : ""
    };

    await api("/api/admin/page/come-funziona", {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    alert("✅ Salvato (Come funziona)");
  }

  if (cfSaveBtn) {
    cfSaveBtn.onclick = async () => {
      try {
        await saveComeFunziona();
      } catch (e) {
        alert("❌ " + e.message);
      }
    };
  }

  /* =========================================================
     PRENOTAZIONI - CARICA + MOSTRA
     ========================================================= */

  function fmtDate(d) {
    if (!d) return "";
    try {
      const x = new Date(d);
      return x.toLocaleString("it-IT", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return String(d);
    }
  }

  async function loadReservations() {
    if (!reservationsGrid) return;

    if (reservationsMsg) reservationsMsg.textContent = "Caricamento...";
    reservationsGrid.innerHTML = "Caricamento...";

    try {
      const { reservations } = await api("/api/admin/reservations?limit=50");

      reservationsGrid.innerHTML = "";
      (reservations || []).forEach((r) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <strong>${escapeHtml(r.full_name || "")}</strong>
            <span style="opacity:.75;">#${r.id}</span>
          </div>

          <div style="opacity:.8; font-size:14px; margin-top:6px;">
            📞 ${escapeHtml(r.phone || "")} • 👥 ${r.people}
          </div>

          <div style="opacity:.8; font-size:14px; margin-top:6px;">
            📅 ${fmtDate(r.reserved_at)}
          </div>

          <div style="margin-top:8px; font-size:14px; opacity:.85;">
            <strong>Note:</strong> ${escapeHtml(r.notes || "—")}
          </div>

          <div class="row" style="margin-top:10px; align-items:center;">
            <div style="flex:1; min-width:180px;">
              <label>Stato</label>
              <select data-k="status">
                <option value="new" ${r.status === "new" ? "selected" : ""}>new</option>
                <option value="confirmed" ${r.status === "confirmed" ? "selected" : ""}>confirmed</option>
                <option value="cancelled" ${r.status === "cancelled" ? "selected" : ""}>cancelled</option>
              </select>
            </div>

            <div style="align-self:flex-end;">
              <button class="btn" data-act="saveStatus">Salva</button>
            </div>
          </div>

          <div style="margin-top:10px; opacity:.7; font-size:14px;" data-msg=""></div>
        `;

        card.querySelector('[data-act="saveStatus"]').onclick = async () => {
          const msg = card.querySelector('[data-msg=""]');
          msg.textContent = "Salvataggio...";
          try {
            const status = card.querySelector('[data-k="status"]').value;
            await api("/api/admin/reservations/" + r.id, {
              method: "PUT",
              body: JSON.stringify({ status })
            });
            msg.textContent = "✅ Salvato";
            await loadReservations();
          } catch (e) {
            msg.textContent = "❌ " + e.message;
          }
        };

        reservationsGrid.appendChild(card);
      });

      if (!reservations || reservations.length === 0) {
        reservationsGrid.innerHTML = "<div class='card'>Nessuna prenotazione al momento.</div>";
      }

      if (reservationsMsg) reservationsMsg.textContent = "OK";
    } catch (e) {
      reservationsGrid.innerHTML = `<div class="card">❌ Errore: ${escapeHtml(e.message)}</div>`;
      if (reservationsMsg) reservationsMsg.textContent = "Errore";
    }
  }

  if (refreshReservationsBtn) {
    refreshReservationsBtn.onclick = () => loadReservations();
  }

/* =========================================================
   GALLERY - UPLOAD FILES (da libreria) + SALVA
   Richiede endpoint Worker: POST /api/admin/gallery/upload
   ========================================================= */

function renderGalleryPreview(files) {
  if (!galPreview) return;
  galPreview.innerHTML = "";
  [...files].forEach((file) => {
    const img = document.createElement("img");
    img.style.width = "100%";
    img.style.borderRadius = "12px";
    img.style.border = "1px solid rgba(0,0,0,.12)";
    img.style.objectFit = "cover";
    img.style.aspectRatio = "4 / 3";
    img.src = URL.createObjectURL(file);
    galPreview.appendChild(img);
  });
}

if (gal_files) {
  gal_files.addEventListener("change", () => {
    if (gal_files.files && gal_files.files.length) {
      renderGalleryPreview(gal_files.files);
    }
  });
}

async function uploadGalleryFiles() {
  if (!gal_files || !gal_files.files || gal_files.files.length === 0) {
    alert("Seleziona almeno una foto");
    return;
  }

  const fd = new FormData();
  [...gal_files.files].forEach((f) => fd.append("files", f));

  const res = await fetch(API + "/api/admin/gallery/upload", {
    method: "POST",
    headers: { ...authHeaders() }, // ⚠️ NON mettere content-type qui!
    body: fd
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));

  // se vuoi: data.urls (array) con gli URL caricati
  alert("✅ Foto caricate");
}

if (galSaveBtn) {
  galSaveBtn.onclick = async () => {
    try {
      await uploadGalleryFiles();
      // reset
      if (gal_files) gal_files.value = "";
      if (galPreview) galPreview.innerHTML = "";
    } catch (e) {
      alert("❌ " + e.message);
    }
  };
}

  /* =========================================================
     LOGIN / LOGOUT
     ========================================================= */

  if (loginBtn) {
    loginBtn.onclick = async () => {
      token = tokenInput.value.trim();
      localStorage.setItem("admin_token", token);
      try {
        showApp(true);
        await loadItems();
        await loadComeFunziona();
        await loadReservations();
        await loadGallery();
      } catch (e) {
        showApp(false);
        alert("Errore: " + e.message);
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      token = "";
      localStorage.removeItem("admin_token");
      if (tokenInput) tokenInput.value = "";
      showApp(false);
    };
  }

  // AUTO START se token già salvato
  if (token) {
    if (tokenInput) tokenInput.value = token;
    showApp(true);
    loadItems()
      .then(loadComeFunziona)
      .then(loadReservations)
      .then(loadGallery)
      .catch(() => showApp(false));
  } else {
    showApp(false);
  }

  // Utils
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }
})();