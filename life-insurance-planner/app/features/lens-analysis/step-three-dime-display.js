(function () {
  const DIME_SETTINGS = Object.freeze({
    dimeIncomeYears: 10,
    includeExistingCoverageOffset: true,
    includeOffsetAssets: false
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

  function renderAssumptionList(assumptions) {
    return `
      <ul class="compact-list">
        <li><span>DIME income years</span><strong>${escapeHtml(assumptions.dimeIncomeYears)}</strong></li>
        <li><span>Existing coverage offset</span><strong>${assumptions.includeExistingCoverageOffset ? "Included" : "Excluded"}</strong></li>
        <li><span>Offset assets</span><strong>${assumptions.includeOffsetAssets ? "Included" : "Excluded"}</strong></li>
      </ul>
    `;
  }

  function renderWarnings(warnings) {
    const messages = (Array.isArray(warnings) ? warnings : [])
      .map(normalizeWarningMessage)
      .filter(Boolean);

    if (!messages.length) {
      return "";
    }

    return `
      <div class="section-label">DIME Notes</div>
      <ul class="compact-list">
        ${messages.map(function (message) {
          return `<li><span>${escapeHtml(message)}</span></li>`;
        }).join("")}
      </ul>
    `;
  }

  function renderDimeResult(host, dimeResult, builderWarnings) {
    const components = dimeResult.components || {};
    const offsets = dimeResult.commonOffsets || {};
    const assumptions = dimeResult.assumptions || {};
    const warnings = [
      ...(Array.isArray(builderWarnings) ? builderWarnings : []),
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
      ${renderAssumptionList(assumptions)}
      ${renderWarnings(warnings)}
    `;
  }

  function initializeStepThreeDimeDisplay() {
    const host = document.querySelector("[data-step-three-dime-analysis]");
    if (!host) {
      return;
    }

    const lensAnalysis = window.LensApp?.lensAnalysis || {};
    const buildLensModelFromSavedProtectionModeling = lensAnalysis.buildLensModelFromSavedProtectionModeling;
    const runDimeAnalysis = lensAnalysis.analysisMethods?.runDimeAnalysis;

    if (typeof buildLensModelFromSavedProtectionModeling !== "function") {
      renderMessage(host, "DIME Analysis", "Lens saved-data builder is unavailable.");
      return;
    }

    if (typeof runDimeAnalysis !== "function") {
      renderMessage(host, "DIME Analysis", "DIME analysis method is unavailable.");
      return;
    }

    const profileRecord = resolveLinkedProfileRecord();
    if (!profileRecord) {
      renderMessage(host, "DIME Analysis", "Link a client profile before running the DIME display.");
      return;
    }

    const protectionModelingPayload = getProtectionModelingPayload(profileRecord);
    if (!hasProtectionModelingSource(protectionModelingPayload)) {
      renderMessage(host, "DIME Analysis", "No saved protection modeling data was found for this linked profile.");
      return;
    }

    try {
          const builderResult = buildLensModelFromSavedProtectionModeling({
            profileRecord,
            protectionModelingPayload,
            taxConfig: createSavedDataTaxConfig()
          });

      if (!builderResult?.lensModel) {
        renderMessage(host, "DIME Analysis", "The saved Lens model could not be built for this profile.");
        return;
      }

      const dimeResult = runDimeAnalysis(builderResult.lensModel, DIME_SETTINGS);
      renderDimeResult(host, dimeResult, builderResult.warnings);
    } catch (error) {
      renderMessage(host, "DIME Analysis", "DIME display could not be prepared from the saved Lens model.");
      console.error("Step 3 DIME display failed", error);
    }
  }

  document.addEventListener("DOMContentLoaded", initializeStepThreeDimeDisplay);
})();
