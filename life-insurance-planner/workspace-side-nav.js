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

    return `
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 4.1v11.8M4.1 10h11.8" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>
      </svg>
    `;
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
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="7" cy="7.2" r="2.35" stroke="currentColor" stroke-width="1.55"/>
          <circle cx="13.3" cy="8.15" r="2.05" stroke="currentColor" stroke-width="1.55"/>
          <path d="M3.9 15.35c.55-2.15 2.2-3.45 4.15-3.45 1.95 0 3.55 1.3 4.1 3.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
          <path d="M11.2 15.35c.4-1.65 1.7-2.65 3.25-2.65 1.1 0 2.15.5 2.85 1.45" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
        </svg>
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

  function getWorkspacePages(mode) {
    return [
      { key: "studio", label: "Start Page", href: "studio.html", active: mode === "studio" },
      { key: "clients", label: "Client Directory", href: "clients.html", active: mode === "directory" || mode === "client-detail" },
      { key: "resources", label: "Resources", href: "resources.html", active: mode === "resources" },
      { key: "lens", label: "LENS Analysis", href: "lens.html", active: mode === "lens" },
      { key: "strategy", label: "Strategy Builder", href: "strategy-builder.html", active: false },
      { key: "policy", label: "Policy Web", href: "policy-web.html", active: false }
    ];
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

  function renderDirectorySidebar() {
    const pages = getWorkspacePages("directory");
    const items = [
      { key: "all", label: "View All" },
      { key: "households", label: "Households" },
      { key: "individuals", label: "Individuals" },
      { key: "add", label: "Add New", extraClass: " client-directory-app-nav-button-add" }
    ];

    return `
      <aside class="client-directory-app-sidebar workspace-side-nav" aria-label="Client directory navigation">
        <div class="client-directory-app-sidebar-header workspace-side-nav-header">
          <div class="client-directory-app-sidebar-copy workspace-side-nav-copy">
            <span class="client-directory-app-sidebar-kicker workspace-side-nav-kicker">Navigate</span>
            <strong>Client Directory</strong>
          </div>
          <button
            class="client-directory-app-sidebar-toggle workspace-side-nav-toggle"
            type="button"
            data-directory-sidebar-toggle
            aria-expanded="true"
            aria-label="Collapse directory navigation"
            title="Collapse directory navigation"
          >
            <span class="client-directory-app-sidebar-toggle-glyph workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
          </button>
        </div>

        <div class="client-directory-app-sidebar-section workspace-side-nav-section">
          <span class="client-directory-app-sidebar-section-label workspace-side-nav-section-label">All Pages</span>
          <nav class="client-directory-app-nav workspace-side-nav-items" aria-label="Workspace pages">
            ${pages.map(function (page) {
              return `
                <a class="client-directory-app-nav-button workspace-side-nav-button${page.active ? " is-active" : ""}" href="${escapeHtml(page.href)}"${page.active ? ' aria-current="page"' : ""}>
                  <span class="client-directory-app-nav-icon workspace-side-nav-icon" aria-hidden="true">
                    ${getWorkspacePageIcon(page.key)}
                  </span>
                  <span class="client-directory-app-nav-label workspace-side-nav-label">${escapeHtml(page.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="client-directory-app-sidebar-section workspace-side-nav-section">
          <span class="client-directory-app-sidebar-section-label workspace-side-nav-section-label">Current Page</span>
          <nav class="client-directory-app-nav workspace-side-nav-items" aria-label="Client directory actions">
            ${items.map(function (item) {
              return `
                <button class="client-directory-app-nav-button workspace-side-nav-button${item.extraClass || ""}" type="button" data-directory-nav-action="${escapeHtml(item.key)}">
                  <span class="client-directory-app-nav-icon workspace-side-nav-icon" aria-hidden="true">
                    ${getDirectoryIcon(item.key)}
                  </span>
                  <span class="client-directory-app-nav-label workspace-side-nav-label">${escapeHtml(item.label)}</span>
                </button>
              `;
            }).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  function renderClientDetailSidebar() {
    const pages = getWorkspacePages("client-detail");
    const tabs = [
      { key: "overview", label: "Dashboard" },
      { key: "planning", label: "Planning" },
      { key: "household", label: "Household" },
      { key: "notes", label: "Notes" }
    ];

    return `
      <aside class="client-profile-side-tabs workspace-side-nav" aria-label="Client detail sections">
        <div class="client-profile-side-tabs-header workspace-side-nav-header">
          <div class="client-profile-side-tabs-copy workspace-side-nav-copy">
            <span class="client-profile-side-tabs-kicker workspace-side-nav-kicker">Navigate</span>
            <strong>Client Workspace</strong>
          </div>
          <button
            class="client-profile-side-tabs-toggle workspace-side-nav-toggle"
            type="button"
            data-client-side-tabs-toggle
            aria-expanded="true"
            aria-label="Collapse section navigation"
            title="Collapse section navigation"
          >
            <span class="client-profile-side-tabs-toggle-glyph workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
          </button>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">All Pages</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Workspace pages">
            ${pages.map(function (page) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${page.active ? " is-active" : ""}"
                  href="${escapeHtml(page.href)}"
                  ${page.active ? ' aria-current="page"' : ""}
                  aria-label="${escapeHtml(page.label)}"
                  title="${escapeHtml(page.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getWorkspacePageIcon(page.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(page.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">Current Page</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Client detail tabs">
            ${tabs.map(function (tab, index) {
              return `
                <button
                  class="client-profile-tab workspace-side-nav-button${index === 0 ? " is-active" : ""}"
                  type="button"
                  data-client-tab="${escapeHtml(tab.key)}"
                  aria-selected="${index === 0 ? "true" : "false"}"
                  aria-label="${escapeHtml(tab.label)}"
                  title="${escapeHtml(tab.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getClientDetailIcon(tab.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(tab.label)}</span>
                </button>
              `;
            }).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  function renderLensSidebar() {
    const pages = getWorkspacePages("lens");
    const items = [
      { key: "overview", label: "Overview", href: "#lens-overview", active: true },
      { key: "start", label: "Start Analysis", href: "#lens-start-analysis", active: false },
      { key: "summary", label: "Tool Summary", href: "#lens-tool-summary", active: false }
    ];

    return `
      <aside class="client-profile-side-tabs workspace-side-nav" aria-label="LENS workspace navigation">
        <div class="client-profile-side-tabs-header workspace-side-nav-header">
          <div class="client-profile-side-tabs-copy workspace-side-nav-copy">
            <span class="client-profile-side-tabs-kicker workspace-side-nav-kicker">Navigate</span>
            <strong>LENS Workspace</strong>
          </div>
          <button
            class="client-profile-side-tabs-toggle workspace-side-nav-toggle"
            type="button"
            data-lens-side-tabs-toggle
            aria-expanded="true"
            aria-label="Collapse section navigation"
            title="Collapse section navigation"
          >
            <span class="client-profile-side-tabs-toggle-glyph workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
          </button>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">All Pages</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Workspace pages">
            ${pages.map(function (page) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${page.active ? " is-active" : ""}"
                  href="${escapeHtml(page.href)}"
                  ${page.active ? ' aria-current="page"' : ""}
                  aria-label="${escapeHtml(page.label)}"
                  title="${escapeHtml(page.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getWorkspacePageIcon(page.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(page.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">Current Page</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="LENS page navigation">
            ${items.map(function (item) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${item.active ? " is-active" : ""}"
                  href="${escapeHtml(item.href)}"
                  data-lens-tab="${escapeHtml(item.key)}"
                  ${item.active ? ' aria-current="location"' : ""}
                  aria-label="${escapeHtml(item.label)}"
                  title="${escapeHtml(item.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getLensPageIcon(item.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(item.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  function renderStudioSidebar() {
    const pages = getWorkspacePages("studio");
    const items = [
      { key: "overview", label: "Overview", href: "#studio-overview", active: true },
      { key: "planning", label: "Planning Tools", href: "#studio-planning-tools", active: false },
      { key: "workspace", label: "Workspace Links", href: "#studio-workspace-tools", active: false }
    ];

    return `
      <aside class="client-profile-side-tabs workspace-side-nav" aria-label="Studio navigation">
        <div class="client-profile-side-tabs-header workspace-side-nav-header">
          <div class="client-profile-side-tabs-copy workspace-side-nav-copy">
            <span class="client-profile-side-tabs-kicker workspace-side-nav-kicker">Navigate</span>
            <strong>Studio</strong>
          </div>
          <button
            class="client-profile-side-tabs-toggle workspace-side-nav-toggle"
            type="button"
            data-studio-side-tabs-toggle
            aria-expanded="true"
            aria-label="Collapse studio navigation"
            title="Collapse studio navigation"
          >
            <span class="client-profile-side-tabs-toggle-glyph workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
          </button>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">All Pages</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Studio pages">
            ${pages.map(function (page) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${page.active ? " is-active" : ""}"
                  href="${escapeHtml(page.href)}"
                  ${page.active ? ' aria-current="page"' : ""}
                  aria-label="${escapeHtml(page.label)}"
                  title="${escapeHtml(page.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getWorkspacePageIcon(page.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(page.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">Current Page</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Studio start sections">
            ${items.map(function (item, index) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${index === 0 ? " is-active" : ""}"
                  href="${escapeHtml(item.href)}"
                  data-studio-tab="${escapeHtml(item.key)}"
                  ${item.active ? ' aria-current="location"' : ""}
                  aria-label="${escapeHtml(item.label)}"
                  title="${escapeHtml(item.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getLensPageIcon(item.key === "overview" ? "overview" : item.key === "planning" ? "start" : "summary")}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(item.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  function renderResourcesSidebar() {
    const pages = getWorkspacePages("resources");
    const items = [
      { key: "calendar", label: "Calendar", href: "#resources-calendar-board", active: true },
      { key: "agenda", label: "Agenda", href: "#resources-agenda", active: false },
      { key: "summary", label: "Month Summary", href: "#resources-month-summary", active: false }
    ];

    return `
      <aside class="client-profile-side-tabs workspace-side-nav" aria-label="Resources navigation">
        <div class="client-profile-side-tabs-header workspace-side-nav-header">
          <div class="client-profile-side-tabs-copy workspace-side-nav-copy">
            <span class="client-profile-side-tabs-kicker workspace-side-nav-kicker">Navigate</span>
            <strong>Resources</strong>
          </div>
          <button
            class="client-profile-side-tabs-toggle workspace-side-nav-toggle"
            type="button"
            data-resources-side-tabs-toggle
            aria-expanded="true"
            aria-label="Collapse resources navigation"
            title="Collapse resources navigation"
          >
            <span class="client-profile-side-tabs-toggle-glyph workspace-side-nav-toggle-glyph" aria-hidden="true">&#8249;</span>
          </button>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">All Pages</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Workspace pages">
            ${pages.map(function (page) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${page.active ? " is-active" : ""}"
                  href="${escapeHtml(page.href)}"
                  ${page.active ? ' aria-current="page"' : ""}
                  aria-label="${escapeHtml(page.label)}"
                  title="${escapeHtml(page.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getWorkspacePageIcon(page.key)}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(page.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>

        <div class="client-profile-side-tabs-section workspace-side-nav-section">
          <span class="client-profile-side-tabs-section-label workspace-side-nav-section-label">Current Page</span>
          <nav class="client-profile-tabs workspace-side-nav-items" aria-label="Resources sections">
            ${items.map(function (item, index) {
              return `
                <a
                  class="client-profile-tab workspace-side-nav-button${index === 0 ? " is-active" : ""}"
                  href="${escapeHtml(item.href)}"
                  data-resources-tab="${escapeHtml(item.key)}"
                  ${item.active ? ' aria-current="location"' : ""}
                  aria-label="${escapeHtml(item.label)}"
                  title="${escapeHtml(item.label)}"
                >
                  <span class="client-profile-side-tab-icon workspace-side-nav-icon" aria-hidden="true">${getLensPageIcon(index === 0 ? "overview" : index === 1 ? "start" : "summary")}</span>
                  <span class="client-profile-side-tab-label workspace-side-nav-label">${escapeHtml(item.label)}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  function render(mode) {
    if (mode === "studio") {
      return renderStudioSidebar();
    }

    if (mode === "directory") {
      return renderDirectorySidebar();
    }

    if (mode === "client-detail") {
      return renderClientDetailSidebar();
    }

    if (mode === "lens") {
      return renderLensSidebar();
    }

    if (mode === "resources") {
      return renderResourcesSidebar();
    }

    return "";
  }

  function mountAll(root) {
    const scope = root && typeof root.querySelectorAll === "function" ? root : document;
    scope.querySelectorAll("[data-workspace-side-nav]").forEach(function (node) {
      const mode = String(node.getAttribute("data-workspace-side-nav") || "").trim();
      const markup = render(mode);
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
