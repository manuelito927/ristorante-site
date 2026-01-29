(function () {
const API = "https://still-haze-01c8.filosofiaefficace.workers.dev";
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
    const story_it = $("story_it");
  const story_en = $("story_en");
  const cf_pets = $("cf_pets");

  // ✅ GALLERY (UPLOAD FILE)
  const galSaveBtn = $("saveGallery");
  const gal_files = $("gal_files");     // <input type="file" ...>
  const galPreview = $("galPreview");   // div dove mostriamo anteprime
// 🖼 COPERTINE
const coverPage = $("cover_page");
const coverFile = $("cover_file");
const saveCoverBtn = $("saveCover");

// 🏠 HOME
const homeTitle = $("homeTitle");
const homeBody = $("homeBody");
const saveHomeBtn = $("saveHome");

const homeCardsEditor = $("homeCardsEditor");
const homeMsg = $("homeMsg");

// 🍕 STRIP PIATTI (titolo + immagini)
const stripKey = $("strip_key");
const stripTitle = $("strip_title");
const saveStripTitleBtn = $("saveStripTitle");
const stripItemName = $("strip_item_name");
const stripItemFile = $("strip_item_file");
const addStripItemBtn = $("addStripItem");
const stripItemsGrid = $("stripItemsGrid");
const stripMsg = $("stripMsg");

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
    const headers = {
      ...(opts.headers || {}),
      ...authHeaders()
    };

    // ❗️Se il body è FormData NON forziamo content-type
    if (!(opts.body instanceof FormData)) {
      headers["content-type"] = "application/json";
    }

    const res = await fetch(API + path, {
      ...opts,
      headers
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

  // CREA nuovo prodotto (POST /api/admin/menu)
  if (createBtn) {
    createBtn.onclick = async () => {
      // prende gli allergeni spuntati nel form "Nuovo Prodotto" (tab-menu)
      const newCard = createBtn.closest(".card"); // card "Nuovo Prodotto"
const allergens = Array.from(newCard.querySelectorAll(".alg:checked")).map(el => el.value);
const uniqueAllergens = [...new Set(allergens)];
      const payload = {
        name: $("name").value.trim(),
        name_en: ($("name_en") ? $("name_en").value.trim() : ""),
        description: $("description") ? $("description").value.trim() : "",
        description_en: $("description_en") ? $("description_en").value.trim() : "",
        price_cents: toCents($("price").value),
        category: $("category").value.trim(),
        category_en: $("category_en") ? $("category_en").value.trim() : "",
        position: Number($("position").value || 0),
        allergens: uniqueAllergens,
        is_available: $("is_available").value === "true",
        image_url: $("image_url").value.trim() || null
      };

      if (!payload.name) return alert("Nome (IT) obbligatorio");
      if (!Number.isFinite(payload.price_cents)) return alert("Prezzo non valido");

      try {
        await api("/api/admin/menu", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        // reset campi
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

        // reset checkbox allergeni
newCard.querySelectorAll(".alg").forEach(c => (c.checked = false));

        await loadItems();
        alert("✅ Prodotto aggiunto!");
      } catch (e) {
        alert("❌ " + e.message);
      }
    };
  }

async function loadItems() {
  if (!grid) return;

  grid.innerHTML = "<div class='card'>Caricamento menu...</div>";

  try {
const res = await api("/api/menu");
const items = res.items || res.data?.items || [];
    grid.innerHTML = "";

    // tiene traccia di quale prodotto è aperto
    let openId = null;

    (items || []).forEach((it) => {
      const wrap = document.createElement("div");
      wrap.className = "item-card card";
      wrap.style.padding = "14px"; // un po' più compatto

      // ✅ Allergeni: pre-seleziona quelli già salvati in DB
      const selAll = new Set(Array.isArray(it.allergens) ? it.allergens : []);

      function alg(value, label) {
        const checked = selAll.has(value) ? "checked" : "";
        return `
          <label style="display:flex; gap:8px; align-items:center; font-size:13px; background:#fafafa; border:1px solid #e0e0e0; padding:8px 10px; border-radius:10px;">
            <input class="alg" type="checkbox" value="${value}" ${checked}>
            <span>${label}</span>
          </label>
        `;
      }

      const allergensHtml = `
        <div class="form-group" style="margin-bottom:12px;">
          <label style="display:block; font-size:12px; font-weight:bold; margin-bottom:8px;">
            ALLERGENI (spunta quelli presenti)
          </label>

          <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px;">
            ${alg("glutine","Glutine")}
            ${alg("crostacei","Crostacei")}
            ${alg("uova","Uova")}
            ${alg("pesce","Pesce")}
            ${alg("arachidi","Arachidi")}
            ${alg("soia","Soia")}
            ${alg("latte","Latte")}
            ${alg("frutta_a_guscio","Frutta a guscio")}
            ${alg("sedano","Sedano")}
            ${alg("senape","Senape")}
            ${alg("sesamo","Sesamo")}
            ${alg("solfiti","Solfiti")}
            ${alg("lupini","Lupini")}
            ${alg("molluschi","Molluschi")}
            ${alg("nichel","Nichel")}
          </div>
        </div>
      `;

      // ✅ Header compatto (sempre visibile)
      const compactHeader = `
        <button type="button" data-act="toggle"
          style="
            width:100%;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            background:transparent;
            border:0;
            padding:0;
            cursor:pointer;
            text-align:left;
          "
          aria-expanded="false"
        >
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
              <strong style="font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(it.name || "")}
              </strong>
              <span style="opacity:.7; font-size:12px; white-space:nowrap;">
                ${escapeHtml(it.category || "")}
              </span>
            </div>
            <div style="opacity:.6; font-size:12px; margin-top:4px;">
              ID: ${escapeHtml(String(it.id))}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:10px; flex:0 0 auto;">
            <span class="status-badge status-${it.is_available}"
              style="padding:4px 8px; border-radius:6px; font-size:10px; font-weight:800; text-transform:uppercase;
              background:${it.is_available ? '#e6f4ea' : '#ffebee'};
              color:${it.is_available ? '#1e7e34' : '#c62828'};">
              ${it.is_available ? 'Disponibile' : 'Esaurito'}
            </span>

            <strong style="font-size:14px; white-space:nowrap;">€ ${fromCents(it.price_cents)}</strong>

            <span data-el="chev" style="font-size:18px; line-height:1; opacity:.7;">▾</span>
          </div>
        </button>
      `;

      // ✅ Dettagli (nascosti finché non apri)
      const details = `
        <div data-el="details" hidden style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(0,0,0,.06);">

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

    <label style="display:block; font-size:12px; font-weight:bold; margin-top:10px;">Category (EN)</label>
    <input data-k="category_en" value="${escapeAttr(it.category_en || "")}" style="width:100%;" placeholder="es. Pizzas"/>
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

          ${allergensHtml}

          <div class="row" style="display:flex; gap:10px;">
            <button class="btn success" data-act="save" style="flex:2;">Salva Modifiche</button>
            <button class="btn danger" data-act="del" style="flex:1;">Elimina</button>
          </div>

          <div style="margin-top:10px; opacity:.7; font-size:13px; text-align:center;" data-msg=""></div>
        </div>
      `;

      wrap.innerHTML = compactHeader + details;
      grid.appendChild(wrap);

      const toggleBtn = wrap.querySelector('[data-act="toggle"]');
      const detailsEl = wrap.querySelector('[data-el="details"]');
      const chevEl = wrap.querySelector('[data-el="chev"]');

      function setOpen(isOpen) {
        if (!toggleBtn || !detailsEl) return;
        toggleBtn.setAttribute("aria-expanded", String(isOpen));
        detailsEl.hidden = !isOpen;
        if (chevEl) chevEl.textContent = isOpen ? "▴" : "▾";
      }

      // Toggle: uno aperto alla volta
      toggleBtn.onclick = () => {
        const willOpen = openId !== it.id;

        // chiudi tutti
        grid.querySelectorAll('[data-el="details"]').forEach((d) => (d.hidden = true));
        grid.querySelectorAll('[data-act="toggle"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
        grid.querySelectorAll('[data-el="chev"]').forEach((c) => (c.textContent = "▾"));

        if (willOpen) {
          openId = it.id;
          setOpen(true);

          // porta il prodotto in vista (senza spararti in fondo)
          wrap.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          openId = null;
          setOpen(false);
        }
      };

      // Save / Delete (identici a prima)
      wrap.querySelector('[data-act="save"]').onclick = async () => {
        const msg = wrap.querySelector('[data-msg=""]');
        msg.textContent = "Salvataggio...";
        try {
          const payload = readPayload(wrap);
          await api("/api/admin/menu/" + it.id, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          msg.innerHTML = "<span style='color:green'>✅ Salvato</span>";
          setTimeout(() => {
            msg.textContent = "";
            openId = it.id; // riapri lo stesso dopo reload
            loadItems();
          }, 800);
        } catch (e) {
          msg.textContent = "❌ " + e.message;
        }
      };

      wrap.querySelector('[data-act="del"]').onclick = async () => {
        const ok = confirm("Eliminare '" + it.name + "'?");
        if (!ok) return;
        try {
          await api("/api/admin/menu/" + it.id, { method: "DELETE" });
          openId = null;
          loadItems();
        } catch (e) {
          alert("❌ " + e.message);
        }
      };
    });

    if (!items || items.length === 0) {
      grid.innerHTML = "<div class='card'>Nessun prodotto presente nel menu.</div>";
    }
  } catch (e) {
    grid.innerHTML = "Errore: " + e.message;
  }
}

/* =========================================================
   HOME - CARICA + SALVA (5 CARD)
   usa: GET  /api/page/home
        PUT  /api/admin/page/home
   ========================================================= */

const DEFAULT_HOME_CARDS = [
  { title:"Menu Digitale", text:"Scopri tutti i piatti, ingredienti e prezzi in un attimo.", href:"/menu/", buttonText:"VAI AL MENU" },
  { title:"Come funziona", text:"Orari, indirizzo, info utili e tutto quello che devi sapere.", href:"/come-funziona/", buttonText:"SCOPRI" },
  { title:"Prenota", text:"Prenota il tuo tavolo in pochi secondi.", href:"/prenota/", buttonText:"PRENOTA" },
  { title:"Gallery", text:"Guarda foto, atmosfera e piatti.", href:"/gallery/", buttonText:"VEDI FOTO" },
  { title:"Recensioni", text:"Leggi cosa dicono di noi.", href:"/recensioni/", buttonText:"LEGGI" },
];

function renderHomeCardsEditor(cards){
  if(!homeCardsEditor) return;
  homeCardsEditor.innerHTML = (cards || []).map((c, i) => `
    <div class="card" style="padding:14px; border-radius:14px; border:1px solid rgba(0,0,0,.06);">
      <div style="font-weight:800; margin-bottom:10px;">Card ${i+1}</div>

      <div class="form-group">
        <label>Titolo</label>
        <input data-hk="title" data-i="${i}" value="${escapeAttr(c.title || "")}">
      </div>

      <div class="form-group">
        <label>Testo</label>
        <textarea data-hk="text" data-i="${i}">${escapeHtml(c.text || "")}</textarea>
      </div>

      <div class="form-group">
        <label>Link (href)</label>
        <input data-hk="href" data-i="${i}" value="${escapeAttr(c.href || "")}" placeholder="/menu/">
      </div>

      <div class="form-group">
        <label>Testo bottone</label>
        <input data-hk="buttonText" data-i="${i}" value="${escapeAttr(c.buttonText || "")}">
      </div>
    </div>
  `).join("");
}

function readHomeCardsFromEditor(){
  if(!homeCardsEditor) return [];
  const cards = [];
  for(let i=0;i<5;i++){
    const get = (k) => {
      const el = homeCardsEditor.querySelector(`[data-hk="${k}"][data-i="${i}"]`);
      return el ? String(el.value || "").trim() : "";
    };
    cards.push({
      title: get("title"),
      text: get("text"),
      href: get("href") || "#",
      buttonText: get("buttonText") || "SCOPRI"
    });
  }
  return cards;
}

async function loadHome() {
  try {
    const res = await api("/api/page/home");
    const d = res && res.data ? res.data : {};

    const cards = Array.isArray(d.cards) ? d.cards : DEFAULT_HOME_CARDS;

    renderHomeCardsEditor(cards);
    if(homeMsg) homeMsg.textContent = "Caricato ✅";
  } catch (e) {
    console.error("Errore caricamento HOME", e);
    renderHomeCardsEditor(DEFAULT_HOME_CARDS);
    if(homeMsg) homeMsg.textContent = "Errore: caricati valori di default";
  }
}

async function saveHome() {
  const cards = readHomeCardsFromEditor();

  await api("/api/admin/page/home", {
    method: "PUT",
    body: JSON.stringify({ cards })
  });

  if(homeMsg) homeMsg.textContent = "Salvato ✅";
  alert("✅ Home (card) salvata!");
}

if (saveHomeBtn) {
  saveHomeBtn.onclick = () => saveHome();
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
                if (story_it) story_it.value = d.story_it || "";
        if (story_en) story_en.value = d.story_en || "";
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
      pets_text: cf_pets ? cf_pets.value.trim() : "",

      story_it: story_it ? story_it.value.trim() : "",
      story_en: story_en ? story_en.value.trim() : ""
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

/* =========================================================
   COPERTINE PAGINE
   ========================================================= */

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


async function saveCover() {
  if (!coverPage || !coverFile) return alert("Campi copertina non trovati");
  if (!coverFile.files || !coverFile.files[0]) return alert("Seleziona un'immagine");

  const file = coverFile.files[0];

  try {
    // ✅ riuso la stessa funzione di upload della gallery (già testata)
    const imageUrl = await uploadOneFileToR2(file);

const page = coverPage.value.toLowerCase();

    await api("/api/admin/page/covers", {
      method: "PUT",
      body: JSON.stringify({ [page]: imageUrl })
    });

    coverFile.value = "";
    alert("✅ Copertina salvata per: " + page.toUpperCase());
  } catch (e) {
    alert("❌ Upload copertina fallito: " + (e.message || e));
  }
}

if (saveCoverBtn) {
  saveCoverBtn.onclick = () => saveCover();
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
await Promise.all([
  loadItems(),
  loadComeFunziona(),
  loadReservations(),
  loadHome()
  // loadStripAdmin()
]);
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
loadItems()
  .then(loadComeFunziona)
  .then(loadReservations)
  .then(loadHome)
  .catch(() => showApp(false));
  } else {
    showApp(false);
  }

function readPayload(wrap) {
  const payload = {};

  // campi input / textarea / select
  wrap.querySelectorAll("[data-k]").forEach(el => {
    const key = el.getAttribute("data-k");

    if (el.tagName === "SELECT") {
      payload[key] = el.value === "true" ? true : el.value === "false" ? false : el.value;
    } 
    else if (el.type === "number") {
      payload[key] = el.value !== "" ? Number(el.value) : null;
    } 
    else {
      payload[key] = el.value.trim();
    }
  });

  // allergeni (checkbox)
  // allergeni (checkbox) - senza duplicati
payload.allergens = Array.from(
  new Set(Array.from(wrap.querySelectorAll(".alg:checked")).map(c => c.value))
);

  // prezzo in centesimi
  if ("price" in payload) {
    payload.price_cents = Math.round(Number(payload.price) * 100);
    delete payload.price;
  }

  return payload;
}

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }


})();
