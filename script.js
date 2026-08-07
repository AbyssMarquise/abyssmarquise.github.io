const lightbox = GLightbox({
  selector: ".glightbox",
  loop: true,
  touchNavigation: true,
  closeButton: true,
});

/*
 * Rend les cartes contenant des images entièrement cliquables.
 */
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
     * Laisse les boutons servant à changer de miniature fonctionner
     * sans ouvrir le carrousel zoomé.
     */
    if (event.target.closest("[data-project-switch]")) {
      return;
    }

    /*
     * Si la personne clique directement sur une image GLightbox,
     * cette image précise s’ouvre.
     */
    if (event.target.closest(".glightbox")) {
      return;
    }

    /*
     * Un clic ailleurs dans la carte ouvre la première image visible.
     */
    const visibleSlide = card.querySelector(
      "[data-project-slide]:not([hidden])",
    );

    const visibleImage =
      visibleSlide?.querySelector(".glightbox") || firstImage;

    visibleImage.click();
  });

  card.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      !event.target.closest("[data-project-switch]")
    ) {
      event.preventDefault();

      const visibleSlide = card.querySelector(
        "[data-project-slide]:not([hidden])",
      );

      const visibleImage =
        visibleSlide?.querySelector(".glightbox") || firstImage;

      visibleImage.click();
    }
  });
});

/*
 * Permet de passer entre les miniatures 02 et 03.
 */
document.querySelectorAll("[data-grouped-project]").forEach((card) => {
  const slides = [...card.querySelectorAll("[data-project-slide]")];

  card.querySelectorAll("[data-project-switch]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const target = button.dataset.projectSwitch;

      slides.forEach((slide) => {
        slide.hidden = slide.dataset.projectSlide !== target;
      });
    });
  });
});
