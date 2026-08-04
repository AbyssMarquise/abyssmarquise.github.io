let lastAbonnementSlide = 0;

const lightbox = GLightbox({
  selector: ".glightbox",
  loop: true,
  touchNavigation: true,
  closeButton: true,
});

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", function (e) {
    if (e.target.closest(".glightbox")) return;

    this.querySelector(".glightbox").click();
  });
});
