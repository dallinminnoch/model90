(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: PMI asset records controller.
  // Purpose: collect repeatable value-only assetRecords[] rows from PMI.
  // Non-goals: no treatment assumptions, no offsetAssets writes, no method
  // calculation calls, and no storage access.

  let generatedAssetIdCounter = 0;
  let activeController = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function toOptionalNumber(value) {
    const normalized = normalizeString(value).replace(/,/g, "");
    if (!normalized) {
      return null;
    }

    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function clonePlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return Object.assign({}, value);
  }

  function getAssetLibraryApi() {
    return lensAnalysis.assetLibrary && typeof lensAnalysis.assetLibrary === "object"
      ? lensAnalysis.assetLibrary
      : {};
  }

  function getAssetTaxonomyApi() {
    return lensAnalysis.assetTaxonomy && typeof lensAnalysis.assetTaxonomy === "object"
      ? lensAnalysis.assetTaxonomy
      : {};
  }

  function getLibraryEntries() {
    const assetLibrary = getAssetLibraryApi();
    if (typeof assetLibrary.getAssetLibraryEntries === "function") {
      return assetLibrary.getAssetLibraryEntries();
    }

    return Array.isArray(assetLibrary.ASSET_LIBRARY_ENTRIES)
      ? assetLibrary.ASSET_LIBRARY_ENTRIES.slice()
      : [];
  }

  function findLibraryEntry(typeKey) {
    const assetLibrary = getAssetLibraryApi();
    if (typeof assetLibrary.findAssetLibraryEntry === "function") {
      return assetLibrary.findAssetLibraryEntry(typeKey);
    }

    return getLibraryEntries().find(function (entry) {
      return entry && entry.typeKey === typeKey;
    }) || null;
  }

  function getTaxonomyCategory(categoryKey) {
    const taxonomy = getAssetTaxonomyApi();
    const categories = Array.isArray(taxonomy.DEFAULT_ASSET_CATEGORIES)
      ? taxonomy.DEFAULT_ASSET_CATEGORIES
      : [];
    return categories.find(function (category) {
      return category && category.categoryKey === categoryKey;
    }) || null;
  }

  function getCategoryLabel(categoryKey) {
    const category = getTaxonomyCategory(categoryKey);
    return normalizeString(category && category.label) || normalizeString(categoryKey) || "Asset";
  }

  function generateAssetId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return "asset_" + global.crypto.randomUUID().replace(/-/g, "_");
    }

    generatedAssetIdCounter += 1;
    return "asset_" + Date.now() + "_" + generatedAssetIdCounter;
  }

  function createAssetRecordFromLibraryEntry(entry) {
    const safeEntry = entry && typeof entry === "object" ? entry : {};
    const typeKey = normalizeString(safeEntry.typeKey);
    const categoryKey = normalizeString(safeEntry.categoryKey);
    const label = normalizeString(safeEntry.label) || typeKey || "Added Asset";

    return {
      assetId: generateAssetId(),
      categoryKey,
      typeKey,
      label,
      currentValue: null,
      sourceKey: null,
      isDefaultAsset: false,
      isCustomAsset: safeEntry.isCustomType === true || categoryKey === "otherCustomAsset",
      notes: null,
      metadata: {
        sourceType: "user-input",
        source: "asset-library",
        libraryEntryKey: typeKey
      }
    };
  }

  function normalizeRecordForUi(record, index) {
    const safeRecord = record && typeof record === "object" ? record : {};
    const entry = findLibraryEntry(safeRecord.typeKey);
    const categoryKey = normalizeString(safeRecord.categoryKey || (entry && entry.categoryKey));
    const typeKey = normalizeString(safeRecord.typeKey || (entry && entry.typeKey));
    const label = normalizeString(safeRecord.label || (entry && entry.label));

    if (!categoryKey || !typeKey || !label) {
      return null;
    }

    const metadata = clonePlainObject(safeRecord.metadata);
    return {
      assetId: normalizeString(safeRecord.assetId) || generateAssetId(),
      categoryKey,
      typeKey,
      label,
      currentValue: toOptionalNumber(safeRecord.currentValue),
      sourceKey: null,
      isDefaultAsset: safeRecord.isDefaultAsset === true,
      isCustomAsset: safeRecord.isCustomAsset === true || categoryKey === "otherCustomAsset",
      notes: normalizeString(safeRecord.notes) || null,
      metadata: Object.assign({
        sourceType: "user-input",
        source: "asset-library",
        libraryEntryKey: typeKey
      }, metadata, {
        sourceIndex: Number.isInteger(index) ? index : null
      })
    };
  }

  function createSearchText(entry) {
    return [
      entry.label,
      entry.typeKey,
      entry.categoryKey,
      entry.group,
      entry.description
    ].concat(Array.isArray(entry.aliases) ? entry.aliases : [])
      .map(function (value) {
        return normalizeString(value).toLowerCase();
      })
      .filter(Boolean)
      .join(" ");
  }

  function matchesSearch(entry, query) {
    const normalizedQuery = normalizeString(query).toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return createSearchText(entry).indexOf(normalizedQuery) !== -1;
  }

  function formatValueForInput(value) {
    if (value == null || !Number.isFinite(Number(value))) {
      return "";
    }

    return String(Number(value));
  }

  function renderShell(root) {
    if (!root || root.dataset.pmiAssetRecordsInitialized === "true") {
      return;
    }

    root.innerHTML = `
      <div class="profile-form-section-heading">
        <div>
          <h2>Additional Assets</h2>
          <p class="helper-text">Add specific asset or account rows from the asset library. Values only; treatment is managed in Analysis Setup.</p>
        </div>
      </div>
      <div class="profile-dependent-builder" data-pmi-asset-records-builder>
        <div class="profile-dependent-list" data-pmi-asset-records-list></div>
        <button class="button tertiary-button profile-dependent-add-button" type="button" data-pmi-asset-records-add>Add Asset</button>
      </div>
    `;
    root.dataset.pmiAssetRecordsInitialized = "true";
  }

  function createModal(controller) {
    const documentRef = controller.documentRef;
    if (!documentRef || !documentRef.body) {
      return null;
    }

    const modal = documentRef.createElement("div");
    modal.className = "profile-search-modal";
    modal.setAttribute("data-pmi-asset-library-modal", "");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="profile-search-modal-backdrop" data-pmi-asset-library-close></div>
      <div class="profile-search-modal-panel" role="dialog" aria-modal="true" aria-labelledby="pmi-asset-library-title">
        <button class="profile-search-modal-close" type="button" aria-label="Close asset library" data-pmi-asset-library-close>x</button>
        <div class="profile-search-modal-header">
          <h2 id="pmi-asset-library-title">Add Asset</h2>
        </div>
        <div class="field-group full-width">
          <label for="pmi-asset-library-search">Search</label>
          <input id="pmi-asset-library-search" type="text" placeholder="Search asset types" data-pmi-asset-library-search>
        </div>
        <div class="profile-search-results" data-pmi-asset-library-results></div>
      </div>
    `;

    documentRef.body.appendChild(modal);
    return modal;
  }

  function initPmiAssetRecords(options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const root = typeof safeOptions.root === "string"
      ? document.querySelector(safeOptions.root)
      : safeOptions.root;

    if (!root) {
      return null;
    }

    renderShell(root);

    const controller = {
      root,
      documentRef: root.ownerDocument || document,
      records: [],
      list: root.querySelector("[data-pmi-asset-records-list]"),
      addButton: root.querySelector("[data-pmi-asset-records-add]"),
      modal: null,
      searchInput: null,
      results: null
    };

    function syncRecordsFromDom() {
      if (!controller.list) {
        return;
      }

      const previousById = controller.records.reduce(function (map, record) {
        if (record.assetId) {
          map[record.assetId] = record;
        }
        return map;
      }, {});

      controller.records = Array.from(controller.list.querySelectorAll("[data-pmi-asset-record-entry]"))
        .map(function (row) {
          const assetId = normalizeString(row.getAttribute("data-pmi-asset-id"));
          const existingRecord = previousById[assetId] || {};
          const labelInput = row.querySelector("[data-pmi-asset-record-label]");
          const valueInput = row.querySelector("[data-pmi-asset-record-value]");
          const label = normalizeString(labelInput && labelInput.value) || existingRecord.label || "Added Asset";

          return Object.assign({}, existingRecord, {
            assetId: existingRecord.assetId || assetId || generateAssetId(),
            label,
            currentValue: toOptionalNumber(valueInput && valueInput.value)
          });
        });
    }

    function renderRows() {
      if (!controller.list) {
        return;
      }

      if (!controller.records.length) {
        controller.list.innerHTML = `
          <div class="profile-search-results-empty" data-pmi-asset-records-empty>No additional assets added.</div>
        `;
        return;
      }

      controller.list.innerHTML = controller.records.map(function (record) {
        const categoryLabel = getCategoryLabel(record.categoryKey);
        return `
          <div class="profile-dependent-entry" data-pmi-asset-record-entry data-pmi-asset-id="${escapeHtml(record.assetId)}">
            <div class="profile-dependent-entry-header">
              <span class="profile-dependent-entry-label">${escapeHtml(record.label)}</span>
              <button class="profile-dependent-entry-remove" type="button" data-pmi-asset-record-remove>Remove</button>
            </div>
            <div class="form-grid">
              <div class="field-group">
                <label>Account / nickname</label>
                <input class="profile-yes-no-field" data-pmi-asset-record-label type="text" value="${escapeHtml(record.label)}">
              </div>
              <div class="field-group">
                <label>Category</label>
                <input class="profile-yes-no-field" type="text" value="${escapeHtml(categoryLabel)}" readonly aria-readonly="true">
              </div>
              <div class="field-group">
                <label>Current Value</label>
                <div class="profile-currency-field">
                  <input data-pmi-asset-record-value type="number" min="0" step="1000" value="${escapeHtml(formatValueForInput(record.currentValue))}">
                  <span class="profile-currency-suffix">USD</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    function renderResults() {
      if (!controller.results) {
        return;
      }

      const query = controller.searchInput ? controller.searchInput.value : "";
      const entries = getLibraryEntries().filter(function (entry) {
        return matchesSearch(entry, query);
      });

      if (!entries.length) {
        controller.results.innerHTML = '<div class="profile-search-results-empty">No matching asset types found.</div>';
        return;
      }

      controller.results.innerHTML = entries.map(function (entry) {
        return `
          <button class="profile-search-result-button" type="button" data-pmi-asset-library-type-key="${escapeHtml(entry.typeKey)}">
            <strong>${escapeHtml(entry.label)}</strong>
            <span>${escapeHtml(getCategoryLabel(entry.categoryKey))} - ${escapeHtml(entry.group || "Asset")}</span>
            <span>${escapeHtml(entry.description || "")}</span>
          </button>
        `;
      }).join("");
    }

    function closeModal() {
      if (controller.modal) {
        controller.modal.hidden = true;
      }
    }

    function openModal() {
      if (!controller.modal) {
        controller.modal = createModal(controller);
        if (!controller.modal) {
          return;
        }

        controller.searchInput = controller.modal.querySelector("[data-pmi-asset-library-search]");
        controller.results = controller.modal.querySelector("[data-pmi-asset-library-results]");

        controller.modal.addEventListener("click", function (event) {
          if (event.target.closest("[data-pmi-asset-library-close]")) {
            closeModal();
            return;
          }

          const resultButton = event.target.closest("[data-pmi-asset-library-type-key]");
          if (!resultButton) {
            return;
          }

          const entry = findLibraryEntry(resultButton.getAttribute("data-pmi-asset-library-type-key"));
          if (!entry) {
            return;
          }

          syncRecordsFromDom();
          const record = createAssetRecordFromLibraryEntry(entry);
          controller.records.push(record);
          renderRows();
          closeModal();

          const row = controller.list
            ? Array.from(controller.list.querySelectorAll("[data-pmi-asset-record-entry]")).find(function (candidate) {
              return normalizeString(candidate.getAttribute("data-pmi-asset-id")) === record.assetId;
            })
            : null;
          const valueInput = row && row.querySelector("[data-pmi-asset-record-value]");
          if (valueInput && typeof valueInput.focus === "function") {
            valueInput.focus();
          }
        });

        controller.searchInput?.addEventListener("input", renderResults);
        controller.modal.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            closeModal();
          }
        });
      }

      if (controller.searchInput) {
        controller.searchInput.value = "";
      }
      renderResults();
      controller.modal.hidden = false;
      controller.searchInput?.focus();
    }

    function hydrateAssetRecords(records) {
      controller.records = Array.isArray(records)
        ? records.map(normalizeRecordForUi).filter(Boolean)
        : [];
      renderRows();
    }

    function serializeAssetRecords() {
      syncRecordsFromDom();
      return controller.records
        .map(function (record) {
          const currentValue = toOptionalNumber(record.currentValue);
          if (currentValue == null || currentValue < 0) {
            return null;
          }

          return {
            assetId: normalizeString(record.assetId) || generateAssetId(),
            categoryKey: normalizeString(record.categoryKey),
            typeKey: normalizeString(record.typeKey),
            label: normalizeString(record.label) || normalizeString(record.typeKey) || "Added Asset",
            currentValue,
            sourceKey: null,
            isDefaultAsset: false,
            isCustomAsset: record.isCustomAsset === true || normalizeString(record.categoryKey) === "otherCustomAsset",
            notes: normalizeString(record.notes) || null,
            metadata: Object.assign({
              sourceType: "user-input",
              source: "asset-library",
              libraryEntryKey: normalizeString(record.typeKey)
            }, clonePlainObject(record.metadata))
          };
        })
        .filter(Boolean);
    }

    controller.hydrateAssetRecords = hydrateAssetRecords;
    controller.serializeAssetRecords = serializeAssetRecords;

    controller.addButton?.addEventListener("click", openModal);
    controller.list?.addEventListener("click", function (event) {
      const removeButton = event.target.closest("[data-pmi-asset-record-remove]");
      if (!removeButton) {
        return;
      }

      const row = removeButton.closest("[data-pmi-asset-record-entry]");
      const assetId = normalizeString(row && row.getAttribute("data-pmi-asset-id"));
      controller.records = controller.records.filter(function (record) {
        return record.assetId !== assetId;
      });
      renderRows();
    });

    controller.list?.addEventListener("input", function (event) {
      if (!event.target.closest("[data-pmi-asset-record-entry]")) {
        return;
      }

      syncRecordsFromDom();
    });

    hydrateAssetRecords([]);
    activeController = controller;
    return controller;
  }

  function hydrateAssetRecords(records) {
    if (activeController && typeof activeController.hydrateAssetRecords === "function") {
      activeController.hydrateAssetRecords(records);
    }
  }

  function serializeAssetRecords() {
    return activeController && typeof activeController.serializeAssetRecords === "function"
      ? activeController.serializeAssetRecords()
      : [];
  }

  lensAnalysis.pmiAssetRecords = {
    initPmiAssetRecords,
    hydrateAssetRecords,
    serializeAssetRecords,
    createAssetRecordFromLibraryEntry
  };
})(window);
