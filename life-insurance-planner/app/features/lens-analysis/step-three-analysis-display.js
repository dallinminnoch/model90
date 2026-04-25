(function () {
  const DIME_SETTINGS = Object.freeze({
    dimeIncomeYears: 10,
    includeExistingCoverageOffset: true,
    includeOffsetAssets: false
  });

  const NEEDS_SETTINGS = Object.freeze({
    includeExistingCoverageOffset: true,
    includeOffsetAssets: true,
    includeTransitionNeeds: true,
    includeDiscretionarySupport: false
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "$0";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(number);
  }

  function formatDisplayValue(value) {
    if (typeof value === "boolean") {
      return value ? "Included" : "Excluded";
    }

    if (value == null || value === "") {
      return "Not set";
    }

    return String(value);
  }

  function normalizeWarningMessage(warning) {
    if (!warning || typeof warning !== "object") {
      return "";
    }

    return String(warning.message || warning.code || "").trim();
  }

  function renderMessage(host, title, message) {
    if (!host) {
      return;
    }

    host.innerHTML = `
      <div class="section-label">${escapeHtml(title)}</div>
      <p class="card-copy">${escapeHtml(message)}</p>
    `;
  }

  function renderMessageToHosts(hosts, title, message) {
    hosts.forEach(function (host) {
      renderMessage(host, title, message);
    });
  }

  function getUrlValue(params, fieldNames) {
    const names = Array.isArray(fieldNames) ? fieldNames : [];
    for (let index = 0; index < names.length; index += 1) {
      const value = String(params.get(names[index]) || "").trim();
      if (value) {
        return value;
      }
    }

    return "";
  }

  function resolveLinkedProfileRecord() {
    const clientRecords = window.LensApp?.clientRecords || {};
    const getCurrentLinkedRecord = clientRecords.getCurrentLinkedRecord;
    const getClientRecordByReference = clientRecords.getClientRecordByReference;
    if (typeof getCurrentLinkedRecord !== "function") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const urlCaseRef = getUrlValue(params, ["caseRef", "profileCaseRef", "linkedCaseRef"]);
    const urlRecordId = getUrlValue(params, ["profileId", "recordId", "id", "linkedRecordId"]);
    if ((urlCaseRef || urlRecordId) && typeof getClientRecordByReference === "function") {
      return getClientRecordByReference(urlRecordId, urlCaseRef);
    }

    return getCurrentLinkedRecord(urlCaseRef, urlRecordId);
  }

  function getProtectionModelingPayload(profileRecord) {
    if (profileRecord?.protectionModeling && typeof profileRecord.protectionModeling === "object") {
      return profileRecord.protectionModeling;
    }

    const entries = Array.isArray(profileRecord?.protectionModelingEntries)
      ? profileRecord.protectionModelingEntries
      : [];
    return entries.length ? entries[entries.length - 1] : null;
  }

  function hasProtectionModelingSource(payload) {
    return Boolean(
      payload
      && typeof payload === "object"
      && payload.data
      && typeof payload.data === "object"
      && Object.keys(payload.data).length
    );
  }

  function createSavedDataTaxConfig() {
    const incomeTaxCalculations = window.LensApp?.lensAnalysis?.incomeTaxCalculations || {};
    if (typeof incomeTaxCalculations.createPmiTaxConfigFromStorage !== "function") {
      return null;
    }

    return incomeTaxCalculations.createPmiTaxConfigFromStorage({
      storage: window.localStorage,
      taxUtils: window.LensPmiTaxUtils || null
    });
  }

  function renderMoneyList(items) {
    return `
      <ul class="compact-list">
        ${items.map(function (item) {
          return `<li><span>${escapeHtml(item.label)}</span><strong>${formatCurrency(item.value)}</strong></li>`;
        }).join("")}
      </ul>
    `;
  }

  function renderAssumptionList(items) {
    return `
      <ul class="compact-list">
        ${items.map(function (item) {
          return `<li><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(formatDisplayValue(item.value))}</strong></li>`;
        }).join("")}
      </ul>
    `;
  }

  function splitWarnings(warnings) {
    return (Array.isArray(warnings) ? warnings : []).reduce(function (result, warning) {
      const message = normalizeWarningMessage(warning);
      if (!message) {
        return result;
      }

      if (warning?.severity === "info") {
        result.notes.push(message);
      } else {
        result.warnings.push(message);
      }

      return result;
    }, { warnings: [], notes: [] });
  }

  function renderWarningsAndNotes(title, warnings) {
    const split = splitWarnings(warnings);
    const warningMarkup = split.warnings.length
      ? `
        <div class="section-label">${escapeHtml(title)} Warnings</div>
        <ul class="compact-list">
          ${split.warnings.map(function (message) {
            return `<li><span>${escapeHtml(message)}</span></li>`;
          }).join("")}
        </ul>
      `
      : "";
    const notesMarkup = split.notes.length
      ? `
        <details>
          <summary>${escapeHtml(title)} Notes</summary>
          <ul class="compact-list">
            ${split.notes.map(function (message) {
              return `<li><span>${escapeHtml(message)}</span></li>`;
            }).join("")}
          </ul>
        </details>
      `
      : "";

    return warningMarkup + notesMarkup;
  }

  function renderDimeResult(host, dimeResult, sharedWarnings) {
    const components = dimeResult.components || {};
    const offsets = dimeResult.commonOffsets || {};
    const assumptions = dimeResult.assumptions || {};
    const warnings = [
      ...(Array.isArray(sharedWarnings) ? sharedWarnings : []),
      ...(Array.isArray(dimeResult.warnings) ? dimeResult.warnings : [])
    ];

    host.innerHTML = `
      <div class="section-label">DIME Analysis</div>
      <div class="card-value">${formatCurrency(dimeResult.netCoverageGap)}</div>
      <p class="card-copy">Net coverage gap from saved linked PMI data.</p>
      ${renderMoneyList([
        { label: "Gross DIME Need", value: dimeResult.grossNeed },
        { label: "Existing Coverage Offset", value: offsets.existingCoverageOffset },
        { label: "Asset Offset", value: offsets.assetOffset },
        { label: "Net Coverage Gap", value: dimeResult.netCoverageGap }
      ])}
      <div class="section-label">DIME Components</div>
      ${renderMoneyList([
        { label: "Debt", value: components.debt },
        { label: "Income", value: components.income },
        { label: "Mortgage", value: components.mortgage },
        { label: "Education", value: components.education }
      ])}
      <div class="section-label">Assumptions</div>
      ${renderAssumptionList([
        { label: "DIME income years", value: assumptions.dimeIncomeYears },
        { label: "Existing coverage offset", value: assumptions.includeExistingCoverageOffset },
        { label: "Offset assets", value: assumptions.includeOffsetAssets }
      ])}
      ${renderWarningsAndNotes("DIME", warnings)}
    `;
  }

  function renderNeedsResult(host, needsResult, sharedWarnings) {
    const components = needsResult.components || {};
    const offsets = needsResult.commonOffsets || {};
    const assumptions = needsResult.assumptions || {};
    const warnings = [
      ...(Array.isArray(sharedWarnings) ? sharedWarnings : []),
      ...(Array.isArray(needsResult.warnings) ? needsResult.warnings : [])
    ];

    host.innerHTML = `
      <div class="section-label">Needs Analysis</div>
      <div class="card-value">${formatCurrency(needsResult.netCoverageGap)}</div>
      <p class="card-copy">Net coverage gap from the detailed needs methodology.</p>
      ${renderMoneyList([
        { label: "Gross Needs Analysis Need", value: needsResult.grossNeed },
        { label: "Existing Coverage Offset", value: offsets.existingCoverageOffset },
        { label: "Asset Offset", value: offsets.assetOffset },
        { label: "Survivor Income Offset", value: offsets.survivorIncomeOffset },
        { label: "Net Coverage Gap", value: needsResult.netCoverageGap }
      ])}
      <div class="section-label">Needs Components</div>
      ${renderMoneyList([
        { label: "Debt Payoff", value: components.debtPayoff },
        { label: "Essential Support", value: components.essentialSupport },
        { label: "Education", value: components.education },
        { label: "Final Expenses", value: components.finalExpenses },
        { label: "Transition Needs", value: components.transitionNeeds },
        { label: "Discretionary Support", value: components.discretionarySupport }
      ])}
      <div class="section-label">Assumptions</div>
      ${renderAssumptionList([
        { label: "Support duration years", value: assumptions.needsSupportDurationYears },
        { label: "Support duration source", value: assumptions.supportDurationSource },
        { label: "Existing coverage offset", value: assumptions.includeExistingCoverageOffset },
        { label: "Offset assets", value: assumptions.includeOffsetAssets },
        { label: "Transition needs", value: assumptions.includeTransitionNeeds },
        { label: "Discretionary support", value: assumptions.includeDiscretionarySupport },
        { label: "Survivor income offset", value: assumptions.includeSurvivorIncomeOffset }
      ])}
      ${renderWarningsAndNotes("Needs", warnings)}
    `;
  }

  function initializeStepThreeAnalysisDisplay() {
    const dimeHost = document.querySelector("[data-step-three-dime-analysis]");
    const needsHost = document.querySelector("[data-step-three-needs-analysis]");
    const hosts = [dimeHost, needsHost].filter(Boolean);
    if (!hosts.length) {
      return;
    }

    const lensAnalysis = window.LensApp?.lensAnalysis || {};
    const buildLensModelFromSavedProtectionModeling = lensAnalysis.buildLensModelFromSavedProtectionModeling;
    const runDimeAnalysis = lensAnalysis.analysisMethods?.runDimeAnalysis;
    const runNeedsAnalysis = lensAnalysis.analysisMethods?.runNeedsAnalysis;

    if (typeof buildLensModelFromSavedProtectionModeling !== "function") {
      renderMessageToHosts(hosts, "Analysis Methods", "Lens saved-data builder is unavailable.");
      return;
    }

    if (typeof runDimeAnalysis !== "function" || typeof runNeedsAnalysis !== "function") {
      renderMessageToHosts(hosts, "Analysis Methods", "One or more analysis methods are unavailable.");
      return;
    }

    const profileRecord = resolveLinkedProfileRecord();
    if (!profileRecord) {
      renderMessageToHosts(hosts, "Analysis Methods", "Link a client profile before running the analysis display.");
      return;
    }

    const protectionModelingPayload = getProtectionModelingPayload(profileRecord);
    if (!hasProtectionModelingSource(protectionModelingPayload)) {
      renderMessageToHosts(hosts, "Analysis Methods", "No saved protection modeling data was found for this linked profile.");
      return;
    }

    try {
      const builderResult = buildLensModelFromSavedProtectionModeling({
        profileRecord,
        protectionModelingPayload,
        taxConfig: createSavedDataTaxConfig()
      });

      if (!builderResult?.lensModel) {
        renderMessageToHosts(hosts, "Analysis Methods", "The saved Lens model could not be built for this profile.");
        return;
      }

      if (dimeHost) {
        renderDimeResult(
          dimeHost,
          runDimeAnalysis(builderResult.lensModel, DIME_SETTINGS),
          builderResult.warnings
        );
      }

      if (needsHost) {
        renderNeedsResult(
          needsHost,
          runNeedsAnalysis(builderResult.lensModel, NEEDS_SETTINGS),
          builderResult.warnings
        );
      }
    } catch (error) {
      renderMessageToHosts(hosts, "Analysis Methods", "Step 3 analysis display could not be prepared from the saved Lens model.");
      console.error("Step 3 analysis display failed", error);
    }
  }

  document.addEventListener("DOMContentLoaded", initializeStepThreeAnalysisDisplay);
})();
