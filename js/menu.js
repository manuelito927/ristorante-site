document.querySelectorAll(".js-toggle").forEach((btn) => {
  const content = btn.nextElementSibling;
  const plus = btn.querySelector(".plus");

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";

    btn.setAttribute("aria-expanded", String(!isOpen));
    content.hidden = isOpen;
    plus.textContent = isOpen ? "+" : "–";
  });
});