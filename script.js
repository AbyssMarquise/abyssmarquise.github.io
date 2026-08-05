const lightbox = GLightbox({
  selector: ".glightbox",
  loop: true,
  touchNavigation: true,
  closeButton: true,
});

document.querySelectorAll(".project-card").forEach((card) => {
  const firstImage = card.querySelector(".glightbox");

  if (!firstImage) {
    return;
  }

  card.classList.add("project-card-clickable");
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", "button");

  const openFirstImage = () => {
    firstImage.click();
  };

  card.addEventListener("click", (event) => {
    /*
     * Si l’utilisateur clique directement sur une miniature GLightbox,
     * on laisse cette image précise s’ouvrir.
     */
    if (event.target.closest(".glightbox")) {
      return;
    }

    /*
     * Un clic ailleurs dans la carte ouvre toujours la première image.
     */
    openFirstImage();
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFirstImage();
    }
  });
});
