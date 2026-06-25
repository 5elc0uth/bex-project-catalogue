const loginPanel = document.getElementById("loginPanel");
const projectAdminPanel = document.getElementById("projectAdminPanel");
const loginForm = document.getElementById("loginForm");
const projectForm = document.getElementById("projectForm");
const logoutButton = document.getElementById("logoutButton");
const adminMessage = document.getElementById("adminMessage");
const loginMessage = document.getElementById("loginMessage");
const adminEmailInput = document.getElementById("adminEmail");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const rememberAdminEmailCheckbox = document.getElementById("rememberAdminEmail");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const newAdminPasswordInput = document.getElementById("newAdminPassword");
const confirmAdminPasswordInput = document.getElementById("confirmAdminPassword");
const cancelPasswordResetButton = document.getElementById("cancelPasswordResetButton");
const adminPasswordInput = document.getElementById("adminPassword");
const adminPasswordToggle = document.getElementById("adminPasswordToggle");
const saveProjectButton = document.getElementById("saveProjectButton");
const adminProjectList = document.getElementById("adminProjectList");
const refreshProjectsButton = document.getElementById("refreshProjectsButton");
const adminProjectSortSelect = document.getElementById("adminProjectSortSelect");
const adminProjectSearchInput = document.getElementById("adminProjectSearchInput");
const projectListViewButton = document.getElementById("projectListViewButton");
const projectGridViewButton = document.getElementById("projectGridViewButton");
const newProjectModal = document.getElementById("newProjectModal");
const openNewProjectModalButton = document.getElementById("openNewProjectModalButton");
const closeNewProjectModalButton = document.getElementById("closeNewProjectModalButton");
const cancelNewProjectButton = document.getElementById("cancelNewProjectButton");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectModalDescription = document.getElementById("projectModalDescription");
const projectScreenshotsHelp = document.getElementById("projectScreenshotsHelp");
const openRecycleBinButton = document.getElementById("openRecycleBinButton");
const recycleBinModal = document.getElementById("recycleBinModal");
const closeRecycleBinButton = document.getElementById("closeRecycleBinButton");
const recycleBinList = document.getElementById("recycleBinList");
const adminStatsActive = document.getElementById("adminStatsActive");
const adminStatsCompleted = document.getElementById("adminStatsCompleted");
const adminStatsInProgress = document.getElementById("adminStatsInProgress");
const adminStatsBin = document.getElementById("adminStatsBin");
const adminBulkActionBar = document.getElementById("adminBulkActionBar");
const selectVisibleProjectsCheckbox = document.getElementById("selectVisibleProjectsCheckbox");
const selectedProjectsCount = document.getElementById("selectedProjectsCount");
const bulkProjectStatusSelect = document.getElementById("bulkProjectStatusSelect");
const bulkUpdateStatusButton = document.getElementById("bulkUpdateStatusButton");
const bulkMoveToBinButton = document.getElementById("bulkMoveToBinButton");
const clearSelectedProjectsButton = document.getElementById("clearSelectedProjectsButton");
const recycleBulkActionBar = document.getElementById("recycleBulkActionBar");
const selectRecycleBinProjectsCheckbox = document.getElementById("selectRecycleBinProjectsCheckbox");
const selectedRecycleProjectsCount = document.getElementById("selectedRecycleProjectsCount");
const bulkRestoreProjectsButton = document.getElementById("bulkRestoreProjectsButton");
const clearSelectedRecycleProjectsButton = document.getElementById("clearSelectedRecycleProjectsButton");

let editingProjectId = null;
let adminMessageHideTimer = null;
let loginMessageHideTimer = null;
const rememberedAdminEmailStorageKey = "bexCatalogueAdminRememberedEmail";
let currentlyRenderedAdminProjects = [];
const selectedProjectIds = new Set();
let currentlyRenderedRecycleProjects = [];
const selectedRecycleProjectIds = new Set();

if (newProjectModal && openNewProjectModalButton && closeNewProjectModalButton) {
    openNewProjectModalButton.addEventListener("click", () => {
        startAddProject();
    });

    closeNewProjectModalButton.addEventListener("click", () => {
        closeDialog(newProjectModal);
        resetProjectModal();
    });

    if (cancelNewProjectButton) {
        cancelNewProjectButton.addEventListener("click", () => {
            closeDialog(newProjectModal);
            resetProjectModal();
        });
    }

    newProjectModal.addEventListener("click", (event) => {
        if (event.target === newProjectModal) {
            closeDialog(newProjectModal);
            resetProjectModal();
        }
    });
}

if (recycleBinModal && openRecycleBinButton && closeRecycleBinButton) {
    openRecycleBinButton.addEventListener("click", async () => {
        if (recycleBinList) {
            recycleBinList.innerHTML = `
                <p class="admin-project-empty">Loading recycle bin...</p>
            `;
        }

        if (recycleBulkActionBar) {
            recycleBulkActionBar.classList.add("d-none");
        }

        if (!recycleBinModal.open) {
            recycleBinModal.showModal();
        }

        await loadRecycleBinProjects();
    });

    closeRecycleBinButton.addEventListener("click", () => {
        closeDialog(recycleBinModal);
    });

    recycleBinModal.addEventListener("click", (event) => {
        if (event.target === recycleBinModal) {
            closeDialog(recycleBinModal);
        }
    });
}

if (selectVisibleProjectsCheckbox) {
    selectVisibleProjectsCheckbox.addEventListener("change", () => {
        setVisibleProjectSelection(selectVisibleProjectsCheckbox.checked);
    });
}

if (bulkUpdateStatusButton) {
    bulkUpdateStatusButton.addEventListener("click", async () => {
        await bulkUpdateSelectedProjectStatus();
    });
}

if (bulkMoveToBinButton) {
    bulkMoveToBinButton.addEventListener("click", async () => {
        await bulkMoveSelectedProjectsToBin();
    });
}

if (clearSelectedProjectsButton) {
    clearSelectedProjectsButton.addEventListener("click", () => {
        clearSelectedProjects();
    });
}

if (selectRecycleBinProjectsCheckbox) {
    selectRecycleBinProjectsCheckbox.addEventListener("change", () => {
        setRecycleProjectSelection(selectRecycleBinProjectsCheckbox.checked);
    });
}

if (bulkRestoreProjectsButton) {
    bulkRestoreProjectsButton.addEventListener("click", async () => {
        await bulkRestoreSelectedProjects();
    });
}

if (clearSelectedRecycleProjectsButton) {
    clearSelectedRecycleProjectsButton.addEventListener("click", () => {
        clearSelectedRecycleProjects();
    });
}

if (recycleBinList) {
    recycleBinList.addEventListener("change", (event) => {
        const recycleCheckbox = event.target.closest("[data-recycle-project-select]");

        if (!recycleCheckbox) {
            return;
        }

        if (recycleCheckbox.checked) {
            selectedRecycleProjectIds.add(recycleCheckbox.dataset.projectId);
        } else {
            selectedRecycleProjectIds.delete(recycleCheckbox.dataset.projectId);
        }

        updateRecycleBulkActionState();
    });

    recycleBinList.addEventListener("click", async (event) => {
        const restoreButton = event.target.closest("[data-project-restore]");

        if (restoreButton) {
            await restoreProject(
                restoreButton.dataset.projectId,
                restoreButton.dataset.projectTitle
            );
            return;
        }

        const deleteButton = event.target.closest("[data-project-delete-permanently]");

        if (deleteButton) {
            await permanentlyDeleteProject(
                deleteButton.dataset.projectId,
                deleteButton.dataset.projectTitle
            );
        }
    });
}

if (adminPasswordInput && adminPasswordToggle) {
    adminPasswordToggle.addEventListener("click", () => {
        const isPasswordVisible = adminPasswordInput.type === "text";

        adminPasswordInput.type = isPasswordVisible ? "password" : "text";

        adminPasswordToggle.setAttribute(
            "aria-label",
            isPasswordVisible ? "Show password" : "Hide password"
        );

        adminPasswordToggle.innerHTML = isPasswordVisible
            ? `<i class="bi bi-eye" aria-hidden="true"></i>`
            : `<i class="bi bi-eye-slash" aria-hidden="true"></i>`;

        adminPasswordInput.focus();
    });
}

if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async () => {
        await sendPasswordResetEmail();
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        await updateRecoveredAdminPassword();
    });
}

if (cancelPasswordResetButton) {
    cancelPasswordResetButton.addEventListener("click", async () => {
        await window.bexSupabase.auth.signOut();
        cleanAdminRecoveryUrl();
        clearLoginMessage();
        showLoginPanel();
    });
}

syncRememberedAdminEmail();

function closeDialog(dialog) {
    if (!dialog) {
        return;
    }

    if (dialog.open) {
        dialog.close();
    }
}

function setLoginButtonLoading(isLoading) {
    const loginButton = loginForm.querySelector('button[type="submit"]');

    if (!loginButton) {
        return;
    }

    loginButton.disabled = isLoading;
    loginButton.classList.toggle("is-loading", isLoading);
    loginButton.setAttribute("aria-busy", isLoading ? "true" : "false");

    loginButton.innerHTML = isLoading
        ? `<span class="admin-login-button-spinner" aria-hidden="true"></span><span>Signing in</span>`
        : "Sign in";
}

function setRefreshButtonLoading(isLoading) {
    if (!refreshProjectsButton) {
        return;
    }

    refreshProjectsButton.disabled = isLoading;
    refreshProjectsButton.classList.toggle("is-loading", isLoading);
    refreshProjectsButton.setAttribute("aria-busy", isLoading ? "true" : "false");

    refreshProjectsButton.innerHTML = isLoading
        ? `<span class="admin-refresh-spinner" aria-hidden="true"></span><span>Refreshing</span>`
        : "Refresh";
}

function openProjectModal() {
    if (newProjectModal && !newProjectModal.open) {
        newProjectModal.showModal();
    }
}

function startAddProject() {
    editingProjectId = null;
    projectForm.reset();
    projectDisplayOrder.value = "100";

    if (projectModalTitle) {
        projectModalTitle.textContent = "Add project";
    }

    if (projectModalDescription) {
        projectModalDescription.textContent = "Add a new project record.";
    }

    if (projectScreenshotsHelp) {
        projectScreenshotsHelp.textContent = "Upload up to 8 screenshots in PNG, JPG, JPEG, or WebP. Use names like 01-home, 02-dashboard, 03-report to control gallery order. The first image becomes the card thumbnail.";
    }

    saveProjectButton.textContent = "Save project";
    openProjectModal();
}

function resetProjectModal() {
    editingProjectId = null;
    projectForm.reset();
    projectDisplayOrder.value = "100";

    if (projectModalTitle) {
        projectModalTitle.textContent = "Add project";
    }

    if (projectModalDescription) {
        projectModalDescription.textContent = "Add a new project record to the live Supabase-powered catalogue.";
    }

    if (projectScreenshotsHelp) {
        projectScreenshotsHelp.textContent = "Upload up to 8 screenshots in PNG, JPG, JPEG, or WebP. Use names like 01-home, 02-dashboard, 03-report to control gallery order. The first image becomes the card thumbnail.";
    }

    saveProjectButton.textContent = "Save project";
}

async function startEditProject(projectId) {
    editingProjectId = null;
    projectForm.reset();

    saveProjectButton.textContent = "Loading...";
    saveProjectButton.setAttribute("aria-disabled", "true");
    saveProjectButton.disabled = true;

    showMessage("Loading project for editing...", "info");

    try {
        const [projectResult, technologiesResult] = await Promise.all([
            window.bexSupabase
                .from("projects")
                .select("id, title, short_description, category, status, repository_url, live_url, display_order")
                .eq("id", projectId)
                .single(),

            window.bexSupabase
                .from("project_technologies")
                .select("technology, sort_order")
                .eq("project_id", projectId)
                .order("sort_order", { ascending: true })
        ]);

        if (projectResult.error) {
            throw projectResult.error;
        }

        if (technologiesResult.error) {
            throw technologiesResult.error;
        }

        const project = projectResult.data;
        const technologies = technologiesResult.data || [];

        editingProjectId = project.id;

        projectTitle.value = project.title || "";
        projectCategory.value = project.category || "";
        projectStatus.value = project.status || "Completed";
        projectDisplayOrder.value = project.display_order || 100;
        projectDescription.value = project.short_description || "";
        projectRepositoryUrl.value = project.repository_url || "";
        projectLiveUrl.value = project.live_url || "";
        projectTechnologies.value = technologies
            .map((technologyRow) => technologyRow.technology)
            .join(", ");
        projectScreenshots.value = "";

        if (projectModalTitle) {
            projectModalTitle.textContent = "Edit project";
        }

        if (projectModalDescription) {
            projectModalDescription.textContent = `Update "${project.title}" project details.`;
        }

        if (projectScreenshotsHelp) {
            projectScreenshotsHelp.textContent = "Leave screenshots empty to keep the existing images. Upload up to 8 new screenshots only if you want to replace the existing images. Use names like 01-home, 02-dashboard, 03-report to control gallery order.";
        }

        saveProjectButton.removeAttribute("aria-disabled");
        saveProjectButton.disabled = false;
        saveProjectButton.textContent = "Update project";

        openProjectModal();

        showMessage("Project loaded. Make your changes and save.", "success");
    } catch (error) {
        console.error(error);
        showMessage("Project could not be loaded for editing.", "error");

        saveProjectButton.removeAttribute("aria-disabled");
        saveProjectButton.disabled = false;
        saveProjectButton.textContent = "Save project";
        resetProjectModal();
    }
}

const adminProjectViewStorageKey = "bexAdminProjectView";
let adminProjectView = window.localStorage.getItem(adminProjectViewStorageKey) || "list";
let adminProjectsCache = [];

const projectTitle = document.getElementById("projectTitle");
const projectCategory = document.getElementById("projectCategory");
const projectStatus = document.getElementById("projectStatus");
const projectDisplayOrder = document.getElementById("projectDisplayOrder");
const projectDescription = document.getElementById("projectDescription");
const projectRepositoryUrl = document.getElementById("projectRepositoryUrl");
const projectLiveUrl = document.getElementById("projectLiveUrl");
const projectTechnologies = document.getElementById("projectTechnologies");
const projectScreenshots = document.getElementById("projectScreenshots");

const screenshotBucketName = "project-screenshots";
const maxScreenshotDimension = 1600;
const screenshotImageQuality = 0.82;
const allowedScreenshotTypes = ["image/png", "image/jpeg", "image/webp"];
const maxScreenshotFiles = 8;
const maxOriginalScreenshotSizeMb = 12;
const maxOriginalScreenshotSizeBytes = maxOriginalScreenshotSizeMb * 1024 * 1024;

initialiseAdminPage();

async function initialiseAdminPage() {
    const isPasswordRecovery = await handleAdminPasswordRecoveryRedirect();

    if (isPasswordRecovery) {
        return;
    }

    const { data } = await window.bexSupabase.auth.getSession();

    if (data.session) {
        await showAdminPanel();
    } else {
        showLoginPanel();
    }
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    clearLoginMessage();
    clearAdminMessage();
    setLoginButtonLoading(true);

    try {
        const { error } = await window.bexSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        rememberAdminEmail(email);

        await showAdminPanel();
        clearLoginMessage();
        clearAdminMessage();
    } catch (error) {
        showLoginMessage(
            error.message || "Unable to sign in. Please check your details and try again.",
            "error"
        );
    } finally {
        setLoginButtonLoading(false);
    }
});

logoutButton.addEventListener("click", async () => {
    await window.bexSupabase.auth.signOut();
    projectForm.reset();
    showLoginPanel();
});

refreshProjectsButton.addEventListener("click", async () => {
    setRefreshButtonLoading(true);

    try {
        await loadAdminProjects();
        showMessage("Project list refreshed.", "success");
    } catch (error) {
        console.error(error);
        showMessage("Project list could not be refreshed.", "error");
    } finally {
        setRefreshButtonLoading(false);
    }
});

adminProjectSortSelect.addEventListener("change", () => {
    applyAdminProjectControls();
});

adminProjectSearchInput.addEventListener("input", () => {
    applyAdminProjectControls();
});

projectListViewButton.addEventListener("click", () => {
    setAdminProjectView("list");
});

projectGridViewButton.addEventListener("click", () => {
    setAdminProjectView("grid");
});

adminProjectList.addEventListener("change", (event) => {
    const projectCheckbox = event.target.closest("[data-project-select]");

    if (!projectCheckbox) {
        return;
    }

    if (projectCheckbox.checked) {
        selectedProjectIds.add(projectCheckbox.dataset.projectId);
    } else {
        selectedProjectIds.delete(projectCheckbox.dataset.projectId);
    }

    updateBulkActionState();
});

adminProjectList.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-project-edit]");

    if (editButton) {
        await startEditProject(editButton.dataset.projectId);
        return;
    }

    const deactivateButton = event.target.closest("[data-project-deactivate]");

    if (!deactivateButton) {
        return;
    }

    const projectId = deactivateButton.dataset.projectId;
    const projectTitle = deactivateButton.dataset.projectTitle;

    await deactivateProject(projectId, projectTitle);
});

projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const projectIdBeingEdited = editingProjectId;
    const isEditing = Boolean(projectIdBeingEdited);

    saveProjectButton.setAttribute("aria-disabled", "true");
    saveProjectButton.disabled = true;
    saveProjectButton.textContent = isEditing ? "Updating..." : "Saving...";

    try {
        const files = getOrderedScreenshotFiles(projectScreenshots.files);
        const title = projectTitle.value.trim();
        const slug = createSlug(title);
        const technologies = createTechnologyList(projectTechnologies.value);
        const displayOrder = Number.parseInt(projectDisplayOrder.value, 10);

        if (!Number.isFinite(displayOrder) || displayOrder < 1) {
            throw new Error("Display order must be a number greater than 0.");
        }

        validateProjectScreenshotFiles(files, isEditing);

        if (technologies.length === 0) {
            throw new Error("Enter at least one technology.");
        }

        showMessage("Checking project title...", "info");
        await ensureProjectSlugIsUnique(slug, projectIdBeingEdited);

        let uploadedImages = [];

        if (files.length > 0) {
            showMessage("Optimising and uploading screenshots...", "info");
            uploadedImages = await uploadProjectScreenshots(slug, files);
        }

        const projectPayload = {
            title,
            slug,
            short_description: projectDescription.value.trim(),
            category: projectCategory.value.trim(),
            status: projectStatus.value,
            repository_url: cleanOptionalUrl(projectRepositoryUrl.value),
            live_url: cleanOptionalUrl(projectLiveUrl.value),
            display_order: displayOrder,
            updated_at: new Date().toISOString(),
            updated_action: isEditing ? "Edited" : "Created"
        };

        if (uploadedImages.length > 0) {
            projectPayload.thumbnail_url = uploadedImages[0];
        }

        if (isEditing) {
            showMessage("Updating project record...", "info");

            const updateProjectTask = window.bexSupabase
                .from("projects")
                .update(projectPayload)
                .eq("id", projectIdBeingEdited)
                .then(({ error }) => {
                    if (error) {
                        throw error;
                    }
                });

            const updateTasks = [
                updateProjectTask,
                replaceProjectTechnologies(projectIdBeingEdited, technologies)
            ];

            if (uploadedImages.length > 0) {
                updateTasks.push(
                    replaceProjectScreenshotsForProject(projectIdBeingEdited, title, uploadedImages)
                );
            }

            await Promise.all(updateTasks);

            await loadAdminProjects();
            await updateAdminStats();

            closeDialog(newProjectModal);
            resetProjectModal();

            showMessage(`"${title}" has been updated.`, "success");
            return;
        }

        showMessage("Saving project record...", "info");

        const { data: insertedProject, error: projectError } = await window.bexSupabase
            .from("projects")
            .insert({
                ...projectPayload,
                is_active: true
            })
            .select("id, title, short_description, category, status, repository_url, live_url, thumbnail_url, display_order, created_at, updated_at, updated_action")
            .single();

        if (projectError) {
            throw projectError;
        }

        await Promise.all([
            saveProjectTechnologies(insertedProject.id, technologies),
            saveProjectScreenshots(insertedProject.id, title, uploadedImages)
        ]);

        adminProjectsCache = [
            insertedProject,
            ...adminProjectsCache
        ];

        applyAdminProjectControls();
        updateAdminStats();

        closeDialog(newProjectModal);
        resetProjectModal();

        showMessage("Project saved successfully. Open the catalogue to view it.", "success");
    } catch (error) {
        console.error(error);
        showMessage(error.message || "Project could not be saved. Check that all uploaded screenshots are valid PNG, JPG, JPEG, or WebP images.", "error");
    } finally {
        saveProjectButton.removeAttribute("aria-disabled");
        saveProjectButton.disabled = false;
        saveProjectButton.textContent = newProjectModal && newProjectModal.open && editingProjectId
            ? "Update project"
            : "Save project";
    }
});


async function showAdminPanel() {
    const isAdmin = await verifyAdminAccess();

    if (!isAdmin) {
        await window.bexSupabase.auth.signOut();
        showLoginPanel();
        showMessage("This account is not authorised to manage the catalogue.", "error");
        return;
    }

    loginPanel.classList.add("d-none");
    projectAdminPanel.classList.remove("d-none");
    document.body.classList.remove("admin-auth-checking");

    await loadAdminProjects();
}

function showLoginPanel() {
    projectAdminPanel.classList.add("d-none");
    loginPanel.classList.remove("d-none");
    document.body.classList.remove("admin-auth-checking");

    if (loginForm) {
        loginForm.classList.remove("d-none");
    }

    if (resetPasswordForm) {
        resetPasswordForm.classList.add("d-none");
    }

    syncRememberedAdminEmail();

    if (adminPasswordInput) {
        adminPasswordInput.value = "";
    }
}

async function verifyAdminAccess() {
    const { data, error } = await window.bexSupabase
        .from("admin_profiles")
        .select("id, role, is_active")
        .eq("is_active", true)
        .limit(1);

    if (error) {
        console.error(error);
        return false;
    }

    return Array.isArray(data) && data.length > 0;
}

function getOrderedScreenshotFiles(fileList) {
    return Array.from(fileList).sort((firstFile, secondFile) => {
        return firstFile.name.localeCompare(secondFile.name, undefined, {
            numeric: true,
            sensitivity: "base"
        });
    });
}

function validateProjectScreenshotFiles(files, isEditing) {
    if (!isEditing && files.length === 0) {
        throw new Error("Upload at least one project screenshot.");
    }

    if (files.length === 0) {
        return;
    }

    if (files.length > maxScreenshotFiles) {
        throw new Error(`Upload a maximum of ${maxScreenshotFiles} screenshots at once.`);
    }

    files.forEach((file) => {
        if (!allowedScreenshotTypes.includes(file.type)) {
            throw new Error(`"${file.name}" is not a supported image type. Use PNG, JPG, JPEG, or WebP.`);
        }

        if (file.size > maxOriginalScreenshotSizeBytes) {
            throw new Error(`"${file.name}" is too large. Maximum file size is ${maxOriginalScreenshotSizeMb}MB before optimisation.`);
        }
    });
}

async function optimiseProjectScreenshot(file) {
    if (!file || !file.type.startsWith("image/")) {
        throw new Error(`"${file?.name || "Selected file"}" is not a valid image file.`);
    }

    const image = await loadImageFromFile(file);

    if (!image.width || !image.height) {
        throw new Error(`Could not read image dimensions for: ${file.name}. The image may be corrupt.`);
    }

    const scale = Math.min(
        1,
        maxScreenshotDimension / image.width,
        maxScreenshotDimension / image.height
    );

    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Image optimisation is not supported in this browser.");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/webp", screenshotImageQuality);
    });

    if (!blob || blob.size === 0) {
        throw new Error(`Could not optimise image: ${file.name}. Try exporting it again as PNG, JPG, or WebP.`);
    }

    const optimisedName = file.name.replace(/\.[^.]+$/, "") + ".webp";

    return new File([blob], optimisedName, {
        type: "image/webp",
        lastModified: Date.now()
    });
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Could not read image file: ${file.name}. The file may be corrupt or unsupported.`));
        };

        image.src = objectUrl;
    });
}

async function uploadProjectScreenshots(slug, files) {
    const uploadTasks = files.map(async (file, index) => {
        const optimisedFile = await optimiseProjectScreenshot(file);
        const safeFileName = createSafeFileName(optimisedFile.name);
        const paddedIndex = String(index + 1).padStart(2, "0");
        const filePath = `${slug}/${paddedIndex}-${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await window.bexSupabase.storage
            .from(screenshotBucketName)
            .upload(filePath, optimisedFile, {
                cacheControl: "3600",
                upsert: false,
                contentType: optimisedFile.type
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = window.bexSupabase.storage
            .from(screenshotBucketName)
            .getPublicUrl(filePath);

        return {
            imageUrl: data.publicUrl,
            sortOrder: index + 1
        };
    });

    const uploadedImages = await Promise.all(uploadTasks);

    return uploadedImages
        .sort((firstImage, secondImage) => firstImage.sortOrder - secondImage.sortOrder)
        .map((uploadedImage) => uploadedImage.imageUrl);
}

async function saveProjectTechnologies(projectId, technologies) {
    const technologyRows = technologies.map((technology, index) => ({
        project_id: projectId,
        technology,
        sort_order: index + 1
    }));

    const { error } = await window.bexSupabase
        .from("project_technologies")
        .insert(technologyRows);

    if (error) {
        throw error;
    }
}

async function replaceProjectTechnologies(projectId, technologies) {
    const { error: deleteError } = await window.bexSupabase
        .from("project_technologies")
        .delete()
        .eq("project_id", projectId);

    if (deleteError) {
        throw deleteError;
    }

    await saveProjectTechnologies(projectId, technologies);
}

async function saveProjectScreenshots(projectId, title, imageUrls) {
    const screenshotRows = imageUrls.map((imageUrl, index) => ({
        project_id: projectId,
        image_url: imageUrl,
        alt_text: `${title} screenshot ${index + 1}`,
        sort_order: index + 1,
        is_thumbnail: index === 0
    }));

    const { error } = await window.bexSupabase
        .from("project_screenshots")
        .insert(screenshotRows);

    if (error) {
        throw error;
    }
}

async function replaceProjectScreenshotsForProject(projectId, title, newImageUrls) {
    const { data: existingScreenshots, error: screenshotLoadError } = await window.bexSupabase
        .from("project_screenshots")
        .select("image_url")
        .eq("project_id", projectId);

    if (screenshotLoadError) {
        throw screenshotLoadError;
    }

    const existingImageUrls = (existingScreenshots || [])
        .map((screenshot) => screenshot.image_url)
        .filter(Boolean);

    const { error: deleteScreenshotRowsError } = await window.bexSupabase
        .from("project_screenshots")
        .delete()
        .eq("project_id", projectId);

    if (deleteScreenshotRowsError) {
        throw deleteScreenshotRowsError;
    }

    await saveProjectScreenshots(projectId, title, newImageUrls);

    deleteProjectStorageFiles(existingImageUrls).catch((storageError) => {
        console.warn("Old screenshot files could not be removed from storage.", storageError);
    });
}

function setAdminProjectView(view) {
    adminProjectView = view === "grid" ? "grid" : "list";
    window.localStorage.setItem(adminProjectViewStorageKey, adminProjectView);

    projectListViewButton.classList.toggle("is-active", adminProjectView === "list");
    projectGridViewButton.classList.toggle("is-active", adminProjectView === "grid");

    adminProjectList.classList.toggle("admin-project-list--list", adminProjectView === "list");
    adminProjectList.classList.toggle("admin-project-list--grid", adminProjectView === "grid");
}

async function loadAdminProjects() {
    adminProjectList.innerHTML = `
    <p class="admin-project-empty">Loading projects...</p>
  `;

    const { data: projects, error } = await window.bexSupabase
        .from("projects")
        .select("id, title, short_description, category, status, repository_url, live_url, thumbnail_url, display_order, created_at, updated_at, updated_action")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("title", { ascending: true });

    if (error) {
        console.error(error);
        adminProjectList.innerHTML = `
      <p class="admin-project-empty admin-project-empty--error">
        Projects could not be loaded.
      </p>
    `;
        return;
    }

    adminProjectsCache = projects || [];
    applyAdminProjectControls();
    updateAdminStats();
}

function renderAdminStatsFromCache() {
    const activeProjects = adminProjectsCache || [];

    const activeCount = activeProjects.length;
    const completedCount = activeProjects.filter((project) => project.status === "Completed").length;
    const inProgressCount = activeProjects.filter((project) => project.status === "In Progress").length;

    if (adminStatsActive) {
        adminStatsActive.textContent = activeCount;
    }

    if (adminStatsCompleted) {
        adminStatsCompleted.textContent = completedCount;
    }

    if (adminStatsInProgress) {
        adminStatsInProgress.textContent = inProgressCount;
    }
}

async function updateAdminStats() {
    renderAdminStatsFromCache();

    if (!adminStatsBin) {
        return;
    }

    try {
        const { count, error } = await window.bexSupabase
            .from("projects")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("is_active", false);

        if (error) {
            throw error;
        }

        adminStatsBin.textContent = count ?? 0;
    } catch (error) {
        console.error(error);
        adminStatsBin.textContent = "—";
    }
}

function applyAdminProjectControls() {
    const searchTerm = adminProjectSearchInput.value.trim().toLowerCase();

    const filteredProjects = adminProjectsCache.filter((project) => {
        const searchableText = [
            project.title,
            project.category,
            project.status
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(searchTerm);
    });

    setAdminProjectView(adminProjectView);

    const sortedProjects = sortAdminProjects(
        filteredProjects,
        adminProjectSortSelect.value
    );

    renderAdminProjects(sortedProjects);
}

function sortAdminProjects(projects, sortType) {
    const sortedProjects = [...projects];

    if (sortType === "name") {
        return sortedProjects.sort((firstProject, secondProject) =>
            compareAdminText(firstProject.title, secondProject.title)
        );
    }

    if (sortType === "updated") {
        return sortedProjects.sort((firstProject, secondProject) => {
            return (
                getAdminUpdatedTime(secondProject) -
                getAdminUpdatedTime(firstProject) ||
                compareAdminText(firstProject.title, secondProject.title)
            );
        });
    }

    if (sortType === "publicOrder") {
        return sortedProjects.sort((firstProject, secondProject) => {
            return (
                getProjectDisplayOrder(firstProject) -
                getProjectDisplayOrder(secondProject) ||
                compareAdminText(firstProject.title, secondProject.title)
            );
        });
    }

    return sortedProjects.sort((firstProject, secondProject) => {
        return (
            getAdminAttentionSortWeight(firstProject.status) -
            getAdminAttentionSortWeight(secondProject.status) ||
            getAdminUpdatedTime(secondProject) -
            getAdminUpdatedTime(firstProject) ||
            compareAdminText(firstProject.title, secondProject.title)
        );
    });
}

function compareAdminText(firstValue, secondValue) {
    const firstSortValue = createAdminSortKey(firstValue);
    const secondSortValue = createAdminSortKey(secondValue);

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

function createAdminSortKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replaceAll("&", "and")
        .replace(/[^a-z0-9]+/g, "");
}

function getAdminAttentionSortWeight(status) {
    return status === "In Progress" ? 1 : 2;
}

function getAdminUpdatedTime(project) {
    const updatedAt = project.updated_at || project.created_at;
    const date = new Date(updatedAt);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getProjectDisplayOrder(project) {
    const displayOrder = Number(project.display_order);

    return Number.isFinite(displayOrder) ? displayOrder : 100;
}

function renderAdminProjects(projects) {
    currentlyRenderedAdminProjects = projects;

    if (projects.length === 0) {
        updateBulkActionState();
        adminProjectList.innerHTML = `
      <p class="admin-project-empty">
        No active projects found.
      </p>
    `;
        return;
    }

    adminProjectList.innerHTML = projects
        .map((project) => {
            const liveLink = createAdminProjectLink(project.live_url, "Live App");
            const repoLink = createAdminProjectLink(project.repository_url, "GitHub");
            const thumbnailUrl = project.thumbnail_url || "";
            const orderValue = getProjectDisplayOrder(project);

            const thumbnailMarkup = thumbnailUrl
                ? `
                    <img
                        src="${escapeHtml(thumbnailUrl)}"
                        alt="${escapeHtml(project.title)} thumbnail"
                        class="admin-project-thumbnail"
                        loading="lazy"
                    >
                `
                : `
                    <div class="admin-project-thumbnail admin-project-thumbnail--empty" aria-hidden="true"></div>
                `;

            return `
        <article class="admin-project-item admin-project-item--media">
          <label class="admin-project-select" aria-label="Select ${escapeHtml(project.title)}">
            <input
              type="checkbox"
              data-project-select
              data-project-id="${escapeHtml(project.id)}"
              ${selectedProjectIds.has(project.id) ? "checked" : ""}
            >
          </label>

          <div class="admin-project-media">
            ${thumbnailMarkup}
          </div>

          <div class="admin-project-summary">
            <div class="admin-project-title-row">
              <h3>${escapeHtml(project.title)}</h3>
            </div>

            <div class="admin-project-badge-row">
              <span class="admin-project-badge">
                ${escapeHtml(project.category)}
              </span>

              <span class="project-status project-status--${createStatusClass(project.status)}">
                ${escapeHtml(project.status)}
              </span>

              <span class="admin-project-badge admin-project-badge--order">
                Public order ${escapeHtml(orderValue)}
              </span>
            </div>

            <div class="admin-project-link-row">
              ${repoLink}
              ${liveLink}
            </div>

<p class="admin-project-updated-line">
  Updated ${escapeHtml(formatAdminShortDate(project.updated_at || project.created_at))}
  · ${escapeHtml(formatAdminActionLabel(project.updated_action))}
</p>
          </div>

          <div class="admin-project-actions admin-project-actions--icons">
            <button
              type="button"
              class="admin-icon-action admin-icon-action--edit"
              data-project-edit
              data-project-id="${escapeHtml(project.id)}"
              aria-label="Edit ${escapeHtml(project.title)}"
              title="Edit project"
            >
              <i class="bi bi-pencil" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="admin-icon-action admin-icon-action--bin"
              data-project-deactivate
              data-project-id="${escapeHtml(project.id)}"
              data-project-title="${escapeHtml(project.title)}"
              aria-label="Move ${escapeHtml(project.title)} to bin"
              title="Move to Bin"
            >
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
          </div>
        </article>
      `;
        })
        .join("");

    updateBulkActionState();
}

function setVisibleProjectSelection(shouldSelect) {
    currentlyRenderedAdminProjects.forEach((project) => {
        if (shouldSelect) {
            selectedProjectIds.add(project.id);
        } else {
            selectedProjectIds.delete(project.id);
        }
    });

    applyAdminProjectControls();
    updateBulkActionState();
}

function clearSelectedProjects() {
    selectedProjectIds.clear();
    applyAdminProjectControls();
    updateBulkActionState();
}

function updateBulkActionState() {
    const selectedCount = selectedProjectIds.size;
    const visibleProjectIds = currentlyRenderedAdminProjects.map((project) => project.id);
    const visibleSelectedCount = visibleProjectIds.filter((projectId) =>
        selectedProjectIds.has(projectId)
    ).length;

    if (adminBulkActionBar) {
        adminBulkActionBar.classList.toggle("d-none", currentlyRenderedAdminProjects.length === 0);
    }

    if (selectedProjectsCount) {
        selectedProjectsCount.textContent = `${selectedCount} selected`;
    }

    if (bulkProjectStatusSelect) {
        bulkProjectStatusSelect.disabled = selectedCount === 0;
        bulkProjectStatusSelect.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (bulkUpdateStatusButton) {
        bulkUpdateStatusButton.disabled = selectedCount === 0;
        bulkUpdateStatusButton.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (bulkMoveToBinButton) {
        bulkMoveToBinButton.disabled = selectedCount === 0;
        bulkMoveToBinButton.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (clearSelectedProjectsButton) {
        clearSelectedProjectsButton.disabled = selectedCount === 0;
        clearSelectedProjectsButton.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (selectVisibleProjectsCheckbox) {
        selectVisibleProjectsCheckbox.checked =
            currentlyRenderedAdminProjects.length > 0 &&
            visibleSelectedCount === currentlyRenderedAdminProjects.length;

        selectVisibleProjectsCheckbox.indeterminate =
            visibleSelectedCount > 0 &&
            visibleSelectedCount < currentlyRenderedAdminProjects.length;
    }
}

async function bulkUpdateSelectedProjectStatus() {
    const selectedIds = Array.from(selectedProjectIds);
    const nextStatus = bulkProjectStatusSelect ? bulkProjectStatusSelect.value : "";

    if (selectedIds.length === 0) {
        showMessage("Select at least one project first.", "error");
        return;
    }

    if (!["Completed", "In Progress"].includes(nextStatus)) {
        showMessage("Choose a valid status before updating selected projects.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Set ${selectedIds.length} selected project${selectedIds.length === 1 ? "" : "s"} to "${nextStatus}"? ${nextStatus === "Completed"
            ? "Completed projects will appear in the public catalogue."
            : "In Progress projects will be hidden from the public catalogue."
        }`
    );

    if (!confirmed) {
        return;
    }

    showMessage("Updating selected project statuses...", "info");

    const now = new Date().toISOString();
    const updatedAction = `Bulk status changed to ${nextStatus}`;

    const { error } = await window.bexSupabase
        .from("projects")
        .update({
            status: nextStatus,
            updated_at: now,
            updated_action: updatedAction
        })
        .eq("is_active", true)
        .in("id", selectedIds);

    if (error) {
        console.error(error);
        showMessage("Selected project statuses could not be updated.", "error");
        return;
    }

    adminProjectsCache = adminProjectsCache.map((project) => {
        if (!selectedProjectIds.has(project.id)) {
            return project;
        }

        return {
            ...project,
            status: nextStatus,
            updated_at: now,
            updated_action: updatedAction
        };
    });

    selectedProjectIds.clear();

    if (selectVisibleProjectsCheckbox) {
        selectVisibleProjectsCheckbox.checked = false;
        selectVisibleProjectsCheckbox.indeterminate = false;
    }

    applyAdminProjectControls();
    updateAdminStats();

    await loadAdminProjects();

    showMessage(
        `${selectedIds.length} project${selectedIds.length === 1 ? "" : "s"} updated to "${nextStatus}".`,
        "success"
    );
}

async function bulkMoveSelectedProjectsToBin() {
    const selectedIds = Array.from(selectedProjectIds);

    if (selectedIds.length === 0) {
        showMessage("Select at least one project first.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Move ${selectedIds.length} selected project${selectedIds.length === 1 ? "" : "s"} to the recycle bin? This will hide them from the public catalogue.`
    );

    if (!confirmed) {
        return;
    }

    const binReason = window.prompt(
        "Optional: why are you moving these selected projects to the recycle bin?",
        "Bulk moved to bin"
    );

    if (binReason === null) {
        return;
    }

    showMessage("Moving selected projects to recycle bin...", "info");

    const now = new Date().toISOString();

    const { error } = await window.bexSupabase
        .from("projects")
        .update({
            is_active: false,
            moved_to_bin_at: now,
            moved_to_bin_reason: binReason.trim() || null,
            updated_at: now,
            updated_action: "Bulk moved to bin"
        })
        .in("id", selectedIds);

    if (error) {
        console.error(error);
        showMessage("Selected projects could not be moved to the recycle bin.", "error");
        return;
    }

    adminProjectsCache = adminProjectsCache.filter((project) => !selectedProjectIds.has(project.id));
    selectedProjectIds.clear();

    applyAdminProjectControls();
    updateAdminStats();

    showMessage(`${selectedIds.length} project${selectedIds.length === 1 ? "" : "s"} moved to the recycle bin.`, "success");
}

function createAdminProjectLink(url, label) {
    if (!url || url === "#") {
        return "";
    }

    return `
    <a
      href="${escapeHtml(url)}"
      class="admin-small-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${label}
    </a>
  `;
}

async function deactivateProject(projectId, projectTitle) {
    const confirmed = window.confirm(
        `Move "${projectTitle}" to the recycle bin? This will hide it from the public catalogue.`
    );

    if (!confirmed) {
        return;
    }

    const binReason = window.prompt(
        `Optional: why are you moving "${projectTitle}" to the recycle bin?`,
        ""
    );

    if (binReason === null) {
        return;
    }

    showMessage("Moving project to recycle bin...", "info");

    const { error } = await window.bexSupabase
        .from("projects")
        .update({
            is_active: false,
            moved_to_bin_at: new Date().toISOString(),
            moved_to_bin_reason: binReason.trim() || null,
            updated_at: new Date().toISOString(),
            updated_action: "Moved to bin"
        })
        .eq("id", projectId);

    if (error) {
        console.error(error);
        showMessage("Project could not be deactivated.", "error");
        return;
    }

    adminProjectsCache = adminProjectsCache.filter((project) => project.id !== projectId);
    applyAdminProjectControls();
    updateAdminStats();

    showMessage(`"${projectTitle}" has been moved to the recycle bin.`, "success");
}

async function loadRecycleBinProjects() {
    if (!recycleBinList) {
        return;
    }

    recycleBinList.innerHTML = `
        <p class="admin-project-empty">Loading recycle bin...</p>
    `;

    const { data: projects, error } = await window.bexSupabase
        .from("projects")
        .select("id, title, category, status, created_at, moved_to_bin_at, moved_to_bin_reason")
        .eq("is_active", false)
        .order("moved_to_bin_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        recycleBinList.innerHTML = `
            <p class="admin-project-empty admin-project-empty--error">
                Recycle bin could not be loaded.
            </p>
        `;
        return;
    }

    renderRecycleBinProjects(projects || []);
}

function renderRecycleBinProjects(projects) {
    currentlyRenderedRecycleProjects = projects;

    if (!recycleBinList) {
        updateRecycleBulkActionState();
        return;
    }

    if (projects.length === 0) {
        selectedRecycleProjectIds.clear();
        updateRecycleBulkActionState();

        recycleBinList.innerHTML = `
            <p class="admin-project-empty">
                Recycle bin is empty.
            </p>
        `;
        return;
    }

    recycleBinList.innerHTML = projects
        .map((project) => {
            return `
                <article class="admin-recycle-item">
                    <label class="admin-project-select" aria-label="Select ${escapeHtml(project.title)}">
                        <input
                            type="checkbox"
                            data-recycle-project-select
                            data-project-id="${escapeHtml(project.id)}"
                            ${selectedRecycleProjectIds.has(project.id) ? "checked" : ""}
                        >
                    </label>

                    <div class="admin-recycle-summary">
                        <h3>${escapeHtml(project.title)}</h3>
                        <p>
                            ${escapeHtml(project.category)} · ${escapeHtml(project.status)}
                        </p>
                        <p>
                            Moved to bin: ${escapeHtml(formatAdminDate(project.moved_to_bin_at))}
                        </p>
                        <p>
                            Reason: ${escapeHtml(project.moved_to_bin_reason || "No reason provided")}
                        </p>
                    </div>

                    <div class="admin-recycle-actions">
                        <button
                            type="button"
                            class="admin-small-link admin-restore-button"
                            data-project-restore
                            data-project-id="${escapeHtml(project.id)}"
                            data-project-title="${escapeHtml(project.title)}"
                        >
                            Restore
                        </button>

                        <button
                            type="button"
                            class="admin-danger-button"
                            data-project-delete-permanently
                            data-project-id="${escapeHtml(project.id)}"
                            data-project-title="${escapeHtml(project.title)}"
                        >
                            Delete Permanently
                        </button>
                    </div>
                </article>
            `;
        })
        .join("");

    updateRecycleBulkActionState();
}

function setRecycleProjectSelection(shouldSelect) {
    currentlyRenderedRecycleProjects.forEach((project) => {
        if (shouldSelect) {
            selectedRecycleProjectIds.add(project.id);
        } else {
            selectedRecycleProjectIds.delete(project.id);
        }
    });

    renderRecycleBinProjects(currentlyRenderedRecycleProjects);
    updateRecycleBulkActionState();
}

function clearSelectedRecycleProjects() {
    selectedRecycleProjectIds.clear();
    renderRecycleBinProjects(currentlyRenderedRecycleProjects);
    updateRecycleBulkActionState();
}

function updateRecycleBulkActionState() {
    const selectedCount = selectedRecycleProjectIds.size;
    const visibleProjectIds = currentlyRenderedRecycleProjects.map((project) => project.id);
    const visibleSelectedCount = visibleProjectIds.filter((projectId) =>
        selectedRecycleProjectIds.has(projectId)
    ).length;

    if (recycleBulkActionBar) {
        recycleBulkActionBar.classList.toggle("d-none", currentlyRenderedRecycleProjects.length === 0);
    }

    if (selectedRecycleProjectsCount) {
        selectedRecycleProjectsCount.textContent = `${selectedCount} selected`;
    }

    if (bulkRestoreProjectsButton) {
        bulkRestoreProjectsButton.disabled = selectedCount === 0;
        bulkRestoreProjectsButton.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (clearSelectedRecycleProjectsButton) {
        clearSelectedRecycleProjectsButton.disabled = selectedCount === 0;
        clearSelectedRecycleProjectsButton.setAttribute("aria-disabled", selectedCount === 0 ? "true" : "false");
    }

    if (selectRecycleBinProjectsCheckbox) {
        selectRecycleBinProjectsCheckbox.checked =
            currentlyRenderedRecycleProjects.length > 0 &&
            visibleSelectedCount === currentlyRenderedRecycleProjects.length;

        selectRecycleBinProjectsCheckbox.indeterminate =
            visibleSelectedCount > 0 &&
            visibleSelectedCount < currentlyRenderedRecycleProjects.length;
    }
}

async function bulkRestoreSelectedProjects() {
    const selectedIds = Array.from(selectedRecycleProjectIds);

    if (selectedIds.length === 0) {
        showMessage("Select at least one recycle bin project first.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Restore ${selectedIds.length} selected project${selectedIds.length === 1 ? "" : "s"}? They will become active again.`
    );

    if (!confirmed) {
        return;
    }

    showMessage("Restoring selected projects...", "info");

    const now = new Date().toISOString();

    const { error } = await window.bexSupabase
        .from("projects")
        .update({
            is_active: true,
            moved_to_bin_at: null,
            moved_to_bin_reason: null,
            updated_at: now,
            updated_action: "Bulk restored"
        })
        .in("id", selectedIds);

    if (error) {
        console.error(error);
        showMessage("Selected projects could not be restored.", "error");
        return;
    }

    selectedRecycleProjectIds.clear();

    await Promise.all([
        loadRecycleBinProjects(),
        loadAdminProjects()
    ]);

    updateAdminStats();

    showMessage(`${selectedIds.length} project${selectedIds.length === 1 ? "" : "s"} restored.`, "success");
}

async function restoreProject(projectId, projectTitle) {
    showMessage("Restoring project...", "info");

    const { error } = await window.bexSupabase
        .from("projects")
        .update({
            is_active: true,
            moved_to_bin_at: null,
            moved_to_bin_reason: null,
            updated_at: new Date().toISOString(),
            updated_action: "Restored"
        })
        .eq("id", projectId);

    if (error) {
        console.error(error);
        showMessage("Project could not be restored.", "error");
        return;
    }

    await Promise.all([
        loadRecycleBinProjects(),
        loadAdminProjects()
    ]);

    updateAdminStats();

    showMessage(`"${projectTitle}" has been restored.`, "success");
}

async function permanentlyDeleteProject(projectId, projectTitle) {
    const confirmed = window.confirm(
        `Permanently delete "${projectTitle}"? This will delete the project record, related technologies, screenshot records, and stored image files. This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    showMessage("Preparing permanent delete...", "info");

    const { data: screenshots, error: screenshotLoadError } = await window.bexSupabase
        .from("project_screenshots")
        .select("image_url")
        .eq("project_id", projectId);

    if (screenshotLoadError) {
        console.error(screenshotLoadError);
        showMessage("Project screenshots could not be checked before deletion.", "error");
        return;
    }

    try {
        const imageUrls = (screenshots || []).map((screenshot) => screenshot.image_url);

        showMessage("Deleting project permanently...", "info");

        await Promise.all([
            deleteProjectStorageFiles(imageUrls),

            window.bexSupabase
                .from("project_technologies")
                .delete()
                .eq("project_id", projectId)
                .then(({ error }) => {
                    if (error) {
                        throw error;
                    }
                }),

            window.bexSupabase
                .from("project_screenshots")
                .delete()
                .eq("project_id", projectId)
                .then(({ error }) => {
                    if (error) {
                        throw error;
                    }
                })
        ]);

        const { error: projectError } = await window.bexSupabase
            .from("projects")
            .delete()
            .eq("id", projectId);

        if (projectError) {
            throw projectError;
        }

        await loadRecycleBinProjects();
        updateAdminStats();

        showMessage(`"${projectTitle}" has been permanently deleted.`, "success");
    } catch (error) {
        console.error(error);
        showMessage(error.message || "Project could not be permanently deleted.", "error");
    }
}

function getStoragePathFromPublicUrl(publicUrl) {
    if (!publicUrl) {
        return null;
    }

    const marker = `/object/public/${screenshotBucketName}/`;
    const markerIndex = publicUrl.indexOf(marker);

    if (markerIndex === -1) {
        return null;
    }

    const pathWithPossibleQueryString = publicUrl.slice(markerIndex + marker.length);
    const storagePath = pathWithPossibleQueryString.split("?")[0];

    try {
        return decodeURIComponent(storagePath);
    } catch {
        return storagePath;
    }
}

async function deleteProjectStorageFiles(imageUrls) {
    const storagePaths = imageUrls
        .map((imageUrl) => getStoragePathFromPublicUrl(imageUrl))
        .filter(Boolean);

    if (storagePaths.length === 0) {
        return;
    }

    const { error } = await window.bexSupabase.storage
        .from(screenshotBucketName)
        .remove(storagePaths);

    if (error) {
        throw error;
    }
}

function formatAdminDate(value) {
    if (!value) {
        return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatAdminShortDate(value) {
    if (!value) {
        return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatAdminActionLabel(value) {
    const action = String(value || "Existing record").trim();

    if (action.startsWith("Bulk status changed to ")) {
        return action.replace("Bulk status changed to ", "Status → ");
    }

    if (action.startsWith("Bulk moved to bin")) {
        return "Moved to bin";
    }

    return action;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function createStatusClass(status) {
    return String(status)
        .trim()
        .toLowerCase()
        .replaceAll(" ", "-");
}

function createTechnologyList(value) {
    return value
        .split(",")
        .map((technology) => technology.trim())
        .filter((technology) => technology !== "");
}

function cleanOptionalUrl(value) {
    const cleanedValue = value.trim();

    return cleanedValue === "" ? "#" : cleanedValue;
}

async function ensureProjectSlugIsUnique(slug, currentProjectId = null) {
    let duplicateQuery = window.bexSupabase
        .from("projects")
        .select("id, title, slug")
        .eq("slug", slug)
        .limit(1);

    if (currentProjectId) {
        duplicateQuery = duplicateQuery.neq("id", currentProjectId);
    }

    const { data, error } = await duplicateQuery;

    if (error) {
        throw error;
    }

    if (Array.isArray(data) && data.length > 0) {
        throw new Error(`A project with a similar title already exists: "${data[0].title}". Please use a different project title.`);
    }
}

function createSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll("&", "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function createSafeFileName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/-+/g, "-");
}

async function handleAdminPasswordRecoveryRedirect() {
    const currentUrl = new URL(window.location.href);
    const hashParameters = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));

    const hasRecoveryType =
        currentUrl.searchParams.get("type") === "recovery" ||
        hashParameters.get("type") === "recovery";

    const hasAccessToken = hashParameters.has("access_token");
    const hasRecoveryCode = currentUrl.searchParams.has("code");

    if (!hasRecoveryType && !hasAccessToken && !hasRecoveryCode) {
        return false;
    }

    try {
        if (hasRecoveryCode) {
            const { error } = await window.bexSupabase.auth.exchangeCodeForSession(window.location.href);

            if (error) {
                throw error;
            }
        }

        showPasswordResetPanel();
        showLoginMessage("Enter and confirm your new password.", "info");
        cleanAdminRecoveryUrl();

        return true;
    } catch (error) {
        console.error(error);
        cleanAdminRecoveryUrl();
        showLoginPanel();
        showLoginMessage("Password reset link could not be verified. Please request a new reset link.", "error");

        return true;
    }
}

function showPasswordResetPanel() {
    projectAdminPanel.classList.add("d-none");
    loginPanel.classList.remove("d-none");
    document.body.classList.remove("admin-auth-checking");

    if (loginForm) {
        loginForm.classList.add("d-none");
    }

    if (resetPasswordForm) {
        resetPasswordForm.classList.remove("d-none");
    }

    if (newAdminPasswordInput) {
        newAdminPasswordInput.focus();
    }
}

function cleanAdminRecoveryUrl() {
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;

    window.history.replaceState({}, document.title, cleanUrl);
}

async function updateRecoveredAdminPassword() {
    const newPassword = newAdminPasswordInput ? newAdminPasswordInput.value : "";
    const confirmPassword = confirmAdminPasswordInput ? confirmAdminPasswordInput.value : "";

    clearLoginMessage();

    if (newPassword.length < 8) {
        showLoginMessage("Password must be at least 8 characters long.", "error");
        newAdminPasswordInput.focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        showLoginMessage("Passwords do not match.", "error");
        confirmAdminPasswordInput.focus();
        return;
    }

    const resetButton = resetPasswordForm.querySelector('button[type="submit"]');
    const originalButtonText = resetButton ? resetButton.textContent : "";

    if (resetButton) {
        resetButton.disabled = true;
        resetButton.textContent = "Updating...";
    }

    try {
        const { error } = await window.bexSupabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        resetPasswordForm.reset();

        await window.bexSupabase.auth.signOut();

        showLoginPanel();
        showLoginMessage("Password updated successfully. Sign in with your new password.", "success");
    } catch (error) {
        showLoginMessage(
            error.message || "Password could not be updated. Please request a new reset link and try again.",
            "error"
        );
    } finally {
        if (resetButton) {
            resetButton.disabled = false;
            resetButton.textContent = originalButtonText || "Update password";
        }
    }
}

function rememberAdminEmail(email) {
    if (!rememberAdminEmailCheckbox || !rememberAdminEmailCheckbox.checked) {
        window.localStorage.removeItem(rememberedAdminEmailStorageKey);
        return;
    }

    window.localStorage.setItem(rememberedAdminEmailStorageKey, email);
}

function syncRememberedAdminEmail() {
    if (!adminEmailInput || !rememberAdminEmailCheckbox) {
        return;
    }

    const rememberedEmail = window.localStorage.getItem(rememberedAdminEmailStorageKey);

    if (rememberedEmail) {
        adminEmailInput.value = rememberedEmail;
        rememberAdminEmailCheckbox.checked = true;
        return;
    }

    adminEmailInput.value = "";
    rememberAdminEmailCheckbox.checked = false;
}

async function sendPasswordResetEmail() {
    const email = adminEmailInput ? adminEmailInput.value.trim() : "";

    clearLoginMessage();

    if (!email) {
        showLoginMessage("Enter your email address first, then select Forgot password.", "error");

        if (adminEmailInput) {
            adminEmailInput.focus();
        }

        return;
    }

    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = "Sending...";

    try {
        const redirectTo = `${window.location.origin}${window.location.pathname}`;

        const { error } = await window.bexSupabase.auth.resetPasswordForEmail(email, {
            redirectTo
        });

        if (error) {
            throw error;
        }

        showLoginMessage(
            `A password reset link has been sent to ${email}. Please check your inbox.`,
            "success"
        );
    } catch (error) {
        showLoginMessage(
            error.message || "Password reset link could not be sent. Please check the email address and try again.",
            "error"
        );
    } finally {
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent = "Forgot password?";
    }
}

function showMessage(message, type) {
    if (!adminMessage) {
        return;
    }

    window.clearTimeout(adminMessageHideTimer);

    adminMessage.textContent = message;
    adminMessage.className = `admin-message admin-message--${type}`;
    adminMessage.classList.remove("d-none");

    if (type === "success") {
        adminMessageHideTimer = window.setTimeout(() => {
            clearAdminMessage();
        }, 3500);
    }
}

function clearAdminMessage() {
    if (!adminMessage) {
        return;
    }

    window.clearTimeout(adminMessageHideTimer);
    adminMessage.classList.add("d-none");
    adminMessage.textContent = "";
}

function showLoginMessage(message, type) {
    let messageElement = document.getElementById("loginMessage");

    if (!messageElement && loginForm) {
        messageElement = document.createElement("div");
        messageElement.id = "loginMessage";
        messageElement.setAttribute("role", "alert");
        messageElement.setAttribute("aria-live", "polite");
        loginForm.insertAdjacentElement("beforebegin", messageElement);
    }

    if (!messageElement) {
        return;
    }

    window.clearTimeout(loginMessageHideTimer);

    messageElement.textContent = message;
    messageElement.className = `admin-login-message admin-login-message--${type}`;
    messageElement.setAttribute("aria-hidden", "false");

    if (type === "success") {
        loginMessageHideTimer = window.setTimeout(() => {
            clearLoginMessage();
        }, 7000);
    }
}

function clearLoginMessage() {
    const messageElement = document.getElementById("loginMessage");

    if (!messageElement) {
        return;
    }

    window.clearTimeout(loginMessageHideTimer);

    messageElement.textContent = "";
    messageElement.className = "admin-login-message admin-login-message--reserved";
    messageElement.setAttribute("aria-hidden", "true");
}


