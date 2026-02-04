// Scroll reveal globale (robusto, anche per contenuti caricati via JS)
(function () {

  function initReveal() {
    const elements = document.querySelectorAll("[data-reveal]:not(.is-visible)");

    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach(el => observer.observe(el));
  }

  // prima volta
  initReveal();

  // 🔥 riascolta quando il DOM cambia (fetch, innerHTML, ecc.)
  const mo = new MutationObserver(() => {
    initReveal();
  });

  mo.observe(document.body, {
    childList: true,
    subtree: true
  });

})();