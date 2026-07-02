const projectGrid = document.getElementById("projectGrid");
const projectSearchInput = document.getElementById("projectSearchInput");
const projectSortSelect = document.getElementById("projectSortSelect");
const projectEmptyState = document.getElementById("projectEmptyState");
const projectResultSummary = document.getElementById("projectResultSummary");
const projectCategoryFilters = document.getElementById("projectCategoryFilters");
const currentYear = document.getElementById("currentYear");
const PROJECT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22450%22%20viewBox%3D%220%200%20800%20450%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22450%22%20fill%3D%22%23EEF2F7%22/%3E%3Crect%20x%3D%22264%22%20y%3D%22168%22%20width%3D%22272%22%20height%3D%22114%22%20rx%3D%2224%22%20fill%3D%22%23FFFFFF%22/%3E%3Ccircle%20cx%3D%22328%22%20cy%3D%22225%22%20r%3D%2226%22%20fill%3D%22%23F2B705%22/%3E%3Cpath%20d%3D%22M379%20244L414%20209L444%20239L464%20219L501%20256H379V244Z%22%20fill%3D%22%23123C69%22/%3E%3Ctext%20x%3D%22400%22%20y%3D%22325%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%230B1F3A%22%3EPreview%20Unavailable%3C/text%3E%3C/svg%3E";

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
const projectScreenshotCache = new Map();
const preloadedProjectImages = new Set();
let projectControlsInitialised = false;
let publicRealtimeRefreshTimer = null;
let activeProjectCategoryFilter = "all";

currentYear.textContent = new Date().getFullYear();

function handleProjectImageError(imageElement) {
  if (!imageElement) {
    return;
  }

  const currentImageSource = imageElement.getAttribute("src") || "";

  if (currentImageSource === PROJECT_PLACEHOLDER_IMAGE) {
    return;
  }

  imageElement.src = PROJECT_PLACEHOLDER_IMAGE;
  imageElement.classList.add("project-image--fallback");
}

function setProjectPreviewImageLoading(isLoading) {
  const previewGallery = projectPreviewImage.closest(".project-preview-gallery");

  if (!previewGallery) {
    return;
  }

  previewGallery.classList.toggle("is-loading", isLoading);
  previewGallery.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function preloadProjectImages(imageUrls) {
  imageUrls.forEach((imageUrl) => {
    const resolvedImageUrl = String(imageUrl || "").trim();

    if (!resolvedImageUrl || preloadedProjectImages.has(resolvedImageUrl)) {
      return;
    }

    const preloadImage = new Image();
    preloadImage.src = resolvedImageUrl;

    preloadedProjectImages.add(resolvedImageUrl);
  });
}

function preloadNearbyProjectPreviewImages() {
  if (activePreviewImages.length <= 1) {
    return;
  }

  const nearbyImageIndexes = [
    activePreviewImageIndex,
    (activePreviewImageIndex + 1) % activePreviewImages.length,
    (activePreviewImageIndex - 1 + activePreviewImages.length) % activePreviewImages.length
  ];

  const nearbyImageUrls = nearbyImageIndexes.map((imageIndex) => activePreviewImages[imageIndex]);

  preloadProjectImages(nearbyImageUrls);
}

function createProjectLoadingSkeleton() {
  return Array.from({ length: 6 })
    .map(() => {
      return `
        <article class="col-md-6 col-xl-4">
          <div class="project-card project-card--loading" aria-hidden="true">
            <div class="project-skeleton project-skeleton--image"></div>

            <div class="project-card-body">
              <div class="project-skeleton-row">
                <span class="project-skeleton project-skeleton--pill"></span>
                <span class="project-skeleton project-skeleton--pill project-skeleton--pill-short"></span>
              </div>

              <div class="project-skeleton project-skeleton--title"></div>
              <div class="project-skeleton project-skeleton--text"></div>
              <div class="project-skeleton project-skeleton--text project-skeleton--text-short"></div>

              <div class="project-skeleton-actions">
                <span class="project-skeleton project-skeleton--button"></span>
                <span class="project-skeleton project-skeleton--button"></span>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProjects() {
  projectGrid.innerHTML = createProjectLoadingSkeleton();

  try {
    const supabaseProjects = await withProjectLoadTimeout(loadProjectsFromSupabase(), 3500);

    if (supabaseProjects.length > 0) {
      allProjects = supabaseProjects;
    } else {
      allProjects = await loadProjectsFromJson();
    }

    setupProjectControls();
    renderProjectCategoryFilters();
    applyProjectFiltersAndSort();
  } catch (error) {
    console.error(error);

    try {
      allProjects = await loadProjectsFromJson();
      setupProjectControls();
      renderProjectCategoryFilters();
      applyProjectFiltersAndSort();
    } catch (fallbackError) {
      projectGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            Project catalogue could not be loaded. Please check Supabase or projects.json.
          </div>
        </div>
      `;

      console.error(fallbackError);
    }
  }
}

function withProjectLoadTimeout(projectLoadPromise, timeoutMs) {
  return Promise.race([
    projectLoadPromise,
    new Promise((resolve) => {
      window.setTimeout(() => {
        resolve([]);
      }, timeoutMs);
    })
  ]);
}

async function loadProjectsFromJson() {
  const response = await fetch("projects.json");

  if (!response.ok) {
    throw new Error("Unable to load project data from projects.json.");
  }

  const projects = await response.json();

  return projects.filter((project) => project.status === "Completed");
}

async function loadProjectsFromSupabase() {
  if (!window.bexSupabase) {
    return [];
  }

  const { data: projects, error: projectsError } = await window.bexSupabase
    .from("projects")
    .select(`
      id,
      title,
      short_description,
      category,
      status,
      repository_url,
      live_url,
      thumbnail_url,
      display_order
    `)
    .eq("is_active", true)
    .eq("status", "Completed")
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (projectsError) {
    throw projectsError;
  }

  if (!projects || projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.id);

  const { data: technologies, error: technologiesError } = await window.bexSupabase
    .from("project_technologies")
    .select("project_id, technology, sort_order")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });

  if (technologiesError) {
    throw technologiesError;
  }

  const technologiesByProjectId = new Map();

  (technologies || []).forEach((technologyRow) => {
    if (!technologiesByProjectId.has(technologyRow.project_id)) {
      technologiesByProjectId.set(technologyRow.project_id, []);
    }

    technologiesByProjectId
      .get(technologyRow.project_id)
      .push(technologyRow.technology);
  });

  return projects.map((project) => {
    const thumbnailUrl =
      project.thumbnail_url ||
      PROJECT_PLACEHOLDER_IMAGE;

    return {
      id: project.id,
      title: project.title,
      displayOrder: project.display_order || 100,
      shortDescription: project.short_description,
      category: project.category,
      technologies: technologiesByProjectId.get(project.id) || [],
      status: project.status,
      repositoryUrl: project.repository_url || "#",
      liveUrl: project.live_url || "#",
      imageUrl: thumbnailUrl,
      imageUrls: [thumbnailUrl],
      screenshotsLoaded: false
    };
  });
}

function renderProjects(projects) {
  projectGrid.innerHTML = "";
  updateProjectResultSummary(projects.length);

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
  if (projectControlsInitialised) {
    return;
  }

  projectControlsInitialised = true;

  projectSearchInput.addEventListener("input", applyProjectFiltersAndSort);
  projectSortSelect.addEventListener("change", applyProjectFiltersAndSort);

  if (projectCategoryFilters) {
    projectCategoryFilters.addEventListener("click", (event) => {
      const filterButton = event.target.closest("[data-project-category-filter]");

      if (!filterButton) {
        return;
      }

      activeProjectCategoryFilter = filterButton.dataset.projectCategoryFilter;
      renderProjectCategoryFilters();
      applyProjectFiltersAndSort();
    });
  }

  projectGrid.addEventListener("click", (event) => {
    const imageButton = event.target.closest(".project-image-button");

    if (!imageButton) {
      return;
    }

    const projectIndex = Number(imageButton.dataset.projectIndex);

    openProjectPreview(projectIndex);
  });
  projectGrid.addEventListener(
    "error",
    (event) => {
      if (!event.target.classList.contains("project-image")) {
        return;
      }

      handleProjectImageError(event.target);
    },
    true
  );
  projectPreviewPrevious.addEventListener("click", () => {
    showProjectPreviewImage(-1);
  });

  projectPreviewNext.addEventListener("click", () => {
    showProjectPreviewImage(1);
  });

  projectPreviewImage.addEventListener("load", () => {
    setProjectPreviewImageLoading(false);
  });

  projectPreviewImage.addEventListener("error", () => {
    handleProjectImageError(projectPreviewImage);
    setProjectPreviewImageLoading(false);
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
    const categoryMatches =
      activeProjectCategoryFilter === "all" ||
      project.category === activeProjectCategoryFilter;

    if (!categoryMatches) {
      return false;
    }

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

function renderProjectCategoryFilters() {
  if (!projectCategoryFilters) {
    return;
  }

  const categories = Array.from(
    new Set(
      allProjects
        .map((project) => project.category)
        .filter((category) => String(category || "").trim() !== "")
    )
  ).sort(compareProjectText);

  const activeCategoryExists =
    activeProjectCategoryFilter === "all" ||
    categories.includes(activeProjectCategoryFilter);

  if (!activeCategoryExists) {
    activeProjectCategoryFilter = "all";
  }

  const filterButtons = [
    createProjectCategoryFilterButton("all", "All", allProjects.length),
    ...categories.map((category) => {
      const projectCount = allProjects.filter((project) => project.category === category).length;

      return createProjectCategoryFilterButton(category, category, projectCount);
    })
  ];

  projectCategoryFilters.innerHTML = filterButtons.join("");
}

function createProjectCategoryFilterButton(categoryValue, label, projectCount) {
  const isActive = activeProjectCategoryFilter === categoryValue;

  return `
    <button
      type="button"
      class="project-category-filter ${isActive ? "is-active" : ""}"
      data-project-category-filter="${escapeHtml(categoryValue)}"
      aria-pressed="${isActive ? "true" : "false"}"
    >
      <span>${escapeHtml(label)}</span>
      <strong>${projectCount}</strong>
    </button>
  `;
}

function updateProjectResultSummary(visibleCount) {
  if (!projectResultSummary) {
    return;
  }

  const totalCount = allProjects.length;
  const hasSearchTerm = projectSearchInput.value.trim() !== "";
  const hasCategoryFilter = activeProjectCategoryFilter !== "all";

  if (totalCount === 0) {
    projectResultSummary.textContent = "No completed projects are currently available.";
    return;
  }

  if (hasSearchTerm || hasCategoryFilter) {
    projectResultSummary.textContent = `Showing ${visibleCount} of ${totalCount} completed project${totalCount === 1 ? "" : "s"}.`;
    return;
  }

  projectResultSummary.textContent = `Showing ${totalCount} completed project${totalCount === 1 ? "" : "s"}.`;
}

function sortProjects(projects, sortType) {
  const sortedProjects = [...projects];

  if (sortType === "name") {
    return sortedProjects.sort((firstProject, secondProject) =>
      compareProjectText(firstProject.title, secondProject.title)
    );
  }

  if (sortType === "category") {
    return sortedProjects.sort((firstProject, secondProject) => {
      const categoryComparison = compareProjectText(firstProject.category, secondProject.category);

      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      return compareProjectText(firstProject.title, secondProject.title);
    });
  }

  if (sortType === "status") {
    return sortedProjects.sort((firstProject, secondProject) => {
      const statusComparison =
        getStatusSortWeight(firstProject.status) - getStatusSortWeight(secondProject.status);

      if (statusComparison !== 0) {
        return statusComparison;
      }

      return compareProjectText(firstProject.title, secondProject.title);
    });
  }

  return sortedProjects.sort((firstProject, secondProject) => {
    const displayOrderComparison =
      getPublicProjectDisplayOrder(firstProject) - getPublicProjectDisplayOrder(secondProject);

    if (displayOrderComparison !== 0) {
      return displayOrderComparison;
    }

    return compareProjectText(firstProject.title, secondProject.title);
  });
}

function compareProjectText(firstValue, secondValue) {
  const firstSortValue = createProjectSortKey(firstValue);
  const secondSortValue = createProjectSortKey(secondValue);

  return (
    firstSortValue.localeCompare(secondSortValue, undefined, {
      numeric: true,
      sensitivity: "base"
    }) ||
    String(firstValue || "").localeCompare(String(secondValue || ""), undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}

function createProjectSortKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "");
}

function getRecommendedSortWeight(status) {
  return status === "Completed" ? 1 : 2;
}

function getPublicProjectDisplayOrder(project) {
  const displayOrder = Number(project.displayOrder);

  return Number.isFinite(displayOrder) ? displayOrder : 100;
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
    "Code unavailable",
    "project-action-link project-action-link--secondary"
  );

  const liveButton = createProjectLink(
    project.liveUrl,
    "View App",
    "App unavailable",
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
  loading="lazy"
  decoding="async"
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

async function openProjectPreview(projectIndex) {
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
    "Code unavailable",
    "project-action-link project-action-link--secondary"
  );

  const liveButton = createProjectLink(
    project.liveUrl,
    "View App",
    "App unavailable",
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

  await loadProjectScreenshotsForPreview(project);
}

async function loadProjectScreenshotsForPreview(project) {
  if (!project.id || project.screenshotsLoaded) {
    return;
  }

  if (projectScreenshotCache.has(project.id)) {
    project.imageUrls = projectScreenshotCache.get(project.id);
    preloadProjectImages(project.imageUrls);

    project.screenshotsLoaded = true;
    activePreviewImages = getProjectPreviewImages(project);
    activePreviewImageIndex = 0;
    updateProjectPreviewImage(project.title);
    return;
  }

  try {
    const { data: screenshots, error } = await window.bexSupabase
      .from("project_screenshots")
      .select("image_url, sort_order")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    const imageUrls = (screenshots || [])
      .map((screenshot) => screenshot.image_url)
      .filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim() !== "");

    const resolvedImageUrls = imageUrls.length > 0 ? imageUrls : [project.imageUrl];

    projectScreenshotCache.set(project.id, resolvedImageUrls);
    preloadProjectImages(resolvedImageUrls);

    project.imageUrls = resolvedImageUrls;
    project.screenshotsLoaded = true;

    activePreviewImages = getProjectPreviewImages(project);
    activePreviewImageIndex = 0;
    updateProjectPreviewImage(project.title);
  } catch (error) {
    console.error(error);
  }
}

function getProjectPreviewImages(project) {
  if (Array.isArray(project.imageUrls) && project.imageUrls.length > 0) {
    return project.imageUrls.filter((imageUrl) => imageUrl.trim() !== "");
  }

  return [project.imageUrl];
}

function updateProjectPreviewImage(projectTitle) {
  const imageUrl = activePreviewImages[activePreviewImageIndex] || PROJECT_PLACEHOLDER_IMAGE;

  setProjectPreviewImageLoading(true);
  projectPreviewImage.classList.remove("project-image--fallback");

  projectPreviewImage.src = imageUrl;
  projectPreviewImage.alt = `${projectTitle} screenshot ${activePreviewImageIndex + 1}`;

  projectPreviewCounter.textContent = `${activePreviewImageIndex + 1} / ${activePreviewImages.length}`;

  const hasMultipleImages = activePreviewImages.length > 1;

  projectPreviewPrevious.hidden = !hasMultipleImages;
  projectPreviewNext.hidden = !hasMultipleImages;
  projectPreviewCounter.hidden = !hasMultipleImages;

  preloadNearbyProjectPreviewImages();
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

function createProjectLink(url, label, unavailableLabel, className) {
  if (!isValidProjectUrl(url)) {
    return `
      <span class="${className}" aria-disabled="true">
        ${unavailableLabel}
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

function setupPublicCatalogueRealtimeRefresh() {
  if (!window.bexSupabase) {
    return;
  }

  window.bexSupabase
    .channel("public-catalogue-projects")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects"
      },
      () => {
        window.clearTimeout(publicRealtimeRefreshTimer);

        publicRealtimeRefreshTimer = window.setTimeout(async () => {
          projectScreenshotCache.clear();
          await loadProjects();
        }, 400);
      }
    )
    .subscribe();
}

loadProjects();
setupPublicCatalogueRealtimeRefresh();
