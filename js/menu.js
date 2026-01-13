document.querySelectorAll(".menu-section").forEach((section) => {
  const btn = section.querySelector(".section-toggle");
  const content = section.querySelector(".section-content");
  const icon = section.querySelector(".section-icon");

  if (!btn || !content || !icon) return;

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!isOpen));
    content.hidden = isOpen;
    icon.textContent = isOpen ? "+" : "–";
  });
});