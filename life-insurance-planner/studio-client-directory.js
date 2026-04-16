(function () {
  const nativeClientsView = document.querySelector("[data-studio-native-clients-view]");
  const NATIVE_CLIENTS_FLAG = "__STUDIO_NATIVE_CLIENTS__";
  const NATIVE_CLIENTS_NAVIGATE = "__StudioNativeClientNavigate";
  const PENDING_ADD_CLIENT_MODAL_FLAG = "__STUDIO_PENDING_ADD_CLIENT_MODAL__";

  if (!nativeClientsView) {
    return;
  }

  let isMounted = false;
  let loadingPromise = null;
  let linksBound = false;

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

  function loadClientsDocument() {
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

      loader.className = "studio-native-clients-loader";
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
            throw new Error("Client directory source did not finish loading.");
          }

          const markup = sourceDocument.documentElement.outerHTML;
          const parsedDocument = new DOMParser().parseFromString(markup, "text/html");
          finish(resolve, parsedDocument);
        } catch (error) {
          finish(reject, error);
        }
      });

      loader.addEventListener("error", function () {
        finish(reject, new Error("Unable to load clients.html."));
      });

      loader.src = new URL("clients.html", window.location.href).toString();
      document.body.appendChild(loader);
    });
  }

  function transformClientsScript(sourceText) {
    let scriptText = String(sourceText || "");

    if (scriptText.indexOf('const rowsHost = document.getElementById("client-table-rows");') !== -1) {
      scriptText = scriptText.replace(
        'const rowsHost = document.getElementById("client-table-rows");',
        'const isStudioNativeClients = Boolean(window.__STUDIO_NATIVE_CLIENTS__);\n      const rowsHost = document.getElementById("client-table-rows");'
      );

      scriptText = scriptText
        .replace(
          'const directorySidebarHost = document.querySelector(\'[data-workspace-side-nav="directory"]\');',
          'const directorySidebarHost = isStudioNativeClients ? null : document.querySelector(\'[data-workspace-side-nav="directory"]\');'
        )
        .replace(
          'const directorySidebarToggle = document.querySelector("[data-directory-sidebar-toggle]");',
          'const directorySidebarToggle = isStudioNativeClients ? null : document.querySelector("[data-directory-sidebar-toggle]");'
        )
        .replace(
          'const directorySidebarGroups = Array.from(document.querySelectorAll("[data-directory-context-group-key]"));',
          'const directorySidebarGroups = isStudioNativeClients ? [] : Array.from(document.querySelectorAll("[data-directory-context-group-key]"));'
        )
        .replace(
          'const directorySidebarButtons = Array.from(document.querySelectorAll("[data-directory-nav-action]"));',
          'const directorySidebarButtons = isStudioNativeClients ? [] : Array.from(document.querySelectorAll("[data-directory-nav-action]"));'
        )
        .replace(
          'const directorySidebarScopeButtons = Array.from(document.querySelectorAll("[data-directory-scope-action]"));',
          'const directorySidebarScopeButtons = isStudioNativeClients ? [] : Array.from(document.querySelectorAll("[data-directory-scope-action]"));'
        )
        .replace(
          'const directorySidebarPriorityButtons = Array.from(document.querySelectorAll("[data-directory-priority-action]"));',
          'const directorySidebarPriorityButtons = isStudioNativeClients ? [] : Array.from(document.querySelectorAll("[data-directory-priority-action]"));'
        )
        .replace(
          'window.location.href = "profile-only-form.html";',
          'if (!window.__StudioNativeClientNavigate || !window.__StudioNativeClientNavigate("profile-only-form.html")) {\n          window.location.href = "profile-only-form.html";\n          }'
        )
        .replaceAll(
          'window.location.href = `client-detail.html?id=${encodeURIComponent(row.dataset.clientOpen)}`;',
          'if (!window.__StudioNativeClientNavigate || !window.__StudioNativeClientNavigate(`client-detail.html?id=${encodeURIComponent(row.dataset.clientOpen)}`)) {\n            window.location.href = `client-detail.html?id=${encodeURIComponent(row.dataset.clientOpen)}`;\n            }'
        );
    }

    return scriptText;
  }

  function bindNativeLinks() {
    if (linksBound) {
      return;
    }

    nativeClientsView.addEventListener("click", function (event) {
      const link = event.target.closest("a[data-loading-link]");
      if (!(link instanceof HTMLAnchorElement)) {
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

  function openPendingAddClientModalIfNeeded() {
    if (!window[PENDING_ADD_CLIENT_MODAL_FLAG]) {
      return;
    }

    const openAddClientModal = window.ClientDirectoryShellApi?.openAddClientModal;
    if (typeof openAddClientModal !== "function") {
      return;
    }

    window[PENDING_ADD_CLIENT_MODAL_FLAG] = false;
    window.requestAnimationFrame(function () {
      openAddClientModal();
    });
  }

  function mountClientsContent(sourceDocument) {
    const directoryLayout = sourceDocument.querySelector(".client-directory-shell-layout");
    const addModal = sourceDocument.querySelector("[data-add-client-modal]");
    const inlineScripts = Array.from(sourceDocument.querySelectorAll("script:not([src])"));

    if (!(directoryLayout instanceof HTMLElement)) {
      throw new Error("Client directory layout was not found.");
    }

    nativeClientsView.innerHTML = "";

    const directoryLayoutClone = directoryLayout.cloneNode(true);
    const nativeWorkspace = directoryLayoutClone.querySelector(".client-directory-workspace");
    const nativeMain = directoryLayoutClone.querySelector(".client-directory-main");
    const nativeHeader = directoryLayoutClone.querySelector(".client-directory-header");
    const nativeRail = directoryLayoutClone.querySelector(".client-directory-rail");

    if (
      nativeWorkspace instanceof HTMLElement &&
      nativeMain instanceof HTMLElement &&
      nativeHeader instanceof HTMLElement
    ) {
      nativeWorkspace.insertBefore(nativeHeader, nativeRail || nativeMain);
    }

    const shell = document.createElement("section");
    shell.className = "client-directory-shell studio-native-client-directory";
    shell.setAttribute("data-workspace-current-title", "Client Directory");
    shell.appendChild(directoryLayoutClone);
    nativeClientsView.appendChild(shell);

    if (addModal instanceof HTMLElement) {
      nativeClientsView.appendChild(addModal.cloneNode(true));
    }

    window[NATIVE_CLIENTS_FLAG] = true;
    window[NATIVE_CLIENTS_NAVIGATE] = navigateThroughStudio;

    inlineScripts.forEach(function (sourceScript, index) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.dataset.studioNativeClientsScript = String(index + 1);
      script.textContent = transformClientsScript(sourceScript.textContent || "");
      nativeClientsView.appendChild(script);
    });

    bindNativeLinks();
  }

  function showLoadError(error) {
    nativeClientsView.innerHTML = "";

    const message = document.createElement("div");
    message.className = "studio-native-clients-placeholder studio-native-clients-placeholder-error";
    message.textContent = error instanceof Error ? error.message : "Client directory could not be loaded.";
    nativeClientsView.appendChild(message);
  }

  function ensureMounted() {
    if (isMounted) {
      openPendingAddClientModalIfNeeded();
      return Promise.resolve(nativeClientsView);
    }

    if (loadingPromise) {
      return loadingPromise;
    }

    loadingPromise = loadClientsDocument()
      .then(function (sourceDocument) {
        mountClientsContent(sourceDocument);
        isMounted = true;
        openPendingAddClientModalIfNeeded();
        return nativeClientsView;
      })
      .catch(function (error) {
        showLoadError(error);
        throw error;
      })
      .finally(function () {
        loadingPromise = null;
      });

    return loadingPromise;
  }

  window.StudioClientDirectory = {
    ensureMounted: ensureMounted,
    isMounted: function () {
      return isMounted;
    },
    navigate: navigateThroughStudio
  };
})();
