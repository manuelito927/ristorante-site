(function () {
  const SELECTOR = `
    h1, h2, h3, p,
    .hero-card, .home-hero-card,
    .info-block, .menu-section, .item,
    .piatti-title, .piatto-card,
    .card
  `;

  function markElements() {
    document.querySelectorAll(SELECTOR).forEach(el => {
      // evita di animare header/menu e roba “fissa”
      if (el.closest("header") || el.closest("nav")) return;

      // evita doppioni
      if (el.classList.contains("reveal") || el.classList.contains("is-visible")) return;

      el.classList.add("reveal");
    });
  }

  function initObserver() {
    const elements = document.querySelectorAll(".reveal:not(.is-visible)");

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
    }, { threshold: 0.15 });

    elements.forEach(el => observer.observe(el));
  }

  function run() {
    markElements();
    initObserver();
  }

  // prima volta
  run();

  // per contenuti caricati via fetch/innerHTML (Home ecc.)
  const mo = new MutationObserver(() => run());
  mo.observe(document.body, { childList: true, subtree: true });
})();