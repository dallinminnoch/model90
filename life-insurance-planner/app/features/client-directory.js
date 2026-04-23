(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const { STORAGE_KEYS } = LensApp.config || {};

  function getDirectoryHelpers() {
    return LensApp.clientDirectoryHelpers || {};
  }

  function getClientRecordsApi() {
    return LensApp.clientRecords || {};
  }

  function getClientIntakeApi() {
    return LensApp.clientIntake || {};
  }

  function initializeClientDirectory() {
    const { ensureClientRecords, mergePendingClientRecords, getClientRecords, writeClientRecords } = getClientRecordsApi();
    const letterButtons = document.querySelectorAll("[data-client-letter]");
    const rowsHost = document.getElementById("client-table-rows");
    const emptyState = document.getElementById("client-empty-state");
    const searchField = document.querySelector(".client-table-search input");
    const exportDropdown = document.querySelector("[data-export-dropdown]");
    const exportButton = document.querySelector("[data-export-button]");
    const exportOptions = document.querySelectorAll("[data-export-action]");
    const addClientButton = document.querySelector("[data-add-client-button]");
    const viewButtons = document.querySelectorAll("[data-client-view]");
    const statusButtons = document.querySelectorAll("[data-client-status]");
    const orderDropdown = document.querySelector("[data-order-dropdown]");
    const orderTrigger = document.querySelector("[data-order-trigger]");
    const orderOptions = document.querySelectorAll("[data-order-option]");
    const nameHeading = document.getElementById("client-table-heading-name");
    const nextActionHeading = document.getElementById("client-table-heading-next-action");
    const coverageHeading = document.getElementById("client-table-heading-coverage");
    const addClientModal = document.querySelector("[data-add-client-modal]");
    const addClientModalCloseTargets = document.querySelectorAll("[data-add-client-modal-close]");
    if (!letterButtons.length || !rowsHost) {
      return;
    }

    ensureClientRecords();
    mergePendingClientRecords();
    let allRecords = buildCanonicalDirectoryRecords(getClientRecords());
    const selectedRecordIds = new Set();
    const collapsedGroupKeys = new Set();
    let activeLetter = "all";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0];
    const shouldRestoreClientStatus = navigationEntry?.type === "reload";
    let activeStatus = shouldRestoreClientStatus ? (sessionStorage.getItem(STORAGE_KEYS.clientStatus) || "all") : "all";
    const shouldRestoreClientView = navigationEntry?.type === "reload";
    const forcedClientView = sessionStorage.getItem(STORAGE_KEYS.clientViewIntent);
    let activeView = normalizeDirectoryView(
      forcedClientView || (shouldRestoreClientView ? (sessionStorage.getItem(STORAGE_KEYS.clientView) || "all") : "all")
    );
    let sortOrder = loadPersistedDirectoryOrder();
    let externalRecordFilter = null;

    if (!shouldRestoreClientStatus) {
      sessionStorage.setItem(STORAGE_KEYS.clientStatus, "all");
    }

    if (!shouldRestoreClientView) {
      sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
    }

    sessionStorage.removeItem(STORAGE_KEYS.clientViewIntent);

    function syncLetterButtons() {
      letterButtons.forEach((button) => {
        button.classList.toggle("is-active", String(button.dataset.clientLetter || "all") === activeLetter);
      });
    }

    function syncViewButtons() {
      viewButtons.forEach((button) => {
        button.classList.toggle("is-active", normalizeDirectoryView(button.dataset.clientView) === activeView);
      });
    }

    function syncStatusButtons() {
      const counts = buildStatusCounts(allRecords, activeView);

      statusButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.clientStatus === activeStatus);
        const counter = button.querySelector("[data-status-count]");
        if (counter) {
          counter.textContent = String(counts[button.dataset.clientStatus] || 0);
        }
      });
    }

    function syncTableHeadings() {
      if (nameHeading) {
        nameHeading.textContent = activeView === "households" ? "Household" : activeView === "businesses" ? "Business" : activeView === "all" ? "Profile" : "Client";
      }
      if (nextActionHeading) {
        nextActionHeading.textContent = "Next Action";
      }
      if (coverageHeading) {
        coverageHeading.textContent = "Coverage Gap";
      }
    }

    function syncExportButtonState() {
      if (!exportButton) {
        return;
      }

      const hasSelection = selectedRecordIds.size > 0;
      exportButton.classList.toggle("is-active", hasSelection);

      if (!hasSelection && exportDropdown) {
        exportDropdown.classList.remove("is-open");
        exportButton.setAttribute("aria-expanded", "false");
      }

      if (addClientButton) {
        addClientButton.classList.toggle("is-inactive", hasSelection);
      }
    }

    function openAddClientModal() {
      if (!addClientModal) {
        return;
      }

      addClientModal.hidden = false;
      addClientModal.classList.add("is-open");
      document.body.classList.add("is-modal-open");
    }

    function closeAddClientModal() {
      if (!addClientModal) {
        return;
      }

      addClientModal.hidden = true;
      addClientModal.classList.remove("is-open");
      document.body.classList.remove("is-modal-open");
    }

    function getSelectedRecords() {
      return allRecords.filter((record) => selectedRecordIds.has(String(record.id || "").trim()));
    }

    function getFilteredRecords() {
      const { getClientLifecycleStatus } = getDirectoryHelpers();
      const query = (searchField?.value || "").trim().toLowerCase();

      return allRecords.filter((record) => {
        const matchesView = doesRecordMatchDirectoryView(record, activeView);
        const matchesLetter = activeLetter === "all" || getLastInitial(record.lastName) === activeLetter;
        const matchesStatus = activeStatus === "all" || getClientLifecycleStatus(record) === activeStatus;
        const matchesExternal = typeof externalRecordFilter === "function" ? externalRecordFilter(record) : true;
        const matchesSearch = !query
          || String(record.displayName || "").toLowerCase().includes(query)
          || String(record.directorySearchText || "").toLowerCase().includes(query)
          || String(record.summary || "").toLowerCase().includes(query)
          || String(record.caseRef || "").toLowerCase().includes(query);

        return matchesView && matchesLetter && matchesStatus && matchesExternal && matchesSearch;
      });
    }

    function getDirectoryOrderLabel() {
      return sortOrder === "alphabetical" ? "Alphabetical" : "Close Index";
    }

    function syncDirectoryOrder() {
      if (orderTrigger) {
        orderTrigger.textContent = `Order: ${getDirectoryOrderLabel()}`;
      }

      orderOptions.forEach((option) => {
        option.classList.toggle("is-active", String(option.dataset.orderOption || "").trim() === sortOrder);
      });
    }

    function getDirectoryCoreState() {
      return {
        activeLetter,
        activeView,
        activeStatus,
        sortOrder,
        searchQuery: String(searchField?.value || ""),
        selectedRecordIds: Array.from(selectedRecordIds)
      };
    }

    function dispatchDirectoryCoreRender() {
      window.dispatchEvent(new CustomEvent("client-directory-core:render", {
        detail: getDirectoryCoreState()
      }));
    }

    function setOrderMenuOpen(isOpen) {
      if (!orderDropdown || !orderTrigger) {
        return;
      }

      orderDropdown.classList.toggle("is-open", isOpen);
      orderTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function compareDirectoryRecordsAlphabetically(firstRecord, secondRecord) {
      return String(firstRecord.displayName || "").localeCompare(String(secondRecord.displayName || ""), undefined, {
        sensitivity: "base",
        numeric: true
      });
    }

    function sortDirectoryRecords(sourceRecords) {
      if (sortOrder === "alphabetical") {
        return sourceRecords.slice().sort(compareDirectoryRecordsAlphabetically);
      }

      return sourceRecords.map((record) => ({
        record,
        scoreResult: getDirectoryOpportunityScoreResult(record)
      })).sort((firstEntry, secondEntry) => {
        const scoreDifference = secondEntry.scoreResult.score - firstEntry.scoreResult.score;
        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        const uncoveredGapDifference = (secondEntry.scoreResult.uncoveredGap || 0) - (firstEntry.scoreResult.uncoveredGap || 0);
        if (uncoveredGapDifference !== 0) {
          return uncoveredGapDifference;
        }

        return compareDirectoryRecordsAlphabetically(firstEntry.record, secondEntry.record);
      }).map((entry) => entry.record);
    }

    function toggleRecordFlag(recordId) {
      const normalizedRecordId = String(recordId || "").trim();
      if (!normalizedRecordId) {
        return false;
      }

      const nextRecords = getClientRecords().map((record) => {
        const currentRecordId = String(record.id || "").trim();
        if (currentRecordId !== normalizedRecordId) {
          return record;
        }

        return {
          ...record,
          isFlagged: !Boolean(record.isFlagged)
        };
      });

      writeClientRecords(nextRecords);
      return true;
    }

    const DIRECTORY_PIPELINE_GROUPS = Object.freeze([
      Object.freeze({ key: "prospecting", label: "Prospecting", toneClass: "client-directory-group-prospecting" }),
      Object.freeze({ key: "in-progress", label: "In Progress", toneClass: "client-directory-group-in-progress" }),
      Object.freeze({ key: "underwriting", label: "Underwriting", toneClass: "client-directory-group-underwriting" }),
      Object.freeze({ key: "placed", label: "Placed", toneClass: "client-directory-group-placed" }),
      Object.freeze({ key: "closed", label: "Closed", toneClass: "client-directory-group-closed" })
    ]);

    function buildDirectoryStatusBuckets(sourceRecords) {
      const { getClientLifecycleStatus } = getDirectoryHelpers();

      return sourceRecords.reduce((buckets, record) => {
        const statusKey = getClientLifecycleStatus(record);
        if (!Array.isArray(buckets[statusKey])) {
          buckets[statusKey] = [];
        }
        buckets[statusKey].push(record);
        return buckets;
      }, DIRECTORY_PIPELINE_GROUPS.reduce((buckets, group) => {
        buckets[group.key] = [];
        return buckets;
      }, {}));
    }

    function buildRenderableDirectoryGroups(visibleRecords, filteredRecords) {
      const visibleBuckets = buildDirectoryStatusBuckets(visibleRecords);
      const filteredBuckets = buildDirectoryStatusBuckets(filteredRecords);

      return DIRECTORY_PIPELINE_GROUPS
        .filter((group) => (visibleBuckets[group.key] || []).length > 0)
        .map((group) => ({
          ...group,
          totalCount: (filteredBuckets[group.key] || []).length,
          records: visibleBuckets[group.key] || []
        }));
    }

    function isDirectoryGroupCollapsed(groupKey) {
      return collapsedGroupKeys.has(String(groupKey || "").trim());
    }

    function renderDirectoryGroup(group) {
      const isCollapsed = isDirectoryGroupCollapsed(group.key);
      const bodyId = `client-directory-group-body-${group.key}`;

      return `
        <section class="client-directory-group ${group.toneClass}${isCollapsed ? " is-collapsed" : ""}" data-directory-group="${group.key}">
          <header class="client-directory-group-header">
            <button class="client-directory-group-toggle" type="button" data-directory-group-toggle="${group.key}" aria-expanded="${isCollapsed ? "false" : "true"}" aria-controls="${bodyId}">
              <span class="client-directory-group-toggle-icon" aria-hidden="true"></span>
              <span class="client-directory-group-heading">
                <span class="client-directory-group-marker" aria-hidden="true"></span>
                <span class="client-directory-group-title">${group.label}</span>
                <span class="client-directory-group-count">${group.totalCount}</span>
              </span>
            </button>
          </header>
          <div class="client-directory-group-body" id="${bodyId}" role="rowgroup"${isCollapsed ? " hidden" : ""}>
            ${group.records.map((record) => renderClientRow(record, selectedRecordIds.has(String(record.id || "").trim()))).join("")}
          </div>
        </section>
      `;
    }

    function renderDirectory() {
      allRecords = buildCanonicalDirectoryRecords(getClientRecords());
      const filteredRecords = sortDirectoryRecords(getFilteredRecords());
      const visibleRecords = filteredRecords;
      const renderableGroups = buildRenderableDirectoryGroups(visibleRecords, filteredRecords);

      rowsHost.innerHTML = renderableGroups.map(renderDirectoryGroup).join("");
      if (emptyState) {
        emptyState.hidden = visibleRecords.length > 0;
      }

      rowsHost.querySelectorAll("[data-directory-group-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const groupKey = String(button.getAttribute("data-directory-group-toggle") || "").trim();
          if (!groupKey) {
            return;
          }

          const willCollapse = !collapsedGroupKeys.has(groupKey);
          const groupSection = button.closest(".client-directory-group");
          const groupBody = groupSection?.querySelector(".client-directory-group-body");

          if (willCollapse) {
            collapsedGroupKeys.add(groupKey);
          } else {
            collapsedGroupKeys.delete(groupKey);
          }

          groupSection?.classList.toggle("is-collapsed", willCollapse);
          button.setAttribute("aria-expanded", willCollapse ? "false" : "true");
          if (groupBody) {
            groupBody.hidden = willCollapse;
          }
        });
      });

      rowsHost.querySelectorAll("[data-client-select]").forEach((checkbox) => {
        checkbox.addEventListener("click", (event) => {
          event.stopPropagation();
        });

        checkbox.addEventListener("change", () => {
          const recordId = String(checkbox.dataset.clientSelect || "").trim();
          if (!recordId) {
            return;
          }

          if (checkbox.checked) {
            selectedRecordIds.add(recordId);
          } else {
            selectedRecordIds.delete(recordId);
          }
          syncExportButtonState();
        });
      });

      rowsHost.querySelectorAll("[data-priority-trigger]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const dropdown = button.closest("[data-priority-dropdown]");
          const row = button.closest(".client-table");
          if (!dropdown) {
            return;
          }

          rowsHost.querySelectorAll("[data-priority-dropdown].is-open").forEach((item) => {
            if (item !== dropdown) {
              item.classList.remove("is-open");
              item.querySelector("[data-priority-trigger]")?.setAttribute("aria-expanded", "false");
              item.closest(".client-table")?.classList.remove("is-priority-open");
            }
          });

          const isOpen = dropdown.classList.toggle("is-open");
          button.setAttribute("aria-expanded", String(isOpen));
          row?.classList.toggle("is-priority-open", isOpen);
        });
      });

      rowsHost.querySelectorAll("[data-priority-option]").forEach((option) => {
        option.addEventListener("click", (event) => {
          event.stopPropagation();
          const recordId = option.dataset.priorityRecord;
          const { normalizePriority } = getDirectoryHelpers();
          const priority = normalizePriority(option.dataset.priorityOption);
          if (!recordId || !priority) {
            return;
          }

          updateClientPriority(recordId, priority);
          renderDirectory();
        });
      });

      rowsHost.querySelectorAll("[data-client-flag-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const recordId = String(button.getAttribute("data-client-flag-toggle") || "").trim();
          if (!recordId) {
            return;
          }

          if (toggleRecordFlag(recordId)) {
            renderDirectory();
          }
        });
      });

      rowsHost.querySelectorAll("[data-client-open]").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target.closest("input") || event.target.closest("[data-priority-dropdown]") || event.target.closest("[data-client-flag-toggle]")) {
            return;
          }

          const recordId = row.dataset.clientOpen;
          if (!recordId) {
            return;
          }

          window.location.href = `client-detail.html?id=${encodeURIComponent(recordId)}`;
        });

        row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          if (event.target.closest("input") || event.target.closest("[data-priority-dropdown]") || event.target.closest("[data-client-flag-toggle]")) {
            return;
          }

          event.preventDefault();
          const recordId = row.dataset.clientOpen;
          if (!recordId) {
            return;
          }

          window.location.href = `client-detail.html?id=${encodeURIComponent(recordId)}`;
        });
      });

      syncTableHeadings();
      syncLetterButtons();
      syncViewButtons();
      syncStatusButtons();
      syncDirectoryOrder();
      syncExportButtonState();
      dispatchDirectoryCoreRender();
    }

    letterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeLetter = button.dataset.clientLetter || "all";

        letterButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });

        renderDirectory();
      });
    });

    if (searchField) {
      searchField.addEventListener("input", () => {
        renderDirectory();
      });
    }

    viewButtons.forEach((button) => {
      button.classList.toggle("is-active", normalizeDirectoryView(button.dataset.clientView) === activeView);
      button.addEventListener("click", () => {
        activeView = normalizeDirectoryView(button.dataset.clientView || "all");
        sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
        viewButtons.forEach((item) => {
          item.classList.toggle("is-active", normalizeDirectoryView(item.dataset.clientView) === activeView);
        });
        renderDirectory();
      });
    });

    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeStatus = button.dataset.clientStatus || "all";
        sessionStorage.setItem(STORAGE_KEYS.clientStatus, activeStatus);
        renderDirectory();
      });
    });

    orderOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const nextOrder = String(option.dataset.orderOption || "").trim();
        if (nextOrder !== "alphabetical" && nextOrder !== "opportunity-score") {
          return;
        }

        sortOrder = nextOrder;
        persistDirectoryOrder(sortOrder);
        syncDirectoryOrder();
        renderDirectory();
        setOrderMenuOpen(false);
        option.blur();
        orderTrigger?.blur();
      });
    });

    if (orderDropdown && orderTrigger) {
      orderTrigger.addEventListener("click", () => {
        const willOpen = !orderDropdown.classList.contains("is-open");
        setOrderMenuOpen(Boolean(willOpen));
      });
    }

    if (addClientButton) {
      addClientButton.addEventListener("click", (event) => {
        event.preventDefault();
        openAddClientModal();
      });
    }

    addClientModalCloseTargets.forEach((target) => {
      target.addEventListener("click", closeAddClientModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAddClientModal();
      }
    });

    if (addClientModal) {
      addClientModal.addEventListener("click", (event) => {
        if (event.target === addClientModal) {
          closeAddClientModal();
        }
      });
    }

    if (exportButton && exportDropdown) {
      exportButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!selectedRecordIds.size) {
          return;
        }

        const isOpen = exportDropdown.classList.toggle("is-open");
        exportButton.setAttribute("aria-expanded", String(isOpen));
      });
    }

    exportOptions.forEach((option) => {
      option.addEventListener("click", async (event) => {
        event.stopPropagation();
        const selectedRecords = getSelectedRecords();
        if (!selectedRecords.length) {
          return;
        }

        const action = option.dataset.exportAction;
        if (action === "print") {
          printClientRecords(selectedRecords);
        } else if (action === "share") {
          await shareClientRecords(selectedRecords);
        } else {
          exportClientRecords(selectedRecords);
        }

        exportDropdown?.classList.remove("is-open");
        exportButton?.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!target.closest("[data-export-dropdown]")) {
        exportDropdown?.classList.remove("is-open");
        exportButton?.setAttribute("aria-expanded", "false");
      }

      if (!target.closest("[data-order-dropdown]")) {
        setOrderMenuOpen(false);
      }

      if (target.closest("[data-priority-dropdown]")) {
        return;
      }

      rowsHost.querySelectorAll("[data-priority-dropdown].is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector("[data-priority-trigger]")?.setAttribute("aria-expanded", "false");
        dropdown.closest(".client-table")?.classList.remove("is-priority-open");
      });
    });

    LensApp.clientDirectoryCore = {
      getState() {
        return {
          ...getDirectoryCoreState(),
          selectedRecordIds: Array.from(selectedRecordIds)
        };
      },
      getAllRecords() {
        allRecords = buildCanonicalDirectoryRecords(getClientRecords());
        return allRecords.slice();
      },
      getFilteredRecords() {
        allRecords = buildCanonicalDirectoryRecords(getClientRecords());
        return sortDirectoryRecords(getFilteredRecords()).slice();
      },
      getSelectedRecords() {
        allRecords = buildCanonicalDirectoryRecords(getClientRecords());
        return getSelectedRecords().slice();
      },
      clearSelection() {
        selectedRecordIds.clear();
        renderDirectory();
      },
      applyShellState(nextState) {
        const state = nextState && typeof nextState === "object" ? nextState : {};

        if (Object.prototype.hasOwnProperty.call(state, "activeView")) {
          activeView = normalizeDirectoryView(state.activeView);
          sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
        }

        if (Object.prototype.hasOwnProperty.call(state, "activeLetter")) {
          const normalizedLetter = String(state.activeLetter || "all").trim().toUpperCase();
          activeLetter = normalizedLetter === "ALL" ? "all" : (/^[A-Z]$/.test(normalizedLetter) ? normalizedLetter : "all");
        }

        if (Object.prototype.hasOwnProperty.call(state, "activeStatus")) {
          const normalizedStatus = String(state.activeStatus || "all").trim().toLowerCase();
          activeStatus = ["all", "prospecting", "in-progress", "underwriting", "placed", "closed"].includes(normalizedStatus)
            ? normalizedStatus
            : "all";
          sessionStorage.setItem(STORAGE_KEYS.clientStatus, activeStatus);
        }

        if (Object.prototype.hasOwnProperty.call(state, "sortOrder")) {
          const normalizedSortOrder = String(state.sortOrder || "").trim();
          sortOrder = normalizedSortOrder === "alphabetical" ? "alphabetical" : "opportunity-score";
          persistDirectoryOrder(sortOrder);
        }

        if (Object.prototype.hasOwnProperty.call(state, "searchQuery") && searchField) {
          searchField.value = String(state.searchQuery || "");
        }

        if (Object.prototype.hasOwnProperty.call(state, "externalRecordFilter")) {
          externalRecordFilter = typeof state.externalRecordFilter === "function" ? state.externalRecordFilter : null;
        }

        if (state.clearSelection) {
          selectedRecordIds.clear();
        }

        renderDirectory();
        return this.getState();
      },
      refresh() {
        renderDirectory();
      }
    };

    syncDirectoryOrder();
    renderDirectory();
  }

  function normalizeDirectoryView(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "all") {
      return "all";
    }
    if (normalized === "companies") {
      return "businesses";
    }

    return ["all", "individuals", "households", "businesses"].includes(normalized)
      ? normalized
      : "all";
  }

  function getDirectoryRecordView(record) {
    return normalizeDirectoryView(record?.viewType);
  }

  function doesRecordMatchDirectoryView(record, activeView) {
    if (normalizeDirectoryView(activeView) === "all") {
      return true;
    }
    return getDirectoryRecordView(record) === normalizeDirectoryView(activeView);
  }

  function getDirectoryPreferredFirstName(record) {
    const preferredName = String(record?.preferredName || "").trim();
    if (preferredName) {
      return preferredName;
    }

    const firstName = String(record?.firstName || "").trim();
    if (firstName) {
      return firstName;
    }

    const displayName = String(record?.displayName || "").trim();
    if (!displayName) {
      return "";
    }

    if (displayName.includes(",")) {
      return String(displayName.split(",").slice(1).join(",") || "").trim().split(/\s+/).filter(Boolean)[0] || "";
    }

    const parts = displayName.split(/\s+/).filter(Boolean);
    const lastName = String(record?.lastName || "").trim().toLowerCase();
    if (parts.length > 1 && lastName && parts[parts.length - 1].toLowerCase() === lastName) {
      return parts.slice(0, -1).join(" ").trim();
    }

    return parts[0] || "";
  }

  function buildCanonicalIndividualDisplayName(record) {
    const lastName = String(record?.lastName || "").trim();
    const firstName = getDirectoryPreferredFirstName(record);
    if (lastName && firstName) {
      return `${lastName}, ${firstName}`;
    }

    return String(record?.displayName || "").trim() || [lastName, firstName].filter(Boolean).join(", ").trim();
  }

  function buildDirectorySearchText(record, extras) {
    return [
      record?.displayName,
      record?.firstName,
      record?.preferredName,
      record?.lastName,
      record?.summary,
      record?.householdName,
      ...(Array.isArray(extras) ? extras : [])
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");
  }

  function sortDirectoryGroupMemberEntries(memberEntries, groupRecord) {
    const primaryLastName = String(groupRecord?.lastName || "").trim().toLowerCase();
    return memberEntries.slice().sort((left, right) => {
      const leftPrimaryRank = primaryLastName && String(left?.record?.lastName || "").trim().toLowerCase() === primaryLastName ? 0 : 1;
      const rightPrimaryRank = primaryLastName && String(right?.record?.lastName || "").trim().toLowerCase() === primaryLastName ? 0 : 1;
      if (leftPrimaryRank !== rightPrimaryRank) {
        return leftPrimaryRank - rightPrimaryRank;
      }

      return left.index - right.index;
    });
  }

  function buildProjectedGroupRecord(groupRecord, memberEntries) {
    const sortedMemberEntries = sortDirectoryGroupMemberEntries(memberEntries, groupRecord);
    const memberRecords = sortedMemberEntries.map((entry) => entry.record);
    const memberDisplayNames = memberRecords.map((record) => buildCanonicalIndividualDisplayName(record));
    const primaryLastName = String(groupRecord?.lastName || memberRecords[0]?.lastName || "").trim();
    const firstTwoNames = memberRecords
      .map((record) => getDirectoryPreferredFirstName(record))
      .filter(Boolean)
      .slice(0, 2);
    const displayName = primaryLastName && firstTwoNames.length
      ? `${primaryLastName}, ${firstTwoNames.join(" & ")}`
      : String(groupRecord?.displayName || "").trim();

    return {
      ...groupRecord,
      displayName,
      lastName: primaryLastName,
      householdName: "",
      directorySearchText: buildDirectorySearchText(groupRecord, memberDisplayNames)
    };
  }

  function buildProjectedIndividualRecord(record) {
    const displayName = buildCanonicalIndividualDisplayName(record);
    return {
      ...record,
      displayName,
      householdName: "",
      directorySearchText: buildDirectorySearchText(record, [displayName])
    };
  }

  function buildCanonicalDirectoryRecords(records) {
    const safeRecords = Array.isArray(records)
      ? records.filter((record) => record && typeof record === "object")
      : [];

    const groupRecordsById = new Map();
    const memberEntriesByGroupId = new Map();
    const standaloneEntries = [];
    const projectedEntries = [];

    safeRecords.forEach((record, index) => {
      const rawViewType = String(record?.viewType || "").trim().toLowerCase();
      const normalizedRawView = rawViewType === "businesses" ? "companies" : rawViewType;
      const recordId = String(record?.id || "").trim();
      const groupId = String(record?.householdId || "").trim();

      if ((normalizedRawView === "households" || normalizedRawView === "companies") && recordId) {
        groupRecordsById.set(recordId, {
          index,
          record: {
            ...record,
            viewType: normalizedRawView
          }
        });
        return;
      }

      if (normalizedRawView === "individuals" && groupId) {
        const existingEntries = memberEntriesByGroupId.get(groupId) || [];
        existingEntries.push({ index, record });
        memberEntriesByGroupId.set(groupId, existingEntries);
        return;
      }

      standaloneEntries.push({
        index,
        record: normalizedRawView === "individuals"
          ? record
          : {
            ...record,
            viewType: normalizedRawView === "companies" ? "companies" : record.viewType
          }
      });
    });

    groupRecordsById.forEach((groupEntry, groupId) => {
      const memberEntries = memberEntriesByGroupId.get(groupId) || [];

      if (memberEntries.length > 1) {
        projectedEntries.push({
          index: groupEntry.index,
          record: buildProjectedGroupRecord(groupEntry.record, memberEntries)
        });
        return;
      }

      if (memberEntries.length === 1) {
        projectedEntries.push({
          index: memberEntries[0].index,
          record: buildProjectedIndividualRecord(memberEntries[0].record)
        });
        return;
      }

      projectedEntries.push({
        index: groupEntry.index,
        record: {
          ...groupEntry.record,
          householdName: "",
          directorySearchText: buildDirectorySearchText(groupEntry.record, [])
        }
      });
    });

    memberEntriesByGroupId.forEach((memberEntries, groupId) => {
      if (groupRecordsById.has(groupId)) {
        return;
      }

      memberEntries.forEach((entry) => {
        projectedEntries.push({
          index: entry.index,
          record: buildProjectedIndividualRecord(entry.record)
        });
      });
    });

    standaloneEntries.forEach((entry) => {
      projectedEntries.push({
        index: entry.index,
        record: String(entry.record?.viewType || "").trim().toLowerCase() === "individuals"
          ? buildProjectedIndividualRecord(entry.record)
          : {
            ...entry.record,
            householdName: "",
            directorySearchText: buildDirectorySearchText(entry.record, [])
          }
      });
    });

    return projectedEntries
      .sort((left, right) => left.index - right.index)
      .map((entry) => entry.record);
  }

  function buildStatusCounts(records, activeView) {
    const { getClientLifecycleStatus } = getDirectoryHelpers();

    return records
      .filter((record) => doesRecordMatchDirectoryView(record, activeView))
      .reduce((counts, record) => {
        const lifecycleStatus = getClientLifecycleStatus(record);
        counts.all += 1;
        counts[lifecycleStatus] = (counts[lifecycleStatus] || 0) + 1;
        return counts;
      }, { all: 0, prospecting: 0, "in-progress": 0, underwriting: 0, placed: 0, closed: 0 });
  }

  function getLastInitial(lastName) {
    const value = String(lastName || "").trim().toUpperCase();
    return value ? value.charAt(0) : "";
  }

  function getDirectoryStorageIdentity() {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.authSession) || "null");
      return session?.email ? String(session.email).trim().toLowerCase() : "guest";
    } catch (error) {
      return "guest";
    }
  }

  function getDirectoryOrderStorageKey() {
    return `clientDirectoryOrder:${getDirectoryStorageIdentity()}`;
  }

  function loadPersistedDirectoryOrder() {
    try {
      const storedValue = String(localStorage.getItem(getDirectoryOrderStorageKey()) || "").trim();
      return storedValue === "alphabetical" ? "alphabetical" : "opportunity-score";
    } catch (error) {
      return "opportunity-score";
    }
  }

  function persistDirectoryOrder(value) {
    try {
      localStorage.setItem(getDirectoryOrderStorageKey(), value === "alphabetical" ? "alphabetical" : "opportunity-score");
    } catch (error) {
      // Ignore persistence failures and keep the in-memory order.
    }
  }

  function readSummaryNumber(value) {
    const numericValue = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function hasDirectoryProfileCreated(record) {
    return Boolean(String(record?.displayName || "").trim()) && Boolean(String(record?.caseRef || "").trim());
  }

  function hasDirectoryAnalysisCompleted(record) {
    return Boolean(record?.analysisCompleted) || record?.statusGroup === "coverage-placed" || record?.statusGroup === "closed";
  }

  function hasDirectoryPreliminaryCompleted(record) {
    return Boolean(record?.preliminaryUnderwritingCompleted) || Boolean(record?.pmiCompleted) || hasDirectoryAnalysisCompleted(record);
  }

  function hasDirectoryPmiCompleted(record) {
    return Boolean(record?.pmiCompleted) || hasDirectoryAnalysisCompleted(record);
  }

  function getDirectoryNextAction(record) {
    if (!hasDirectoryProfileCreated(record)) {
      return "Create Profile";
    }

    if (!hasDirectoryPreliminaryCompleted(record)) {
      return "Preliminary Underwriting";
    }

    if (!hasDirectoryPmiCompleted(record)) {
      return "Protection Modeling Inputs";
    }

    if (!hasDirectoryAnalysisCompleted(record)) {
      return "Complete Analysis";
    }

    if (record?.statusGroup === "coverage-placed") {
      return "Policy Delivered";
    }

    return "Workflow Complete";
  }

  function getLatestProtectionModelingPayload(record) {
    if (!record || typeof record !== "object") {
      return null;
    }

    if (record.protectionModeling && typeof record.protectionModeling === "object") {
      return record.protectionModeling;
    }

    if (Array.isArray(record.protectionModelingEntries) && record.protectionModelingEntries.length) {
      return record.protectionModelingEntries[record.protectionModelingEntries.length - 1];
    }

    return null;
  }

  function getLatestProtectionModelingData(record) {
    const payload = getLatestProtectionModelingPayload(record);
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return payload.data && typeof payload.data === "object"
      ? payload.data
      : payload;
  }

  function getRecordCurrentCoverageValue(record) {
    const modelingData = getLatestProtectionModelingData(record) || {};
    const modeledCoverageTotal = Math.max(
      0,
      readSummaryNumber(modelingData.currentCoverage),
      readSummaryNumber(modelingData.existingCoverage),
      readSummaryNumber(modelingData.existingLifeCoverage),
      readSummaryNumber(modelingData.individualCoverage),
      readSummaryNumber(modelingData.spousalCoverage),
      readSummaryNumber(modelingData.groupLifeCoverage),
      readSummaryNumber(modelingData.currentCoverageAmount),
      readSummaryNumber(modelingData.currentLifeInsuranceCoverage)
    );
    const recordCoverage = Math.max(
      readSummaryNumber(record?.currentCoverage),
      readSummaryNumber(record?.coverageAmount)
    );
    const hasExplicitRecordCoverage = record && typeof record === "object"
      && Object.prototype.hasOwnProperty.call(record, "currentCoverage");
    return hasExplicitRecordCoverage
      ? Math.max(0, readSummaryNumber(record?.currentCoverage))
      : Math.max(0, modeledCoverageTotal, recordCoverage);
  }

  function getRecordModeledNeedValue(record) {
    const modelingData = getLatestProtectionModelingData(record) || {};
    const storedModeledNeed = Math.max(
      0,
      readSummaryNumber(record?.modeledNeed),
      readSummaryNumber(record?.coverageGap)
    );
    const hasStoredModeledNeed = record && typeof record === "object"
      && Object.prototype.hasOwnProperty.call(record, "modeledNeed");

    if (hasStoredModeledNeed) {
      return Math.max(0, readSummaryNumber(record?.modeledNeed));
    }

    return Math.max(
      0,
      storedModeledNeed,
      readSummaryNumber(modelingData.totalModeledNeed),
      readSummaryNumber(modelingData.totalNeed),
      readSummaryNumber(modelingData.totalCoverageNeed),
      readSummaryNumber(modelingData.totalDeathBenefitNeed),
      readSummaryNumber(modelingData.deathBenefitNeed),
      readSummaryNumber(modelingData.estimatedNeed),
      readSummaryNumber(modelingData.coverageNeed),
      readSummaryNumber(modelingData.coverageTarget)
    );
  }

  function getRecordUncoveredGapValue(record) {
    const explicitUncoveredGap = readSummaryNumber(record?.uncoveredGap);
    const hasExplicitUncoveredGap = record && typeof record === "object"
      && Object.prototype.hasOwnProperty.call(record, "uncoveredGap");
    if (hasExplicitUncoveredGap) {
      return Math.max(0, explicitUncoveredGap);
    }

    const modeledNeed = getRecordModeledNeedValue(record);
    const currentCoverage = getRecordCurrentCoverageValue(record);
    return Math.max(0, modeledNeed - currentCoverage);
  }

  function getRecordTimelineDate(record) {
    const { getDirectoryCreatedDate } = getDirectoryHelpers();
    const rawValue = String(getDirectoryCreatedDate(record) || record?.lastReview || "").trim();
    if (!rawValue) {
      return null;
    }

    const parsed = new Date(`${rawValue}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getRecordReviewDate(record) {
    const rawValue = String(record?.lastReview || record?.lastUpdatedDate || record?.dateProfileCreated || "").trim();
    if (!rawValue) {
      return null;
    }

    const parsed = new Date(`${rawValue}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getDirectoryOpportunityScoreResult(record) {
    const opportunityScoreEngine = window.LipOpportunityScore;
    if (!opportunityScoreEngine || typeof opportunityScoreEngine.calculate !== "function") {
      return {
        score: 0,
        tier: "is-risk",
        uncoveredGap: getRecordUncoveredGapValue(record)
      };
    }

    return opportunityScoreEngine.calculate(record, {
      modelingData: getLatestProtectionModelingData(record) || {},
      currentCoverage: getRecordCurrentCoverageValue(record),
      modeledNeed: getRecordModeledNeedValue(record),
      uncoveredGap: getRecordUncoveredGapValue(record),
      statusGroup: record?.statusGroup,
      profileCreated: hasDirectoryProfileCreated(record),
      preliminaryCompleted: hasDirectoryPreliminaryCompleted(record),
      pmiCompleted: hasDirectoryPmiCompleted(record),
      analysisCompleted: hasDirectoryAnalysisCompleted(record),
      timelineDate: getRecordTimelineDate(record),
      reviewDate: getRecordReviewDate(record)
    });
  }

  function renderClientRow(record, isSelected) {
    const {
      normalizePriority,
      formatCurrencyCompact,
      getPriorityDisplay
    } = getDirectoryHelpers();
    const priority = normalizePriority(record.priority);
    const opportunityScore = getDirectoryOpportunityScoreResult(record);
    const isHouseholdAvatar = record.viewType === "households";
    const avatarClasses = `client-avatar${isHouseholdAvatar ? " client-avatar-household" : ""}`;
    const avatarPresentation = isHouseholdAvatar ? null : getAvatarPresentation(record.age, record.dateOfBirth);
    const avatarStyle = avatarPresentation
      ? ` style="background: ${avatarPresentation.background}; color: ${avatarPresentation.color};"`
      : "";
    const isFlagged = Boolean(record.isFlagged);
    const subtitle = getClientDirectorySubtitle(record);

      const rowFlagIconSrc = isFlagged ? "../Images/flat-row-selected.svg" : "../Images/flat-row.svg";

      return `
        <div class="client-table client-table-clickable directory-list-row" role="row" tabindex="0" data-client-open="${record.id}">
          <div class="client-row-controls" role="group" aria-label="Controls for ${record.displayName}">
            <div class="client-table-cell-check"><input class="row-select-checkbox" type="checkbox" aria-label="Select ${record.displayName}" data-client-select="${record.id}"${isSelected ? " checked" : ""}></div>
            <div class="client-table-cell-pin"><span class="client-row-pin-icon" aria-hidden="true"></span></div>
            <div class="client-table-cell-flag">
              <button class="client-row-flag-button row-flag-control${isFlagged ? " is-flagged" : ""}" type="button" data-client-flag-toggle="${record.id}" aria-pressed="${isFlagged ? "true" : "false"}" aria-label="${isFlagged ? `Unflag ${record.displayName}` : `Flag ${record.displayName}`}">
                <img class="client-row-flag-icon row-flag-control__icon" src="${rowFlagIconSrc}" alt="" aria-hidden="true">
              </button>
            </div>
          </div>
          <div class="client-table-cell client-table-cell-client directory-person">
            <span class="${avatarClasses} directory-person__avatar"${avatarStyle}>${getInitials(record.displayName, record.viewType, record.lastName)}</span>
          <div class="directory-person__body">
            <strong class="directory-person__name">${record.displayName}</strong>
            ${subtitle ? `<span class="directory-person__subtitle">${subtitle}</span>` : ""}
          </div>
        </div>
        <div class="client-table-cell client-table-cell-case-ref-value">${record.caseRef || "--"}</div>
        <div class="client-table-cell client-table-cell-close-index-value client-table-cell-opportunity-score">
          <span class="client-opportunity-score-pill opportunity-score-pill ${opportunityScore.tier}" aria-label="Close index ${opportunityScore.score}" title="Close Index ${opportunityScore.score}">
            ${opportunityScore.score}
          </span>
        </div>
        <div class="client-table-cell client-table-cell-next-action-value"><span class="client-table-cell-next-action-text">${getDirectoryNextAction(record)}</span></div>
        <div class="client-table-cell client-table-cell-coverage-amount-value">${formatCurrencyCompact(getRecordUncoveredGapValue(record))}</div>
        <div class="client-table-cell client-table-cell-value client-table-cell-priority-value">
          <div class="client-priority-dropdown" data-priority-dropdown="${record.id}">
            <button class="client-priority-button priority-pill ${priority ? `client-priority-button-${priority}` : "client-priority-button-unset"}" type="button" data-priority-trigger aria-expanded="false">
              ${getPriorityDisplay(priority)}
            </button>
            <div class="client-priority-menu priority-menu">
              <button class="client-priority-option priority-menu__option client-priority-option-low ${priority === "low" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="low">Low</button>
              <button class="client-priority-option priority-menu__option client-priority-option-medium ${priority === "medium" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="medium">Medium</button>
              <button class="client-priority-option priority-menu__option client-priority-option-high ${priority === "high" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="high">High</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildDirectoryExportRows(records) {
    const { getClientStatusDisplay, getPriorityDisplay, normalizePriority, formatCurrencyCompact } = getDirectoryHelpers();

    return records.map((record) => {
      const opportunityScore = getDirectoryOpportunityScoreResult(record);

      return [
        record.displayName,
        record.caseRef || "--",
        String(opportunityScore.score),
        getDirectoryNextAction(record),
        getClientStatusDisplay(record),
        formatCurrencyCompact(getRecordUncoveredGapValue(record)),
        getPriorityDisplay(normalizePriority(record.priority))
      ];
    });
  }

  function exportClientRecords(records) {
    const header = ["Client", "Case Ref", "Close Index", "Next Action", "Client Status", "Coverage Gap", "Priority"];
    const rows = buildDirectoryExportRows(records);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-directory-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printClientRecords(records) {
    const { escapeHtml } = getDirectoryHelpers();
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1120,height=860");
    if (!printWindow) {
      return;
    }

    const rowsMarkup = buildDirectoryExportRows(records).map((row) => `
      <tr>
        <td>${escapeHtml(row[0])}</td>
        <td>${escapeHtml(row[1])}</td>
        <td>${escapeHtml(row[2])}</td>
        <td>${escapeHtml(row[3])}</td>
        <td>${escapeHtml(row[4])}</td>
        <td>${escapeHtml(row[5])}</td>
        <td>${escapeHtml(row[6])}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Client Directory Export</title>
          <style>
            body {
              margin: 0;
              padding: 2rem;
              font-family: "Segoe UI", Arial, sans-serif;
              color: #102134;
              background: #ffffff;
            }
            h1 {
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
            }
            p {
              margin: 0 0 1.5rem;
              color: #475467;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.95rem;
            }
            th,
            td {
              padding: 0.8rem 0.75rem;
              border: 1px solid #d6dde7;
              text-align: left;
            }
            th {
              background: #f5f7fb;
              color: #000000;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <h1>Client Directory Export</h1>
          <p>${records.length} selected ${records.length === 1 ? "profile" : "profiles"}</p>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Case Ref</th>
                <th>Close Index</th>
                <th>Next Action</th>
                <th>Client Status</th>
                <th>Coverage Gap</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  }

  async function shareClientRecords(records) {
    const summary = buildClientShareSummary(records);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Client Directory Selection",
          text: summary
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await copyTextToClipboard(summary);
    if (copied) {
      window.alert("Selected client details copied to the clipboard.");
      return;
    }

    window.alert("Sharing is not available in this browser.");
  }

  function buildClientShareSummary(records) {
    const lines = buildDirectoryExportRows(records).map((row) => (
      `${row[0]} | ${row[1]} | Close Index ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} | ${row[6]}`
    ));

    return [
      "Client Directory Selection",
      "",
      ...lines
    ].join("\n");
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        return false;
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function updateClientPriority(recordId, priority) {
    const { getClientRecords, writeClientRecords } = getClientRecordsApi();
    const { normalizePriority } = getDirectoryHelpers();
    const records = getClientRecords().map((record) => (
      record.id === recordId
        ? { ...record, priority: normalizePriority(priority) }
        : record
    ));

    writeClientRecords(records);
  }

  function getInitials(name, viewType, lastName) {
    if (viewType === "households") {
      const householdLastInitial = getLastInitial(lastName);
      if (householdLastInitial) {
        return householdLastInitial;
      }

      const trimmed = String(name || "").trim().replace(/\s+Household$/i, "");
      const parts = trimmed.split(/\s+/).filter(Boolean);
      const fallbackLastName = parts.length ? parts[parts.length - 1] : "";
      return (fallbackLastName.charAt(0).toUpperCase() || "H");
    }

    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CL";
  }

  function getAvatarAge(ageValue, dateOfBirthValue) {
    const { calculateAgeFromDate } = getClientIntakeApi();
    const directAge = Number(String(ageValue || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(directAge) && directAge >= 0) {
      return Math.max(0, Math.min(100, directAge));
    }

    const birthDateValue = String(dateOfBirthValue || "").trim();
    if (!birthDateValue) {
      return null;
    }

    const calculatedAge = calculateAgeFromDate(birthDateValue);
    return Number.isFinite(calculatedAge) ? Math.max(0, Math.min(100, calculatedAge)) : null;
  }

  function interpolateNumber(start, end, progress) {
    return start + ((end - start) * progress);
  }

  function getAvatarHue(ageValue, dateOfBirthValue) {
    const age = getAvatarAge(ageValue, dateOfBirthValue);
    if (age === null) {
      return 210;
    }

    if (age <= 18) {
      return interpolateNumber(48, 60, age / 18);
    }

    if (age <= 30) {
      return interpolateNumber(60, 210, (age - 18) / 12);
    }

    if (age <= 65) {
      return interpolateNumber(210, 280, (age - 30) / 35);
    }

    return interpolateNumber(280, 360, (age - 65) / 35);
  }

  function getAvatarPresentation(ageValue, dateOfBirthValue) {
    const hue = getAvatarHue(ageValue, dateOfBirthValue);
    const prefersSoftAvatars = Boolean(document.body?.classList.contains("is-a11y-soft-avatars"));
    if (prefersSoftAvatars) {
      return {
        background: `hsl(${hue} 62% 88%)`,
        color: `hsl(${hue} 46% 36%)`
      };
    }

    const highlightHue = hue;
    const shadowHue = (hue + 22) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${highlightHue} 72% 66%), hsl(${shadowHue} 68% 44%))`,
      color: "#ffffff"
    };
  }

  function getClientDirectorySubtitle(record) {
    return "";
  }

  function getDependentsDisplay(record) {
    const count = Number(record?.dependentsCount || 0);
    if (Number.isFinite(count) && count > 0) {
      return String(count);
    }

    return String(record?.hasDependents || "").trim().toLowerCase() === "yes" ? "Yes" : "-";
  }

  LensApp.clientDirectory = Object.assign(LensApp.clientDirectory || {}, {
    initializeClientDirectory,
    buildStatusCounts,
    getLastInitial,
    renderClientRow,
    exportClientRecords,
    printClientRecords,
    shareClientRecords,
    buildClientShareSummary,
    copyTextToClipboard,
    updateClientPriority,
    getInitials,
    getAvatarAge,
    interpolateNumber,
    getAvatarHue,
    getAvatarPresentation,
    getClientDirectorySubtitle,
    getDependentsDisplay
  });
})();
