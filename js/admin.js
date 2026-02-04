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
  // ✅ SETTINGS PRENOTAZIONI (toggle + whatsapp)
  const bookingEnabled = $("bookingEnabled");         // checkbox
  const bookingWhatsapp = $("bookingWhatsapp");       // input
  const saveBookingSettingsBtn = $("saveBookingSettings"); // button
  const bookingSettingsMsg = $("bookingSettingsMsg"); // div msg


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
// 🖼 COPERTINE
const coverPage = $("cover_page");
const coverFile = $("cover_file");
const saveCoverBtn = $("saveCover");

// 🏠 HOME
const saveHomeBtn = $("saveHome");

const homeCardsEditor = $("homeCardsEditor");
const homeMsg = $("homeMsg");

// 🍕 STRIP PIATTI (titolo + immagini)
const stripKey = $("strip_key");
const stripTitle = $("strip_title");
const stripOrder = $("strip_order"); // ✅ ordine categoria
const saveStripTitleBtn = $("saveStripTitle");
const stripItemName = $("strip_item_name");
const stripItemFile = $("strip_item_file");
const addStripItemBtn = $("addStripItem");
const stripItemsGrid = $("stripItemsGrid");
const stripMsg = $("stripMsg");

// ➕ CREA CATEGORIA STRIP
const newStripKey = $("new_strip_key");
const newStripTitle = $("new_strip_title");
const newStripOrder = $("new_strip_order");
const createStripCategoryBtn = $("createStripCategory");
const createStripMsg = $("createStripMsg");
const deleteStripCategoryBtn = $("deleteStripCategory");

  let token = localStorage.getItem("admin_token") || "";
let stripOpenIndex = null; // tiene aperto solo 1 piatto nello strip
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
      alert("CLICK FUNZIONA");
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
   HOME - CARICA + SALVA (5 CARD)  ✅ IT + EN
   usa: GET  /api/page/home
        PUT  /api/admin/page/home
   ========================================================= */

// default con IT + EN
const DEFAULT_HOME_CARDS = [
  {
    title_it:"BENVENUTI DA GREENWOOD, DOVE",
    text_it:"In un equilibrio perfetto tra tradizione culinaria e innovazione contemporanea, Greenwood non è solo una sosta, ma una destinazione.",
    href:"/menu/",
    button_it:"SCOPRI SUBITO",

    title_en:"WELCOME TO GREENWOOD, WHERE",
    text_en:"In a perfect balance between culinary tradition and modern innovation, Greenwood is not just a stop — it’s a destination.",
    button_en:"DISCOVER NOW"
  },
  {
    title_it:"COME FUNZIONA",
    text_it:"Scopri orari, indirizzo e tutte le informazioni utili per vivere al meglio Greenwood.",
    href:"/come-funziona/",
    button_it:"SCOPRI",

    title_en:"HOW IT WORKS",
    text_en:"Find opening hours, address and everything you need to enjoy Greenwood at its best.",
    button_en:"LEARN MORE"
  },
  {
    title_it:"PRENOTA",
    text_it:"Prenota il tuo tavolo in pochi secondi e assicurati il tuo posto.",
    href:"/prenota/",
    button_it:"PRENOTA",

    title_en:"BOOK A TABLE",
    text_en:"Book your table in seconds and secure your spot.",
    button_en:"BOOK NOW"
  },
  {
    title_it:"GALLERY",
    text_it:"Dai un’occhiata all’atmosfera, ai piatti e al locale.",
    href:"/gallery/",
    button_it:"VEDI FOTO",

    title_en:"GALLERY",
    text_en:"Take a look at the atmosphere, dishes and venue.",
    button_en:"VIEW PHOTOS"
  },
  {
    title_it:"RECENSIONI",
    text_it:"Leggi cosa dicono di noi e condividi la tua esperienza.",
    href:"/recensioni/",
    button_it:"LEGGI",

    title_en:"REVIEWS",
    text_en:"Read what people say about us and share your experience.",
    button_en:"READ"
  },
];

function normalizeHomeCards(cards){
  // supporta sia il vecchio formato (title/text/buttonText)
  // sia il nuovo formato (title_it/title_en ecc)
  const out = [];
  for(let i=0;i<5;i++){
    const c = (cards && cards[i]) ? cards[i] : {};
    out.push({
      href: c.href || "#",

      // se esistono i campi nuovi, li uso
      title_it: c.title_it ?? c.title ?? "",
      text_it:  c.text_it  ?? c.text  ?? "",
      button_it: c.button_it ?? c.buttonText ?? "SCOPRI",

      title_en: c.title_en ?? "",
      text_en:  c.text_en  ?? "",
      button_en: c.button_en ?? "DISCOVER"
    });
  }
  return out;
}

function renderHomeCardsEditor(cards){
  if(!homeCardsEditor) return;
  const norm = normalizeHomeCards(cards);

  homeCardsEditor.innerHTML = norm.map((c, i) => `
    <div class="card" style="padding:14px; border-radius:14px; border:1px solid rgba(0,0,0,.06);">
      <div style="font-weight:800; margin-bottom:10px;">Card ${i+1}</div>

      <div class="form-group">
        <span class="lang-tag">ITALIANO</span>
        <label>Titolo (IT)</label>
        <input data-hk="title_it" data-i="${i}" value="${escapeAttr(c.title_it || "")}">
      </div>

      <div class="form-group">
        <span class="lang-tag">ITALIANO</span>
        <label>Testo (IT)</label>
        <textarea data-hk="text_it" data-i="${i}">${escapeHtml(c.text_it || "")}</textarea>
      </div>

      <div class="form-group">
        <label>Link (href)</label>
        <input data-hk="href" data-i="${i}" value="${escapeAttr(c.href || "")}" placeholder="/menu/">
      </div>

      <div class="form-group">
        <span class="lang-tag">ITALIANO</span>
        <label>Testo bottone (IT)</label>
        <input data-hk="button_it" data-i="${i}" value="${escapeAttr(c.button_it || "")}">
      </div>

      <hr style="border:0;border-top:1px solid rgba(0,0,0,.06);margin:14px 0">

      <div class="form-group">
        <span class="lang-tag">INGLESE</span>
        <label>Title (EN)</label>
        <input data-hk="title_en" data-i="${i}" value="${escapeAttr(c.title_en || "")}">
      </div>

      <div class="form-group">
        <span class="lang-tag">INGLESE</span>
        <label>Text (EN)</label>
        <textarea data-hk="text_en" data-i="${i}">${escapeHtml(c.text_en || "")}</textarea>
      </div>

      <div class="form-group">
        <span class="lang-tag">INGLESE</span>
        <label>Button text (EN)</label>
        <input data-hk="button_en" data-i="${i}" value="${escapeAttr(c.button_en || "")}">
              <button class="btn success" type="button"
        data-home-save-one="${i}"
        style="width:auto; padding:12px 22px; margin-top:12px;">
        Salva Card ${i+1}
      </button>

      <div data-home-one-msg="${i}" style="margin-top:8px; font-size:13px; opacity:.75;"></div>
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
      href: get("href") || "#",

      title_it: get("title_it"),
      text_it:  get("text_it"),
      button_it: get("button_it") || "SCOPRI",

      title_en: get("title_en"),
      text_en:  get("text_en"),
      button_en: get("button_en") || "DISCOVER"
    });
  }
  return cards;
}

async function saveOneHomeCard(index){
  const res = await api("/api/page/home");
  const d = res && res.data ? res.data : {};
  const serverCards = normalizeHomeCards(Array.isArray(d.cards) ? d.cards : DEFAULT_HOME_CARDS);

  const editorCards = readHomeCardsFromEditor();
  serverCards[index] = editorCards[index];

  await api("/api/admin/page/home", {
    method: "PUT",
    body: JSON.stringify({ cards: serverCards })
  });

  const msg = document.querySelector(`[data-home-one-msg="${index}"]`);
  if (msg) msg.textContent = "Salvata ✅";
  setTimeout(() => { if (msg) msg.textContent = ""; }, 1200);
}

function bindHomeSaveButtons(){
  if(!homeCardsEditor) return;

  homeCardsEditor.querySelectorAll("[data-home-save-one]").forEach(btn=>{
    btn.onclick = async () => {
      const i = Number(btn.getAttribute("data-home-save-one"));
      const oldText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Salvataggio...";
      try{
        await saveOneHomeCard(i);
      }catch(e){
        alert("❌ " + e.message);
      }finally{
        btn.disabled = false;
        btn.textContent = oldText;
      }
    };
  });
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
  const s = String(d).trim();

  // ✅ se arriva già nel formato "YYYY-MM-DD HH:MM" lo mostro senza conversioni
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}, ${m[4]}:${m[5]}`;
  }

  // fallback: se arriva ISO vero, usa Date
  try {
    const x = new Date(s);
    return x.toLocaleString("it-IT", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return s;
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
      PRENOTAZIONI - SETTINGS (ON/OFF + WHATSAPP)
      usa:
        GET  /api/settings/booking
        PUT  /api/admin/settings/booking
     ========================================================= */

  async function loadBookingSettings(){
    try {
      const res = await api("/api/settings/booking"); // { enabled, whatsapp }
      const d = res && res.data ? res.data : res;

      if (bookingEnabled) bookingEnabled.checked = !!d.enabled;
      if (bookingWhatsapp) bookingWhatsapp.value = String(d.whatsapp || "").trim();

      if (bookingSettingsMsg) bookingSettingsMsg.textContent = "Impostazioni caricate ✅";
    } catch (e) {
      // se endpoint non esiste ancora, non bloccare la dashboard
      if (bookingSettingsMsg) bookingSettingsMsg.textContent = "Impostazioni non disponibili (endpoint non ancora creato)";
      console.warn("loadBookingSettings:", e.message);
    }
  }

  async function saveBookingSettings(){
    const enabled = bookingEnabled ? !!bookingEnabled.checked : false;
    const whatsapp = bookingWhatsapp ? String(bookingWhatsapp.value || "").trim() : "";

    try {
      if (bookingSettingsMsg) bookingSettingsMsg.textContent = "Salvataggio...";
      await api("/api/admin/settings/booking", {
        method: "PUT",
        body: JSON.stringify({ enabled, whatsapp })
      });
      if (bookingSettingsMsg) bookingSettingsMsg.textContent = "Salvato ✅";
      alert("✅ Impostazioni prenotazioni salvate!");
    } catch (e) {
      if (bookingSettingsMsg) bookingSettingsMsg.textContent = "❌ " + e.message;
      alert("❌ " + e.message);
    }
  }

  if (saveBookingSettingsBtn) {
    saveBookingSettingsBtn.onclick = () => saveBookingSettings();
  }



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

if (galSaveBtn) {
  galSaveBtn.onclick = async () => {
    if (!gal_files?.files?.length) {
      return alert("Seleziona almeno una foto");
    }

    try {
      const urls = [];

      // 1️⃣ upload di TUTTE le immagini su R2
      for (const file of gal_files.files) {
        const imageUrl = await uploadOneFileToR2(file);
        urls.push(imageUrl);
      }

      // 2️⃣ UNA SOLA chiamata → sostituisce tutta la gallery
      await api("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ images: urls })
      });

      gal_files.value = "";
      if (galPreview) galPreview.innerHTML = "";

      alert("✅ Gallery aggiornata!");
    } catch (e) {
      alert("❌ " + e.message);
    }
  };
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
   STRIP - CARICA CATEGORIE (da /api/strip)
   ========================================================= */
async function loadStripKeysIntoSelect() {
  if (!stripKey) return;

  try {
    const res = await api("/api/strip"); // ritorna { keys: [...] }
    const keys = Array.isArray(res.keys) ? res.keys : [];

    // svuota e ricrea opzioni
    stripKey.innerHTML = "";

    if (!keys.length) {
      stripKey.innerHTML = `<option value="pizze">pizze</option>`;
      return;
    }

    keys.forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      stripKey.appendChild(opt);
    });

  } catch (e) {
    console.warn("Errore load strip keys:", e);
  }
}

if (stripKey) {
  stripKey.onchange = () => refreshStripEditor();
}

if (createStripCategoryBtn) {
  createStripCategoryBtn.onclick = async () => {
    const key = String(newStripKey?.value || "").trim().toLowerCase();
    const title = String(newStripTitle?.value || "").trim();

    if (!key) return alert("Scrivi la key (es. piatti_gourmet)");
    if (!/^[a-z0-9_-]{2,30}$/.test(key)) {
      return alert("Key non valida. Usa solo a-z 0-9 _ - (2-30 caratteri)");
    }

    try {
      if (createStripMsg) createStripMsg.textContent = "Creazione...";

      // ✅ QUI la vera API che esiste già nel worker:
      // PUT /api/admin/strip/<key>  body: { title:"...", items:[] }
      await api("/api/admin/strip/" + encodeURIComponent(key), {
        method: "PUT",
body: JSON.stringify({
  title: title || key,
order: Number(newStripOrder?.value || 0),
  items: []
})
      });

      if (createStripMsg) createStripMsg.textContent = "✅ Categoria creata!";
      if (newStripKey) newStripKey.value = "";
      if (newStripTitle) newStripTitle.value = "";
if (newStripOrder) newStripOrder.value = "";


      // ricarica dropdown
      await loadStripKeysIntoSelect();

      // seleziona la categoria appena creata
      if (stripKey) stripKey.value = key;

      alert("✅ Categoria creata: " + key);
    } catch (e) {
      if (createStripMsg) createStripMsg.textContent = "❌ " + e.message;
      alert("❌ " + e.message);
    }
  };
}

if (deleteStripCategoryBtn) {
  deleteStripCategoryBtn.onclick = async () => {
    const key = String(stripKey?.value || "").trim();
    if (!key) return alert("Seleziona una categoria");

    const ok = confirm("Vuoi eliminare la categoria '" + key + "'? Verranno rimossi titolo e piatti dello scroll.");
    if (!ok) return;

    try {
      if (createStripMsg) createStripMsg.textContent = "Eliminazione...";

      await api("/api/admin/strip/" + encodeURIComponent(key), {
        method: "DELETE"
      });

      if (createStripMsg) createStripMsg.textContent = "✅ Categoria eliminata!";

      // ricarica dropdown
      await loadStripKeysIntoSelect();

      // seleziona la prima rimasta e ricarica editor
      if (stripKey && stripKey.options.length) {
        stripKey.value = stripKey.options[0].value;
        await refreshStripEditor();
      }

      alert("✅ Categoria eliminata: " + key);
    } catch (e) {
      if (createStripMsg) createStripMsg.textContent = "❌ " + e.message;
      alert("❌ " + e.message);
    }
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
await Promise.all([
  loadItems(),
  loadComeFunziona(),
  loadReservations(),
  loadHome(),
  loadStripKeysIntoSelect(),
  loadBookingSettings()
]);
// dopo che le keys sono caricate, ricarico l'editor della sezione selezionata
await refreshStripEditor();
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
  .then(loadStripKeysIntoSelect)
  .then(loadBookingSettings)
  .then(() => refreshStripEditor())
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


/* =========================================================
   STRIP - CARICA + MOSTRA + MODIFICA ITEMS (EDIT/DELETE)
   usa:
     GET  /api/strip/:key
     PUT  /api/admin/strip/:key   body: { title, items }
   ========================================================= */

async function loadStripData(key) {
  if (!key) return { title: "", order: 0, items: [] };

  const res = await api("/api/strip/" + encodeURIComponent(key)).catch(() => ({ data: {} }));
  const d = res && res.data && typeof res.data === "object" ? res.data : {};

  return {
    title: String(d.title || ""),
    order: Number.isFinite(Number(d.order)) ? Number(d.order) : 0,
    items: Array.isArray(d.items) ? d.items : []
  };
}

async function saveStripData(key, title, order, items) {
  await api("/api/admin/strip/" + encodeURIComponent(key), {
    method: "PUT",
    body: JSON.stringify({
      title: title || "",
      order: Number(order || 0),
      items: Array.isArray(items) ? items : []
    })
  });
}

function renderStripItemsEditor(items) {
  if (!stripItemsGrid) return;
  stripItemsGrid.innerHTML = "";

  if (!items || !items.length) {
    stripItemsGrid.innerHTML = `<div style="opacity:.7; font-size:13px;">Nessun piatto presente in questa sezione.</div>`;
    return;
  }

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "card";
    row.style.padding = "12px";
    row.style.borderRadius = "14px";
    row.style.border = "1px solid rgba(0,0,0,.06)";

row.innerHTML = `
<button data-s="toggle"
  style="all:unset; width:100%; cursor:pointer;">
  <div style="display:flex; gap:12px; align-items:center;">
    <img src="${escapeAttr(it.image_url || "")}"
      style="width:84px; height:64px; object-fit:cover; border-radius:12px; background:#eee;">
    <strong>${escapeHtml(it.name || "Senza nome")}</strong>
  </div>
</button>

<div data-s="editor" hidden style="margin-top:12px;">
  <input data-s="name" value="${escapeAttr(it.name || "")}"
    style="width:100%; margin-bottom:8px;">

  <label class="btn secondary" style="width:100%;">
    Cambia foto
    <input data-s="file" type="file" hidden>
  </label>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <button data-s="save" class="btn success" style="flex:1;">Salva</button>
    <button data-s="del" class="btn danger" style="flex:1;">Elimina</button>
  </div>

  <div data-s="msg" style="margin-top:6px; font-size:12px;"></div>
</div>
`;

const toggleBtn = row.querySelector('[data-s="toggle"]');
const editor = row.querySelector('[data-s="editor"]');

toggleBtn.onclick = () => {
  const isOpen = stripOpenIndex === idx;

  // chiude tutti
  stripItemsGrid
    .querySelectorAll('[data-s="editor"]')
    .forEach(e => e.hidden = true);

  if (isOpen) {
    stripOpenIndex = null;
  } else {
    editor.hidden = false;
    stripOpenIndex = idx;

    row.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
    // handlers
    const fileInput = row.querySelector('[data-s="file"]');
    const msgEl = row.querySelector('[data-s="msg"]');
    const nameInput = row.querySelector('[data-s="name"]');

    // CAMBIA FOTO (upload immediato e aggiorna url in memoria)
    fileInput.onchange = async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      msgEl.textContent = "Upload foto...";
      try {
        const url = await uploadOneFileToR2(file);
        it.image_url = url; // aggiorna oggetto
        // aggiorna preview
        const img = row.querySelector("img");
        if (img) {
          img.style.display = "";
          img.src = url;
        }
        msgEl.textContent = "✅ Foto aggiornata (ora premi Salva)";
      } catch (e) {
        msgEl.textContent = "❌ " + e.message;
      }
    };

    // SALVA singolo item: salva TUTTA la lista
    row.querySelector('[data-s="save"]').onclick = async () => {
      const key = String(stripKey?.value || "").trim();
      if (!key) return alert("Seleziona la sezione");

      const title = String(stripTitle?.value || "").trim();
      it.name = String(nameInput.value || "").trim();

      if (!it.name) return alert("Nome piatto obbligatorio");

      msgEl.textContent = "Salvataggio...";
      try {
        const { items: currentItems } = await loadStripData(key);
        // ricostruisco lista mantenendo ordine, sostituisco l'elemento per id o per index
        const next = currentItems.map((x, i) => {
          const same =
            (it.id != null && x.id === it.id) ||
            (it.id == null && i === idx);
          return same ? { ...x, name: it.name, image_url: it.image_url } : x;
        });

        await saveStripData(key, title, next);
        msgEl.textContent = "✅ Salvato";
        await refreshStripEditor(); // ricarica da DB e ridisegna
      } catch (e) {
        msgEl.textContent = "❌ " + e.message;
      }
    };

    // ELIMINA item: salva TUTTA la lista senza quell'item
    row.querySelector('[data-s="del"]').onclick = async () => {
      const ok = confirm("Eliminare questo piatto dallo scroll?");
      if (!ok) return;

      const key = String(stripKey?.value || "").trim();
      if (!key) return alert("Seleziona la sezione");
      const title = String(stripTitle?.value || "").trim();

      msgEl.textContent = "Eliminazione...";
      try {
        const { items: currentItems } = await loadStripData(key);
        const next = currentItems.filter((x, i) => {
          const same =
            (it.id != null && x.id === it.id) ||
            (it.id == null && i === idx);
          return !same;
        });

        await saveStripData(key, title, next);
        msgEl.textContent = "✅ Eliminato";
        await refreshStripEditor();
      } catch (e) {
        msgEl.textContent = "❌ " + e.message;
      }
    };

    stripItemsGrid.appendChild(row);
  });
}

// ricarica titolo + lista in editor
async function refreshStripEditor() {
  const key = String(stripKey?.value || "").trim();
  if (!key) return;

  if (stripMsg) stripMsg.textContent = "Caricamento sezione...";
  const d = await loadStripData(key);

  if (stripTitle) stripTitle.value = d.title || "";
  if (stripOrder) stripOrder.value = String(d.order ?? 0);
  renderStripItemsEditor(d.items);

  if (stripMsg) stripMsg.textContent = "OK";
}

// =======================
// SALVA TITOLO STRIP
// =======================
if (saveStripTitleBtn) {
  saveStripTitleBtn.onclick = async () => {
    const key = String(stripKey?.value || "").trim();
    const title = String(stripTitle?.value || "").trim();
const order = Number(stripOrder?.value || 0);

    if (!key) return alert("Seleziona una sezione");
    if (!title) return alert("Inserisci un titolo");

    try {
      const current = await api("/api/strip/" + encodeURIComponent(key)).catch(() => ({ data: {} }));
      const items = Array.isArray(current?.data?.items) ? current.data.items : [];

      await api("/api/admin/strip/" + encodeURIComponent(key), {
        method: "PUT",
body: JSON.stringify({ title, order, items })
      });

      alert("✅ Titolo salvato");
    } catch (e) {
      alert("❌ " + e.message);
    }
  };
}

// =======================
// AGGIUNGI PIATTO STRIP
// =======================
if (addStripItemBtn) {
  addStripItemBtn.onclick = async () => {
    const key = String(stripKey?.value || "").trim();
    const name = String(stripItemName?.value || "").trim();
    const file = stripItemFile?.files?.[0];

    if (!key) return alert("Seleziona la sezione");
    if (!name) return alert("Scrivi il nome piatto");
    if (!file) return alert("Seleziona un'immagine");

    try {
      const imageUrl = await uploadOneFileToR2(file);

      await api("/api/admin/strip/items", {
        method: "POST",
        body: JSON.stringify({ key, name, image_url: imageUrl })
      });

      stripItemName.value = "";
      stripItemFile.value = "";
      alert("✅ Piatto aggiunto!");
    } catch (e) {
      alert("❌ " + e.message);
    }
  };
}

})();
