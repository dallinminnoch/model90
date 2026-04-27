(function (window) {
  const root = window.LensApp = window.LensApp || {};
  const lensAnalysis = root.lensAnalysis = root.lensAnalysis || {};

  const UNAVAILABLE_COPY = "Not available";
  const EMPTY_MESSAGE = "Not available until income and survivor inputs are completed.";

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function cloneSettings(settings) {
    return isPlainObject(settings) ? { ...settings } : {};
  }

  function createFallbackAnalysisMethodSettings(analysisSettingsAdapter) {
    const adapter = isPlainObject(analysisSettingsAdapter) ? analysisSettingsAdapter : {};
    return {
      needsAnalysisSettings: cloneSettings(adapter.DEFAULT_NEEDS_ANALYSIS_SETTINGS),
      warnings: [
        {
          code: "analysis-settings-adapter-unavailable",
          message: "Analysis settings adapter was unavailable; current default Needs settings were used.",
          severity: "info",
          sourcePaths: ["LensApp.lensAnalysis.analysisSettingsAdapter"]
        }
      ],
      trace: []
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toOptionalNumber(value) {
    if (value === "" || value == null) {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getPath(source, path) {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce(function (current, key) {
        return current && typeof current === "object" ? current[key] : undefined;
      }, source);
  }

  function formatCurrency(value) {
    const number = toOptionalNumber(value);
    if (number == null) {
      return UNAVAILABLE_COPY;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(number);
  }

  function formatPercent(value) {
    const number = toOptionalNumber(value);
    if (number == null) {
      return UNAVAILABLE_COPY;
    }

    return `${number.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  }

  function formatMonths(value) {
    const number = toOptionalNumber(value);
    if (number == null) {
      return UNAVAILABLE_COPY;
    }

    const rounded = Math.round(number * 10) / 10;
    return `${rounded.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${rounded === 1 ? "month" : "months"}`;
  }

  function formatYears(value) {
    const number = toOptionalNumber(value);
    if (number == null) {
      return UNAVAILABLE_COPY;
    }

    const rounded = Math.round(number * 10) / 10;
    return `${rounded.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${rounded === 1 ? "year" : "years"}`;
  }

  function formatBoolean(value) {
    if (value === true) {
      return "Yes";
    }

    if (value === false) {
      return "No";
    }

    return UNAVAILABLE_COPY;
  }

  function formatSource(value) {
    const normalized = String(value || "").trim();
    return normalized || "Current Lens model and Needs Analysis result";
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

  function findTrace(result, key) {
    const trace = Array.isArray(result?.trace) ? result.trace : [];
    return trace.find(function (entry) {
      return entry && entry.key === key;
    }) || null;
  }

  function getTraceNumber(result, key) {
    return toOptionalNumber(findTrace(result, key)?.value);
  }

  function getTraceInputNumber(result, key, inputKey) {
    return toOptionalNumber(findTrace(result, key)?.inputs?.[inputKey]);
  }

  function renderEmptyState(host, title, message) {
    host.innerHTML = `
      <div class="income-impact-empty-state">
        <div class="section-label">Income Loss Impact</div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderMetric(label, value, helper) {
    return `
      <article class="income-impact-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p>${escapeHtml(helper)}</p>
      </article>
    `;
  }

  function renderRows(rows) {
    return `
      <ul class="income-impact-list">
        ${rows.map(function (row) {
          return `
            <li>
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.value)}</strong>
            </li>
          `;
        }).join("")}
      </ul>
    `;
  }

  function renderCard(title, helper, rows) {
    return `
      <article class="income-impact-card">
        <div class="income-impact-card-header">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(helper)}</p>
        </div>
        ${renderRows(rows)}
      </article>
    `;
  }

  function clampPercent(value) {
    const number = toOptionalNumber(value);
    if (number == null) {
      return 0;
    }

    return Math.max(0, Math.min(100, number));
  }

  function renderTimeline(data) {
    const supportDurationMonths = data.supportDurationMonths;
    if (supportDurationMonths == null || supportDurationMonths <= 0) {
      return `
        <article class="income-impact-card income-impact-card--wide">
          <div class="income-impact-card-header">
            <h3>Support Gap Timeline</h3>
            <p>Current-dollar v1 timeline.</p>
          </div>
          <div class="income-impact-empty-inline">${escapeHtml(EMPTY_MESSAGE)}</div>
        </article>
      `;
    }

    const delayMonths = Math.max(0, data.survivorIncomeStartDelayMonths || 0);
    const incomeOffsetMonths = Math.max(0, data.incomeOffsetMonths == null
      ? supportDurationMonths - delayMonths
      : data.incomeOffsetMonths);
    const delayWidth = clampPercent((delayMonths / supportDurationMonths) * 100);
    const incomeWidth = clampPercent((incomeOffsetMonths / supportDurationMonths) * 100);

    return `
      <article class="income-impact-card income-impact-card--wide">
        <div class="income-impact-card-header">
          <h3>Support Gap Timeline</h3>
          <p>Current-dollar v1 timeline. Inflation and growth projections are not applied here.</p>
        </div>
        <div class="income-impact-timeline" aria-label="Current-dollar support gap timeline">
          <div class="income-impact-timeline-bar">
            <span style="width:${delayWidth}%"></span>
            <span style="width:${incomeWidth}%"></span>
          </div>
          <div class="income-impact-timeline-grid">
            <div>
              <span>Before survivor income starts</span>
              <strong>${escapeHtml(formatMonths(delayMonths))}</strong>
              <p>${escapeHtml(formatCurrency(data.supportNeedDuringDelay))} support need during delay</p>
            </div>
            <div>
              <span>After survivor income starts</span>
              <strong>${escapeHtml(formatMonths(incomeOffsetMonths))}</strong>
              <p>${escapeHtml(formatCurrency(data.supportNeedAfterIncomeStarts))} remaining support need</p>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function normalizeDisplayData(lensModel, needsResult) {
    const incomeBasis = isPlainObject(lensModel?.incomeBasis) ? lensModel.incomeBasis : {};
    const survivorScenario = isPlainObject(lensModel?.survivorScenario) ? lensModel.survivorScenario : {};
    const needsAssumptions = isPlainObject(needsResult?.assumptions) ? needsResult.assumptions : {};
    const needsComponents = isPlainObject(needsResult?.components) ? needsResult.components : {};
    const needsOffsets = isPlainObject(needsResult?.commonOffsets) ? needsResult.commonOffsets : {};

    const monthlySupportGap = getTraceNumber(needsResult, "supportGapAfterSurvivorIncomeStarts");
    const supportDurationMonths = getTraceNumber(needsResult, "supportDuration");
    const supportDurationYears = toOptionalNumber(needsAssumptions.needsSupportDurationYears);
    const survivorIncomeStartDelayMonths = getTraceNumber(needsResult, "survivorIncomeStartDelayMonths")
      ?? toOptionalNumber(survivorScenario.survivorIncomeStartDelayMonths);
    const incomeOffsetMonths = getTraceInputNumber(needsResult, "survivorIncomeOffset", "incomeOffsetMonths")
      ?? getTraceInputNumber(needsResult, "supportNeedAfterSurvivorIncomeStarts", "incomeOffsetMonths");

    return {
      insuredGrossAnnualIncome: toOptionalNumber(incomeBasis.insuredGrossAnnualIncome),
      bonusVariableAnnualIncome: toOptionalNumber(incomeBasis.bonusVariableAnnualIncome),
      annualEmployerBenefitsValue: toOptionalNumber(incomeBasis.annualEmployerBenefitsValue),
      annualIncomeReplacementBase: toOptionalNumber(incomeBasis.annualIncomeReplacementBase),
      survivorContinuesWorking: survivorScenario.survivorContinuesWorking,
      survivorGrossAnnualIncome: toOptionalNumber(survivorScenario.survivorGrossAnnualIncome),
      survivorNetAnnualIncome: toOptionalNumber(survivorScenario.survivorNetAnnualIncome),
      expectedSurvivorWorkReductionPercent: toOptionalNumber(survivorScenario.expectedSurvivorWorkReductionPercent),
      survivorIncomeStartDelayMonths,
      survivorIncomeOffset: toOptionalNumber(needsOffsets.survivorIncomeOffset),
      monthlySupportGap,
      annualSupportGap: monthlySupportGap == null ? null : monthlySupportGap * 12,
      supportDurationMonths,
      supportDurationYears,
      incomeOffsetMonths,
      supportNeedDuringDelay: getTraceNumber(needsResult, "supportNeedDuringSurvivorIncomeDelay"),
      supportNeedAfterIncomeStarts: getTraceNumber(needsResult, "supportNeedAfterSurvivorIncomeStarts"),
      totalIncomeSupportNeed: toOptionalNumber(needsComponents.essentialSupport),
      source: formatSource(findTrace(needsResult, "essentialSupport")?.sourcePaths?.join(", "))
    };
  }

  function renderIncomeImpact(host, context) {
    const data = normalizeDisplayData(context.lensModel, context.needsResult);
    const notes = [
      ...(Array.isArray(context.builderWarnings) ? context.builderWarnings : []),
      ...(Array.isArray(context.methodWarnings) ? context.methodWarnings : []),
      ...(Array.isArray(context.needsResult?.warnings) ? context.needsResult.warnings : [])
    ]
      .map(function (warning) {
        return String(warning?.message || warning?.code || "").trim();
      })
      .filter(Boolean);

    host.innerHTML = `
      <div class="income-impact-header">
        <div>
          <div class="section-label">Detailed Analysis</div>
          <h2>Income Loss Impact</h2>
          <p>Read-only view built from the current Lens model and Needs Analysis result.</p>
        </div>
        <span class="income-impact-source">Current-dollar v1</span>
      </div>

      <div class="income-impact-snapshot" aria-label="Income loss snapshot">
        ${renderMetric("Annual Income Lost", formatCurrency(data.annualIncomeReplacementBase), "incomeBasis.annualIncomeReplacementBase")}
        ${renderMetric("Survivor Income Available", formatCurrency(data.survivorNetAnnualIncome), "survivorScenario.survivorNetAnnualIncome")}
        ${renderMetric("Annual Support Gap", formatCurrency(data.annualSupportGap), "Annualized from Needs support gap trace")}
        ${renderMetric("Support Duration", formatYears(data.supportDurationYears), "Needs Analysis support duration")}
      </div>

      <div class="income-impact-grid">
        ${renderCard("Income Replacement Bridge", "Current model facts and Needs support trace.", [
          { label: "Insured gross income", value: formatCurrency(data.insuredGrossAnnualIncome) },
          { label: "Bonus / variable income", value: formatCurrency(data.bonusVariableAnnualIncome) },
          { label: "Employer benefits", value: formatCurrency(data.annualEmployerBenefitsValue) },
          { label: "Income replacement base", value: formatCurrency(data.annualIncomeReplacementBase) },
          { label: "Survivor income offset", value: formatCurrency(data.survivorIncomeOffset) },
          { label: "Annual income gap", value: formatCurrency(data.annualSupportGap) }
        ])}
        ${renderCard("Survivor Income Impact", "Survivor facts used by the Needs Analysis support component.", [
          { label: "Survivor continues working", value: formatBoolean(data.survivorContinuesWorking) },
          { label: "Survivor gross income", value: formatCurrency(data.survivorGrossAnnualIncome) },
          { label: "Survivor net income", value: formatCurrency(data.survivorNetAnnualIncome) },
          { label: "Expected work reduction", value: formatPercent(data.expectedSurvivorWorkReductionPercent) },
          { label: "Income start delay", value: formatMonths(data.survivorIncomeStartDelayMonths) },
          { label: "Survivor income applied to support", value: formatCurrency(data.survivorIncomeOffset) }
        ])}
        ${renderTimeline(data)}
        ${renderCard("Capital Needed for Income Support", "Needs Analysis essential support component.", [
          { label: "Annual support gap", value: formatCurrency(data.annualSupportGap) },
          { label: "Support duration", value: formatYears(data.supportDurationYears) },
          { label: "Total income support need", value: formatCurrency(data.totalIncomeSupportNeed) },
          { label: "Assumption / method source", value: data.source }
        ])}
      </div>

      ${notes.length ? `
        <div class="income-impact-notes">
          <strong>Data notes</strong>
          <ul>
            ${notes.slice(0, 4).map(function (note) {
              return `<li>${escapeHtml(note)}</li>`;
            }).join("")}
          </ul>
        </div>
      ` : ""}
    `;
  }

  function initializeIncomeLossImpactDisplay() {
    const host = document.querySelector("[data-income-impact-display]");
    if (!host) {
      return;
    }

    const currentLensAnalysis = window.LensApp?.lensAnalysis || {};
    const buildLensModelFromSavedProtectionModeling = currentLensAnalysis.buildLensModelFromSavedProtectionModeling;
    const analysisSettingsAdapter = currentLensAnalysis.analysisSettingsAdapter;
    const createAnalysisMethodSettings = analysisSettingsAdapter?.createAnalysisMethodSettings;
    const runNeedsAnalysis = currentLensAnalysis.analysisMethods?.runNeedsAnalysis;

    if (typeof buildLensModelFromSavedProtectionModeling !== "function") {
      renderEmptyState(host, "Income impact unavailable", "Lens saved-data builder is unavailable.");
      return;
    }

    if (typeof runNeedsAnalysis !== "function") {
      renderEmptyState(host, "Income impact unavailable", "Needs Analysis is unavailable.");
      return;
    }

    const profileRecord = resolveLinkedProfileRecord();
    if (!profileRecord) {
      renderEmptyState(host, "Link a client profile", "Income Loss Impact needs a linked client profile before it can render.");
      return;
    }

    const protectionModelingPayload = getProtectionModelingPayload(profileRecord);
    if (!hasProtectionModelingSource(protectionModelingPayload)) {
      renderEmptyState(host, "Protection Modeling Inputs needed", "No saved protection modeling data was found for this linked profile.");
      return;
    }

    try {
      const builderResult = buildLensModelFromSavedProtectionModeling({
        profileRecord,
        protectionModelingPayload,
        taxConfig: createSavedDataTaxConfig()
      });

      if (!builderResult?.lensModel) {
        renderEmptyState(host, "Income impact unavailable", "The saved Lens model could not be built for this profile.");
        return;
      }

      const methodSettings = typeof createAnalysisMethodSettings === "function"
        ? createAnalysisMethodSettings({
            analysisSettings: profileRecord.analysisSettings,
            lensModel: builderResult.lensModel,
            profileRecord
          })
        : createFallbackAnalysisMethodSettings(analysisSettingsAdapter);

      const needsResult = runNeedsAnalysis(
        builderResult.lensModel,
        cloneSettings(methodSettings.needsAnalysisSettings)
      );

      renderIncomeImpact(host, {
        lensModel: builderResult.lensModel,
        needsResult,
        builderWarnings: builderResult.warnings,
        methodWarnings: methodSettings.warnings
      });
    } catch (error) {
      renderEmptyState(host, "Income impact unavailable", "Income Loss Impact could not be prepared from the saved Lens model.");
      console.error("Income Loss Impact display failed", error);
    }
  }

  lensAnalysis.incomeLossImpactDisplay = {
    initializeIncomeLossImpactDisplay
  };

  document.addEventListener("DOMContentLoaded", initializeIncomeLossImpactDisplay);
})(window);
