// Scroll reveal globale (auto, senza data-reveal)
(function () {
  const SELECTOR = [
    "main",
    "section",
    ".card",
    ".item-card",
    ".item",
    ".info-block",
    ".home-hero-card",
    ".piatti-strip",
    ".piatti-title",
    ".strip-categories",
    ".piatti-scroll",
    "#homeCards > *",
    "h1, h2, h3, p, li"
  ].join(",");

  // Esclusioni: roba che NON vuoi animare
  const EXCLUDE = [
    "header",
    ".header",
    "nav",
    ".mobile-menu",
    ".menu-backdrop",
    ".hero",
    "#pageHero",
    "script",
    "style"
  ].join(",");

  const all = Array.from(document.querySelectorAll(SELECTOR));

  const elements = all.filter(el => {
    if (!el || el.closest(EXCLUDE)) return false;

    // evita elementi vuoti / invisibili
    const txt = (el.textContent || "").trim();
    const hasMedia = el.querySelector && el.querySelector("img,video,svg");
    if (!txt && !hasMedia) return false;

    // evita animazioni doppie
    if (el.classList.contains("reveal")) return false;

    el.classList.add("reveal");
    return true;
  });

  // fallback se IntersectionObserver non c'è
  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
})();