(function(){
  function getLang(){
    const q = new URLSearchParams(location.search).get("lang");
    const saved = localStorage.getItem("lang");
    return (q || saved || "it").toLowerCase().startsWith("en") ? "en" : "it";
  }

  function setLang(lang){
    localStorage.setItem("lang", lang);
    const u = new URL(location.href);
    u.searchParams.set("lang", lang);
    location.href = u.toString();
  }

  function mountLangButton(){
    const header = document.querySelector(".header");
    if(!header) return;

    // evita doppioni
    if(document.getElementById("langToggle")) return;

    const lang = getLang();
    document.documentElement.lang = lang;

    const btn = document.createElement("button");
    btn.id = "langToggle";
    btn.type = "button";
    btn.className = "lang-btn";
    btn.setAttribute("aria-label", "Cambia lingua");
btn.innerHTML = lang === "it"
  ? "🇮🇹"
  : "🇬🇧";

    btn.addEventListener("click", () => {
      setLang(lang === "it" ? "en" : "it");
    });

    header.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", mountLangButton);
})();