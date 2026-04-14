(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getDirectoryIcon(key) {
    if (key === "all") {
      return `
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="2.75" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="2.75" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
        </svg>
      `;
    }

    if (key === "households") {
      return `
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="7" cy="7.2" r="2.35" stroke="currentColor" stroke-width="1.55"/>
          <circle cx="13.3" cy="8.15" r="2.05" stroke="currentColor" stroke-width="1.55"/>
          <path d="M3.9 15.35c.55-2.15 2.2-3.45 4.15-3.45 1.95 0 3.55 1.3 4.1 3.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M11.2 15.35c.4-1.65 1.7-2.65 3.25-2.65 1.1 0 2.15.5 2.85 1.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    if (key === "individuals") {
      return `
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="6.4" r="2.5" stroke="currentColor" stroke-width="1.55"/>
          <path d="M5.45 15.4c.6-2.45 2.45-3.95 4.55-3.95 2.1 0 3.95 1.5 4.55 3.95" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    if (key === "businesses") {
      return `
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4.25 16.6V5.45a1.2 1.2 0 0 1 1.2-1.2h5.3a1.2 1.2 0 0 1 1.2 1.2V16.6" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
          <path d="M11.95 16.6V8.1a1.2 1.2 0 0 1 1.2-1.2h1.4a1.2 1.2 0 0 1 1.2 1.2v8.5" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
          <path d="M2.9 16.6h14.2" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M7.05 7.25h1.15M7.05 9.8h1.15M7.05 12.35h1.15" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 4.1v11.8M4.1 10h11.8" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      </svg>
    `;
  }

  function getDirectoryScopeIcon(key) {
    const assetMap = {
      flagged: "../Images/flag.svg",
      "recently-viewed": "../Images/recentlyviewed.svg",
      "recently-added": "../Images/recentlyadded.svg",
      incomplete: "../Images/incomplete.svg"
    };
    const src = assetMap[String(key || "").trim()];
    if (!src) {
      return "";
    }
    return `<img src="${escapeHtml(src)}" alt="" aria-hidden="true">`;
  }

  function getWorkspacePageIcon(key) {
    if (key === "studio") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.75" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="2.75" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
        </svg>
      `;
    }

    if (key === "home") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.6 8.45 10 3.55l6.4 4.9v7.2a1.35 1.35 0 0 1-1.35 1.35H4.95A1.35 1.35 0 0 1 3.6 15.65V8.45Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
          <path d="M7.75 16.95v-4.3h4.5v4.3" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
        </svg>
      `;
    }

    if (key === "clients") {
      return `
        <img src="../Images/clientdirectory.svg" alt="" />
      `;
    }

    if (key === "resources") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.1 3.15h7.65l2.15 2.2v10.1a1.55 1.55 0 0 1-1.55 1.55H5.1a1.55 1.55 0 0 1-1.55-1.55V4.7A1.55 1.55 0 0 1 5.1 3.15Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
          <path d="M12.75 3.3v2.55h2.4" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6.4 9.2h6.85M6.4 12.15h6.85" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    if (key === "lens") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="6.05" stroke="currentColor" stroke-width="1.55"/>
          <circle cx="10" cy="10" r="2.1" stroke="currentColor" stroke-width="1.55"/>
          <path d="M10 2.95v1.85M10 15.2v1.85M17.05 10H15.2M4.8 10H2.95" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    if (key === "strategy") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 15.75h14" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M4.25 13.1 7.45 9.9l2.75 2.75 5.55-6.1" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.95 6.55h2.8v2.8" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4.25 5.25h11.5a1.1 1.1 0 0 1 1.1 1.1v7.3a1.1 1.1 0 0 1-1.1 1.1H4.25a1.1 1.1 0 0 1-1.1-1.1v-7.3a1.1 1.1 0 0 1 1.1-1.1Z" stroke="currentColor" stroke-width="1.55"/>
        <path d="M6.2 8.15h7.6M6.2 10.85h5.2" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
      </svg>
    `;
  }

  function getWorkspacePages(mode, options) {
    const config = options && typeof options === "object" ? options : {};
    const activePage = String(config.activePage || "").trim();
    const isShell = Boolean(config.shell);
    const hrefs = isShell
      ? {
          studio: "studio.html",
          clients: "studio.html?view=clients.html",
          resources: "studio.html?view=resources.html",
          lens: "studio.html?view=lens.html",
          strategy: "studio.html?view=strategy-builder.html",
          policy: "studio.html?view=policy-web.html"
        }
      : {
          studio: "studio.html",
          clients: "clients.html",
          resources: "resources.html",
          lens: "lens.html",
          strategy: "strategy-builder.html",
          policy: "policy-web.html"
        };

    return [
      { key: "studio", label: "Start Page", shortLabel: "Start", href: hrefs.studio, active: activePage ? activePage === "studio" : mode === "studio" },
      { key: "clients", label: "Client Directory", shortLabel: "Clients", href: hrefs.clients, active: activePage ? activePage === "clients" : mode === "directory" || mode === "client-detail" },
      { key: "resources", label: "Resources", shortLabel: "Resources", href: hrefs.resources, active: activePage ? activePage === "resources" : mode === "resources" },
      { key: "lens", label: "LENS Analysis", shortLabel: "LENS", href: hrefs.lens, active: activePage ? activePage === "lens" : mode === "lens" },
      { key: "strategy", label: "Strategy Builder", shortLabel: "Strategy", href: hrefs.strategy, active: activePage === "strategy" },
      { key: "policy", label: "Policy Web", shortLabel: "Policy", href: hrefs.policy, active: activePage === "policy" }
    ];
  }

  function renderPrimaryRail(pages) {
    return `
      <div class="workspace-side-nav-primary-rail">
        <nav class="workspace-side-nav-primary-items" aria-label="Workspace pages">
          ${pages.map(function (page) {
            return `
              <a
                class="workspace-side-nav-button workspace-side-nav-primary-button${page.active ? " is-active" : ""}"
                href="${escapeHtml(page.href)}"
                ${page.active ? ' aria-current="page"' : ""}
                aria-label="${escapeHtml(page.label)}"
                title="${escapeHtml(page.label)}"
              >
                <span class="workspace-side-nav-icon workspace-side-nav-primary-icon" aria-hidden="true">
                  ${getWorkspacePageIcon(page.key)}
                </span>
                <span class="workspace-side-nav-label workspace-side-nav-primary-label">${escapeHtml(page.shortLabel || page.label)}</span>
              </a>
            `;
          }).join("")}
        </nav>
      </div>
    `;
  }

  function renderWorkspaceShell(config) {
    return `
      <aside class="workspace-side-nav workspace-side-nav-shell" aria-label="${escapeHtml(config.ariaLabel)}">
        ${renderPrimaryRail(config.pages)}
        <div class="workspace-side-nav-context">
          <div class="workspace-side-nav-header workspace-side-nav-context-header">
            <div class="workspace-side-nav-copy">
              <span class="workspace-side-nav-kicker">Current Page</span>
              <strong>${escapeHtml(config.title)}</strong>
            </div>
            ${config.headerActionMarkup ? `<div class="workspace-side-nav-context-header-extra">${config.headerActionMarkup}</div>` : ""}
          </div>
          <div class="workspace-side-nav-section workspace-side-nav-context-section">
            <span class="workspace-side-nav-section-label workspace-side-nav-context-section-label">${escapeHtml(config.sectionLabel)}</span>
            ${config.contextMarkup}
          </div>
        </div>
        <button
          class="${escapeHtml(config.toggleClass)} workspace-side-nav-toggle workspace-side-nav-edge-toggle"
          type="button"
          ${config.toggleDataAttr}
          aria-expanded="true"
          aria-label="${escapeHtml(config.toggleLabel)}"
          title="${escapeHtml(config.toggleLabel)}"
        >
          <span class="${escapeHtml(config.toggleGlyphClass)} workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
        </button>
      </aside>
    `;
  }

  function getLensPageIcon(key) {
    if (key === "overview") {
      return getWorkspacePageIcon("lens");
    }

    if (key === "start") {
      return getClientDetailIcon("planning");
    }

    return getClientDetailIcon("notes");
  }

  function getClientDetailIcon(key) {
    if (key === "overview") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.75" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="2.75" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="2.75" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
          <rect x="12.15" y="12.15" width="5.1" height="5.1" rx="1.1" stroke="currentColor" stroke-width="1.55"/>
        </svg>
      `;
    }

    if (key === "planning") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 15.75h14" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M4.25 13.1 7.45 9.9l2.75 2.75 5.55-6.1" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.95 6.55h2.8v2.8" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    if (key === "household") {
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="7" cy="7.2" r="2.35" stroke="currentColor" stroke-width="1.55"/>
          <circle cx="13.3" cy="8.15" r="2.05" stroke="currentColor" stroke-width="1.55"/>
          <path d="M3.9 15.35c.55-2.15 2.2-3.45 4.15-3.45 1.95 0 3.55 1.3 4.1 3.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M11.2 15.35c.4-1.65 1.7-2.65 3.25-2.65 1.1 0 2.15.5 2.85 1.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5.1 3.15h7.65l2.15 2.2v10.1a1.55 1.55 0 0 1-1.55 1.55H5.1a1.55 1.55 0 0 1-1.55-1.55V4.7A1.55 1.55 0 0 1 5.1 3.15Z" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
        <path d="M12.75 3.3v2.55h2.4" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.4 9.2h6.85M6.4 12.15h6.85" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
      </svg>
    `;
  }

  function renderDirectorySidebar(options) {
    const pages = getWorkspacePages("directory", options);
    const items = [
      { key: "all", label: "View All" },
      { key: "individuals", label: "Individuals" },
      { key: "households", label: "Households" },
      { key: "businesses", label: "Businesses" },
      { key: "add", label: "Add New", extraClass: " workspace-side-nav-context-button-add" }
    ];
    const priorityItems = [
      { key: "all", label: "All Priorities" },
      { key: "high", label: "High Priority" },
      { key: "medium", label: "Medium Priority" },
      { key: "low", label: "Low Priority" }
    ];
    const scopeItems = [
      { key: "flagged", label: "Flagged" },
      { key: "recently-viewed", label: "Recently Viewed" },
      { key: "recently-added", label: "Recently Added" },
      { key: "incomplete", label: "Incomplete Profiles" }
    ];

    return renderWorkspaceShell({
      ariaLabel: "Client directory navigation",
      pages: pages,
      title: "Client Directory",
      sectionLabel: "Views & Actions",
      toggleClass: "client-directory-app-sidebar-toggle",
      toggleGlyphClass: "client-directory-app-sidebar-toggle-glyph",
      toggleDataAttr: "data-directory-sidebar-toggle",
      toggleLabel: "Collapse directory navigation",
      contextMarkup: `
        <nav class="workspace-side-nav-items workspace-side-nav-context-items" aria-label="Client directory actions">
          ${items.map(function (item) {
            const supportsPrioritySubmenu = item.key === "individuals" || item.key === "households" || item.key === "businesses";
            return `
              <div class="workspace-side-nav-context-group${supportsPrioritySubmenu ? " workspace-side-nav-context-group-has-submenu" : ""}" data-directory-context-group${supportsPrioritySubmenu ? ` data-directory-context-group-key="${escapeHtml(item.key)}"` : ""}>
                <button class="workspace-side-nav-button workspace-side-nav-context-button${item.extraClass || ""}" type="button" data-directory-nav-action="${escapeHtml(item.key)}">
                  <span class="workspace-side-nav-icon workspace-side-nav-context-icon" aria-hidden="true">
                    ${getDirectoryIcon(item.key)}
                  </span>
                  <span class="workspace-side-nav-label workspace-side-nav-context-label">${escapeHtml(item.label)}</span>
                </button>
                ${supportsPrioritySubmenu ? `
                  <div class="workspace-side-nav-submenu" aria-label="${escapeHtml(item.label)} filters">
                    ${scopeItems.map(function (scopeItem) {
                      return `
                        <button
                          class="workspace-side-nav-button workspace-side-nav-submenu-button"
                          type="button"
                          data-directory-scope-action="${escapeHtml(`${item.key}:scope:${scopeItem.key}`)}"
                          data-directory-scope-view="${escapeHtml(item.key)}"
                          data-directory-scope="${escapeHtml(scopeItem.key)}"
                        >
                          <span class="workspace-side-nav-submenu-icon" aria-hidden="true">
                            ${getDirectoryScopeIcon(scopeItem.key)}
                          </span>
                          <span class="workspace-side-nav-submenu-label">${escapeHtml(scopeItem.label)}</span>
                        </button>
                      `;
                    }).join("")}
                    <div class="workspace-side-nav-submenu-divider" role="presentation"></div>
                    ${priorityItems.map(function (priorityItem) {
                      return `
                        <button
                          class="workspace-side-nav-button workspace-side-nav-submenu-button"
                          type="button"
                          data-directory-priority-action="${escapeHtml(`${item.key}:${priorityItem.key}`)}"
                          data-directory-priority-view="${escapeHtml(item.key)}"
                          data-directory-priority="${escapeHtml(priorityItem.key)}"
                        >
                          <span class="workspace-side-nav-submenu-label">${escapeHtml(priorityItem.label)}</span>
                        </button>
                      `;
                    }).join("")}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </nav>
      `
    });
  }

  function renderClientDetailSidebar(options) {
    const pages = getWorkspacePages("client-detail", options);
    const sidebarTitle = String(options?.title || "").trim() || "Client Workspace";
    const returnHref = options?.shell ? "studio.html?view=clients.html" : "clients.html";
    const tabs = [
      { key: "overview", label: "Dashboard" },
      { key: "planning", label: "Planning" },
      { key: "household", label: "Household" },
      { key: "notes", label: "Notes" }
    ];

    return renderWorkspaceShell({
      ariaLabel: "Client detail sections",
      pages: pages,
      title: sidebarTitle,
      sectionLabel: "Sections",
      headerActionMarkup: `
        <a
          class="workspace-side-nav-button workspace-side-nav-context-button workspace-side-nav-context-button-return"
          href="${escapeHtml(returnHref)}"
          data-client-directory-return
          data-client-directory-return-href="${escapeHtml(returnHref)}"
          title="Return to Client Directory"
        >
          Return to Client Directory
        </a>
      `,
      toggleClass: "client-profile-side-tabs-toggle",
      toggleGlyphClass: "client-profile-side-tabs-toggle-glyph",
      toggleDataAttr: "data-client-side-tabs-toggle",
      toggleLabel: "Collapse section navigation",
      contextMarkup: `
        <nav class="workspace-side-nav-items workspace-side-nav-context-items" aria-label="Client detail tabs">
          ${tabs.map(function (tab, index) {
            return `
              <button
                class="workspace-side-nav-button workspace-side-nav-context-button${index === 0 ? " is-active" : ""}"
                type="button"
                data-client-tab="${escapeHtml(tab.key)}"
                aria-selected="${index === 0 ? "true" : "false"}"
                aria-label="${escapeHtml(tab.label)}"
                title="${escapeHtml(tab.label)}"
              >
                <span class="workspace-side-nav-icon workspace-side-nav-context-icon" aria-hidden="true">${getClientDetailIcon(tab.key)}</span>
                <span class="workspace-side-nav-label workspace-side-nav-context-label">${escapeHtml(tab.label)}</span>
              </button>
            `;
          }).join("")}
        </nav>
      `
    });
  }

  function renderLensSidebar(options) {
    const pages = getWorkspacePages("lens", options);
    const items = [
      { key: "overview", label: "Overview", href: "#lens-overview", active: true },
      { key: "start", label: "Start Analysis", href: "#lens-start-analysis", active: false },
      { key: "summary", label: "Tool Summary", href: "#lens-tool-summary", active: false }
    ];

    return renderWorkspaceShell({
      ariaLabel: "LENS workspace navigation",
      pages: pages,
      title: "LENS Analysis",
      sectionLabel: "Sections",
      toggleClass: "client-profile-side-tabs-toggle",
      toggleGlyphClass: "client-profile-side-tabs-toggle-glyph",
      toggleDataAttr: "data-lens-side-tabs-toggle",
      toggleLabel: "Collapse section navigation",
      contextMarkup: `
        <nav class="workspace-side-nav-items workspace-side-nav-context-items" aria-label="LENS page navigation">
          ${items.map(function (item) {
            return `
              <a
                class="workspace-side-nav-button workspace-side-nav-context-button${item.active ? " is-active" : ""}"
                href="${escapeHtml(item.href)}"
                data-lens-tab="${escapeHtml(item.key)}"
                ${item.active ? ' aria-current="location"' : ""}
                aria-label="${escapeHtml(item.label)}"
                title="${escapeHtml(item.label)}"
              >
                <span class="workspace-side-nav-icon workspace-side-nav-context-icon" aria-hidden="true">${getLensPageIcon(item.key)}</span>
                <span class="workspace-side-nav-label workspace-side-nav-context-label">${escapeHtml(item.label)}</span>
              </a>
            `;
          }).join("")}
        </nav>
      `
    });
  }

  function renderStudioSidebar(options) {
    const pages = getWorkspacePages("studio", options);
    const items = [
      { key: "overview", label: "Overview", href: "#studio-overview", active: true },
      { key: "planning", label: "Planning Tools", href: "#studio-planning-tools", active: false },
      { key: "workspace", label: "Workspace Links", href: "#studio-workspace-tools", active: false }
    ];

    return renderWorkspaceShell({
      ariaLabel: "Studio navigation",
      pages: pages,
      title: "Studio",
      sectionLabel: "Start Page",
      toggleClass: "client-profile-side-tabs-toggle",
      toggleGlyphClass: "client-profile-side-tabs-toggle-glyph",
      toggleDataAttr: "data-studio-side-tabs-toggle",
      toggleLabel: "Collapse studio navigation",
      contextMarkup: `
        <nav class="workspace-side-nav-items workspace-side-nav-context-items" aria-label="Studio start sections">
          ${items.map(function (item, index) {
            return `
              <a
                class="workspace-side-nav-button workspace-side-nav-context-button${index === 0 ? " is-active" : ""}"
                href="${escapeHtml(item.href)}"
                data-studio-tab="${escapeHtml(item.key)}"
                ${item.active ? ' aria-current="location"' : ""}
                aria-label="${escapeHtml(item.label)}"
                title="${escapeHtml(item.label)}"
              >
                <span class="workspace-side-nav-icon workspace-side-nav-context-icon" aria-hidden="true">${getLensPageIcon(item.key === "overview" ? "overview" : item.key === "planning" ? "start" : "summary")}</span>
                <span class="workspace-side-nav-label workspace-side-nav-context-label">${escapeHtml(item.label)}</span>
              </a>
            `;
          }).join("")}
        </nav>
      `
    });
  }

  function renderResourcesSidebar(options) {
    const pages = getWorkspacePages("resources", options);
    const items = [
      { key: "calendar", label: "Calendar", href: "#resources-calendar-board", active: true },
      { key: "agenda", label: "Agenda", href: "#resources-agenda", active: false },
      { key: "summary", label: "Month Summary", href: "#resources-month-summary", active: false }
    ];

    return renderWorkspaceShell({
      ariaLabel: "Resources navigation",
      pages: pages,
      title: "Resources",
      sectionLabel: "Sections",
      toggleClass: "client-profile-side-tabs-toggle",
      toggleGlyphClass: "client-profile-side-tabs-toggle-glyph",
      toggleDataAttr: "data-resources-side-tabs-toggle",
      toggleLabel: "Collapse resources navigation",
      contextMarkup: `
        <nav class="workspace-side-nav-items workspace-side-nav-context-items" aria-label="Resources sections">
          ${items.map(function (item, index) {
            return `
              <a
                class="workspace-side-nav-button workspace-side-nav-context-button${index === 0 ? " is-active" : ""}"
                href="${escapeHtml(item.href)}"
                data-resources-tab="${escapeHtml(item.key)}"
                ${item.active ? ' aria-current="location"' : ""}
                aria-label="${escapeHtml(item.label)}"
                title="${escapeHtml(item.label)}"
              >
                <span class="workspace-side-nav-icon workspace-side-nav-context-icon" aria-hidden="true">${getLensPageIcon(index === 0 ? "overview" : index === 1 ? "start" : "summary")}</span>
                <span class="workspace-side-nav-label workspace-side-nav-context-label">${escapeHtml(item.label)}</span>
              </a>
            `;
          }).join("")}
        </nav>
      `
    });
  }

  function render(mode, options) {
    if (mode === "studio") {
      return renderStudioSidebar(options);
    }

    if (mode === "directory") {
      return renderDirectorySidebar(options);
    }

    if (mode === "client-detail") {
      return renderClientDetailSidebar(options);
    }

    if (mode === "lens") {
      return renderLensSidebar(options);
    }

    if (mode === "resources") {
      return renderResourcesSidebar(options);
    }

    return "";
  }

  function mountAll(root) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : document;
    scope.querySelectorAll("[data-workspace-side-nav]").forEach(function (node) {
      const mode = String(node.getAttribute("data-workspace-side-nav") || "").trim();
      const renderOptions = {};
      const hostTitle = String(node.getAttribute("data-workspace-side-nav-title") || "").trim();
      if (hostTitle) {
        renderOptions.title = hostTitle;
      }
      const markup = render(mode, renderOptions);
      if (!markup) {
        return;
      }
      node.innerHTML = markup;
    });
  }

  window.WorkspaceSideNav = {
    render: render,
    mountAll: mountAll
  };

  mountAll(document);
})();
