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
    const { ensureClientRecords, mergePendingClientRecords, getClientRecords } = getClientRecordsApi();
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
    const itemsDropdown = document.querySelector("[data-items-dropdown]");
    const itemsTrigger = document.querySelector("[data-items-trigger]");
    const itemsOptions = document.querySelectorAll("[data-items-option]");
    const paginationHost = document.getElementById("client-pagination-numbers");
    const prevPageButton = document.getElementById("client-prev-page");
    const nextPageButton = document.getElementById("client-next-page");
    const nameHeading = document.getElementById("client-table-heading-name");
    const insuredHeading = document.getElementById("client-table-heading-insured");
    const coverageHeading = document.getElementById("client-table-heading-coverage");
    const sourceHeading = document.getElementById("client-table-heading-source");
    const statusHeading = document.getElementById("client-table-heading-status");
    const addClientModal = document.querySelector("[data-add-client-modal]");
    const addClientModalCloseTargets = document.querySelectorAll("[data-add-client-modal-close]");

    if (!letterButtons.length || !rowsHost) {
      return;
    }

    ensureClientRecords();
    mergePendingClientRecords();
    let allRecords = getClientRecords();
    const selectedRecordIds = new Set();
    let activeLetter = "all";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0];
    const shouldRestoreClientStatus = navigationEntry?.type === "reload";
    let activeStatus = shouldRestoreClientStatus ? (sessionStorage.getItem(STORAGE_KEYS.clientStatus) || "all") : "all";
    const shouldRestoreClientView = navigationEntry?.type === "reload";
    const forcedClientView = sessionStorage.getItem(STORAGE_KEYS.clientViewIntent);
    let activeView = forcedClientView || (shouldRestoreClientView ? (sessionStorage.getItem(STORAGE_KEYS.clientView) || "individuals") : "individuals");
    const shouldResetItemsShown = sessionStorage.getItem(STORAGE_KEYS.clientItemsShownReset) === "true";
    const shouldRestoreItemsShown = navigationEntry?.type === "reload" && !shouldResetItemsShown;
    let itemsShown = Number(shouldRestoreItemsShown ? (sessionStorage.getItem(STORAGE_KEYS.clientItemsShown) || "15") : "15");
    let currentPage = 1;

    if (!shouldRestoreClientStatus) {
      sessionStorage.setItem(STORAGE_KEYS.clientStatus, "all");
    }

    if (!shouldRestoreClientView) {
      sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
    }

    if (!shouldRestoreItemsShown) {
      sessionStorage.setItem(STORAGE_KEYS.clientItemsShown, "15");
    }

    sessionStorage.removeItem(STORAGE_KEYS.clientViewIntent);
    sessionStorage.removeItem(STORAGE_KEYS.clientItemsShownReset);

    function syncItemsShownControls() {
      if (itemsTrigger) {
        itemsTrigger.textContent = `Items Shown (${itemsShown})`;
      }

      itemsOptions.forEach((option) => {
        option.classList.toggle("is-active", Number(option.dataset.itemsOption) === itemsShown);
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
        nameHeading.textContent = activeView === "households" ? "Household" : "Client";
      }
      if (insuredHeading) {
        insuredHeading.textContent = activeView === "households" ? "Members" : "Insured";
        insuredHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (coverageHeading) {
        coverageHeading.textContent = activeView === "households" ? "Coverage Gap" : "Coverage Amount";
        coverageHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (sourceHeading) {
        sourceHeading.textContent = activeView === "households" ? "Dependents" : "Source";
        sourceHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (statusHeading) {
        statusHeading.textContent = activeView === "households" ? "Policies" : "Client Status";
        statusHeading.classList.toggle("is-households-view", activeView === "households");
      }
    }

    function syncExportButtonState() {
      if (!exportButton) {
        return;
      }

      const hasSelection = selectedRecordIds.size > 0;
      exportButton.classList.toggle("is-active", hasSelection);
      exportButton.disabled = !hasSelection;
      exportButton.setAttribute("aria-disabled", String(!hasSelection));

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
      return allRecords.filter((record) => selectedRecordIds.has(record.id));
    }

    function getFilteredRecords() {
      const query = (searchField?.value || "").trim().toLowerCase();

      return allRecords.filter((record) => {
        const matchesView = record.viewType === activeView;
        const matchesLetter = activeLetter === "all" || getLastInitial(record.lastName) === activeLetter;
        const matchesStatus = activeStatus === "all" || record.statusGroup === activeStatus;
        const matchesSearch = !query
          || String(record.displayName || "").toLowerCase().includes(query)
          || String(record.summary || "").toLowerCase().includes(query)
          || String(record.caseRef || "").toLowerCase().includes(query);

        return matchesView && matchesLetter && matchesStatus && matchesSearch;
      });
    }

    function renderPagination(totalPages) {
      if (!paginationHost || !prevPageButton || !nextPageButton) {
        return;
      }

      prevPageButton.disabled = currentPage <= 1;
      nextPageButton.disabled = currentPage >= totalPages;
      paginationHost.innerHTML = "";

      for (let page = 1; page <= totalPages; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "client-page-number";
        if (page === currentPage) {
          button.classList.add("is-active");
        }
        button.textContent = String(page);
        button.addEventListener("click", () => {
          currentPage = page;
          renderDirectory();
        });
        paginationHost.appendChild(button);
      }
    }

    function renderDirectory() {
      allRecords = getClientRecords();
      const filteredRecords = getFilteredRecords();
      const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsShown));
      currentPage = Math.min(currentPage, totalPages);
      const startIndex = (currentPage - 1) * itemsShown;
      const visibleRecords = filteredRecords.slice(startIndex, startIndex + itemsShown);

      rowsHost.innerHTML = visibleRecords.map((record) => renderClientRow(record, selectedRecordIds.has(record.id))).join("");
      if (emptyState) {
        emptyState.hidden = visibleRecords.length > 0;
      }

      rowsHost.querySelectorAll("[data-client-checkbox]").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          const recordId = checkbox.dataset.clientCheckbox;
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
          if (!recordId) {
            return;
          }

          updateClientPriority(recordId, priority);
          renderDirectory();
        });
      });

      rowsHost.querySelectorAll("[data-client-open]").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target.closest("[data-client-checkbox]") || event.target.closest("[data-priority-dropdown]")) {
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

          if (event.target.closest("[data-client-checkbox]") || event.target.closest("[data-priority-dropdown]")) {
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
      renderPagination(totalPages);
      syncStatusButtons();
      syncExportButtonState();
    }

    letterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeLetter = button.dataset.clientLetter || "all";
        currentPage = 1;

        letterButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });

        renderDirectory();
      });
    });

    if (searchField) {
      searchField.addEventListener("input", () => {
        currentPage = 1;
        renderDirectory();
      });
    }

    viewButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.clientView === activeView);
      button.addEventListener("click", () => {
        activeView = button.dataset.clientView || "individuals";
        sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
        currentPage = 1;
        viewButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        renderDirectory();
      });
    });

    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeStatus = button.dataset.clientStatus || "all";
        sessionStorage.setItem(STORAGE_KEYS.clientStatus, activeStatus);
        currentPage = 1;
        renderDirectory();
      });
    });

    itemsOptions.forEach((option) => {
      option.addEventListener("click", () => {
        itemsShown = Number(option.dataset.itemsOption) || 15;
        sessionStorage.setItem(STORAGE_KEYS.clientItemsShown, String(itemsShown));
        currentPage = 1;
        syncItemsShownControls();
        renderDirectory();
        if (itemsDropdown) {
          itemsDropdown.classList.remove("is-open");
          itemsTrigger?.setAttribute("aria-expanded", "false");
        }
        option.blur();
        itemsTrigger?.blur();
      });
    });

    if (itemsDropdown && itemsTrigger) {
      itemsTrigger.addEventListener("click", () => {
        const isOpen = itemsDropdown.classList.toggle("is-open");
        itemsTrigger.setAttribute("aria-expanded", String(isOpen));
      });

      itemsDropdown.addEventListener("mouseleave", () => {
        itemsDropdown.classList.remove("is-open");
        itemsTrigger.setAttribute("aria-expanded", "false");
      });
    }

    if (prevPageButton) {
      prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          renderDirectory();
        }
      });
    }

    if (nextPageButton) {
      nextPageButton.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(getFilteredRecords().length / itemsShown));
        if (currentPage < totalPages) {
          currentPage += 1;
          renderDirectory();
        }
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
      if (target.closest("[data-export-dropdown]")) {
        return;
      }

      exportDropdown?.classList.remove("is-open");
      exportButton?.setAttribute("aria-expanded", "false");

      if (target.closest("[data-priority-dropdown]")) {
        return;
      }

      rowsHost.querySelectorAll("[data-priority-dropdown].is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector("[data-priority-trigger]")?.setAttribute("aria-expanded", "false");
        dropdown.closest(".client-table")?.classList.remove("is-priority-open");
      });
    });

    syncItemsShownControls();
    renderDirectory();
  }

  function initializeClientDirectoryNavLinks() {
    const clientDirectoryNavLinks = document.querySelectorAll("[data-client-directory-nav]");

    clientDirectoryNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        sessionStorage.setItem(STORAGE_KEYS.clientItemsShownReset, "true");
      });
    });
  }

  function buildStatusCounts(records, activeView) {
    const { getClientLifecycleStatus } = getDirectoryHelpers();

    return records
      .filter((record) => record.viewType === activeView)
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

  function renderClientRow(record, isSelected) {
    const {
      getClientStatusDisplay,
      normalizePriority,
      formatDateForDirectory,
      getDirectoryCreatedDate,
      getPoliciesDisplay,
      formatCurrencyCompact,
      getPriorityDisplay
    } = getDirectoryHelpers();
    const clientStatus = getClientStatusDisplay(record);
    const priority = normalizePriority(record.priority);
    const isHouseholdAvatar = record.viewType === "households";
    const avatarClasses = `client-avatar${isHouseholdAvatar ? " client-avatar-household" : ""}`;
    const avatarPresentation = isHouseholdAvatar ? null : getAvatarPresentation(record.age, record.dateOfBirth);
    const avatarStyle = avatarPresentation
      ? ` style="background: ${avatarPresentation.background}; color: ${avatarPresentation.color};"`
      : "";

    return `
      <div class="client-table client-table-clickable" role="row" tabindex="0" data-client-open="${record.id}">
        <div class="client-table-cell client-table-cell-check"><input type="checkbox" aria-label="Select ${record.displayName}" data-client-checkbox="${record.id}" ${isSelected ? "checked" : ""}></div>
        <div class="client-table-cell client-table-cell-client">
          <span class="${avatarClasses}"${avatarStyle}>${getInitials(record.displayName, record.viewType, record.lastName)}</span>
          <div>
            <strong>${record.displayName}</strong>
            <span>${getClientDirectorySubtitle(record)}</span>
          </div>
        </div>
        <div class="client-table-cell">${record.caseRef}</div>
        <div class="client-table-cell client-table-cell-last-review">${formatDateForDirectory(getDirectoryCreatedDate(record))}</div>
        <div class="client-table-cell client-table-cell-insured-value">${record.insured}</div>
        <div class="client-table-cell client-table-cell-source-value${record.viewType === "households" ? " is-households-view" : ""}">${record.viewType === "households" ? getDependentsDisplay(record) : record.source}</div>
        <div class="client-table-cell client-table-cell-status-value${record.viewType === "households" ? " is-households-view" : ""}">${record.viewType === "households" ? getPoliciesDisplay(record) : clientStatus}</div>
        <div class="client-table-cell client-table-cell-coverage-amount-value">${formatCurrencyCompact(record.uncoveredGap || 0)}</div>
        <div class="client-table-cell client-table-cell-value client-table-cell-priority-value">
          <div class="client-priority-dropdown" data-priority-dropdown="${record.id}">
            <button class="client-priority-button ${priority ? `client-priority-button-${priority}` : "client-priority-button-unset"}" type="button" data-priority-trigger aria-expanded="false">
              ${getPriorityDisplay(priority)}
            </button>
            <div class="client-priority-menu">
              <button class="client-priority-option client-priority-option-low ${priority === "low" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="low">Low</button>
              <button class="client-priority-option client-priority-option-medium ${priority === "medium" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="medium">Medium</button>
              <button class="client-priority-option client-priority-option-high ${priority === "high" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="high">High</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportClientRecords(records) {
    const { formatDateForDirectory, getDirectoryCreatedDate, getClientStatusDisplay, formatCurrencyCompact, getPriorityDisplay } = getDirectoryHelpers();
    const header = ["Client", "Case Ref", "Date Created", "Insured", "Source", "Client Status", "Coverage Amount", "Priority"];
    const rows = records.map((record) => [
      record.displayName,
      record.caseRef,
      formatDateForDirectory(getDirectoryCreatedDate(record)),
      record.insured,
      record.source,
      getClientStatusDisplay(record),
      formatCurrencyCompact(record.coverageAmount),
      getPriorityDisplay(record.priority)
    ]);
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
    const { escapeHtml, formatDateForDirectory, getDirectoryCreatedDate, getClientStatusDisplay, formatCurrencyCompact, getPriorityDisplay } = getDirectoryHelpers();
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1120,height=860");
    if (!printWindow) {
      return;
    }

    const rowsMarkup = records.map((record) => `
      <tr>
        <td>${escapeHtml(record.displayName)}</td>
        <td>${escapeHtml(record.caseRef)}</td>
        <td>${escapeHtml(formatDateForDirectory(getDirectoryCreatedDate(record)))}</td>
        <td>${escapeHtml(record.insured)}</td>
        <td>${escapeHtml(record.source)}</td>
          <td>${escapeHtml(getClientStatusDisplay(record))}</td>
        <td>${escapeHtml(formatCurrencyCompact(record.coverageAmount))}</td>
        <td>${escapeHtml(getPriorityDisplay(record.priority))}</td>
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
                <th>Date Created</th>
                <th>Insured</th>
                <th>Source</th>
                <th>Client Status</th>
                <th>Coverage Amount</th>
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
    const { getClientStatusDisplay, formatCurrencyCompact, getPriorityDisplay } = getDirectoryHelpers();
    const lines = records.map((record) => (
      `${record.displayName} | ${record.caseRef} | ${getClientStatusDisplay(record)} | ${formatCurrencyCompact(record.coverageAmount)} | ${getPriorityDisplay(record.priority)}`
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
    const prefersSoftAvatars = Boolean(document.querySelector(".client-directory-shell-layout.is-a11y-soft-avatars"));
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
    const assignmentName = String(record.householdName || "").trim();
    if (assignmentName) {
      return assignmentName;
    }

    if (record.viewType === "households" || record.viewType === "companies") {
      return String(record.summary || "").trim() || "Profile";
    }

    return "No household linked";
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
    initializeClientDirectoryNavLinks,
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
