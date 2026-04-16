(function () {
  const nativeDetailView = document.querySelector("[data-studio-native-client-detail-view]");

  if (!nativeDetailView) {
    return;
  }

  let currentMountedView = "";
  let mountPromise = null;
  let mountSequence = 0;
  let sourceDocumentPromise = null;
  let linksBound = false;
  const DETAIL_NAV_TABS = [
    { key: "overview", label: "Dashboard" },
    { key: "planning", label: "Planning" },
    { key: "household", label: "Household" },
    { key: "notes", label: "Notes" }
  ];

  function getBaseName(pathname) {
    return String(pathname || "").split("/").pop() || "";
  }

  function normalizeStudioViewFromHref(rawHref) {
    const href = String(rawHref || "").trim();
    if (!href) {
      return "";
    }

    try {
      const resolved = new URL(href, window.location.href);
      const fileName = getBaseName(resolved.pathname).trim().toLowerCase();
      if (!fileName) {
        return "";
      }

      if (fileName === "studio.html") {
        return String(resolved.searchParams.get("view") || "").trim();
      }

      resolved.searchParams.delete("studioEmbed");
      return `${fileName}${resolved.search}${resolved.hash}`;
    } catch (_error) {
      return "";
    }
  }

  function navigateThroughStudio(rawHref) {
    const nextView = normalizeStudioViewFromHref(rawHref);
    if (!nextView) {
      return false;
    }

    if (window.StudioShellApi && typeof window.StudioShellApi.navigateToView === "function") {
      window.StudioShellApi.navigateToView(nextView, "push");
      return true;
    }

    return false;
  }

  function normalizeClientDetailView(rawView) {
    const href = String(rawView || "").trim();
    if (!href) {
      return "";
    }

    try {
      const resolved = new URL(href, window.location.href);
      const fileName = getBaseName(resolved.pathname).trim().toLowerCase();
      if (!["client-detail.html", "individual-profile.html", "household-profile.html"].includes(fileName)) {
        return "";
      }

      return `client-detail.html${resolved.search}${resolved.hash}`;
    } catch (_error) {
      return "";
    }
  }

  function loadClientDetailDocument() {
    return new Promise(function (resolve, reject) {
      const loader = document.createElement("iframe");
      let isSettled = false;

      function finish(callback, value) {
        if (isSettled) {
          return;
        }

        isSettled = true;
        loader.remove();
        callback(value);
      }

      loader.className = "studio-native-client-detail-loader";
      loader.tabIndex = -1;
      loader.setAttribute("aria-hidden", "true");
      loader.setAttribute("sandbox", "allow-same-origin");
      loader.style.position = "fixed";
      loader.style.width = "0";
      loader.style.height = "0";
      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";
      loader.style.border = "0";

      loader.addEventListener("load", function () {
        try {
          const sourceDocument = loader.contentDocument;
          if (!sourceDocument || !sourceDocument.documentElement) {
            throw new Error("Client detail source did not finish loading.");
          }

          const markup = sourceDocument.documentElement.outerHTML;
          const parsedDocument = new DOMParser().parseFromString(markup, "text/html");
          finish(resolve, parsedDocument);
        } catch (error) {
          finish(reject, error);
        }
      });

      loader.addEventListener("error", function () {
        finish(reject, new Error("Unable to load client-detail.html."));
      });

      loader.src = new URL("client-detail.html", window.location.href).toString();
      document.body.appendChild(loader);
    });
  }

  function getClientDetailSourceDocument() {
    if (!sourceDocumentPromise) {
      sourceDocumentPromise = loadClientDetailDocument().catch(function (error) {
        sourceDocumentPromise = null;
        throw error;
      });
    }

    return sourceDocumentPromise;
  }

  function renderNativeDetailBanner() {
    const banner = document.createElement("header");
    banner.className = "studio-native-client-detail-banner";
    banner.setAttribute("data-studio-native-client-detail-banner", "");
    banner.innerHTML = `
      <div class="studio-native-client-detail-banner-copy">
        <span class="studio-native-client-detail-banner-kicker">Client Profile</span>
        <div class="studio-native-client-detail-banner-title-row">
          <strong data-studio-native-client-detail-title>Client Profile</strong>
          <span data-studio-native-client-detail-case-ref hidden></span>
        </div>
      </div>
      <nav class="studio-native-client-detail-banner-tabs" aria-label="Profile sections">
        ${DETAIL_NAV_TABS.map(function (tab) {
          return `
            <button
              class="studio-native-client-detail-banner-tab"
              type="button"
              data-studio-native-client-detail-tab="${tab.key}"
            >
              ${tab.label}
            </button>
          `;
        }).join("")}
      </nav>
    `;

    return banner;
  }

  function renderNativeDetailShell(sourceDocument) {
    const stage = sourceDocument.querySelector(".prospect-stage");

    if (!(stage instanceof HTMLElement)) {
      throw new Error("Client detail layout was not found.");
    }

    nativeDetailView.innerHTML = "";

    const shell = document.createElement("section");
    shell.className = "studio-native-client-detail-shell";
    shell.setAttribute("data-workspace-current-title", "Client Profile");

    const banner = renderNativeDetailBanner();

    const stageClone = stage.cloneNode(true);
    stageClone.classList.add("studio-native-client-detail-stage");

    const detailPanel = stageClone.querySelector(".client-detail-panel");
    if (detailPanel instanceof HTMLElement) {
      detailPanel.classList.add("studio-native-client-detail-panel");
    }

    const host = stageClone.querySelector("[data-client-detail-host]");
    if (host instanceof HTMLElement) {
      host.classList.add("studio-native-client-detail-host");
    }

    shell.appendChild(banner);
    shell.appendChild(stageClone);
    nativeDetailView.appendChild(shell);
  }

  function syncNativeDetailBanner() {
    const banner = nativeDetailView.querySelector("[data-studio-native-client-detail-banner]");
    if (!(banner instanceof HTMLElement)) {
      return;
    }

    const state = typeof window.ClientDetailShellApi?.getState === "function"
      ? window.ClientDetailShellApi.getState()
      : null;

    const titleNode = banner.querySelector("[data-studio-native-client-detail-title]");
    const caseRefNode = banner.querySelector("[data-studio-native-client-detail-case-ref]");

    if (titleNode instanceof HTMLElement) {
      titleNode.textContent = String(state?.title || "Client Profile").trim() || "Client Profile";
    }

    if (caseRefNode instanceof HTMLElement) {
      const caseRef = String(state?.caseRef || "").trim();
      caseRefNode.textContent = caseRef ? `Case ${caseRef}` : "";
      caseRefNode.hidden = !caseRef;
    }

    const activeTab = String(state?.activeTab || "overview").trim() || "overview";
    banner.querySelectorAll("[data-studio-native-client-detail-tab]").forEach(function (button) {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const isActive = button.dataset.studioNativeClientDetailTab === activeTab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function loadClientDetailScript(mountId) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      const scriptUrl = new URL("client-detail.js", new URL("../", window.location.href));
      scriptUrl.searchParams.set("studioNativeMount", String(mountId));

      script.src = scriptUrl.toString();
      script.async = false;

      script.addEventListener("load", function () {
        script.remove();
        resolve(nativeDetailView);
      });

      script.addEventListener("error", function () {
        script.remove();
        reject(new Error("Client detail could not be loaded in Studio."));
      });

      document.body.appendChild(script);
    });
  }

  function bindNativeLinks() {
    if (linksBound) {
      return;
    }

    nativeDetailView.addEventListener("click", function (event) {
      const bannerTab = event.target.closest("[data-studio-native-client-detail-tab]");
      if (bannerTab instanceof HTMLButtonElement) {
        const tabKey = String(bannerTab.dataset.studioNativeClientDetailTab || "").trim();
        if (tabKey && window.ClientDetailShellApi?.setTab?.(tabKey)) {
          window.requestAnimationFrame(syncNativeDetailBanner);
        }
        return;
      }

      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) {
        if (event.target.closest("[data-client-nav-tab]")) {
          window.requestAnimationFrame(syncNativeDetailBanner);
        }
        return;
      }

      const href = String(link.getAttribute("href") || "").trim();
      if (!href) {
        return;
      }

      if (navigateThroughStudio(href)) {
        event.preventDefault();
      }
    });

    linksBound = true;
  }

  function ensureMounted(viewValue) {
    const normalizedView = normalizeClientDetailView(viewValue);
    if (!normalizedView) {
      return Promise.reject(new Error("Client detail view was not supplied."));
    }

    const previousMountedView = currentMountedView;
    currentMountedView = normalizedView;

    // CODE NOTE: Studio passes the active client-detail route through this
    // global so client-detail.js can resolve the requested record without
    // depending on window.location.search from studio.html.
    window.__STUDIO_NATIVE_CLIENT_DETAIL_VIEW__ = normalizedView;

    if (
      previousMountedView === normalizedView
      && nativeDetailView.querySelector("[data-client-detail-host]")
      && window.ClientDetailShellApi
    ) {
      syncNativeDetailBanner();
      return Promise.resolve(nativeDetailView);
    }

    if (mountPromise) {
      return mountPromise;
    }

    mountSequence += 1;
    const mountId = mountSequence;

    if (typeof window.__StudioNativeClientDetailCleanup === "function") {
      try {
        window.__StudioNativeClientDetailCleanup();
      } catch (_error) {
        // Ignore cleanup issues and continue with a fresh mount.
      }
      window.__StudioNativeClientDetailCleanup = null;
    }

    mountPromise = getClientDetailSourceDocument()
      .then(function (sourceDocument) {
        renderNativeDetailShell(sourceDocument);
        bindNativeLinks();
        return loadClientDetailScript(mountId);
      })
      .then(function (mountedView) {
        // CODE NOTE: Keep the native Studio profile banner synced from the
        // mounted client-detail state instead of duplicating title/tab logic.
        syncNativeDetailBanner();
        return mountedView;
      })
      .finally(function () {
        mountPromise = null;
      });

    return mountPromise;
  }

  window.StudioClientDetail = {
    ensureMounted: ensureMounted,
    isMounted: function () {
      return Boolean(window.ClientDetailShellApi);
    },
    getState: function () {
      return typeof window.ClientDetailShellApi?.getState === "function"
        ? window.ClientDetailShellApi.getState()
        : null;
    },
    setTab: function (tabKey) {
      return Boolean(window.ClientDetailShellApi?.setTab?.(tabKey));
    },
    setNav: function (navKey) {
      return Boolean(window.ClientDetailShellApi?.setNav?.(navKey));
    },
    navigate: navigateThroughStudio
  };
})();
