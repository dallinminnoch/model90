(function () {
  const STORAGE_KEYS = Object.freeze({
    authSession: "lipPlannerAuthSession",
    clientRecords: "lensClientRecords",
    pendingClientRecords: "lensPendingClientRecords"
  });

  const DEFAULT_TOOL_ITEMS = Object.freeze([
    {
      key: "tool:studio",
      kind: "tool",
      title: "Start Page",
      subtitle: "Studio overview and workspace shortcuts",
      keywords: "studio home start page overview workspace shortcuts dashboard",
      glyph: "SP",
      view: ""
    },
    {
      key: "tool:clients",
      kind: "tool",
      title: "Client Directory",
      subtitle: "Browse households, individuals, and businesses",
      keywords: "client directory households individuals businesses records list clients",
      glyph: "CD",
      view: "clients.html"
    },
    {
      key: "tool:resources",
      kind: "tool",
      title: "Resources",
      subtitle: "Calendar, trainings, and review schedule",
      keywords: "resources calendar agenda schedule trainings deadlines review",
      glyph: "RS",
      view: "resources.html"
    },
    {
      key: "tool:lens",
      kind: "tool",
      title: "LENS Analysis",
      subtitle: "Guided need analysis and modeling workflow",
      keywords: "lens analysis modeling protection analysis guided intake dime hlv needs",
      glyph: "LN",
      view: "lens.html"
    },
    {
      key: "tool:strategy",
      kind: "tool",
      title: "Strategy Builder",
      subtitle: "Shape recommendation structure and positioning",
      keywords: "strategy builder recommendation structure positioning advisor planning",
      glyph: "SB",
      view: "strategy-builder.html"
    },
    {
      key: "tool:policy",
      kind: "tool",
      title: "Policy Web",
      subtitle: "Policy workflow and placed coverage tools",
      keywords: "policy web placed coverage workflow policies delivery review",
      glyph: "PW",
      view: "policy-web.html"
    }
  ]);

  function loadJson(source, key) {
    try {
      return JSON.parse(source.getItem(key) || "null");
    } catch (_error) {
      return null;
    }
  }

  function normalizeViewType(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "companies") {
      return "businesses";
    }

    return ["individuals", "households", "businesses"].includes(normalized)
      ? normalized
      : "individuals";
  }

  function getViewLabel(viewType) {
    if (viewType === "households") {
      return "Household";
    }
    if (viewType === "businesses") {
      return "Business";
    }
    return "Individual";
  }

  function getStatusLabel(statusGroup) {
    if (statusGroup === "in-review") {
      return "In Review";
    }
    if (statusGroup === "coverage-placed") {
      return "Coverage Placed";
    }
    if (statusGroup === "closed") {
      return "Closed";
    }
    return "Prospects";
  }

  function getInitials(value) {
    const parts = String(value || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) {
      return "CL";
    }

    return parts.map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("");
  }

  function getDateValue(value) {
    const rawValue = String(value || "").trim();
    if (!rawValue) {
      return 0;
    }

    const parsed = new Date(rawValue.includes("T") ? rawValue : `${rawValue}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function getClientDisplayName(record, index) {
    const explicitDisplayName = String(record?.displayName || "").trim();
    if (explicitDisplayName) {
      return explicitDisplayName;
    }

    const preferredName = String(record?.preferredName || "").trim();
    const firstName = String(record?.firstName || "").trim();
    const lastName = String(record?.lastName || "").trim();
    const combinedName = `${preferredName || firstName} ${lastName}`.trim();
    if (combinedName) {
      return combinedName;
    }

    const householdName = String(record?.householdName || "").trim();
    if (householdName) {
      return householdName;
    }

    const firmName = String(record?.firmName || "").trim();
    if (firmName) {
      return firmName;
    }

    return `Client ${index + 1}`;
  }

  function getMatchScore(entry, query) {
    if (!entry || !query) {
      return 0;
    }

    const title = String(entry.title || "").toLowerCase();
    const subtitle = String(entry.subtitle || "").toLowerCase();
    const searchText = String(entry.searchText || "").toLowerCase();
    const caseRef = String(entry.caseRef || "").toLowerCase();
    let score = 0;

    if (title === query || caseRef === query) {
      score += 300;
    }
    if (title.startsWith(query) || caseRef.startsWith(query)) {
      score += 180;
    }
    if (title.includes(query)) {
      score += 120;
    }
    if (caseRef.includes(query)) {
      score += 105;
    }
    if (subtitle.includes(query)) {
      score += 70;
    }
    if (searchText.includes(query)) {
      score += 50;
    }

    return score;
  }

  function create(options) {
    const config = options && typeof options === "object" ? options : {};
    const host = config.host;
    const shell = config.shell;
    const field = config.field;
    const input = config.input;
    const results = config.results;
    const navigateToView = typeof config.navigateToView === "function" ? config.navigateToView : null;
    const getStorageIdentity = typeof config.getStorageIdentity === "function"
      ? config.getStorageIdentity
      : function () { return "guest"; };

    if (!(host instanceof HTMLElement) || !(shell instanceof HTMLElement) || !(field instanceof HTMLElement) || !(input instanceof HTMLInputElement) || !(results instanceof HTMLElement) || !navigateToView) {
      return {
        hide: function () {}
      };
    }

    let isVisible = false;
    let activeIndex = -1;
    let renderedItems = [];

    // CODE NOTE: Studio search ranking + rendering lives in this module, not studio-shell.js.

    function getRecordsStorageKey() {
      return `${STORAGE_KEYS.clientRecords}:${getStorageIdentity()}`;
    }

    function loadClientResults() {
      const persisted = loadJson(localStorage, getRecordsStorageKey());
      const pending = loadJson(sessionStorage, STORAGE_KEYS.pendingClientRecords);
      const mergedRecords = [];
      const seenRecordKeys = new Set();

      [pending, persisted].forEach(function (sourceRecords) {
        if (!Array.isArray(sourceRecords)) {
          return;
        }

        sourceRecords.forEach(function (record) {
          const dedupeKey = String(record?.id || record?.caseRef || "").trim().toLowerCase();
          if (!dedupeKey || seenRecordKeys.has(dedupeKey)) {
            return;
          }

          seenRecordKeys.add(dedupeKey);
          mergedRecords.push(record);
        });
      });

      return mergedRecords.map(function (record, index) {
        if (!record || typeof record !== "object") {
          return null;
        }

        const viewType = normalizeViewType(record.viewType);
        const title = getClientDisplayName(record, index);
        const caseRef = String(record.caseRef || "").trim().toUpperCase();
        const recordId = String(record.id || "").trim();
        const householdName = String(record.householdName || "").trim();
        const summary = String(record.summary || record.clientNotes || "").trim();
        const subtitleParts = [];

        if (caseRef) {
          subtitleParts.push(caseRef);
        }

        subtitleParts.push(getViewLabel(viewType));
        subtitleParts.push(getStatusLabel(String(record.statusGroup || "").trim()));

        if (viewType === "individuals" && householdName) {
          subtitleParts.push(householdName);
        }

        const detailView = recordId
          ? `client-detail.html?id=${encodeURIComponent(recordId)}`
          : caseRef
            ? `client-detail.html?caseRef=${encodeURIComponent(caseRef)}`
            : "";

        if (!detailView) {
          return null;
        }

        return {
          key: `client:${recordId || caseRef || index}`,
          kind: "client",
          title: title,
          subtitle: subtitleParts.join(" | "),
          glyph: getInitials(title),
          detailView: detailView,
          searchText: [
            title,
            caseRef,
            householdName,
            summary,
            getViewLabel(viewType),
            getStatusLabel(String(record.statusGroup || "").trim())
          ].join(" ").toLowerCase(),
          caseRef: caseRef,
          recency: Math.max(
            getDateValue(record.lastViewedAt),
            getDateValue(record.lastUpdatedDate),
            getDateValue(record.lastReview),
            getDateValue(record.dateProfileCreated)
          )
        };
      }).filter(Boolean);
    }

    function buildSections(query) {
      const normalizedQuery = String(query || "").trim().toLowerCase();
      const clientResults = loadClientResults();
      const toolResults = DEFAULT_TOOL_ITEMS.map(function (item) {
        return {
          ...item,
          searchText: `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase()
        };
      });

      const sortedClients = (normalizedQuery
        ? clientResults
          .map(function (item) {
            return {
              ...item,
              matchScore: getMatchScore(item, normalizedQuery)
            };
          })
          .filter(function (item) { return item.matchScore > 0; })
          .sort(function (first, second) {
            if (second.matchScore !== first.matchScore) {
              return second.matchScore - first.matchScore;
            }
            if (second.recency !== first.recency) {
              return second.recency - first.recency;
            }
            return first.title.localeCompare(second.title);
          })
        : clientResults
          .slice()
          .sort(function (first, second) {
            if (second.recency !== first.recency) {
              return second.recency - first.recency;
            }
            return first.title.localeCompare(second.title);
          }))
        .slice(0, normalizedQuery ? 6 : 4);

      const sortedTools = (normalizedQuery
        ? toolResults
          .map(function (item) {
            return {
              ...item,
              matchScore: getMatchScore(item, normalizedQuery)
            };
          })
          .filter(function (item) { return item.matchScore > 0; })
          .sort(function (first, second) {
            if (second.matchScore !== first.matchScore) {
              return second.matchScore - first.matchScore;
            }
            return first.title.localeCompare(second.title);
          })
        : toolResults)
        .slice(0, 6);

      const sections = [];
      if (sortedClients.length) {
        sections.push({
          label: normalizedQuery ? "Clients" : "Recent Clients",
          items: sortedClients
        });
      }

      if (sortedTools.length) {
        sections.push({
          label: normalizedQuery ? "Studio Tools" : "Jump To",
          items: sortedTools
        });
      }

      return sections;
    }

    function setActiveItem(nextIndex) {
      activeIndex = nextIndex;
      Array.from(results.querySelectorAll("[data-studio-search-result-index]")).forEach(function (button) {
        const index = Number(button.getAttribute("data-studio-search-result-index"));
        const isActive = Number.isFinite(index) && index === activeIndex;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        if (isActive) {
          button.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function show() {
      isVisible = true;
      field.classList.add("is-open");
      results.hidden = false;
    }

    function hide(options) {
      const hideConfig = options && typeof options === "object" ? options : {};
      isVisible = false;
      activeIndex = -1;
      renderedItems = [];
      field.classList.remove("is-open");
      results.hidden = true;
      results.innerHTML = "";

      if (hideConfig.clearQuery) {
        input.value = "";
      }
    }

    function activate(result) {
      if (!result) {
        return;
      }

      hide({ clearQuery: true });
      input.blur();
      navigateToView(result.kind === "client" ? result.detailView : (result.view || ""), "push");
    }

    function move(delta) {
      if (!renderedItems.length) {
        return;
      }

      const nextIndex = activeIndex < 0
        ? (delta > 0 ? 0 : renderedItems.length - 1)
        : (activeIndex + delta + renderedItems.length) % renderedItems.length;
      setActiveItem(nextIndex);
    }

    function render() {
      const sections = buildSections(input.value);
      renderedItems = [];
      results.innerHTML = "";

      if (!sections.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "studio-command-search-empty";
        emptyState.textContent = "No matches yet. Try a client name, case ref, or Studio tool.";
        results.appendChild(emptyState);
        show();
        setActiveItem(-1);
        return;
      }

      sections.forEach(function (section) {
        const sectionNode = document.createElement("section");
        sectionNode.className = "studio-command-search-section";

        const sectionLabel = document.createElement("div");
        sectionLabel.className = "studio-command-search-section-label";
        sectionLabel.textContent = section.label;
        sectionNode.appendChild(sectionLabel);

        const sectionList = document.createElement("div");
        sectionList.className = "studio-command-search-section-list";

        section.items.forEach(function (item) {
          const itemIndex = renderedItems.length;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "studio-command-search-result";
          button.setAttribute("data-studio-search-result-index", String(itemIndex));
          button.setAttribute("aria-selected", "false");

          const leading = document.createElement("span");
          leading.className = `studio-command-search-result-leading is-${item.kind}`;
          leading.textContent = item.glyph || (item.kind === "client" ? "CL" : "ST");

          const copy = document.createElement("span");
          copy.className = "studio-command-search-result-copy";

          const title = document.createElement("strong");
          title.textContent = item.title;
          copy.appendChild(title);

          const subtitle = document.createElement("span");
          subtitle.textContent = item.subtitle;
          copy.appendChild(subtitle);

          const kind = document.createElement("span");
          kind.className = "studio-command-search-result-kind";
          kind.textContent = item.kind === "client" ? "Client" : "Tool";

          button.appendChild(leading);
          button.appendChild(copy);
          button.appendChild(kind);
          sectionList.appendChild(button);
          renderedItems.push(item);
        });

        sectionNode.appendChild(sectionList);
        results.appendChild(sectionNode);
      });

      show();
      setActiveItem(renderedItems.length ? 0 : -1);
    }

    if (shell.parentElement !== host) {
      host.appendChild(shell);
    }

    input.addEventListener("focus", render);
    input.addEventListener("input", render);

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isVisible) {
          render();
        }
        move(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isVisible) {
          render();
        }
        move(-1);
        return;
      }

      if (event.key === "Enter" && isVisible && renderedItems.length) {
        event.preventDefault();
        activate(renderedItems[activeIndex >= 0 ? activeIndex : 0]);
      }
    });

    results.addEventListener("click", function (event) {
      const target = event.target.closest("[data-studio-search-result-index]");
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const resultIndex = Number(target.getAttribute("data-studio-search-result-index"));
      if (!Number.isFinite(resultIndex) || !renderedItems[resultIndex]) {
        return;
      }

      activate(renderedItems[resultIndex]);
    });

    results.addEventListener("mousemove", function (event) {
      const target = event.target.closest("[data-studio-search-result-index]");
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const resultIndex = Number(target.getAttribute("data-studio-search-result-index"));
      if (Number.isFinite(resultIndex)) {
        setActiveItem(resultIndex);
      }
    });

    window.addEventListener("storage", function (event) {
      const storageKey = String(event.key || "").trim();
      if (!storageKey) {
        return;
      }

      if ((storageKey === getRecordsStorageKey() || storageKey === STORAGE_KEYS.pendingClientRecords) && isVisible) {
        render();
      }
    });

    return {
      hide: hide,
      render: render
    };
  }

  window.StudioSearch = {
    create: create
  };
})();
