async function loadEditableContent() {
  try {
    const response = await fetch("content/site.json", { cache: "no-store" });
    if (!response.ok) return;

    const content = await response.json();
    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = content[element.dataset.content];
      if (typeof value === "string") element.innerHTML = value;
    });

    const email = document.querySelector("[data-email]");
    if (email && typeof content.email === "string") {
      email.href = `mailto:${content.email}`;
      email.firstChild.textContent = `${content.email} `;
    }
  } catch (error) {
    console.warn("Le contenu éditable n’a pas pu être chargé.", error);
  }
}

loadEditableContent();

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

async function loadProjects() {
  const grid = document.querySelector("#projects-grid");
  if (!grid) return;

  try {
    const indexResponse = await fetch("content/projets/index.json", {
      cache: "no-store",
    });

    if (!indexResponse.ok) return;

    const files = await indexResponse.json();

    const projects = await Promise.all(
      files.map(async (file) => {
        const response = await fetch(`content/projets/${file}.json`, {
          cache: "no-store",
        });

        return response.ok ? response.json() : null;
      }),
    );

    projects.filter(Boolean).forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card";

      const skills = (project.skills || [])
        .map((skill) => `<li>${skill}</li>`)
        .join("");

      const image = project.image
        ? `
          <a href="${project.image}" class="glightbox project-main-image"
             data-gallery="project-${index + 1}"
             data-title="${project.title}">
            <img src="${project.image}" alt="${project.title}">
          </a>
        `
        : "";

      card.innerHTML = `
        <div class="project-visual visual-identity">
          <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
          ${image}
        </div>
        <div class="project-content">
          <p class="project-type">${project.category || ""}</p>
          <h3>${project.title || ""}</h3>
          <p>${project.description || ""}</p>
          <ul aria-label="Outils et expertises">${skills}</ul>
        </div>
      `;

      grid.appendChild(card);
    });

    GLightbox({
      selector: ".glightbox",
      loop: true,
      touchNavigation: true,
      closeButton: true,
    });
  } catch (error) {
    console.warn("Les projets n’ont pas pu être chargés.", error);
  }
}

loadProjects();
