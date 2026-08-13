const PAGE_FILES = ["accueil", "a-propos", "presentation-projets", "contact"];
const REPOSITORY = "abyssmarquise/abyssmarquise.github.io";

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Impossible de charger ${path}.`);
  return response.json();
}

function assetPath(path = "") {
  return String(path).replace(/^\//, "");
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadPages() {
  const pages = await Promise.all(
    PAGE_FILES.map((name) => fetchJson(`content/${name}.json`)),
  );
  const content = Object.assign({}, ...pages);
  if (content.siteTitle) document.title = content.siteTitle;
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = content[element.dataset.content];
    if (typeof value !== "string") return;
    element.innerHTML = value;
    if (value.trim()) element.removeAttribute("hidden");
  });
  document.querySelectorAll("[data-list]").forEach((element) => {
    const values = content[element.dataset.list];
    if (!Array.isArray(values)) return;
    element.replaceChildren(
      ...values.map((value) => {
        const item = document.createElement("span");
        item.textContent = value;
        return item;
      }),
    );
  });
  const email = document.querySelector("[data-email]");
  if (email && content.email) {
    email.href = `mailto:${content.email}`;
    email.insertBefore(
      document.createTextNode(`${content.email} `),
      email.firstChild,
    );
  }

  const footerEmail = document.querySelector("[data-footer-email]");
  if (footerEmail && content.email) {
    footerEmail.href = `mailto:${content.email}`;
    footerEmail.textContent = content.email;
  }

  document.querySelectorAll("[data-social]").forEach((link) => {
    const url = content[link.dataset.social];
    if (typeof url === "string" && url.trim()) {
      link.href = url;
    } else {
      link.hidden = true;
    }
  });
  const hero = document.querySelector(".hero");

  if (hero) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hero.classList.remove("hero-loading");
        hero.classList.add("hero-ready");
      });
    });
  }
}

async function collectionPaths() {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/git/trees/main?recursive=1`,
    {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    },
  );
  if (!response.ok) throw new Error("Impossible de lire les collections.");
  const tree = (await response.json()).tree || [];
  const paths = tree
    .filter((item) => item.type === "blob" && item.path.endsWith(".json"))
    .map((item) => item.path);
  return {
    categories: paths.filter((path) => path.startsWith("content/categories/")),
    projects: paths.filter((path) => path.startsWith("content/projets/")),
  };
}

function projectCaption(project) {
  return [
    project.classification?.projectType,
    project.domain && `Domaine : ${project.domain}`,
    project.client && `Client : ${project.client}`,
    project.date && `Date : ${project.date}`,
    project.brief,
    project.tools?.length && `Outils : ${project.tools.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function lightboxLink(project, className, gallery, showImage = true) {
  const link = document.createElement("a");
  link.href = assetPath(project.image);
  link.className = `glightbox ${className}`;
  link.dataset.gallery = gallery;
  link.dataset.title = project.title || "";
  link.dataset.description = projectCaption(project);
  link.setAttribute("aria-label", project.title || "Voir le projet");
  if (showImage) {
    const image = document.createElement("img");
    image.src = assetPath(project.image);
    image.alt = project.title || "";
    link.appendChild(image);
  }
  return link;
}

function navigationButtons(targets) {
  const fragment = document.createDocumentFragment();
  [
    ["previous", "m15 18-6-6 6-6"],
    ["next", "m9 6 6 6-6 6"],
  ].forEach(([direction, path]) => {
    const button = document.createElement("button");
    button.className = `project-switch project-switch--${direction}`;
    button.type = "button";
    button.dataset.projectSwitch = targets[direction];
    button.setAttribute(
      "aria-label",
      direction === "previous"
        ? "Afficher la miniature précédente"
        : "Afficher la miniature suivante",
    );
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"></path></svg>`;
    fragment.appendChild(button);
  });
  return fragment;
}

function buildSlide(layout, projects, categoryIndex, slideIndex, slideCount) {
  const templateName =
    layout === "posters"
      ? "posters-visual-template"
      : layout === "browser"
        ? "browser-visual-template"
        : layout === "communication"
          ? "communication-visual-template"
          : "single-visual-template";
  const slide = document
    .querySelector(`#${templateName}`)
    .content.firstElementChild.cloneNode(true);
  const slideId = `${categoryIndex + 1}-${slideIndex + 1}`;
  slide.dataset.projectSlide = slideId;
  slide.hidden = slideIndex > 0;
  slide.querySelector(".project-number").textContent = String(
    categoryIndex + 1,
  ).padStart(2, "0");
  const assets = slide.querySelector(".project-assets");
  const gallery = `projet-${categoryIndex + 1}-${slideIndex + 1}`;

  if (layout === "posters") {
    projects.slice(0, 2).forEach((project, index) => {
      assets.appendChild(
        lightboxLink(
          project,
          `poster poster-${index === 0 ? "one" : "two"}`,
          gallery,
        ),
      );
    });
  } else if (layout === "browser") {
    projects.forEach((project) =>
      assets.appendChild(lightboxLink(project, "browser-ad", gallery)),
    );
    slide.querySelector(".browser-logo").textContent =
      projects[0]?.browserLogo || "MÉDIAS";
    slide.querySelector(".browser-category").textContent =
      projects[0]?.browserCategory || projects[0]?.domain || "";
    slide.querySelector(".browser-address span:last-child").textContent =
      projects[0]?.browserAddress || "";
  } else {
    projects.forEach((project, index) =>
      assets.appendChild(
        lightboxLink(
          project,
          index ? "project-gallery-image" : "project-main-image",
          gallery,
          index === 0,
        ),
      ),
    );
  }

  if (slideCount > 1) {
    const previous = `${categoryIndex + 1}-${((slideIndex - 1 + slideCount) % slideCount) + 1}`;
    const next = `${categoryIndex + 1}-${((slideIndex + 1) % slideCount) + 1}`;
    slide
      .querySelector(".project-navigation")
      ?.appendChild(navigationButtons({ previous, next }));
  }
  return slide;
}

function buildCategory(category, projects, index) {
  const card = document
    .querySelector("#category-card-template")
    .content.firstElementChild.cloneNode(true);
  card.querySelector(".project-type").textContent = category.verb || "";
  card.querySelector("h3").textContent = category.title || "";
  card.querySelector(".project-description").textContent =
    category.description || "";
  const types = card.querySelector(".project-content ul");
  (category.projectTypes || []).forEach((type) => {
    const item = document.createElement("li");
    item.textContent = typeof type === "string" ? type : type.title;
    types.appendChild(item);
  });

  const groups = new Map();
  projects
    .filter((project) => project.image)
    .forEach((project) => {
      const layout = project.layout || "single";
      if (!groups.has(layout)) groups.set(layout, []);
      groups.get(layout).push(project);
    });
  if (!groups.size) groups.set("single", []);
  const slides = [...groups.entries()];
  slides.forEach(([layout, groupedProjects], slideIndex) => {
    card
      .querySelector(".project-slides")
      .appendChild(
        buildSlide(layout, groupedProjects, index, slideIndex, slides.length),
      );
  });
  return card;
}

function activateCards() {
  document.querySelectorAll("[data-grouped-project]").forEach((card) => {
    const slides = [...card.querySelectorAll("[data-project-slide]")];
    card.querySelectorAll("[data-project-switch]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        slides.forEach((slide) => {
          slide.hidden =
            slide.dataset.projectSlide !== button.dataset.projectSwitch;
        });
      });
    });
    const firstImage = card.querySelector(".glightbox");
    if (!firstImage) return;
    card.classList.add("project-card-clickable");
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    const visibleImage = () =>
      card.querySelector("[data-project-slide]:not([hidden]) .glightbox") ||
      firstImage;
    card.addEventListener("click", (event) => {
      if (!event.target.closest("[data-project-switch], .glightbox"))
        visibleImage().click();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        visibleImage().click();
      }
    });
  });
}

async function loadCollections() {
  const paths = await collectionPaths();
  const [categories, projects] = await Promise.all([
    Promise.all(paths.categories.map(fetchJson)),
    Promise.all(paths.projects.map(fetchJson)),
  ]);
  const grid = document.querySelector("#projects-grid");
  categories.forEach((category, index) => {
    const related = projects.filter(
      (project) => project.classification?.category === category.title,
    );
    grid.appendChild(buildCategory(category, related, index));
  });
  activateCards();
  GLightbox({
    selector: ".glightbox",
    loop: true,
    touchNavigation: true,
    closeButton: true,
  });
}

Promise.all([loadPages(), loadCollections()]).catch((error) =>
  console.warn("Le contenu Decap n’a pas pu être chargé.", error),
);
