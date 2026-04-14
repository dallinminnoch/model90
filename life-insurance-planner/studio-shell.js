(function () {
  const STUDIO_VIEW_PARAM = "view";
  const STUDIO_EMBED_PARAM = "studioEmbed";
  const ANALYSIS_PAGES = new Set([
    "lens.html",
    "profile.html",
    "manual-protection-modeling-inputs.html",
    "manual-simplified-pmi.html",
    "manual-minimum-inputs.html",
    "income-loss-impact.html",
    "analysis-estimate.html",
    "analysis-detail.html",
    "recommendations.html",
    "planner.html",
    "summary.html"
  ]);
  const STUDIO_SCROLL_TARGETS = {
    overview: "#studio-overview",
    planning: "#studio-planning-tools",
    workspace: "#studio-workspace-tools"
  };
  const LENS_SCROLL_TARGETS = {
    overview: "#lens-overview",
    start: "#lens-start-analysis",
    summary: "#lens-tool-summary"
  };
  const RESOURCE_SCROLL_TARGETS = {
    calendar: "#resources-calendar-board",
    agenda: "#resources-agenda",
    summary: "#resources-month-summary"
  };

  const pageMenu = document.querySelector(".workspace-page-menu");
  const sidebarHost = document.querySelector("[data-workspace-side-nav-host]");
  const startView = document.querySelector("[data-studio-start-view]");
  const nativeClientsView = document.querySelector("[data-studio-native-clients-view]");
  const embedShell = document.querySelector("[data-studio-embed-shell]");
  const embedFrame = document.querySelector("[data-studio-embed-frame]");
  const topbarLinks = Array.from(document.querySelectorAll("[data-studio-page]"));

  if (!sidebarHost || !startView || !nativeClientsView || !embedShell || !embedFrame || !window.WorkspaceSideNav) {
    return;
  }

  let currentView = "";
  let currentScrollKey = "overview";
  let embedHeightFrame = 0;
  let embedResizeObserver = null;
  let embedMutationObserver = null;
  let observedEmbedWindow = null;
  let observedEmbedWindowResizeHandler = null;

  function getStorageIdentity() {
    try {
      const session = JSON.parse(localStorage.getItem("lipPlannerAuthSession") || "null");
      return session && session.email ? String(session.email).trim().toLowerCase() : "guest";
    } catch (_error) {
      return "guest";
    }
  }

  function getSidebarStorageKey() {
    return `workspaceSideNavCollapsed:${getStorageIdentity()}`;
  }

  function getViewFromWindowLocation(locationObject) {
    try {
      const url = new URL(String(locationObject.href || window.location.href), window.location.href);
      return normalizeViewValue(url.searchParams.get(STUDIO_VIEW_PARAM));
    } catch (_error) {
      return "";
    }
  }

  function normalizeViewValue(rawValue) {
    const raw = String(rawValue || "").trim();
    if (!raw) {
      return "";
    }

    try {
      const resolved = new URL(raw, window.location.href);
      const fileName = getBaseName(resolved.pathname);
      if (!fileName || fileName === "studio.html") {
        return "";
      }

      resolved.searchParams.delete(STUDIO_EMBED_PARAM);
      const normalized = `${fileName}${resolved.search}${resolved.hash}`;
      return normalized;
    } catch (_error) {
      return "";
    }
  }

  function getBaseName(pathname) {
    const value = String(pathname || "").split("/").pop() || "";
    return value.trim().toLowerCase();
  }

  function getViewMeta(viewValue) {
    const normalized = normalizeViewValue(viewValue);
    const parsed = normalized ? new URL(normalized, window.location.href) : null;
    const fileName = parsed ? getBaseName(parsed.pathname) : "";
    const pageKey = fileName === "clients.html" || fileName === "client-detail.html" || fileName === "individual-profile.html" || fileName === "household-profile.html"
      ? "clients"
      : fileName === "resources.html"
        ? "resources"
        : ANALYSIS_PAGES.has(fileName)
          ? "lens"
          : fileName === "strategy-builder.html"
            ? "strategy"
            : fileName === "policy-web.html"
              ? "policy"
              : "studio";
    const shellMode = fileName === "clients.html"
      ? "directory"
      : fileName === "client-detail.html" || fileName === "individual-profile.html" || fileName === "household-profile.html"
        ? "client-detail"
        : fileName === "resources.html"
          ? "resources"
          : ANALYSIS_PAGES.has(fileName)
            ? "lens"
            : "studio";

    return {
      normalized: normalized,
      parsed: parsed,
      fileName: fileName,
      pageKey: pageKey,
      shellMode: shellMode
    };
  }

  function buildStudioUrl(viewValue) {
    const url = new URL(window.location.href);
    const normalized = normalizeViewValue(viewValue);
    if (normalized) {
      url.searchParams.set(STUDIO_VIEW_PARAM, normalized);
    } else {
      url.searchParams.delete(STUDIO_VIEW_PARAM);
    }
    return url;
  }

  function buildEmbedUrl(viewValue) {
    const normalized = normalizeViewValue(viewValue);
    if (!normalized) {
      return "";
    }

    const resolved = new URL(normalized, window.location.href);
    resolved.searchParams.set(STUDIO_EMBED_PARAM, "1");
    return resolved.toString();
  }

  function setSidebarCollapsed(isCollapsed) {
    document.body.classList.toggle("workspace-side-nav-collapsed", isCollapsed);
    sidebarHost.classList.toggle("is-collapsed", isCollapsed);

    const toggle = sidebarHost.querySelector(".workspace-side-nav-toggle");
    if (!toggle) {
      return;
    }

    const modeLabel = String(sidebarHost.getAttribute("data-workspace-side-nav") || "studio").replace(/-/g, " ");
    toggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    toggle.setAttribute("aria-label", isCollapsed ? `Expand ${modeLabel} navigation` : `Collapse ${modeLabel} navigation`);
    toggle.setAttribute("title", isCollapsed ? `Expand ${modeLabel} navigation` : `Collapse ${modeLabel} navigation`);
  }

  function persistSidebarCollapsed(isCollapsed) {
    try {
      window.localStorage.setItem(getSidebarStorageKey(), isCollapsed ? "1" : "0");
    } catch (_error) {
      // Ignore storage failures.
    }
  }

  function readSidebarCollapsed() {
    try {
      return window.localStorage.getItem(getSidebarStorageKey()) === "1";
    } catch (_error) {
      return false;
    }
  }

  function syncTopbarState(activePageKey) {
    topbarLinks.forEach(function (link) {
      const linkKey = String(link.dataset.studioPage || "").trim();
      const isActive = linkKey === activePageKey;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function isNativeDirectoryView(viewValue) {
    return getViewMeta(viewValue).shellMode === "directory";
  }

  function getNativeDirectoryApi() {
    if (!isNativeDirectoryView(currentView)) {
      return null;
    }

    const nativeApi = window.ClientDirectoryShellApi;
    if (!nativeApi || typeof nativeApi.getState !== "function") {
      return null;
    }

    return nativeApi;
  }

  function syncShellVisibility() {
    const isToolView = Boolean(currentView);
    const isNativeDirectory = isNativeDirectoryView(currentView);

    document.body.classList.toggle("is-embedded-tool", isToolView && !isNativeDirectory);
    document.body.classList.toggle("is-native-directory", isToolView && isNativeDirectory);
    startView.hidden = isToolView;
    nativeClientsView.hidden = !(isToolView && isNativeDirectory);
    embedShell.hidden = !isToolView || isNativeDirectory;

    if (!isToolView || isNativeDirectory) {
      resetEmbedAutoHeight();
    }
  }

  function getIframeDocument() {
    try {
      return embedFrame.contentDocument || embedFrame.contentWindow?.document || null;
    } catch (_error) {
      return null;
    }
  }

  function getIframeWindow() {
    try {
      return embedFrame.contentWindow || null;
    } catch (_error) {
      return null;
    }
  }

  function clearEmbedAutoHeightWatchers() {
    if (embedHeightFrame) {
      window.cancelAnimationFrame(embedHeightFrame);
      embedHeightFrame = 0;
    }

    if (embedResizeObserver) {
      embedResizeObserver.disconnect();
      embedResizeObserver = null;
    }

    if (embedMutationObserver) {
      embedMutationObserver.disconnect();
      embedMutationObserver = null;
    }

    if (observedEmbedWindow && observedEmbedWindowResizeHandler) {
      observedEmbedWindow.removeEventListener("resize", observedEmbedWindowResizeHandler);
    }

    observedEmbedWindow = null;
    observedEmbedWindowResizeHandler = null;
  }

  function resetEmbedAutoHeight() {
    clearEmbedAutoHeightWatchers();
    embedShell.style.height = "";
    embedShell.style.minHeight = "";
    embedFrame.style.height = "";
    embedFrame.style.minHeight = "";
  }

  function getStudioEmbedViewportHeight() {
    const embedTop = embedShell.getBoundingClientRect().top;
    return Math.max(0, Math.ceil(window.innerHeight - embedTop));
  }

  function getEmbeddedDocumentHeight(doc) {
    if (!doc) {
      return 0;
    }

    const html = doc.documentElement;
    const body = doc.body;

    return Math.max(
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0,
      html ? Math.ceil(html.getBoundingClientRect().height) : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      body ? Math.ceil(body.getBoundingClientRect().height) : 0
    );
  }

  function syncEmbedAutoHeight() {
    if (!currentView || embedShell.hidden) {
      return;
    }

    const doc = getIframeDocument();
    const viewportHeight = getStudioEmbedViewportHeight();
    const viewMeta = getViewMeta(currentView);

    if (viewMeta.shellMode === "directory") {
      const fixedHeight = Math.max(0, viewportHeight);
      embedShell.style.minHeight = `${fixedHeight}px`;
      embedShell.style.height = `${fixedHeight}px`;
      embedFrame.style.minHeight = `${fixedHeight}px`;
      embedFrame.style.height = `${fixedHeight}px`;
      return;
    }

    const contentHeight = getEmbeddedDocumentHeight(doc);
    const measuredHeight = contentHeight > 0 ? contentHeight : viewportHeight;
    const nextHeight = Math.max(0, Math.ceil(measuredHeight) + 2);
    const nextMinHeight = contentHeight > 0 ? 0 : viewportHeight;

    embedShell.style.minHeight = `${nextMinHeight}px`;
    embedShell.style.height = `${nextHeight}px`;
    embedFrame.style.minHeight = `${nextMinHeight}px`;
    embedFrame.style.height = `${nextHeight}px`;
  }

  function scheduleEmbedAutoHeightSync() {
    if (embedHeightFrame) {
      window.cancelAnimationFrame(embedHeightFrame);
    }

    embedHeightFrame = window.requestAnimationFrame(function () {
      embedHeightFrame = 0;
      syncEmbedAutoHeight();
    });
  }

  function watchEmbedAutoHeight() {
    clearEmbedAutoHeightWatchers();

    const doc = getIframeDocument();
    const frameWindow = getIframeWindow();
    if (!doc) {
      return;
    }

    const resizeTarget = doc.documentElement || doc.body;
    const mutationTarget = doc.body || doc.documentElement;

    if (typeof ResizeObserver !== "undefined" && resizeTarget) {
      embedResizeObserver = new ResizeObserver(scheduleEmbedAutoHeightSync);
      embedResizeObserver.observe(resizeTarget);
      if (doc.body && doc.body !== resizeTarget) {
        embedResizeObserver.observe(doc.body);
      }
    }

    if (typeof MutationObserver !== "undefined" && mutationTarget) {
      embedMutationObserver = new MutationObserver(scheduleEmbedAutoHeightSync);
      embedMutationObserver.observe(mutationTarget, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
    }

    if (frameWindow) {
      observedEmbedWindow = frameWindow;
      observedEmbedWindowResizeHandler = scheduleEmbedAutoHeightSync;
      observedEmbedWindow.addEventListener("resize", observedEmbedWindowResizeHandler);
    }

    if (doc.fonts && typeof doc.fonts.ready?.then === "function") {
      doc.fonts.ready.then(scheduleEmbedAutoHeightSync).catch(function () {});
    }

    scheduleEmbedAutoHeightSync();
    window.setTimeout(scheduleEmbedAutoHeightSync, 60);
    window.setTimeout(scheduleEmbedAutoHeightSync, 220);
  }

  function injectEmbedStyles(doc) {
    if (!doc || !doc.head || !doc.body) {
      return;
    }

    doc.body.classList.add("studio-embed-mode");
    if (doc.getElementById("studio-shell-embed-style")) {
      return;
    }

    const style = doc.createElement("style");
    style.id = "studio-shell-embed-style";
    style.textContent = `
      :root {
        --app-side-nav-width: 0px !important;
        --app-side-nav-collapsed-width: 0px !important;
        --app-side-nav-gap: 0px !important;
        --workspace-topbar-height: 0px !important;
        --app-side-nav-top-offset: 0px !important;
        --app-side-nav-toggle-top-offset: 0px !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        background: transparent !important;
      }

      body.studio-embed-mode {
        overflow-x: hidden !important;
        overflow-y: visible !important;
      }

      body.studio-embed-mode.clients-page {
        overflow-y: auto !important;
      }

      body.studio-embed-mode .workspace-page-topbar,
      body.studio-embed-mode .workspace-side-nav-host,
      body.studio-embed-mode .site-header {
        display: none !important;
      }

      body.studio-embed-mode .home-shell,
      body.studio-embed-mode .app-home-shell,
      body.studio-embed-mode .workflow-shell {
        width: 100% !important;
        max-width: none !important;
        min-height: auto !important;
        margin: 0 !important;
        padding-top: 0 !important;
      }

      body.studio-embed-mode .client-directory-shell,
      body.studio-embed-mode .client-directory-shell-layout,
      body.studio-embed-mode .prospect-shell,
      body.studio-embed-mode .client-detail-panel,
      body.studio-embed-mode .client-detail-sections,
      body.studio-embed-mode .client-profile-shell,
      body.studio-embed-mode .client-profile-main,
      body.studio-embed-mode .client-profile-dashboard,
      body.studio-embed-mode .client-profile-dashboard-main,
      body.studio-embed-mode .client-profile-overview-layout,
      body.studio-embed-mode .client-profile-overview-stack,
      body.studio-embed-mode .studio-shell,
      body.studio-embed-mode .resources-shell,
      body.studio-embed-mode .resources-workspace,
      body.studio-embed-mode .resources-calendar-board,
      body.studio-embed-mode .lens-start-layout,
      body.studio-embed-mode .lens-start-main,
      body.studio-embed-mode .prospect-stage {
        width: 100% !important;
        max-width: none !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding-top: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      body.studio-embed-mode .client-directory-shell,
      body.studio-embed-mode .resources-shell,
      body.studio-embed-mode .prospect-shell,
      body.studio-embed-mode .studio-shell {
        padding-bottom: 0 !important;
      }

      body.studio-embed-mode .lens-start-layout,
      body.studio-embed-mode .resources-workspace {
        grid-template-columns: minmax(0, 1fr) !important;
      }

      body.studio-embed-mode .lens-start-rail {
        width: 100% !important;
        min-width: 0 !important;
      }
    `;

    doc.head.appendChild(style);
  }

  function getActiveInnerValue(selector, datasetKey) {
    const doc = getIframeDocument();
    if (!doc) {
      return "";
    }

    const activeElement = doc.querySelector(`${selector}.is-active`);
    if (!activeElement) {
      return "";
    }

    return String(activeElement.dataset[datasetKey] || "").trim();
  }

  function setCurrentPageState(buttons, activeKey, attributeName) {
    buttons.forEach(function (button) {
      const buttonKey = String(button.getAttribute(attributeName) || "").trim();
      const isActive = Boolean(activeKey) && buttonKey === activeKey;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "location");
        button.setAttribute("aria-selected", "true");
      } else {
        button.removeAttribute("aria-current");
        if (button.tagName === "BUTTON") {
          button.setAttribute("aria-selected", "false");
        }
      }
    });
  }

  function getEmbeddedDirectoryState() {
    const nativeDirectoryApi = getNativeDirectoryApi();
    if (nativeDirectoryApi) {
      try {
        const state = nativeDirectoryApi.getState();
        const activeView = String(state?.activeView || "").trim();
        const activeScope = String(state?.activeScope || "").trim();
        const activePriority = String(state?.activePriority || "").trim();
        return {
          activeView: activeView || "individuals",
          activeScope: activeScope || "all",
          activePriority: activePriority || "all",
          isAllActive: Boolean(state?.isAllActive)
        };
      } catch (_error) {
        // Fall back to iframe or DOM-based state detection below.
      }
    }

    const frameWindow = getIframeWindow();
    const doc = getIframeDocument();
    const embeddedDirectoryApi = frameWindow && frameWindow.ClientDirectoryShellApi;

    if (embeddedDirectoryApi && typeof embeddedDirectoryApi.getState === "function") {
      try {
        const state = embeddedDirectoryApi.getState();
        const activeView = String(state?.activeView || "").trim();
        const activeScope = String(state?.activeScope || "").trim();
        const activePriority = String(state?.activePriority || "").trim();
        return {
          activeView: activeView || "individuals",
          activeScope: activeScope || "all",
          activePriority: activePriority || "all",
          isAllActive: Boolean(state?.isAllActive)
        };
      } catch (_error) {
        // Fall through to DOM-based state detection if the embedded API is unavailable.
      }
    }

    if (!doc) {
      return {
        activeView: "individuals",
        activeScope: "all",
        activePriority: "all",
        isAllActive: true
      };
    }

    const activeView = String(doc.querySelector("[data-client-view].is-active")?.getAttribute("data-client-view") || "").trim() || "individuals";
    const activeScope = String(doc.querySelector("[data-directory-scope-action].is-active")?.getAttribute("data-directory-scope") || "").trim() || "all";
    const activePriority = String(doc.querySelector("[data-directory-priority-action].is-active")?.getAttribute("data-directory-priority") || "").trim() || "all";
    const isAllActive = Boolean(doc.querySelector('[data-directory-nav-action="all"].is-active'));

    return {
      activeView: activeView,
      activeScope: activeScope,
      activePriority: activePriority,
      isAllActive: isAllActive
    };
  }

  function syncDirectoryCurrentPageControls() {
    const directoryState = getEmbeddedDirectoryState();
    const activeView = String(directoryState.activeView || "").trim() || "individuals";
    const activeScope = String(directoryState.activeScope || "").trim() || "all";
    const activePriority = String(directoryState.activePriority || "").trim() || "all";
    const isAllActive = Boolean(directoryState.isAllActive);

    sidebarHost.querySelectorAll("[data-directory-context-group-key]").forEach(function (group) {
      const groupKey = String(group.getAttribute("data-directory-context-group-key") || "").trim();
      group.classList.toggle("is-expanded", groupKey === activeView);
    });

    sidebarHost.querySelectorAll("[data-directory-nav-action]").forEach(function (button) {
      const action = String(button.getAttribute("data-directory-nav-action") || "").trim();
      const isActive = action === "all"
        ? isAllActive
        : action === activeView;

      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "location");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    sidebarHost.querySelectorAll("[data-directory-scope-action]").forEach(function (button) {
      const buttonView = String(button.getAttribute("data-directory-scope-view") || "").trim();
      const buttonScope = String(button.getAttribute("data-directory-scope") || "").trim() || "all";
      const isActive = buttonView === activeView && buttonScope === activeScope;

      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "location");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    sidebarHost.querySelectorAll("[data-directory-priority-action]").forEach(function (button) {
      const buttonView = String(button.getAttribute("data-directory-priority-view") || "").trim();
      const buttonPriority = String(button.getAttribute("data-directory-priority") || "").trim() || "all";
      const isActive = buttonView === activeView && buttonPriority === activePriority;

      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "location");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function syncCurrentPageControls(mode, meta) {
    if (mode === "studio") {
      setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-studio-tab]")), currentScrollKey, "data-studio-tab");
      return;
    }

    if (mode === "directory") {
      syncDirectoryCurrentPageControls();
      return;
    }

    if (mode === "client-detail") {
      const activeKey = getActiveInnerValue("[data-client-tab]", "clientTab") || "overview";
      setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-client-tab]")), activeKey, "data-client-tab");
      return;
    }

    if (mode === "resources") {
      const activeKey = getActiveInnerValue("[data-resources-tab]", "resourcesTab") || "calendar";
      setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-resources-tab]")), activeKey, "data-resources-tab");
      return;
    }

    if (mode === "lens") {
      const activeKey = meta.fileName === "lens.html"
        ? getActiveInnerValue("[data-lens-tab]", "lensTab") || "overview"
        : "overview";
      setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-lens-tab]")), activeKey, "data-lens-tab");
    }
  }

  function getEmbeddedCurrentPageTitle(meta) {
    const doc = getIframeDocument();
    const frameWindow = getIframeWindow();
    if (!doc || !frameWindow || !frameWindow.location) {
      return "";
    }

    const actualView = normalizeViewValue(`${getBaseName(frameWindow.location.pathname)}${frameWindow.location.search}${frameWindow.location.hash}`);
    if (!actualView || actualView !== meta.normalized) {
      return "";
    }

    return String(
      doc.body?.getAttribute("data-workspace-current-title")
      || doc.documentElement?.getAttribute("data-workspace-current-title")
      || ""
    ).trim();
  }

  function syncSidebarCurrentTitle(nextTitle) {
    const titleNode = sidebarHost.querySelector(".workspace-side-nav-copy strong");
    if (!titleNode) {
      return;
    }

    const fallbackTitle = String(titleNode.dataset.defaultTitle || titleNode.textContent || "").trim();
    if (!titleNode.dataset.defaultTitle) {
      titleNode.dataset.defaultTitle = fallbackTitle;
    }

    const resolvedTitle = String(nextTitle || "").trim() || titleNode.dataset.defaultTitle || fallbackTitle;
    titleNode.textContent = resolvedTitle;
  }

  function renderSidebarForCurrentView() {
    const meta = getViewMeta(currentView);
    const renderOptions = {
      shell: true,
      activePage: meta.pageKey
    };
    const embeddedTitle = getEmbeddedCurrentPageTitle(meta);
    if (embeddedTitle) {
      renderOptions.title = embeddedTitle;
    }
    sidebarHost.setAttribute("data-workspace-side-nav", meta.shellMode);
    sidebarHost.innerHTML = window.WorkspaceSideNav.render(meta.shellMode, renderOptions);
    setSidebarCollapsed(document.body.classList.contains("workspace-side-nav-collapsed"));
    bindSidebarInteractions(meta);
    syncSidebarCurrentTitle(renderOptions.title || "");
    syncCurrentPageControls(meta.shellMode, meta);
    syncTopbarState(meta.pageKey);
  }

  function scrollStartSection(sectionKey) {
    const targetSelector = STUDIO_SCROLL_TARGETS[sectionKey];
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    if (!target) {
      return;
    }

    currentScrollKey = sectionKey;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    syncCurrentPageControls("studio", getViewMeta(""));
  }

  function scrollEmbeddedTarget(selector) {
    const doc = getIframeDocument();
    if (!doc) {
      return false;
    }

    const target = doc.querySelector(selector);
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function clickEmbeddedControl(selector) {
    const doc = getIframeDocument();
    if (!doc) {
      return false;
    }

    const target = doc.querySelector(selector);
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    target.click();
    return true;
  }

  function setEmbeddedClientDetailTab(tabKey) {
    const doc = getIframeDocument();
    if (!doc) {
      return false;
    }

    const buttons = Array.from(doc.querySelectorAll("[data-client-tab]"));
    const panels = Array.from(doc.querySelectorAll("[data-client-panel]"));
    if (!buttons.length || !panels.length) {
      return false;
    }

    const normalizedTabKey = String(tabKey || "").trim();
    if (!normalizedTabKey) {
      return false;
    }

    let foundMatch = false;

    buttons.forEach(function (button) {
      const isActive = String(button.getAttribute("data-client-tab") || "").trim() === normalizedTabKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        foundMatch = true;
      }
    });

    if (!foundMatch) {
      return false;
    }

    panels.forEach(function (panel) {
      const isActive = String(panel.getAttribute("data-client-panel") || "").trim() === normalizedTabKey;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    try {
      getIframeWindow()?.dispatchEvent(new Event("resize"));
    } catch (_error) {
      // Ignore resize dispatch failures.
    }

    return true;
  }

  function setEmbeddedDirectoryAction(actionKey) {
    const nativeDirectoryApi = getNativeDirectoryApi();
    const normalizedAction = String(actionKey || "").trim();

    if (!normalizedAction) {
      return false;
    }

    if (nativeDirectoryApi && typeof nativeDirectoryApi.triggerAction === "function") {
      try {
        return Boolean(nativeDirectoryApi.triggerAction(normalizedAction));
      } catch (_error) {
        // Fall through to iframe-based controls when the native API is unavailable.
      }
    }

    const doc = getIframeDocument();
    const frameWindow = getIframeWindow();
    if (!doc) {
      return false;
    }

    const embeddedDirectoryApi = frameWindow && frameWindow.ClientDirectoryShellApi;
    if (embeddedDirectoryApi && typeof embeddedDirectoryApi.triggerAction === "function") {
      try {
        if (embeddedDirectoryApi.triggerAction(normalizedAction)) {
          return true;
        }
      } catch (_error) {
        // Fall through to DOM-based control if the embedded API is unavailable.
      }
    }

    if (normalizedAction === "all") {
      const statusAllButton = doc.querySelector('[data-client-status="all"]');
      const letterAllButton = doc.querySelector('[data-client-letter="all"]');
      statusAllButton?.click();
      letterAllButton?.click();
      return Boolean(statusAllButton || letterAllButton);
    }

    if (normalizedAction === "households" || normalizedAction === "individuals" || normalizedAction === "businesses") {
      const viewButton = doc.querySelector(`[data-client-view="${normalizedAction}"]`);
      if (!(viewButton instanceof HTMLElement)) {
        return false;
      }
      viewButton.click();
      return true;
    }

    if (/^(individuals|households|businesses):(all|high|medium|low)$/.test(normalizedAction)) {
      const priorityButton = doc.querySelector(`[data-directory-priority-action="${normalizedAction}"]`);
      if (!(priorityButton instanceof HTMLElement)) {
        return false;
      }
      priorityButton.click();
      return true;
    }

    if (/^(individuals|households|businesses):scope:(all|flagged|recently-viewed|recently-added|incomplete)$/.test(normalizedAction)) {
      const scopeButton = doc.querySelector(`[data-directory-scope-action="${normalizedAction}"]`);
      if (!(scopeButton instanceof HTMLElement)) {
        return false;
      }
      scopeButton.click();
      return true;
    }

    if (normalizedAction === "add") {
      const addButton = doc.querySelector("[data-add-client-button]");
      if (!(addButton instanceof HTMLElement)) {
        return false;
      }
      addButton.click();
      return true;
    }

    return false;
  }

  function navigateToView(viewValue, historyMode) {
    const nextView = normalizeViewValue(viewValue);
    const currentMode = historyMode || "push";
    const nextMeta = getViewMeta(nextView);

    if (nextView === currentView && currentMode !== "none") {
      syncShellVisibility();
      renderSidebarForCurrentView();
      if (nextMeta.shellMode === "directory" && window.StudioClientDirectory && typeof window.StudioClientDirectory.ensureMounted === "function") {
        window.StudioClientDirectory.ensureMounted().then(function () {
          if (window.ClientDirectoryShellApi && typeof window.ClientDirectoryShellApi.refresh === "function") {
            window.ClientDirectoryShellApi.refresh();
          }
          syncCurrentPageControls("directory", nextMeta);
        }).catch(function () {});
      } else {
        scheduleEmbedAutoHeightSync();
      }
      return;
    }

    currentView = nextView;

    syncShellVisibility();
    renderSidebarForCurrentView();

    if (currentMode === "replace") {
      window.history.replaceState({ view: nextView }, "", buildStudioUrl(nextView));
    } else if (currentMode === "push") {
      window.history.pushState({ view: nextView }, "", buildStudioUrl(nextView));
    }

    if (!nextView) {
      resetEmbedAutoHeight();
      scrollStartSection(currentScrollKey);
      return;
    }

    if (nextMeta.shellMode === "directory") {
      embedFrame.classList.remove("is-pending");
      if (window.StudioClientDirectory && typeof window.StudioClientDirectory.ensureMounted === "function") {
        window.StudioClientDirectory.ensureMounted().then(function () {
          if (window.ClientDirectoryShellApi && typeof window.ClientDirectoryShellApi.refresh === "function") {
            window.ClientDirectoryShellApi.refresh();
          }
          syncCurrentPageControls("directory", nextMeta);
        }).catch(function () {});
      }
      return;
    }

    const nextSrc = buildEmbedUrl(nextView);
    const frameWindow = getIframeWindow();
    const currentFrameHref = frameWindow && frameWindow.location
      ? String(frameWindow.location.href || "")
      : String(embedFrame.getAttribute("src") || "");

    if (currentFrameHref !== nextSrc) {
      embedFrame.classList.add("is-pending");
      if (frameWindow && frameWindow.location) {
        try {
          frameWindow.location.replace(nextSrc);
        } catch (_error) {
          embedFrame.setAttribute("src", nextSrc);
        }
      } else {
        embedFrame.setAttribute("src", nextSrc);
      }
    }
  }

  function syncFromEmbeddedLocation(historyMode) {
    const frameWindow = getIframeWindow();
    if (!frameWindow || !frameWindow.location) {
      return;
    }

    const actualView = normalizeViewValue(`${getBaseName(frameWindow.location.pathname)}${frameWindow.location.search}${frameWindow.location.hash}`);
    if (!actualView) {
      return;
    }

    if (actualView === currentView) {
      const meta = getViewMeta(currentView);
      syncSidebarCurrentTitle(getEmbeddedCurrentPageTitle(meta));
      syncCurrentPageControls(meta.shellMode, meta);
      scheduleEmbedAutoHeightSync();
      return;
    }

    currentView = actualView;
    syncShellVisibility();
    renderSidebarForCurrentView();
    if (historyMode === "replace") {
      window.history.replaceState({ view: actualView }, "", buildStudioUrl(actualView));
    } else {
      window.history.pushState({ view: actualView }, "", buildStudioUrl(actualView));
    }
  }

  function bindSidebarInteractions(meta) {
    const toggle = sidebarHost.querySelector(".workspace-side-nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        const nextCollapsed = !sidebarHost.classList.contains("is-collapsed");
        setSidebarCollapsed(nextCollapsed);
        persistSidebarCollapsed(nextCollapsed);
        scheduleEmbedAutoHeightSync();
        window.setTimeout(scheduleEmbedAutoHeightSync, 240);
      });
    }

    sidebarHost.querySelectorAll('a[href*="studio.html"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        const view = parseViewFromShellHref(link.getAttribute("href"));
        if (view === null) {
          return;
        }
        event.preventDefault();
        navigateToView(view, "push");
        closeMenus();
      });
    });

    if (meta.shellMode === "studio") {
      sidebarHost.querySelectorAll("[data-studio-tab]").forEach(function (link) {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          scrollStartSection(String(link.getAttribute("data-studio-tab") || "overview"));
        });
      });
      return;
    }

    if (meta.shellMode === "directory") {
      sidebarHost.querySelectorAll("[data-directory-nav-action]").forEach(function (button) {
        button.addEventListener("click", function () {
          const action = String(button.getAttribute("data-directory-nav-action") || "").trim();
          if (!action) {
            return;
          }

          if (setEmbeddedDirectoryAction(action) || clickEmbeddedControl(`[data-directory-nav-action="${action}"]`)) {
            window.setTimeout(function () {
              syncCurrentPageControls("directory", meta);
            }, 60);
          }
        });
      });
      sidebarHost.querySelectorAll("[data-directory-scope-action]").forEach(function (button) {
        button.addEventListener("click", function () {
          const action = String(button.getAttribute("data-directory-scope-action") || "").trim();
          if (!action) {
            return;
          }

          if (setEmbeddedDirectoryAction(action) || clickEmbeddedControl(`[data-directory-scope-action="${action}"]`)) {
            window.setTimeout(function () {
              syncCurrentPageControls("directory", meta);
            }, 60);
          }
        });
      });
      sidebarHost.querySelectorAll("[data-directory-priority-action]").forEach(function (button) {
        button.addEventListener("click", function () {
          const action = String(button.getAttribute("data-directory-priority-action") || "").trim();
          if (!action) {
            return;
          }

          if (setEmbeddedDirectoryAction(action) || clickEmbeddedControl(`[data-directory-priority-action="${action}"]`)) {
            window.setTimeout(function () {
              syncCurrentPageControls("directory", meta);
            }, 60);
          }
        });
      });
      return;
    }

    if (meta.shellMode === "client-detail") {
      sidebarHost.querySelectorAll("[data-client-tab]").forEach(function (button) {
        button.addEventListener("click", function () {
          const tabKey = String(button.getAttribute("data-client-tab") || "").trim();
          if (!tabKey) {
            return;
          }

          if (setEmbeddedClientDetailTab(tabKey) || clickEmbeddedControl(`[data-client-tab="${tabKey}"]`)) {
            window.setTimeout(function () {
              syncCurrentPageControls("client-detail", meta);
            }, 60);
          }
        });
      });
      return;
    }

    if (meta.shellMode === "resources") {
      sidebarHost.querySelectorAll("[data-resources-tab]").forEach(function (link) {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const key = String(link.getAttribute("data-resources-tab") || "").trim();
          const selector = RESOURCE_SCROLL_TARGETS[key];
          if (!selector) {
            return;
          }

          if (scrollEmbeddedTarget(selector)) {
            setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-resources-tab]")), key, "data-resources-tab");
          }
        });
      });
      return;
    }

    if (meta.shellMode === "lens") {
      sidebarHost.querySelectorAll("[data-lens-tab]").forEach(function (link) {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const key = String(link.getAttribute("data-lens-tab") || "").trim();
          const selector = LENS_SCROLL_TARGETS[key];
          if (!selector) {
            return;
          }

          if (meta.fileName === "lens.html" && scrollEmbeddedTarget(selector)) {
            setCurrentPageState(Array.from(sidebarHost.querySelectorAll("[data-lens-tab]")), key, "data-lens-tab");
            return;
          }

          navigateToView(`lens.html${selector}`, "push");
        });
      });
    }
  }

  function parseViewFromShellHref(rawHref) {
    const href = String(rawHref || "").trim();
    if (!href) {
      return null;
    }

    try {
      const url = new URL(href, window.location.href);
      if (getBaseName(url.pathname) !== "studio.html") {
        return null;
      }
      return normalizeViewValue(url.searchParams.get(STUDIO_VIEW_PARAM));
    } catch (_error) {
      return null;
    }
  }

  function closeMenus() {
    document.querySelectorAll(".workspace-page-menu[open]").forEach(function (menu) {
      menu.removeAttribute("open");
    });
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".workspace-page-menu")) {
      closeMenus();
    }

    const returnToDirectoryLink = event.target.closest("[data-client-directory-return]");
    if (returnToDirectoryLink && sidebarHost.contains(returnToDirectoryLink) && String(sidebarHost.getAttribute("data-workspace-side-nav") || "").trim() === "client-detail") {
      const hrefSource = returnToDirectoryLink.getAttribute("data-client-directory-return-href")
        || returnToDirectoryLink.getAttribute("href")
        || "";
      const view = parseViewFromShellHref(hrefSource) || "clients.html";
      event.preventDefault();
      navigateToView(view, "push");
      closeMenus();
      return;
    }

    const studioLink = event.target.closest("[data-studio-page]");
    if (studioLink instanceof HTMLAnchorElement) {
      const view = parseViewFromShellHref(studioLink.getAttribute("href"));
      if (view === null && String(studioLink.dataset.studioPage || "").trim() !== "studio") {
        return;
      }

      event.preventDefault();
      navigateToView(view || "", "push");
      closeMenus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenus();
    }
  });

  embedFrame.addEventListener("load", function () {
    const doc = getIframeDocument();
    injectEmbedStyles(doc);
    embedFrame.classList.remove("is-pending");
    watchEmbedAutoHeight();
    syncFromEmbeddedLocation("push");
    scheduleEmbedAutoHeightSync();
  });

  window.addEventListener("popstate", function () {
    navigateToView(getViewFromWindowLocation(window.location), "none");
  });

  window.addEventListener("resize", scheduleEmbedAutoHeightSync);



  setSidebarCollapsed(readSidebarCollapsed());
  window.StudioShellApi = {
    navigateToView: navigateToView
  };
  navigateToView(getViewFromWindowLocation(window.location), "none");
})();

