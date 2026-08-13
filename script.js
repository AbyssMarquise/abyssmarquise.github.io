const PAGE_FILES = [
  "content/accueil.json",
  "content/a-propos.json",
  "content/presentation-projets.json",
  "content/contact.json",
];

const REPOSITORY = "abyssmarquise/abyssmarquise.github.io";

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Impossible de charger ${path}.`);
  return response.json();
}

function publicPath(path = "") {
  return String(path).replace(/^\//, "");
}

async function loadPageContent() {
  const sections = await Promise.all(PAGE_FILES.map(fetchJson));
  const content = Object.assign({}, ...sections);

  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = content[element.dataset.content];
    if (typeof value !== "string") return;
    element.innerHTML = value;
    if (value.trim()) element.removeAttribute("hidden");
  });

  const email = document.querySelector("[data-email]");
  if (email && content.email) {
    email.href = `mailto:${content.email}`;
    email.firstChild.textContent = `${content.email} `;
  }
}

async function listCmsFiles() {
  const url = `https://api.github.com/repos/${REPOSITORY}/git/trees/main?recursive=1`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error("Impossible de lire les collections Decap.");

  const data = await response.json();
  const paths = (data.tree || [])
    .filter((item) => item.type === "blob" && item.path.endsWith(".json"))
    .map((item) => item.path);

  return {
    categories: paths.filter((path) => path.startsWith("content/categories/")),
    projects: paths.filter((path) => path.startsWith("content/projets/")),
  };
}

function projectDetails(project) {
  return [
    project.classification?.projectType && `Type : ${project.classification.projectType}`,
    project.domain && `Domaine : ${project.domain}`,
    project.client && `Client : ${project.client}`,
    project.date && `Date : ${project.date}`,
    project.brief && `Brief : ${project.brief}`,
    project.tools?.length && `Outils : ${project.tools.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function updateProjectLink(link, project) {
  if (!link || !project?.image) return;
  const image = publicPath(project.image);
  link.href = image;
  link.dataset.title = project.title || "Projet";
  link.dataset.description = projectDetails(project);
  link.setAttribute("aria-label", `Voir ${project.title || "le projet"}`);

  const thumbnail = link.querySelector("img");
  if (thumbnail) {
    thumbnail.src = image;
    thumbnail.alt = project.title || "Projet";
  }
}

function updateCategoryCard(category, projects) {
  const card = [...document.querySelectorAll("[data-category-card]")].find(
    (item) => item.dataset.categoryCard === category.title,
  );
  if (!card) return;

  const verb = card.querySelector(".project-type");
  const title = card.querySelector(".project-content h3");
  const description = card.querySelector(".project-content > p:not(.project-type)");
  const list = card.querySelector(".project-content > ul");

  if (verb && category.verb) verb.textContent = category.verb;
  if (title && category.title) title.textContent = category.title;
  if (description && category.description) description.textContent = category.description;

  if (list && Array.isArray(category.projectTypes)) {
    list.replaceChildren(
      ...category.projectTypes.map((type) => {
        const item = document.createElement("li");
        item.textContent = type;
        return item;
      }),
    );
  }

  if (category.title === "Publicités et campagnes") {
    const posters = card.querySelectorAll(".poster.glightbox");
    projects.slice(0, posters.length).forEach((project, index) => {
      updateProjectLink(posters[index], project);
    });
    return;
  }

  const mainImage = card.querySelector(".project-main-image.glightbox");
  if (mainImage && projects[0]) updateProjectLink(mainImage, projects[0]);
}

async function loadCmsCollections() {
  const files = await listCmsFiles();
  const [categories, projects] = await Promise.all([
    Promise.all(files.categories.map(fetchJson)),
    Promise.all(files.projects.map(fetchJson)),
  ]);

  categories.forEach((category) => {
    const relatedProjects = projects.filter(
      (project) => project.classification?.category === category.title,
    );
    updateCategoryCard(category, relatedProjects);
  });
}

function activateGroupedProjects() {
  document.querySelectorAll("[data-grouped-project]").forEach((card) => {
    const slides = [...card.querySelectorAll("[data-project-slide]")];
    card.querySelectorAll("[data-project-switch]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        slides.forEach((slide) => {
          slide.hidden = slide.dataset.projectSlide !== button.dataset.projectSwitch;
        });
      });
    });
  });
}

function activateClickableCards() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const firstImage = card.querySelector(".glightbox");
    if (!firstImage) return;
    card.classList.add("project-card-clickable");
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const visibleImage = () =>
      card.querySelector("[data-project-slide]:not([hidden]) .glightbox") || firstImage;

    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-project-switch], .glightbox")) return;
      visibleImage().click();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      visibleImage().click();
    });
  });
}

async function initializePortfolio() {
  try {
    await Promise.all([loadPageContent(), loadCmsCollections()]);
  } catch (error) {
    console.warn("Une partie du contenu Decap n’a pas pu être chargée.", error);
  }

  activateGroupedProjects();
  activateClickableCards();
  GLightbox({
    selector: ".glightbox",
    loop: true,
    touchNavigation: true,
    closeButton: true,
  });
}

initializePortfolio();
