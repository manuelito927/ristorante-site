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
  const galPreview = $("galPreview");   // div dove mostriamo anteprime

  let token = localStorage.getItem("admin_token") || "";

  /* =========================================================
      UTILITIES & CORE
     ========================================================= */

  function setStatus(text) {
    if (statusEl) {
        statusEl.textContent = text;
        statusEl.style.background = text === "Connesso" ? "#e6f4ea" : "#eee";
    }
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

    grid.innerHTML = "<div class='card'>Caricamento menu...</div>";
    try {
        const { items } = await api("/api/menu");
        grid.innerHTML = "";

        (items || []).forEach((it) => {
            const card = document.createElement("div");
            card.className = "item-card card";

            card.innerHTML = `
                <div class="item-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span class="status-badge status-${it.is_available}" style="padding:4px 8px; border-radius:4px; font-size:12px; background:${it.is_available ? '#e6f4ea' : '#ffebee'}; color:${it.is_available ? '#1e7e34' : '#c62828'};">
                        ${it.is_available ? 'Disponibile' : 'Esaurito'}
                    </span>
                    <strong style="font-size:16px;">€ ${fromCents(it.price_cents)}</strong>
                </div>

                <div class="form-group" style="margin-bottom:10px;">
                    <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">NOME PRODOTTO (IT / EN)</label>
                    <input data-k="name" value="${escapeAttr(it.name)}" style="width:100%; margin-bottom:5px;"/>
                    <input data-k="name_en" value="${escapeAttr(it.name_en || "")}" placeholder="English name" style="width:100%;"/>
                </div>

                <div class="form-group" style="margin-bottom:10px;">
                    <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">DESCRIZIONE (IT)</label>
                    <textarea data-k="description" style="width:100%; min-height:50px;">${escapeHtml(it.description || "")}</textarea>
                </div>

                <div class="form-group" style="margin-bottom:10px;">
                    <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:4px;">DESCRIPTION (EN)</label>
                    <textarea data-k="description_en" style="width:100%; min-height:50px;">${escapeHtml(it.description_en || "")}</textarea>
                </div>

                <div class="row" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold;">Prezzo (€)</label>
                        <input data-k="price" type="number" step="0.01" value="${fromCents(it.price_cents)}" style="width:100%;"/>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold;">Posizione</label>
                        <input data-k="position" type="number" step="1" value="${it.position}" style="width:100%;"/>
                    </div>
                </div>

                <div class="row" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold;">Categoria (IT)</label>
                        <input data-k="category" value="${escapeAttr(it.category || "")}" style="width:100%;"/>
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:bold;">Disponibile</label>
                        <select data-k="is_available" style="width:100%;">
                            <option value="true" ${it.is_available ? "selected" : ""}>Si</option>
                            <option value="false" ${!it.is_available ? "selected" : ""}>No</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; font-size:12px; font-weight:bold;">Immagine URL</label>
                    <input data-k="image_url" value="${escapeAttr(it.image_url || "")}" style="width:100%;"/>
                </div>

                <div class="row" style="display:flex; gap:10px;">
                    <button class="btn success" data-act="save" style="flex:2;">Salva Modifiche</button>
                    <button class="btn danger" data-act="del" style="flex:1;">Elimina</button>
                </div>
                <div style="margin-top:10px; opacity:.7; font-size:13px; text-align:center;" data-msg=""></div>
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
                    msg.innerHTML = "<span style='color:green'>✅ Salvato</span>";
                    setTimeout(() => { msg.textContent = ""; loadItems(); }, 1500);
                } catch (e) {
                    msg.textContent = "❌ " + e.message;
                }
            };

            card.querySelector('[data-act="del"]').onclick = async () => {
                const ok = confirm("Eliminare '" + it.name + "'?");
                if (!ok) return;
                try {
                    await api("/api/admin/menu/" + it.id, { method: "DELETE" });
                    loadItems();
                } catch (e) {
                    alert("❌ " + e.message);
                }
            };

            grid.appendChild(card);
        });

        if (!items || items.length === 0) {
            grid.innerHTML = "<div class='card'>Nessun prodotto presente nel menu.</div>";
        }
    } catch (e) {
        grid.innerHTML = "Errore: " + e.message;
    }
  }

  function readPayload(card) {
    const get = (k) => card.querySelector(`[data-k="${k}"]`);
    const allergens = Array.from(card.querySelectorAll('.alg:checked')).map(el => el.value);
    return {
      name: get("name").value.trim(),
      name_en: get("name_en").value.trim(),
      description: get("description").value.trim(),
      description_en: get("description_en").value.trim(),
      price_cents: toCents(get("price").value),
      category: get("category").value.trim(),
      category_en: get("category").value.trim(), // Usiamo IT come base se EN manca
      position: Number(get("position").value || 0),
      is_available: get("is_available").value === "true",
      image_url: get("image_url").value.trim() || null
    };
  }

  // CREA nuovo prodotto
  if (createBtn) {
    createBtn.onclick = async () => {
      const allergens = Array.from(document.querySelectorAll(".alg:checked")).map(el => el.value);
      const payload = {
        name: $("name").value.trim(),
        name_en: ($("name_en") ? $("name_en").value.trim() : ""),
        description: $("description") ? $("description").value.trim() : "",
        description_en: $("description_en") ? $("description_en").value.trim() : "",
        price_cents: toCents($("price").value),
        category: $("category").value.trim(),
        category_en: $("category_en") ? $("category_en").value.trim() : "",
        position: Number($("position").value || 0),
        allergens: allergens,
        is_available: $("is_available").value === "true",
        image_url: $("image_url").value.trim() || null
      };

      if (!payload.name) return alert("Nome (IT) obbligatorio");
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
        alert("✅ Prodotto aggiunto!");
      } catch (e) {
        alert("❌ " + e.message);
      }
    };
  }

  /* =========================================================
      COME FUNZIONA - CARICA + SALVA
     ========================================================= */

  async function loadComeFunziona() {
    try {
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
    } catch(e) { console.error("Errore caricamento info", e); }
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

    alert("✅ Informazioni salvate!");
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
        card.style.marginBottom = "15px";

        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
            <strong style="font-size:16px;">${escapeHtml(r.full_name || "")}</strong>
            <span style="opacity:.6; font-size:12px;">#${r.id}</span>
          </div>

          <div style="font-size:14px; margin-bottom:5px;">📞 ${escapeHtml(r.phone || "")} • 👥 <strong>${r.people} persone</strong></div>
          <div style="font-size:14px; margin-bottom:10px; color:var(--greenwood); font-weight:bold;">📅 ${fmtDate(r.reserved_at)}</div>
          <div style="font-size:13px; background:#f5f5f5; padding:8px; border-radius:6px; margin-bottom:12px;">
            <strong>Note:</strong> ${escapeHtml(r.notes || "—")}
          </div>

          <div style="display:flex; align-items:center; gap:10px;">
            <select data-k="status" style="flex:1;">
              <option value="new" ${r.status === "new" ? "selected" : ""}>Nuova</option>
              <option value="confirmed" ${r.status === "confirmed" ? "selected" : ""}>Confermata</option>
              <option value="cancelled" ${r.status === "cancelled" ? "selected" : ""}>Annullata</option>
            </select>
            <button class="btn success" data-act="saveStatus" style="padding:5px 15px;">Salva</button>
          </div>
          <div style="margin-top:5px; font-size:12px; text-align:center;" data-msg=""></div>
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
            msg.innerHTML = "<span style='color:green'>✅ Aggiornato</span>";
            setTimeout(() => loadReservations(), 1000);
          } catch (e) {
            msg.textContent = "❌ " + e.message;
          }
        };

        reservationsGrid.appendChild(card);
      });

      if (!reservations || reservations.length === 0) {
        reservationsGrid.innerHTML = "<div class='card'>Nessuna prenotazione trovata.</div>";
      }
      if (reservationsMsg) reservationsMsg.textContent = "OK";
    } catch (e) {
      reservationsGrid.innerHTML = `<div class="card">❌ Errore: ${escapeHtml(e.message)}</div>`;
      if (reservationsMsg) reservationsMsg.textContent = "Errore";
    }
  }

  if (refreshReservationsBtn) refreshReservationsBtn.onclick = () => loadReservations();

  /* =========================================================
      GALLERY - UPLOAD R2 + DB
     ========================================================= */

  function renderGalleryPreview(files) {
    if (!galPreview) return;
    galPreview.innerHTML = "";
    [...files].forEach((file) => {
      const img = document.createElement("img");
      img.style = "width:100%; border-radius:10px; aspect-ratio:4/3; object-fit:cover; border:1px solid #ddd;";
      img.src = URL.createObjectURL(file);
      galPreview.appendChild(img);
    });
  }

  if (gal_files) {
    gal_files.addEventListener("change", () => {
      if (gal_files.files && gal_files.files.length) renderGalleryPreview(gal_files.files);
      else if (galPreview) galPreview.innerHTML = "";
    });
  }

  async function uploadOneFileToR2(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(API + "/api/admin/gallery/upload", {
      method: "POST",
      headers: { ...authHeaders() },
      body: fd
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
    if (!data.url) throw new Error("Manca URL nella risposta");
    return data.url;
  }

  async function uploadGalleryAndSave() {
    if (!gal_files || !gal_files.files || gal_files.files.length === 0) return alert("Seleziona almeno una foto");
    
    const urls = [];
    for (const f of [...gal_files.files]) {
      const url = await uploadOneFileToR2(f);
      urls.push(url);
    }
    await api("/api/admin/page/gallery", { method: "PUT", body: JSON.stringify({ urls }) });
    
    gal_files.value = "";
    if (galPreview) galPreview.innerHTML = "";
    alert("✅ Gallery aggiornata!");
  }

  if (galSaveBtn) {
    galSaveBtn.onclick = async () => {
      try { await uploadGalleryAndSave(); } 
      catch (e) { alert("❌ " + (e.message || e)); }
    };
  }

  /* =========================================================
      LOGIN / LOGOUT / INIT
     ========================================================= */

  if (loginBtn) {
    loginBtn.onclick = async () => {
      token = tokenInput.value.trim();
      localStorage.setItem("admin_token", token);
      try {
        showApp(true);
        await Promise.all([loadItems(), loadComeFunziona(), loadReservations()]);
      } catch (e) {
        showApp(false);
        alert("Errore Accesso: " + e.message);
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      token = "";
      localStorage.removeItem("admin_token");
      if (tokenInput) tokenInput.value = "";
      location.reload();
    };
  }

  if (token) {
    if (tokenInput) tokenInput.value = token;
    showApp(true);
    loadItems().then(loadComeFunziona).then(loadReservations).catch(() => showApp(false));
  } else {
    showApp(false);
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

})();