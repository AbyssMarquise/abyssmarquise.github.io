const CONTENT_FILES = [
  "content/accueil.json",
  "content/a-propos.json",
  "content/presentation-projets.json",
  "content/contact.json",
];

const GITHUB_REPOSITORY = "abyssmarquise/abyssmarquise.github.io";
const GITHUB_BRANCH = "main";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePublicPath(path = "") {
  return String(path).replace(/^\//, "");
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Impossible de charger ${path}.`);
  return response.json();
}

function applyEditableContent(content) {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = content[element.dataset.content];
    if (typeof value !== "string") return;
    element.innerHTML = value;
    if (element.hasAttribute("hidden") && value.trim()) {
      element.removeAttribute("hidden");
    }
  });

  const email = document.querySelector("[data-email]");
  if (email && typeof content.email === "string") {
    email.href = `mailto:${content.email}`;
    email.firstChild.textContent = `${content.email} `;
  }
}

async function loadEditableContent() {
  try {
    const sections = await Promise.all(CONTENT_FILES.map(fetchJson));
    applyEditableContent(Object.assign({}, ...sections));
  } catch (error) {
    console.warn("Le contenu éditable n’a pas pu être chargé.", error);
  }
}

async function listContentFiles() {
  const treeUrl =
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/git/trees/` +
    `${GITHUB_BRANCH}?recursive=1`;
  const response = await fetch(treeUrl, {
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error("GitHub n’a pas retourné la liste des contenus.");
  }

  const data = await response.json();
  const paths = (data.tree || [])
    .filter((item) => item.type === "blob" && item.path.endsWith(".json"))
    .map((item) => item.path);

  return {
    categories: paths.filter((path) => path.startsWith("content/categories/")),
    projects: paths.filter((path) => path.startsWith("content/projets/")),
  };
}

function projectDescription(project) {
  const details = [];
  if (project.classification?.projectType) {
    details.push(`<strong>Type :</strong> ${escapeHtml(project.classification.projectType)}`);
  }
  if (project.domain) details.push(`<strong>Domaine :</strong> ${escapeHtml(project.domain)}`);
  if (project.client) details.push(`<strong>Client :</strong> ${escapeHtml(project.client)}`);
  if (project.date) details.push(`<strong>Date :</strong> ${escapeHtml(project.date)}`);
  if (project.brief) details.push(`<strong>Brief :</strong> ${escapeHtml(project.brief)}`);
  if (Array.isArray(project.tools) && project.tools.length) {
    details.push(`<strong>Outils :</strong> ${project.tools.map(escapeHtml).join(", ")}`);
  }
  return details.join("<br>");
}

function categorySlug(title = "") {
  return String(title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createProjectVisual(category, projects, number) {
  const gallery = `categorie-${categorySlug(category.title)}`;
  const projectsWithImages = projects.filter((project) => project.image);
  const visualClass = projectsWithImages.length > 1 ? "project-visual--gallery" : "";
  const links = projectsWithImages
    .map((project, index) => {
      const image = normalizePublicPath(project.image);
      const mainClass = index === 0 ? "project-main-image" : "project-gallery-image";
      return `
        <a href="${escapeHtml(image)}" class="glightbox ${mainClass}"
          data-gallery="${escapeHtml(gallery)}"
          data-title="${escapeHtml(project.title || category.title)}"
          data-description="${escapeHtml(projectDescription(project))}"
          aria-label="Voir ${escapeHtml(project.title || category.title)}">
          ${index === 0 ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title || category.title)}">` : ""}
        </a>`;
    })
    .join("");

  return `
    <div class="project-visual visual-dynamic ${visualClass} ${projectsWithImages.length ? "" : "empty-project-visual"}">
      <span class="project-number">${String(number).padStart(2, "0")}</span>
      ${links}
      ${projectsWithImages.length > 1 ? `<span class="project-count">${projectsWithImages.length} projets</span>` : ""}
    </div>`;
}

function createCategoryCard(category, projects, index) {
  const card = document.createElement("article");
  card.className = "project-card";
  const types = Array.isArray(category.projectTypes) ? category.projectTypes : [];
  const typeItems = types.map((type) => `<li>${escapeHtml(type)}</li>`).join("");
  const projectItems = projects
    .map((project) => {
      const client = project.client ? ` — ${escapeHtml(project.client)}` : "";
      return `<li class="project-entry">${escapeHtml(project.title || "Projet")}${client}</li>`;
    })
    .join("");

  card.innerHTML = `
    ${createProjectVisual(category, projects, index + 1)}
    <div class="project-content">
      <p class="project-type">${escapeHtml(category.verb || "")}</p>
      <h3>${escapeHtml(category.title || "Catégorie")}</h3>
      <p>${escapeHtml(category.description || "")}</p>
      ${typeItems ? `<ul aria-label="Types de projets">${typeItems}</ul>` : ""}
      ${projectItems ? `<div class="category-projects"><strong>Réalisations</strong><ul>${projectItems}</ul></div>` : ""}
    </div>`;
  return card;
}

function activateProjectCards() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const firstImage = card.querySelector(".glightbox");
    if (!firstImage) return;
    card.classList.add("project-card-clickable");
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.addEventListener("click", (event) => {
      if (!event.target.closest(".glightbox")) firstImage.click();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        firstImage.click();
      }
    });
  });
}

async function loadProjects() {
  const grid = document.querySelector("#projects-grid");
  if (!grid) return;

  try {
    const files = await listContentFiles();
    const [categories, projects] = await Promise.all([
      Promise.all(files.categories.map(fetchJson)),
      Promise.all(files.projects.map(fetchJson)),
    ]);

    categories.sort((first, second) =>
      String(first.title || "").localeCompare(String(second.title || ""), "fr"),
    );

    grid.replaceChildren();
    categories.forEach((category, index) => {
      const categoryProjects = projects.filter(
        (project) => project.classification?.category === category.title,
      );
      grid.appendChild(createCategoryCard(category, categoryProjects, index));
    });

    if (!categories.length) {
      grid.innerHTML = '<p class="projects-loading">Aucune catégorie publiée.</p>';
      return;
    }

    activateProjectCards();
    GLightbox({ selector: ".glightbox", loop: true, touchNavigation: true, closeButton: true });
  } catch (error) {
    console.warn("Les projets n’ont pas pu être chargés.", error);
    grid.innerHTML = '<p class="projects-loading">Les projets sont momentanément indisponibles.</p>';
  }
}

loadEditableContent();
loadProjects();
