const projectGrid = document.getElementById("projectGrid");
const projectSearchInput = document.getElementById("projectSearchInput");
const projectSortSelect = document.getElementById("projectSortSelect");
const projectEmptyState = document.getElementById("projectEmptyState");
const currentYear = document.getElementById("currentYear");

const projectPreviewModal = document.getElementById("projectPreviewModal");
const projectPreviewTitle = document.getElementById("projectPreviewTitle");
const projectPreviewCategory = document.getElementById("projectPreviewCategory");
const projectPreviewImage = document.getElementById("projectPreviewImage");
const projectPreviewPrevious = document.getElementById("projectPreviewPrevious");
const projectPreviewNext = document.getElementById("projectPreviewNext");
const projectPreviewCounter = document.getElementById("projectPreviewCounter");
const projectPreviewStatus = document.getElementById("projectPreviewStatus");
const projectPreviewDescription = document.getElementById("projectPreviewDescription");
const projectPreviewTechList = document.getElementById("projectPreviewTechList");
const projectPreviewActions = document.getElementById("projectPreviewActions");

let allProjects = [];
let activePreviewImages = [];
let activePreviewImageIndex = 0;
let previewTouchStartX = 0;

currentYear.textContent = new Date().getFullYear();

async function loadProjects() {
    try {
        const response = await fetch("projects.json");

        if (!response.ok) {
            throw new Error("Unable to load project data.");
        }

        const projects = await response.json();

        allProjects = projects;
        setupProjectControls();
        applyProjectFiltersAndSort();
    } catch (error) {
        projectGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          Project catalogue could not be loaded. Please check projects.json.
        </div>
      </div>
    `;

        console.error(error);
    }
}

function renderProjects(projects) {
    projectGrid.innerHTML = "";

    if (projects.length === 0) {
        projectEmptyState.classList.remove("d-none");
        return;
    }

    projectEmptyState.classList.add("d-none");

    projects.forEach((project) => {
        const projectIndex = allProjects.indexOf(project);
        const projectCard = createProjectCard(project, projectIndex);

        projectGrid.insertAdjacentHTML("beforeend", projectCard);
    });
}

function setupProjectControls() {
    projectSearchInput.addEventListener("input", applyProjectFiltersAndSort);
    projectSortSelect.addEventListener("change", applyProjectFiltersAndSort);

    projectGrid.addEventListener("click", (event) => {
        const imageButton = event.target.closest(".project-image-button");

        if (!imageButton) {
            return;
        }

        const projectIndex = Number(imageButton.dataset.projectIndex);

        openProjectPreview(projectIndex);
    });
      projectPreviewPrevious.addEventListener("click", () => {
    showProjectPreviewImage(-1);
  });

  projectPreviewNext.addEventListener("click", () => {
    showProjectPreviewImage(1);
  });

  projectPreviewImage.addEventListener(
    "touchstart",
    (event) => {
      previewTouchStartX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );

  projectPreviewImage.addEventListener(
    "touchend",
    (event) => {
      const previewTouchEndX = event.changedTouches[0].screenX;
      const swipeDistance = previewTouchEndX - previewTouchStartX;

      if (Math.abs(swipeDistance) < 50) {
        return;
      }

      showProjectPreviewImage(swipeDistance > 0 ? -1 : 1);
    },
    { passive: true }
  );
}

function applyProjectFiltersAndSort() {
    const searchTerm = projectSearchInput.value.trim().toLowerCase();

    const filteredProjects = allProjects.filter((project) => {
        const searchableText = [
            project.title,
            project.shortDescription,
            project.category,
            project.status,
            project.technologies.join(" ")
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(searchTerm);
    });

    const sortedProjects = sortProjects(filteredProjects, projectSortSelect.value);

    renderProjects(sortedProjects);
}

function sortProjects(projects, sortType) {
    const sortedProjects = [...projects];

    if (sortType === "name") {
        return sortedProjects.sort((firstProject, secondProject) =>
            firstProject.title.localeCompare(secondProject.title)
        );
    }

    if (sortType === "category") {
        return sortedProjects.sort((firstProject, secondProject) => {
            const categoryComparison = firstProject.category.localeCompare(secondProject.category);

            if (categoryComparison !== 0) {
                return categoryComparison;
            }

            return firstProject.title.localeCompare(secondProject.title);
        });
    }

    if (sortType === "status") {
        return sortedProjects.sort((firstProject, secondProject) => {
            const statusComparison =
                getStatusSortWeight(firstProject.status) - getStatusSortWeight(secondProject.status);

            if (statusComparison !== 0) {
                return statusComparison;
            }

            return firstProject.title.localeCompare(secondProject.title);
        });
    }

    return sortedProjects.sort((firstProject, secondProject) => {
        const recommendedComparison =
            getRecommendedSortWeight(firstProject.status) - getRecommendedSortWeight(secondProject.status);

        if (recommendedComparison !== 0) {
            return recommendedComparison;
        }

        return firstProject.title.localeCompare(secondProject.title);
    });
}

function getRecommendedSortWeight(status) {
    return status === "Completed" ? 1 : 2;
}

function getStatusSortWeight(status) {
    return status === "Completed" ? 1 : 2;
}

function createProjectCard(project, projectIndex) {
    const technologies = project.technologies
        .map((technology) => `<span class="tech-badge">${escapeHtml(technology)}</span>`)
        .join("");

    const githubButton = createProjectLink(
        project.repositoryUrl,
        "GitHub",
        "project-action-link project-action-link--secondary"
    );

    const liveButton = createProjectLink(
        project.liveUrl,
        "View App",
        "project-action-link project-action-link--primary"
    );

    const statusClass = createStatusClass(project.status);

    return `
    <article class="col-md-6 col-xl-4">
      <div class="project-card">
        <button
          type="button"
          class="project-image-button"
          data-project-index="${projectIndex}"
          aria-label="Preview ${escapeHtml(project.title)}"
        >
          <img
            src="${escapeHtml(project.imageUrl)}"
            alt="${escapeHtml(project.title)} screenshot"
            class="project-image"
          >
        </button>

        <div class="project-card-body">
          <div class="project-meta">
            <span class="project-category">${escapeHtml(project.category)}</span>
            <span class="project-status project-status--${statusClass}">
              ${escapeHtml(project.status)}
            </span>
          </div>

          <h3 class="project-title">${escapeHtml(project.title)}</h3>

<p class="project-description">
  ${escapeHtml(project.shortDescription)}
</p>

<p class="project-card-hint">
  Click screenshot for full preview
</p>

<div class="tech-list">
  ${technologies}
</div>

          <div class="project-actions">
            ${githubButton}
            ${liveButton}
          </div>
        </div>
      </div>
    </article>
  `;
}

function openProjectPreview(projectIndex) {
    const project = allProjects[projectIndex];

    if (!project) {
        return;
    }

    const technologies = project.technologies
        .map((technology) => `<span class="tech-badge">${escapeHtml(technology)}</span>`)
        .join("");

    const githubButton = createProjectLink(
        project.repositoryUrl,
        "GitHub",
        "project-action-link project-action-link--secondary"
    );

    const liveButton = createProjectLink(
        project.liveUrl,
        "View App",
        "project-action-link project-action-link--primary"
    );

    const statusClass = createStatusClass(project.status);

    projectPreviewTitle.textContent = project.title;
    projectPreviewCategory.textContent = project.category;
activePreviewImages = getProjectPreviewImages(project);
activePreviewImageIndex = 0;
updateProjectPreviewImage(project.title);
    projectPreviewStatus.textContent = project.status;
    projectPreviewStatus.className = `project-status project-status--${statusClass}`;
    projectPreviewDescription.textContent = project.shortDescription;
    projectPreviewTechList.innerHTML = technologies;
    projectPreviewActions.innerHTML = `${githubButton}${liveButton}`;

    const modal = new bootstrap.Modal(projectPreviewModal);
    modal.show();
}

function getProjectPreviewImages(project) {
  if (Array.isArray(project.imageUrls) && project.imageUrls.length > 0) {
    return project.imageUrls.filter((imageUrl) => imageUrl.trim() !== "");
  }

  return [project.imageUrl];
}

function updateProjectPreviewImage(projectTitle) {
  const imageUrl = activePreviewImages[activePreviewImageIndex];

  projectPreviewImage.src = imageUrl;
  projectPreviewImage.alt = `${projectTitle} screenshot ${activePreviewImageIndex + 1}`;

  projectPreviewCounter.textContent = `${activePreviewImageIndex + 1} / ${activePreviewImages.length}`;

  const hasMultipleImages = activePreviewImages.length > 1;

  projectPreviewPrevious.hidden = !hasMultipleImages;
  projectPreviewNext.hidden = !hasMultipleImages;
  projectPreviewCounter.hidden = !hasMultipleImages;
}

function showProjectPreviewImage(direction) {
  if (activePreviewImages.length <= 1) {
    return;
  }

  activePreviewImageIndex =
    (activePreviewImageIndex + direction + activePreviewImages.length) %
    activePreviewImages.length;

  updateProjectPreviewImage(projectPreviewTitle.textContent);
}

function createStatusClass(status) {
    return String(status)
        .trim()
        .toLowerCase()
        .replaceAll(" ", "-");
}

function createProjectLink(url, label, className) {
    if (!isValidProjectUrl(url)) {
        return `
      <span class="${className}" aria-disabled="true">
        ${label}
      </span>
    `;
    }

    return `
    <a
      href="${escapeHtml(url)}"
      class="${className}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${label}
    </a>
  `;
}

function isValidProjectUrl(url) {
    return typeof url === "string" && url.trim() !== "" && url.trim() !== "#";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadProjects();