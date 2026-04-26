(function () {
  const LensApp = window.LensApp || (window.LensApp = {});

  const RATE_FIELDS = [
    "generalInflationRatePercent",
    "householdExpenseInflationRatePercent",
    "educationInflationRatePercent",
    "healthcareInflationRatePercent",
    "finalExpenseInflationRatePercent"
  ];

  const RATE_LABELS = {
    generalInflationRatePercent: "General inflation rate",
    householdExpenseInflationRatePercent: "Household expense inflation",
    educationInflationRatePercent: "Education inflation",
    healthcareInflationRatePercent: "Healthcare inflation",
    finalExpenseInflationRatePercent: "Final expense inflation"
  };

  const DEFAULT_INFLATION_ASSUMPTIONS = Object.freeze({
    enabled: true,
    generalInflationRatePercent: 3,
    householdExpenseInflationRatePercent: 3,
    educationInflationRatePercent: 5,
    healthcareInflationRatePercent: 5,
    finalExpenseInflationRatePercent: 3,
    source: "analysis-setup"
  });

  const ASSET_LIQUIDITY_ITEMS = Object.freeze([
    { key: "cashSavings", label: "Cash Savings" },
    { key: "emergencyFund", label: "Emergency Fund" },
    { key: "brokerageAccounts", label: "Brokerage Accounts" },
    { key: "retirementAssets", label: "Retirement Assets" },
    { key: "realEstateEquity", label: "Real Estate Equity" },
    { key: "businessValue", label: "Business Value" }
  ]);

  const LIQUIDITY_CATEGORIES = Object.freeze(["high", "medium", "low", "illiquid"]);

  const DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS = Object.freeze({
    enabled: false,
    cashSavings: Object.freeze({
      include: true,
      liquidityCategory: "high",
      haircutPercent: 0
    }),
    emergencyFund: Object.freeze({
      include: true,
      liquidityCategory: "high",
      haircutPercent: 0
    }),
    brokerageAccounts: Object.freeze({
      include: true,
      liquidityCategory: "medium",
      haircutPercent: 15
    }),
    retirementAssets: Object.freeze({
      include: true,
      liquidityCategory: "medium",
      haircutPercent: 25
    }),
    realEstateEquity: Object.freeze({
      include: false,
      liquidityCategory: "low",
      haircutPercent: 30
    }),
    businessValue: Object.freeze({
      include: false,
      liquidityCategory: "low",
      haircutPercent: 50
    }),
    source: "analysis-setup"
  });

  const ASSET_TREATMENT_ITEMS = Object.freeze([
    { key: "cashSavings", label: "Cash Savings", sourceField: "cashSavings" },
    { key: "emergencyFund", label: "Emergency Fund", sourceField: "emergencyFund" },
    { key: "taxableBrokerage", label: "Taxable Brokerage / Stocks", sourceField: "brokerageAccounts", legacyKey: "brokerageAccounts" },
    { key: "traditionalRetirementAssets", label: "Traditional Retirement Assets", sourceField: "retirementAssets", legacyKey: "retirementAssets" },
    { key: "rothRetirementAssets", label: "Roth Retirement Assets", sourceField: "rothRetirementAssets" },
    { key: "qualifiedAnnuities", label: "Qualified Annuities", sourceField: "qualifiedAnnuities" },
    { key: "nonqualifiedAnnuities", label: "Nonqualified Annuities", sourceField: "nonqualifiedAnnuities" },
    { key: "realEstateEquity", label: "Real Estate Equity", sourceField: "realEstateEquity" },
    { key: "businessValue", label: "Business Value", sourceField: "businessValue" },
    { key: "otherAssets", label: "Other Assets", sourceField: "otherAssets" }
  ]);

  const TAX_TREATMENT_LABELS = Object.freeze({
    "no-tax-drag": "No tax drag",
    "step-up-eligible": "Step-up eligible",
    "ordinary-income-on-distribution": "Ordinary income",
    "tax-advantaged": "Tax advantaged",
    "partially-taxable": "Partially taxable",
    "case-specific": "Case specific",
    custom: "Custom"
  });

  const TAX_TREATMENT_KEYS = Object.freeze(Object.keys(TAX_TREATMENT_LABELS));

  const ASSET_TREATMENT_PRESETS = Object.freeze({
    "cash-like": Object.freeze({
      label: "Cash-like",
      include: true,
      taxTreatment: "no-tax-drag",
      taxDragPercent: 0,
      liquidityHaircutPercent: 0
    }),
    "step-up-investment": Object.freeze({
      label: "Step-up eligible investment",
      include: true,
      taxTreatment: "step-up-eligible",
      taxDragPercent: 0,
      liquidityHaircutPercent: 5
    }),
    "taxable-retirement": Object.freeze({
      label: "Taxable retirement asset",
      include: true,
      taxTreatment: "ordinary-income-on-distribution",
      taxDragPercent: 25,
      liquidityHaircutPercent: 5
    }),
    "roth-retirement": Object.freeze({
      label: "Roth / tax-advantaged retirement",
      include: true,
      taxTreatment: "tax-advantaged",
      taxDragPercent: 0,
      liquidityHaircutPercent: 5
    }),
    "qualified-annuity": Object.freeze({
      label: "Qualified annuity",
      include: true,
      taxTreatment: "ordinary-income-on-distribution",
      taxDragPercent: 25,
      liquidityHaircutPercent: 5
    }),
    "nonqualified-annuity": Object.freeze({
      label: "Nonqualified annuity",
      include: true,
      taxTreatment: "partially-taxable",
      taxDragPercent: 15,
      liquidityHaircutPercent: 10
    }),
    "real-estate-equity": Object.freeze({
      label: "Real estate equity",
      include: false,
      taxTreatment: "step-up-eligible",
      taxDragPercent: 0,
      liquidityHaircutPercent: 25
    }),
    "business-illiquid": Object.freeze({
      label: "Business / illiquid asset",
      include: false,
      taxTreatment: "case-specific",
      taxDragPercent: 10,
      liquidityHaircutPercent: 50
    }),
    excluded: Object.freeze({
      label: "Excluded",
      include: false,
      taxTreatment: "no-tax-drag",
      taxDragPercent: 0,
      liquidityHaircutPercent: 100
    }),
    custom: Object.freeze({
      label: "Custom",
      taxTreatment: "custom"
    })
  });

  const ASSET_TREATMENT_PRESET_KEYS = Object.freeze(Object.keys(ASSET_TREATMENT_PRESETS));

  const DEFAULT_CUSTOM_ASSET_TREATMENT = Object.freeze({
    id: "custom-asset-1",
    label: "Other / Custom Asset",
    estimatedValue: null,
    include: false,
    treatmentPreset: "custom",
    taxTreatment: "custom",
    taxDragPercent: 0,
    liquidityHaircutPercent: 25
  });

  const DEFAULT_ASSET_TREATMENT_ASSUMPTIONS = Object.freeze({
    enabled: false,
    assets: Object.freeze({
      cashSavings: Object.freeze({
        include: true,
        treatmentPreset: "cash-like",
        taxTreatment: "no-tax-drag",
        taxDragPercent: 0,
        liquidityHaircutPercent: 0
      }),
      emergencyFund: Object.freeze({
        include: true,
        treatmentPreset: "cash-like",
        taxTreatment: "no-tax-drag",
        taxDragPercent: 0,
        liquidityHaircutPercent: 0
      }),
      taxableBrokerage: Object.freeze({
        include: true,
        treatmentPreset: "step-up-investment",
        taxTreatment: "step-up-eligible",
        taxDragPercent: 0,
        liquidityHaircutPercent: 5
      }),
      traditionalRetirementAssets: Object.freeze({
        include: true,
        treatmentPreset: "taxable-retirement",
        taxTreatment: "ordinary-income-on-distribution",
        taxDragPercent: 25,
        liquidityHaircutPercent: 5
      }),
      rothRetirementAssets: Object.freeze({
        include: true,
        treatmentPreset: "roth-retirement",
        taxTreatment: "tax-advantaged",
        taxDragPercent: 0,
        liquidityHaircutPercent: 5
      }),
      qualifiedAnnuities: Object.freeze({
        include: true,
        treatmentPreset: "qualified-annuity",
        taxTreatment: "ordinary-income-on-distribution",
        taxDragPercent: 25,
        liquidityHaircutPercent: 5
      }),
      nonqualifiedAnnuities: Object.freeze({
        include: true,
        treatmentPreset: "nonqualified-annuity",
        taxTreatment: "partially-taxable",
        taxDragPercent: 15,
        liquidityHaircutPercent: 10
      }),
      realEstateEquity: Object.freeze({
        include: false,
        treatmentPreset: "real-estate-equity",
        taxTreatment: "step-up-eligible",
        taxDragPercent: 0,
        liquidityHaircutPercent: 25
      }),
      businessValue: Object.freeze({
        include: false,
        treatmentPreset: "business-illiquid",
        taxTreatment: "case-specific",
        taxDragPercent: 10,
        liquidityHaircutPercent: 50
      }),
      otherAssets: Object.freeze({
        include: false,
        treatmentPreset: "custom",
        taxTreatment: "custom",
        taxDragPercent: 0,
        liquidityHaircutPercent: 25
      })
    }),
    customAssets: Object.freeze([
      DEFAULT_CUSTOM_ASSET_TREATMENT
    ]),
    source: "analysis-setup"
  });

  const MIN_RATE = 0;
  const MAX_RATE = 10;
  const MIN_HAIRCUT = 0;
  const MAX_HAIRCUT = 100;
  const MIN_ASSET_TREATMENT_PERCENT = 0;
  const MAX_ASSET_TREATMENT_PERCENT = 100;

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function getUrlValue(params, names) {
    for (let index = 0; index < names.length; index += 1) {
      const value = String(params.get(names[index]) || "").trim();
      if (value) {
        return value;
      }
    }

    return "";
  }

  function resolveLinkedProfileRecord() {
    const clientRecords = LensApp.clientRecords || {};
    const params = new URLSearchParams(window.location.search);
    const urlCaseRef = getUrlValue(params, ["caseRef", "profileCaseRef", "linkedCaseRef"]);
    const urlRecordId = getUrlValue(params, ["profileId", "recordId", "id", "linkedRecordId"]);

    let record = null;
    if ((urlCaseRef || urlRecordId) && typeof clientRecords.getClientRecordByReference === "function") {
      record = clientRecords.getClientRecordByReference(urlRecordId, urlCaseRef);
    }

    if (!record && typeof clientRecords.getCurrentLinkedRecord === "function") {
      record = clientRecords.getCurrentLinkedRecord(urlCaseRef, urlRecordId);
    }

    if (record) {
      clientRecords.setLinkedCaseRef?.(record.caseRef);
      clientRecords.setLinkedRecordId?.(record.id);
    }

    return record || null;
  }

  function normalizeRateValue(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }

    return clampRateValue(number);
  }

  function clampRateValue(value) {
    return Math.min(MAX_RATE, Math.max(MIN_RATE, value));
  }

  function normalizeLiquidityCategory(value, fallback) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return LIQUIDITY_CATEGORIES.includes(normalizedValue)
      ? normalizedValue
      : fallback;
  }

  function normalizeHaircutValue(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(MAX_HAIRCUT, Math.max(MIN_HAIRCUT, number));
  }

  function normalizeAssetTreatmentPreset(value, fallback) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return ASSET_TREATMENT_PRESET_KEYS.includes(normalizedValue)
      ? normalizedValue
      : fallback;
  }

  function normalizeTaxTreatment(value, fallback) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return TAX_TREATMENT_KEYS.includes(normalizedValue)
      ? normalizedValue
      : fallback;
  }

  function normalizeAssetTreatmentPercent(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(
      MAX_ASSET_TREATMENT_PERCENT,
      Math.max(MIN_ASSET_TREATMENT_PERCENT, number)
    );
  }

  function getPresetDefaults(presetKey) {
    return ASSET_TREATMENT_PRESETS[presetKey] || ASSET_TREATMENT_PRESETS.custom;
  }

  function getInflationAssumptions(record) {
    const saved = isPlainObject(record?.analysisSettings?.inflationAssumptions)
      ? record.analysisSettings.inflationAssumptions
      : {};
    const nextAssumptions = {
      ...DEFAULT_INFLATION_ASSUMPTIONS,
      enabled: typeof saved.enabled === "boolean"
        ? saved.enabled
        : DEFAULT_INFLATION_ASSUMPTIONS.enabled,
      source: String(saved.source || DEFAULT_INFLATION_ASSUMPTIONS.source)
    };

    RATE_FIELDS.forEach(function (fieldName) {
      nextAssumptions[fieldName] = normalizeRateValue(
        saved[fieldName],
        DEFAULT_INFLATION_ASSUMPTIONS[fieldName]
      );
    });

    if (saved.lastUpdatedAt) {
      nextAssumptions.lastUpdatedAt = String(saved.lastUpdatedAt);
    }

    return nextAssumptions;
  }

  function getAssetLiquidityAssumptions(record) {
    const saved = isPlainObject(record?.analysisSettings?.assetLiquidityAssumptions)
      ? record.analysisSettings.assetLiquidityAssumptions
      : {};
    const nextAssumptions = {
      enabled: typeof saved.enabled === "boolean"
        ? saved.enabled
        : DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS.enabled,
      source: String(saved.source || DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS.source)
    };

    ASSET_LIQUIDITY_ITEMS.forEach(function (item) {
      const defaults = DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS[item.key];
      const savedAsset = isPlainObject(saved[item.key]) ? saved[item.key] : {};

      nextAssumptions[item.key] = {
        include: typeof savedAsset.include === "boolean"
          ? savedAsset.include
          : defaults.include,
        liquidityCategory: normalizeLiquidityCategory(
          savedAsset.liquidityCategory,
          defaults.liquidityCategory
        ),
        haircutPercent: normalizeHaircutValue(
          savedAsset.haircutPercent,
          defaults.haircutPercent
        )
      };
    });

    if (saved.lastUpdatedAt) {
      nextAssumptions.lastUpdatedAt = String(saved.lastUpdatedAt);
    }

    return nextAssumptions;
  }

  function getAssetTreatmentAssumptions(record) {
    const saved = isPlainObject(record?.analysisSettings?.assetTreatmentAssumptions)
      ? record.analysisSettings.assetTreatmentAssumptions
      : {};
    const savedAssets = isPlainObject(saved.assets) ? saved.assets : {};
    const savedCustomAssets = Array.isArray(saved.customAssets) ? saved.customAssets : [];
    const nextAssumptions = {
      enabled: typeof saved.enabled === "boolean"
        ? saved.enabled
        : DEFAULT_ASSET_TREATMENT_ASSUMPTIONS.enabled,
      assets: {},
      customAssets: [],
      source: String(saved.source || DEFAULT_ASSET_TREATMENT_ASSUMPTIONS.source)
    };

    ASSET_TREATMENT_ITEMS.forEach(function (item) {
      const defaults = DEFAULT_ASSET_TREATMENT_ASSUMPTIONS.assets[item.key];
      const savedAsset = isPlainObject(savedAssets[item.key])
        ? savedAssets[item.key]
        : (isPlainObject(savedAssets[item.legacyKey]) ? savedAssets[item.legacyKey] : {});
      const treatmentPreset = normalizeAssetTreatmentPreset(
        savedAsset.treatmentPreset,
        defaults.treatmentPreset
      );
      const presetDefaults = getPresetDefaults(treatmentPreset);
      const defaultTaxTreatment = defaults.taxTreatment || presetDefaults.taxTreatment || "custom";
      const savedTaxDrag = Object.prototype.hasOwnProperty.call(savedAsset, "taxDragPercent")
        ? savedAsset.taxDragPercent
        : savedAsset.taxRatePercent;

      nextAssumptions.assets[item.key] = {
        include: typeof savedAsset.include === "boolean"
          ? savedAsset.include
          : defaults.include,
        treatmentPreset,
        taxTreatment: normalizeTaxTreatment(
          savedAsset.taxTreatment,
          defaultTaxTreatment
        ),
        taxDragPercent: normalizeAssetTreatmentPercent(
          savedTaxDrag,
          defaults.taxDragPercent
        ),
        liquidityHaircutPercent: normalizeAssetTreatmentPercent(
          savedAsset.liquidityHaircutPercent,
          defaults.liquidityHaircutPercent
        )
      };
    });

    const savedCustomAsset = isPlainObject(savedCustomAssets[0]) ? savedCustomAssets[0] : {};
    const customPreset = normalizeAssetTreatmentPreset(
      savedCustomAsset.treatmentPreset,
      DEFAULT_CUSTOM_ASSET_TREATMENT.treatmentPreset
    );
    const customTaxTreatment = normalizeTaxTreatment(
      savedCustomAsset.taxTreatment,
      getPresetDefaults(customPreset).taxTreatment || DEFAULT_CUSTOM_ASSET_TREATMENT.taxTreatment
    );
    const savedEstimatedValue = Number(savedCustomAsset.estimatedValue);
    nextAssumptions.customAssets = [
      {
        id: String(savedCustomAsset.id || DEFAULT_CUSTOM_ASSET_TREATMENT.id),
        label: String(savedCustomAsset.label || DEFAULT_CUSTOM_ASSET_TREATMENT.label),
        estimatedValue: Number.isFinite(savedEstimatedValue) && savedEstimatedValue >= 0
          ? savedEstimatedValue
          : DEFAULT_CUSTOM_ASSET_TREATMENT.estimatedValue,
        include: typeof savedCustomAsset.include === "boolean"
          ? savedCustomAsset.include
          : DEFAULT_CUSTOM_ASSET_TREATMENT.include,
        treatmentPreset: customPreset,
        taxTreatment: customTaxTreatment,
        taxDragPercent: normalizeAssetTreatmentPercent(
          savedCustomAsset.taxDragPercent,
          DEFAULT_CUSTOM_ASSET_TREATMENT.taxDragPercent
        ),
        liquidityHaircutPercent: normalizeAssetTreatmentPercent(
          savedCustomAsset.liquidityHaircutPercent,
          DEFAULT_CUSTOM_ASSET_TREATMENT.liquidityHaircutPercent
        )
      }
    ];

    if (saved.lastUpdatedAt) {
      nextAssumptions.lastUpdatedAt = String(saved.lastUpdatedAt);
    }

    return nextAssumptions;
  }

  function formatRateInputValue(value) {
    return Number(value || 0).toFixed(2);
  }

  function formatHaircutInputValue(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) {
      return "";
    }

    return Number.isInteger(number)
      ? String(number)
      : String(Number(number.toFixed(2)));
  }

  function formatCurrencyValue(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(Math.max(0, number));
  }

  function parseOptionalMoneyValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalizedValue = String(value).replace(/[$,\s]/g, "");
    if (!normalizedValue) {
      return null;
    }

    const number = Number(normalizedValue);
    return Number.isFinite(number) ? Math.max(0, number) : null;
  }

  function getPresetOptionsMarkup(selectedPreset) {
    return ASSET_TREATMENT_PRESET_KEYS.map(function (presetKey) {
      const preset = ASSET_TREATMENT_PRESETS[presetKey];
      const selected = presetKey === selectedPreset ? " selected" : "";
      return `<option value="${presetKey}"${selected}>${preset.label}</option>`;
    }).join("");
  }

  function renderAssetTreatmentRows() {
    const table = document.querySelector("[data-analysis-asset-treatment-table]");
    if (!table || table.dataset.rendered === "true") {
      return;
    }

    ASSET_TREATMENT_ITEMS.forEach(function (item) {
      const defaults = DEFAULT_ASSET_TREATMENT_ASSUMPTIONS.assets[item.key];
      table.insertAdjacentHTML("beforeend", `
        <div class="analysis-setup-asset-row" role="row" data-analysis-asset-treatment-row="${item.key}">
          <span class="analysis-setup-asset-label" role="cell">${item.label}</span>
          <span role="cell">
            <label class="analysis-setup-asset-include" aria-label="Include ${item.label}">
              <span class="settings-switch analysis-setup-mini-switch">
                <input class="analysis-setup-asset-field" type="checkbox" role="switch" aria-label="Include ${item.label}" data-analysis-asset-treatment-include="${item.key}">
                <span class="settings-switch-track" aria-hidden="true"></span>
              </span>
            </label>
          </span>
          <span role="cell">
            <select class="analysis-setup-asset-select analysis-setup-asset-field" aria-label="${item.label} treatment preset" data-analysis-asset-treatment-preset="${item.key}">
              ${getPresetOptionsMarkup(defaults.treatmentPreset)}
            </select>
          </span>
          <span role="cell">
            <span class="analysis-setup-tax-treatment-pill" data-analysis-asset-treatment-tax-treatment="${item.key}">${TAX_TREATMENT_LABELS[defaults.taxTreatment]}</span>
          </span>
          <span role="cell">
            <span class="analysis-setup-asset-percent">
              <input class="analysis-setup-asset-percent-input analysis-setup-asset-field" type="text" inputmode="decimal" value="${defaults.taxDragPercent}" aria-label="${item.label} tax drag percentage" data-analysis-asset-treatment-tax="${item.key}">
              <span aria-hidden="true">%</span>
            </span>
          </span>
          <span role="cell">
            <span class="analysis-setup-asset-percent">
              <input class="analysis-setup-asset-percent-input analysis-setup-asset-field" type="text" inputmode="decimal" value="${defaults.liquidityHaircutPercent}" aria-label="${item.label} liquidity and marketability haircut percentage" data-analysis-asset-treatment-haircut="${item.key}">
              <span aria-hidden="true">%</span>
            </span>
          </span>
          <span role="cell"><span class="analysis-setup-treatment-preview" data-analysis-asset-treatment-preview="${item.key}">No source value</span></span>
        </div>
      `);
    });

    table.insertAdjacentHTML("beforeend", `
      <div class="analysis-setup-asset-row analysis-setup-asset-row--custom" role="row" data-analysis-asset-treatment-custom-row="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
        <span class="analysis-setup-custom-asset-stack" role="cell">
          <input class="analysis-setup-asset-label-input analysis-setup-asset-field" type="text" value="${DEFAULT_CUSTOM_ASSET_TREATMENT.label}" aria-label="Custom asset label" data-analysis-asset-treatment-custom-label="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
          <input class="analysis-setup-asset-value-input analysis-setup-asset-field" type="text" inputmode="decimal" placeholder="Estimated value" aria-label="Custom asset estimated value" data-analysis-asset-treatment-custom-value="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
        </span>
        <span role="cell">
          <label class="analysis-setup-asset-include" aria-label="Include custom asset">
            <span class="settings-switch analysis-setup-mini-switch">
              <input class="analysis-setup-asset-field" type="checkbox" role="switch" aria-label="Include custom asset" data-analysis-asset-treatment-custom-include="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
              <span class="settings-switch-track" aria-hidden="true"></span>
            </span>
          </label>
        </span>
        <span role="cell">
          <select class="analysis-setup-asset-select analysis-setup-asset-field" aria-label="Custom asset treatment preset" data-analysis-asset-treatment-custom-preset="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
            ${getPresetOptionsMarkup(DEFAULT_CUSTOM_ASSET_TREATMENT.treatmentPreset)}
          </select>
        </span>
        <span role="cell">
          <span class="analysis-setup-tax-treatment-pill" data-analysis-asset-treatment-custom-tax-treatment="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">${TAX_TREATMENT_LABELS[DEFAULT_CUSTOM_ASSET_TREATMENT.taxTreatment]}</span>
        </span>
        <span role="cell">
          <span class="analysis-setup-asset-percent">
            <input class="analysis-setup-asset-percent-input analysis-setup-asset-field" type="text" inputmode="decimal" value="${DEFAULT_CUSTOM_ASSET_TREATMENT.taxDragPercent}" aria-label="Custom asset tax drag percentage" data-analysis-asset-treatment-custom-tax="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
            <span aria-hidden="true">%</span>
          </span>
        </span>
        <span role="cell">
          <span class="analysis-setup-asset-percent">
            <input class="analysis-setup-asset-percent-input analysis-setup-asset-field" type="text" inputmode="decimal" value="${DEFAULT_CUSTOM_ASSET_TREATMENT.liquidityHaircutPercent}" aria-label="Custom asset liquidity and marketability haircut percentage" data-analysis-asset-treatment-custom-haircut="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">
            <span aria-hidden="true">%</span>
          </span>
        </span>
        <span role="cell"><span class="analysis-setup-treatment-preview" data-analysis-asset-treatment-custom-preview="${DEFAULT_CUSTOM_ASSET_TREATMENT.id}">No source value</span></span>
      </div>
    `);

    table.dataset.rendered = "true";
  }

  function getFieldMap() {
    const fields = {};
    Array.from(document.querySelectorAll("[data-analysis-inflation-field]")).forEach(function (field) {
      fields[field.getAttribute("data-analysis-inflation-field")] = field;
    });
    return fields;
  }

  function getSliderMap() {
    const sliders = {};
    Array.from(document.querySelectorAll("[data-analysis-inflation-slider]")).forEach(function (slider) {
      sliders[slider.getAttribute("data-analysis-inflation-slider")] = slider;
    });
    return sliders;
  }

  function getAssetFieldMap() {
    const fields = {
      enabled: document.querySelector("[data-analysis-asset-enabled]"),
      include: {},
      liquidity: {},
      haircut: {}
    };

    Array.from(document.querySelectorAll("[data-analysis-asset-include]")).forEach(function (field) {
      fields.include[field.getAttribute("data-analysis-asset-include")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-liquidity]")).forEach(function (field) {
      fields.liquidity[field.getAttribute("data-analysis-asset-liquidity")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-haircut]")).forEach(function (field) {
      fields.haircut[field.getAttribute("data-analysis-asset-haircut")] = field;
    });

    return fields;
  }

  function getAssetTreatmentFieldMap() {
    const fields = {
      enabled: document.querySelector("[data-analysis-asset-treatment-enabled]"),
      include: {},
      preset: {},
      taxTreatment: {},
      tax: {},
      haircut: {},
      preview: {},
      custom: {
        label: {},
        value: {},
        include: {},
        preset: {},
        taxTreatment: {},
        tax: {},
        haircut: {},
        preview: {}
      }
    };

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-include]")).forEach(function (field) {
      fields.include[field.getAttribute("data-analysis-asset-treatment-include")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-preset]")).forEach(function (field) {
      fields.preset[field.getAttribute("data-analysis-asset-treatment-preset")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-tax-treatment]")).forEach(function (field) {
      fields.taxTreatment[field.getAttribute("data-analysis-asset-treatment-tax-treatment")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-tax]")).forEach(function (field) {
      fields.tax[field.getAttribute("data-analysis-asset-treatment-tax")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-haircut]")).forEach(function (field) {
      fields.haircut[field.getAttribute("data-analysis-asset-treatment-haircut")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-preview]")).forEach(function (field) {
      fields.preview[field.getAttribute("data-analysis-asset-treatment-preview")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-label]")).forEach(function (field) {
      fields.custom.label[field.getAttribute("data-analysis-asset-treatment-custom-label")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-value]")).forEach(function (field) {
      fields.custom.value[field.getAttribute("data-analysis-asset-treatment-custom-value")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-include]")).forEach(function (field) {
      fields.custom.include[field.getAttribute("data-analysis-asset-treatment-custom-include")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-preset]")).forEach(function (field) {
      fields.custom.preset[field.getAttribute("data-analysis-asset-treatment-custom-preset")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-tax-treatment]")).forEach(function (field) {
      fields.custom.taxTreatment[field.getAttribute("data-analysis-asset-treatment-custom-tax-treatment")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-tax]")).forEach(function (field) {
      fields.custom.tax[field.getAttribute("data-analysis-asset-treatment-custom-tax")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-haircut]")).forEach(function (field) {
      fields.custom.haircut[field.getAttribute("data-analysis-asset-treatment-custom-haircut")] = field;
    });

    Array.from(document.querySelectorAll("[data-analysis-asset-treatment-custom-preview]")).forEach(function (field) {
      fields.custom.preview[field.getAttribute("data-analysis-asset-treatment-custom-preview")] = field;
    });

    return fields;
  }

  function hasAssetLiquidityFields(fields) {
    return Boolean(fields.enabled) || ASSET_LIQUIDITY_ITEMS.some(function (item) {
      return Boolean(
        fields.include[item.key]
        || fields.liquidity[item.key]
        || fields.haircut[item.key]
      );
    });
  }

  function hasAssetTreatmentFields(fields) {
    const hasStandardFields = ASSET_TREATMENT_ITEMS.some(function (item) {
      return Boolean(
        fields.include[item.key]
        || fields.preset[item.key]
        || fields.taxTreatment[item.key]
        || fields.tax[item.key]
        || fields.haircut[item.key]
      );
    });
    const hasCustomFields = Object.keys(fields.custom?.label || {}).length > 0;
    return Boolean(fields.enabled) || hasStandardFields || hasCustomFields;
  }

  function setMessage(element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.dataset.tone = tone || "neutral";
    element.hidden = !message;
  }

  function setStatus(element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.dataset.tone = tone || "neutral";
  }

  function populateFields(fields, assumptions, sliders) {
    if (fields.enabled) {
      fields.enabled.checked = Boolean(assumptions.enabled);
    }

    RATE_FIELDS.forEach(function (fieldName) {
      const formattedValue = formatRateInputValue(assumptions[fieldName]);
      if (fields[fieldName]) {
        fields[fieldName].value = formattedValue;
      }
      if (sliders?.[fieldName]) {
        sliders[fieldName].value = formattedValue;
      }
    });
  }

  function populateAssetFields(fields, assumptions) {
    if (fields.enabled) {
      fields.enabled.checked = Boolean(assumptions.enabled);
    }

    ASSET_LIQUIDITY_ITEMS.forEach(function (item) {
      const assumption = assumptions[item.key] || DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS[item.key];

      if (fields.include[item.key]) {
        fields.include[item.key].checked = Boolean(assumption.include);
      }
      if (fields.liquidity[item.key]) {
        fields.liquidity[item.key].value = assumption.liquidityCategory;
      }
      if (fields.haircut[item.key]) {
        fields.haircut[item.key].value = formatHaircutInputValue(assumption.haircutPercent);
      }
    });
  }

  function getLinkedProtectionModelingData(record) {
    const currentPayloadData = record?.protectionModeling?.data;
    if (isPlainObject(currentPayloadData)) {
      return currentPayloadData;
    }

    const entries = Array.isArray(record?.protectionModelingEntries)
      ? record.protectionModelingEntries
      : [];
    const latestEntryData = entries.length ? entries[entries.length - 1]?.data : null;
    return isPlainObject(latestEntryData) ? latestEntryData : {};
  }

  function getAssetSourceValue(record, item) {
    const sourceData = getLinkedProtectionModelingData(record);
    const sourceField = String(item?.sourceField || "").trim();

    if (sourceField && Object.prototype.hasOwnProperty.call(sourceData, sourceField)) {
      return parseOptionalMoneyValue(sourceData[sourceField]);
    }

    if (sourceField && Object.prototype.hasOwnProperty.call(record || {}, sourceField)) {
      return parseOptionalMoneyValue(record[sourceField]);
    }

    return null;
  }

  function getValidatedPreviewPercent(field) {
    const rawValue = String(field?.value || "").trim();
    const number = Number(rawValue);
    return rawValue && Number.isFinite(number)
      ? Math.min(MAX_ASSET_TREATMENT_PERCENT, Math.max(MIN_ASSET_TREATMENT_PERCENT, number))
      : 0;
  }

  function getAvailablePreviewValue(sourceValue, include, taxDragPercent, liquidityHaircutPercent) {
    if (!include) {
      return 0;
    }

    const taxMultiplier = 1 - (taxDragPercent / 100);
    const liquidityMultiplier = 1 - (liquidityHaircutPercent / 100);
    return Math.max(0, sourceValue * taxMultiplier * liquidityMultiplier);
  }

  function syncTaxTreatmentPill(pill, taxTreatment) {
    if (!pill) {
      return;
    }

    const normalizedTaxTreatment = normalizeTaxTreatment(taxTreatment, "custom");
    pill.textContent = TAX_TREATMENT_LABELS[normalizedTaxTreatment] || TAX_TREATMENT_LABELS.custom;
  }

  function syncAssetTreatmentPreview(fields, itemKey, linkedRecord) {
    const preview = fields.preview[itemKey];
    const item = ASSET_TREATMENT_ITEMS.find(function (candidate) {
      return candidate.key === itemKey;
    });

    if (!preview || !item) {
      return;
    }

    const include = Boolean(fields.include[itemKey]?.checked);
    const preset = String(fields.preset[itemKey]?.value || "").trim();
    if (!include || preset === "excluded") {
      preview.textContent = "Excluded";
      return;
    }

    const sourceValue = getAssetSourceValue(linkedRecord, item);
    if (sourceValue === null) {
      preview.textContent = "No source value";
      return;
    }

    const taxDragPercent = getValidatedPreviewPercent(fields.tax[itemKey]);
    const liquidityHaircutPercent = getValidatedPreviewPercent(fields.haircut[itemKey]);
    preview.textContent = formatCurrencyValue(getAvailablePreviewValue(
      sourceValue,
      include,
      taxDragPercent,
      liquidityHaircutPercent
    ));
  }

  function syncCustomAssetTreatmentPreview(fields, customAssetId) {
    const preview = fields.custom.preview[customAssetId];
    if (!preview) {
      return;
    }

    const include = Boolean(fields.custom.include[customAssetId]?.checked);
    const preset = String(fields.custom.preset[customAssetId]?.value || "").trim();
    if (!include || preset === "excluded") {
      preview.textContent = "Excluded";
      return;
    }

    const sourceValue = parseOptionalMoneyValue(fields.custom.value[customAssetId]?.value);
    if (sourceValue === null) {
      preview.textContent = "No source value";
      return;
    }

    const taxDragPercent = getValidatedPreviewPercent(fields.custom.tax[customAssetId]);
    const liquidityHaircutPercent = getValidatedPreviewPercent(fields.custom.haircut[customAssetId]);
    preview.textContent = formatCurrencyValue(getAvailablePreviewValue(
      sourceValue,
      include,
      taxDragPercent,
      liquidityHaircutPercent
    ));
  }

  function populateAssetTreatmentFields(fields, assumptions, linkedRecord) {
    if (fields.enabled) {
      fields.enabled.checked = Boolean(assumptions.enabled);
    }

    ASSET_TREATMENT_ITEMS.forEach(function (item) {
      const assumption = assumptions.assets[item.key] || DEFAULT_ASSET_TREATMENT_ASSUMPTIONS.assets[item.key];

      if (fields.include[item.key]) {
        fields.include[item.key].checked = Boolean(assumption.include);
      }
      if (fields.preset[item.key]) {
        fields.preset[item.key].value = assumption.treatmentPreset;
      }
      syncTaxTreatmentPill(fields.taxTreatment[item.key], assumption.taxTreatment);
      if (fields.tax[item.key]) {
        fields.tax[item.key].value = formatHaircutInputValue(assumption.taxDragPercent);
      }
      if (fields.haircut[item.key]) {
        fields.haircut[item.key].value = formatHaircutInputValue(assumption.liquidityHaircutPercent);
      }

      syncAssetTreatmentPreview(fields, item.key, linkedRecord);
    });

    const customAssumption = (Array.isArray(assumptions.customAssets) ? assumptions.customAssets : [])[0]
      || DEFAULT_CUSTOM_ASSET_TREATMENT;
    const customAssetId = DEFAULT_CUSTOM_ASSET_TREATMENT.id;
    if (fields.custom.label[customAssetId]) {
      fields.custom.label[customAssetId].value = String(customAssumption.label || DEFAULT_CUSTOM_ASSET_TREATMENT.label);
    }
    if (fields.custom.value[customAssetId]) {
      fields.custom.value[customAssetId].value = customAssumption.estimatedValue === null
        ? ""
        : formatHaircutInputValue(customAssumption.estimatedValue);
    }
    if (fields.custom.include[customAssetId]) {
      fields.custom.include[customAssetId].checked = Boolean(customAssumption.include);
    }
    if (fields.custom.preset[customAssetId]) {
      fields.custom.preset[customAssetId].value = customAssumption.treatmentPreset;
    }
    syncTaxTreatmentPill(fields.custom.taxTreatment[customAssetId], customAssumption.taxTreatment);
    if (fields.custom.tax[customAssetId]) {
      fields.custom.tax[customAssetId].value = formatHaircutInputValue(customAssumption.taxDragPercent);
    }
    if (fields.custom.haircut[customAssetId]) {
      fields.custom.haircut[customAssetId].value = formatHaircutInputValue(customAssumption.liquidityHaircutPercent);
    }
    syncCustomAssetTreatmentPreview(fields, customAssetId);
  }

  function setFieldsDisabled(fields, sliders, disabled) {
    Object.keys(fields).forEach(function (fieldName) {
      fields[fieldName].disabled = Boolean(disabled);
    });
    Object.keys(sliders || {}).forEach(function (fieldName) {
      sliders[fieldName].disabled = Boolean(disabled);
    });
  }

  function setAssetFieldsDisabled(fields, disabled) {
    if (fields.enabled) {
      fields.enabled.disabled = Boolean(disabled);
    }

    ["include", "liquidity", "haircut"].forEach(function (groupName) {
      Object.keys(fields[groupName] || {}).forEach(function (fieldName) {
        fields[groupName][fieldName].disabled = Boolean(disabled);
      });
    });
  }

  function setAssetTreatmentFieldsDisabled(fields, disabled) {
    if (fields.enabled) {
      fields.enabled.disabled = Boolean(disabled);
    }

    ["include", "preset", "tax", "haircut"].forEach(function (groupName) {
      Object.keys(fields[groupName] || {}).forEach(function (fieldName) {
        fields[groupName][fieldName].disabled = Boolean(disabled);
      });
    });

    ["label", "value", "include", "preset", "tax", "haircut"].forEach(function (groupName) {
      Object.keys(fields.custom?.[groupName] || {}).forEach(function (fieldName) {
        fields.custom[groupName][fieldName].disabled = Boolean(disabled);
      });
    });
  }

  function syncSliderFromNumber(fields, sliders, fieldName, shouldFormat) {
    const field = fields[fieldName];
    const slider = sliders[fieldName];
    const rawValue = String(field?.value || "").trim();

    if (!field || !slider || !rawValue) {
      return;
    }

    const number = Number(rawValue);
    if (!Number.isFinite(number)) {
      return;
    }

    const clampedValue = clampRateValue(number);
    const formattedValue = formatRateInputValue(clampedValue);
    slider.value = formattedValue;

    if (shouldFormat || clampedValue !== number) {
      field.value = formattedValue;
    }
  }

  function syncNumberFromSlider(fields, sliders, fieldName) {
    const field = fields[fieldName];
    const slider = sliders[fieldName];

    if (!field || !slider) {
      return;
    }

    const number = Number(slider.value);
    const clampedValue = Number.isFinite(number)
      ? clampRateValue(number)
      : DEFAULT_INFLATION_ASSUMPTIONS[fieldName];
    const formattedValue = formatRateInputValue(clampedValue);

    slider.value = formattedValue;
    field.value = formattedValue;
  }

  function applyAssetTreatmentPreset(fields, itemKey, linkedRecord) {
    const presetKey = String(fields.preset[itemKey]?.value || "").trim();
    const preset = ASSET_TREATMENT_PRESETS[presetKey];

    if (!preset || presetKey === "custom") {
      syncTaxTreatmentPill(fields.taxTreatment[itemKey], preset?.taxTreatment || "custom");
      syncAssetTreatmentPreview(fields, itemKey, linkedRecord);
      return;
    }

    if (fields.include[itemKey]) {
      fields.include[itemKey].checked = Boolean(preset.include);
    }
    syncTaxTreatmentPill(fields.taxTreatment[itemKey], preset.taxTreatment);
    if (fields.tax[itemKey]) {
      fields.tax[itemKey].value = formatHaircutInputValue(preset.taxDragPercent);
    }
    if (fields.haircut[itemKey]) {
      fields.haircut[itemKey].value = formatHaircutInputValue(preset.liquidityHaircutPercent);
    }

    syncAssetTreatmentPreview(fields, itemKey, linkedRecord);
  }

  function applyCustomAssetTreatmentPreset(fields, customAssetId) {
    const presetKey = String(fields.custom.preset[customAssetId]?.value || "").trim();
    const preset = ASSET_TREATMENT_PRESETS[presetKey];

    if (!preset || presetKey === "custom") {
      syncTaxTreatmentPill(fields.custom.taxTreatment[customAssetId], preset?.taxTreatment || "custom");
      syncCustomAssetTreatmentPreview(fields, customAssetId);
      return;
    }

    if (fields.custom.include[customAssetId]) {
      fields.custom.include[customAssetId].checked = Boolean(preset.include);
    }
    syncTaxTreatmentPill(fields.custom.taxTreatment[customAssetId], preset.taxTreatment);
    if (fields.custom.tax[customAssetId]) {
      fields.custom.tax[customAssetId].value = formatHaircutInputValue(preset.taxDragPercent);
    }
    if (fields.custom.haircut[customAssetId]) {
      fields.custom.haircut[customAssetId].value = formatHaircutInputValue(preset.liquidityHaircutPercent);
    }

    syncCustomAssetTreatmentPreview(fields, customAssetId);
  }

  function readValidatedAssumptions(fields) {
    const nextAssumptions = {
      enabled: Boolean(fields.enabled?.checked)
    };

    for (let index = 0; index < RATE_FIELDS.length; index += 1) {
      const fieldName = RATE_FIELDS[index];
      const field = fields[fieldName];
      const rawValue = String(field?.value || "").trim();
      const label = RATE_LABELS[fieldName];

      if (!rawValue) {
        return {
          error: `${label} is required. Enter a value from ${MIN_RATE}% to ${MAX_RATE}%.`
        };
      }

      const number = Number(rawValue);
      if (!Number.isFinite(number)) {
        return {
          error: `${label} must be a numeric percentage.`
        };
      }

      if (number < MIN_RATE || number > MAX_RATE) {
        return {
          error: `${label} must be between ${MIN_RATE}% and ${MAX_RATE}%.`
        };
      }

      nextAssumptions[fieldName] = Number(number.toFixed(2));
    }

    return {
      value: {
        ...nextAssumptions,
        lastUpdatedAt: new Date().toISOString(),
        source: "analysis-setup"
      }
    };
  }

  function readValidatedAssetLiquidityAssumptions(fields) {
    const nextAssumptions = {
      enabled: Boolean(fields.enabled?.checked)
    };

    for (let index = 0; index < ASSET_LIQUIDITY_ITEMS.length; index += 1) {
      const item = ASSET_LIQUIDITY_ITEMS[index];
      const category = String(fields.liquidity[item.key]?.value || "").trim().toLowerCase();
      const rawHaircut = String(fields.haircut[item.key]?.value || "").trim();

      if (!LIQUIDITY_CATEGORIES.includes(category)) {
        return {
          error: `${item.label} liquidity must be high, medium, low, or illiquid.`
        };
      }

      if (!rawHaircut) {
        return {
          error: `${item.label} haircut is required. Enter a value from ${MIN_HAIRCUT}% to ${MAX_HAIRCUT}%.`
        };
      }

      const haircut = Number(rawHaircut);
      if (!Number.isFinite(haircut)) {
        return {
          error: `${item.label} haircut must be a numeric percentage.`
        };
      }

      if (haircut < MIN_HAIRCUT || haircut > MAX_HAIRCUT) {
        return {
          error: `${item.label} haircut must be between ${MIN_HAIRCUT}% and ${MAX_HAIRCUT}%.`
        };
      }

      nextAssumptions[item.key] = {
        include: Boolean(fields.include[item.key]?.checked),
        liquidityCategory: category,
        haircutPercent: Number(haircut.toFixed(2))
      };
    }

    return {
      value: {
        ...nextAssumptions,
        lastUpdatedAt: new Date().toISOString(),
        source: "analysis-setup"
      }
    };
  }

  function readValidatedAssetTreatmentAssumptions(fields) {
    const nextAssumptions = {
      enabled: Boolean(fields.enabled?.checked),
      assets: {},
      customAssets: []
    };

    for (let index = 0; index < ASSET_TREATMENT_ITEMS.length; index += 1) {
      const item = ASSET_TREATMENT_ITEMS[index];
      const preset = String(fields.preset[item.key]?.value || "").trim();
      const rawTax = String(fields.tax[item.key]?.value || "").trim();
      const rawHaircut = String(fields.haircut[item.key]?.value || "").trim();

      if (!ASSET_TREATMENT_PRESET_KEYS.includes(preset)) {
        return {
          error: `${item.label} treatment must be a valid preset.`
        };
      }

      if (!rawTax) {
        return {
          error: `${item.label} tax is required. Enter a value from ${MIN_ASSET_TREATMENT_PERCENT}% to ${MAX_ASSET_TREATMENT_PERCENT}%.`
        };
      }

      if (!rawHaircut) {
        return {
          error: `${item.label} haircut is required. Enter a value from ${MIN_ASSET_TREATMENT_PERCENT}% to ${MAX_ASSET_TREATMENT_PERCENT}%.`
        };
      }

      const tax = Number(rawTax);
      const haircut = Number(rawHaircut);
      if (!Number.isFinite(tax)) {
        return {
          error: `${item.label} tax must be a numeric percentage.`
        };
      }

      if (!Number.isFinite(haircut)) {
        return {
          error: `${item.label} haircut must be a numeric percentage.`
        };
      }

      if (tax < MIN_ASSET_TREATMENT_PERCENT || tax > MAX_ASSET_TREATMENT_PERCENT) {
        return {
          error: `${item.label} tax must be between ${MIN_ASSET_TREATMENT_PERCENT}% and ${MAX_ASSET_TREATMENT_PERCENT}%.`
        };
      }

      if (haircut < MIN_ASSET_TREATMENT_PERCENT || haircut > MAX_ASSET_TREATMENT_PERCENT) {
        return {
          error: `${item.label} haircut must be between ${MIN_ASSET_TREATMENT_PERCENT}% and ${MAX_ASSET_TREATMENT_PERCENT}%.`
        };
      }

      nextAssumptions.assets[item.key] = {
        include: Boolean(fields.include[item.key]?.checked),
        treatmentPreset: preset,
        taxTreatment: normalizeTaxTreatment(
          ASSET_TREATMENT_PRESETS[preset]?.taxTreatment,
          "custom"
        ),
        taxDragPercent: Number(tax.toFixed(2)),
        liquidityHaircutPercent: Number(haircut.toFixed(2))
      };
    }

    const customAssetId = DEFAULT_CUSTOM_ASSET_TREATMENT.id;
    const customLabel = String(fields.custom.label[customAssetId]?.value || "").trim();
    const rawCustomValue = String(fields.custom.value[customAssetId]?.value || "").trim();
    const customPreset = String(fields.custom.preset[customAssetId]?.value || "").trim();
    const rawCustomTax = String(fields.custom.tax[customAssetId]?.value || "").trim();
    const rawCustomHaircut = String(fields.custom.haircut[customAssetId]?.value || "").trim();
    const customInclude = Boolean(fields.custom.include[customAssetId]?.checked);

    if (!ASSET_TREATMENT_PRESET_KEYS.includes(customPreset)) {
      return {
        error: "Other / Custom Asset treatment must be a valid preset."
      };
    }

    if (!rawCustomTax) {
      return {
        error: "Other / Custom Asset tax drag is required. Enter a value from 0% to 100%."
      };
    }

    if (!rawCustomHaircut) {
      return {
        error: "Other / Custom Asset haircut is required. Enter a value from 0% to 100%."
      };
    }

    const customTax = Number(rawCustomTax);
    const customHaircut = Number(rawCustomHaircut);
    if (!Number.isFinite(customTax)) {
      return {
        error: "Other / Custom Asset tax drag must be a numeric percentage."
      };
    }

    if (!Number.isFinite(customHaircut)) {
      return {
        error: "Other / Custom Asset haircut must be a numeric percentage."
      };
    }

    if (customTax < MIN_ASSET_TREATMENT_PERCENT || customTax > MAX_ASSET_TREATMENT_PERCENT) {
      return {
        error: "Other / Custom Asset tax drag must be between 0% and 100%."
      };
    }

    if (customHaircut < MIN_ASSET_TREATMENT_PERCENT || customHaircut > MAX_ASSET_TREATMENT_PERCENT) {
      return {
        error: "Other / Custom Asset haircut must be between 0% and 100%."
      };
    }

    const customEstimatedValue = rawCustomValue ? Number(rawCustomValue.replace(/[$,\s]/g, "")) : null;
    if (rawCustomValue && (!Number.isFinite(customEstimatedValue) || customEstimatedValue < 0)) {
      return {
        error: "Other / Custom Asset estimated value must be a non-negative number."
      };
    }

    if ((customInclude || rawCustomValue) && !customLabel) {
      return {
        error: "Other / Custom Asset label is required when the custom row is used."
      };
    }

    nextAssumptions.customAssets = [
      {
        id: customAssetId,
        label: customLabel || DEFAULT_CUSTOM_ASSET_TREATMENT.label,
        estimatedValue: customEstimatedValue,
        include: customInclude,
        treatmentPreset: customPreset,
        taxTreatment: normalizeTaxTreatment(
          ASSET_TREATMENT_PRESETS[customPreset]?.taxTreatment,
          "custom"
        ),
        taxDragPercent: Number(customTax.toFixed(2)),
        liquidityHaircutPercent: Number(customHaircut.toFixed(2))
      }
    ];

    return {
      value: {
        ...nextAssumptions,
        lastUpdatedAt: new Date().toISOString(),
        source: "analysis-setup"
      }
    };
  }

  function saveAnalysisSetupSettings(fields, sliders, assetFields, assetTreatmentFields, linkedRecord, validationMessage, statusMessage) {
    const clientRecords = LensApp.clientRecords || {};
    const shouldSaveAssetLiquidity = hasAssetLiquidityFields(assetFields);
    const shouldSaveAssetTreatment = hasAssetTreatmentFields(assetTreatmentFields);

    RATE_FIELDS.forEach(function (fieldName) {
      syncSliderFromNumber(fields, sliders, fieldName, true);
    });

    if (shouldSaveAssetLiquidity) {
      ASSET_LIQUIDITY_ITEMS.forEach(function (item) {
        const field = assetFields.haircut[item.key];
        const rawValue = String(field?.value || "").trim();
        const number = Number(rawValue);
        if (field && rawValue && Number.isFinite(number) && number >= MIN_HAIRCUT && number <= MAX_HAIRCUT) {
          field.value = formatHaircutInputValue(number);
        }
      });
    }

    if (shouldSaveAssetTreatment) {
      ASSET_TREATMENT_ITEMS.forEach(function (item) {
        ["tax", "haircut"].forEach(function (groupName) {
          const field = assetTreatmentFields[groupName][item.key];
          const rawValue = String(field?.value || "").trim();
          const number = Number(rawValue);
          if (
            field
            && rawValue
            && Number.isFinite(number)
            && number >= MIN_ASSET_TREATMENT_PERCENT
            && number <= MAX_ASSET_TREATMENT_PERCENT
          ) {
            field.value = formatHaircutInputValue(number);
          }
        });
      });

      const customAssetId = DEFAULT_CUSTOM_ASSET_TREATMENT.id;
      ["tax", "haircut", "value"].forEach(function (groupName) {
        const field = assetTreatmentFields.custom[groupName][customAssetId];
        const rawValue = String(field?.value || "").trim().replace(/[$,\s]/g, "");
        const number = Number(rawValue);
        const isValidPercent = groupName !== "value"
          && rawValue
          && Number.isFinite(number)
          && number >= MIN_ASSET_TREATMENT_PERCENT
          && number <= MAX_ASSET_TREATMENT_PERCENT;
        const isValidValue = groupName === "value"
          && rawValue
          && Number.isFinite(number)
          && number >= 0;

        if (field && (isValidPercent || isValidValue)) {
          field.value = formatHaircutInputValue(number);
        }
      });
    }

    const validatedInflation = readValidatedAssumptions(fields);

    if (validatedInflation.error) {
      setMessage(validationMessage, validatedInflation.error, "error");
      setStatus(statusMessage, "Analysis Setup settings were not saved.", "error");
      return null;
    }

    const validatedAssets = shouldSaveAssetLiquidity
      ? readValidatedAssetLiquidityAssumptions(assetFields)
      : null;

    if (validatedAssets?.error) {
      setMessage(validationMessage, validatedAssets.error, "error");
      setStatus(statusMessage, "Analysis Setup settings were not saved.", "error");
      return null;
    }

    const validatedAssetTreatment = shouldSaveAssetTreatment
      ? readValidatedAssetTreatmentAssumptions(assetTreatmentFields)
      : null;

    if (validatedAssetTreatment?.error) {
      setMessage(validationMessage, validatedAssetTreatment.error, "error");
      setStatus(statusMessage, "Analysis Setup settings were not saved.", "error");
      return null;
    }

    const linkedCaseRef = String(linkedRecord?.caseRef || "").trim();
    if (!linkedCaseRef || typeof clientRecords.updateClientRecordByCaseRef !== "function") {
      setMessage(validationMessage, "Link a client profile before saving Analysis Setup settings.", "error");
      setStatus(statusMessage, "No linked profile available.", "error");
      return null;
    }

    const updatedRecord = clientRecords.updateClientRecordByCaseRef(linkedCaseRef, function (currentRecord) {
      const currentSettings = isPlainObject(currentRecord.analysisSettings)
        ? currentRecord.analysisSettings
        : {};

      return {
        ...currentRecord,
        analysisSettings: {
          ...currentSettings,
          inflationAssumptions: validatedInflation.value,
          ...(validatedAssets ? { assetLiquidityAssumptions: validatedAssets.value } : {}),
          ...(validatedAssetTreatment ? { assetTreatmentAssumptions: validatedAssetTreatment.value } : {})
        }
      };
    });

    if (!updatedRecord) {
      setMessage(validationMessage, "Analysis Setup settings could not be saved to the linked profile.", "error");
      setStatus(statusMessage, "Save failed.", "error");
      return null;
    }

    clientRecords.setLinkedCaseRef?.(updatedRecord.caseRef || linkedCaseRef);
    clientRecords.setLinkedRecordId?.(updatedRecord.id);
    populateFields(fields, getInflationAssumptions(updatedRecord), sliders);
    if (shouldSaveAssetLiquidity) {
      populateAssetFields(assetFields, getAssetLiquidityAssumptions(updatedRecord));
    }
    if (shouldSaveAssetTreatment) {
      populateAssetTreatmentFields(assetTreatmentFields, getAssetTreatmentAssumptions(updatedRecord), updatedRecord);
    }
    setMessage(validationMessage, "", "neutral");
    setStatus(statusMessage, "Analysis Setup settings saved.", "success");
    return updatedRecord;
  }

  function initializeAnalysisSetup() {
    const page = document.querySelector(".analysis-setup-page");
    if (!page) {
      return;
    }

    renderAssetTreatmentRows();

    const fields = getFieldMap();
    const sliders = getSliderMap();
    const assetFields = getAssetFieldMap();
    const assetTreatmentFields = getAssetTreatmentFieldMap();
    const saveButton = document.querySelector("[data-analysis-setup-save]");
    const applyButton = document.querySelector("[data-analysis-setup-apply]");
    const statusMessage = document.querySelector("[data-analysis-setup-status]");
    const validationMessage = document.querySelector("[data-analysis-setup-validation]");
    const linkedState = document.querySelector("[data-analysis-setup-linked-state]");
    const badge = document.querySelector("[data-analysis-setup-badge]");
    let linkedRecord = resolveLinkedProfileRecord();

    populateFields(fields, getInflationAssumptions(linkedRecord), sliders);
    populateAssetFields(assetFields, getAssetLiquidityAssumptions(linkedRecord));
    populateAssetTreatmentFields(assetTreatmentFields, getAssetTreatmentAssumptions(linkedRecord), linkedRecord);

    if (!linkedRecord) {
      setFieldsDisabled(fields, sliders, true);
      setAssetFieldsDisabled(assetFields, true);
      setAssetTreatmentFieldsDisabled(assetTreatmentFields, true);
      if (saveButton) {
        saveButton.disabled = true;
      }
      if (applyButton) {
        applyButton.disabled = false;
        applyButton.textContent = "Continue";
        applyButton.addEventListener("click", function () {
          window.location.href = "analysis-estimate.html";
        });
      }
      if (linkedState) {
        linkedState.textContent = "Link a profile first to save Analysis Setup settings.";
      }
      if (badge) {
        badge.textContent = "No linked profile";
      }
      setStatus(statusMessage, "Settings require a linked profile. Continue without saving.", "error");
      return;
    }

    setFieldsDisabled(fields, sliders, false);
    setAssetFieldsDisabled(assetFields, false);
    setAssetTreatmentFieldsDisabled(assetTreatmentFields, false);
    if (saveButton) {
      saveButton.disabled = false;
    }
    if (applyButton) {
      applyButton.disabled = false;
    }
    if (linkedState) {
      const profileName = String(linkedRecord.displayName || linkedRecord.clientName || "Linked profile").trim();
      linkedState.textContent = `${profileName} is linked for Analysis Setup.`;
    }
    if (badge) {
      badge.textContent = "Settings editable";
    }
    setStatus(statusMessage, "Analysis Setup settings save to the linked profile.", "neutral");

    function markUnsaved() {
      setMessage(validationMessage, "", "neutral");
      setStatus(statusMessage, "Unsaved Analysis Setup changes.", "neutral");
    }

    fields.enabled?.addEventListener("change", markUnsaved);

    RATE_FIELDS.forEach(function (fieldName) {
      fields[fieldName]?.addEventListener("input", function () {
        syncSliderFromNumber(fields, sliders, fieldName, false);
        markUnsaved();
      });

      fields[fieldName]?.addEventListener("change", function () {
        syncSliderFromNumber(fields, sliders, fieldName, true);
        markUnsaved();
      });

      sliders[fieldName]?.addEventListener("input", function () {
        syncNumberFromSlider(fields, sliders, fieldName);
        markUnsaved();
      });
    });

    assetFields.enabled?.addEventListener("change", markUnsaved);
    assetTreatmentFields.enabled?.addEventListener("change", markUnsaved);

    ASSET_LIQUIDITY_ITEMS.forEach(function (item) {
      assetFields.include[item.key]?.addEventListener("change", markUnsaved);
      assetFields.liquidity[item.key]?.addEventListener("change", markUnsaved);
      assetFields.haircut[item.key]?.addEventListener("input", markUnsaved);
      assetFields.haircut[item.key]?.addEventListener("change", function () {
        const field = assetFields.haircut[item.key];
        const rawValue = String(field?.value || "").trim();
        const number = Number(rawValue);
        if (field && rawValue && Number.isFinite(number) && number >= MIN_HAIRCUT && number <= MAX_HAIRCUT) {
          field.value = formatHaircutInputValue(number);
        }
        markUnsaved();
      });
    });

    ASSET_TREATMENT_ITEMS.forEach(function (item) {
      assetTreatmentFields.include[item.key]?.addEventListener("change", function () {
        syncAssetTreatmentPreview(assetTreatmentFields, item.key, linkedRecord);
        markUnsaved();
      });

      assetTreatmentFields.preset[item.key]?.addEventListener("change", function () {
        applyAssetTreatmentPreset(assetTreatmentFields, item.key, linkedRecord);
        markUnsaved();
      });

      ["tax", "haircut"].forEach(function (groupName) {
        assetTreatmentFields[groupName][item.key]?.addEventListener("input", function () {
          syncAssetTreatmentPreview(assetTreatmentFields, item.key, linkedRecord);
          markUnsaved();
        });

        assetTreatmentFields[groupName][item.key]?.addEventListener("change", function () {
          const field = assetTreatmentFields[groupName][item.key];
          const rawValue = String(field?.value || "").trim();
          const number = Number(rawValue);
          if (
            field
            && rawValue
            && Number.isFinite(number)
            && number >= MIN_ASSET_TREATMENT_PERCENT
            && number <= MAX_ASSET_TREATMENT_PERCENT
          ) {
            field.value = formatHaircutInputValue(number);
          }
          syncAssetTreatmentPreview(assetTreatmentFields, item.key, linkedRecord);
          markUnsaved();
        });
      });
    });

    const customAssetId = DEFAULT_CUSTOM_ASSET_TREATMENT.id;
    assetTreatmentFields.custom.label[customAssetId]?.addEventListener("input", markUnsaved);
    assetTreatmentFields.custom.value[customAssetId]?.addEventListener("input", function () {
      syncCustomAssetTreatmentPreview(assetTreatmentFields, customAssetId);
      markUnsaved();
    });
    assetTreatmentFields.custom.value[customAssetId]?.addEventListener("change", function () {
      const field = assetTreatmentFields.custom.value[customAssetId];
      const rawValue = String(field?.value || "").trim().replace(/[$,\s]/g, "");
      const number = Number(rawValue);
      if (field && rawValue && Number.isFinite(number) && number >= 0) {
        field.value = formatHaircutInputValue(number);
      }
      syncCustomAssetTreatmentPreview(assetTreatmentFields, customAssetId);
      markUnsaved();
    });
    assetTreatmentFields.custom.include[customAssetId]?.addEventListener("change", function () {
      syncCustomAssetTreatmentPreview(assetTreatmentFields, customAssetId);
      markUnsaved();
    });
    assetTreatmentFields.custom.preset[customAssetId]?.addEventListener("change", function () {
      applyCustomAssetTreatmentPreset(assetTreatmentFields, customAssetId);
      markUnsaved();
    });
    ["tax", "haircut"].forEach(function (groupName) {
      assetTreatmentFields.custom[groupName][customAssetId]?.addEventListener("input", function () {
        syncCustomAssetTreatmentPreview(assetTreatmentFields, customAssetId);
        markUnsaved();
      });

      assetTreatmentFields.custom[groupName][customAssetId]?.addEventListener("change", function () {
        const field = assetTreatmentFields.custom[groupName][customAssetId];
        const rawValue = String(field?.value || "").trim();
        const number = Number(rawValue);
        if (
          field
          && rawValue
          && Number.isFinite(number)
          && number >= MIN_ASSET_TREATMENT_PERCENT
          && number <= MAX_ASSET_TREATMENT_PERCENT
        ) {
          field.value = formatHaircutInputValue(number);
        }
        syncCustomAssetTreatmentPreview(assetTreatmentFields, customAssetId);
        markUnsaved();
      });
    });

    saveButton?.addEventListener("click", function () {
      linkedRecord = saveAnalysisSetupSettings(
        fields,
        sliders,
        assetFields,
        assetTreatmentFields,
        linkedRecord,
        validationMessage,
        statusMessage
      ) || linkedRecord;
    });

    applyButton?.addEventListener("click", function () {
      const updatedRecord = saveAnalysisSetupSettings(
        fields,
        sliders,
        assetFields,
        assetTreatmentFields,
        linkedRecord,
        validationMessage,
        statusMessage
      );
      if (!updatedRecord) {
        return;
      }

      window.location.href = "analysis-estimate.html";
    });
  }

  document.addEventListener("DOMContentLoaded", initializeAnalysisSetup);

  LensApp.analysisSetup = Object.assign(LensApp.analysisSetup || {}, {
    DEFAULT_INFLATION_ASSUMPTIONS,
    DEFAULT_ASSET_LIQUIDITY_ASSUMPTIONS,
    DEFAULT_ASSET_TREATMENT_ASSUMPTIONS,
    getInflationAssumptions,
    getAssetLiquidityAssumptions,
    getAssetTreatmentAssumptions
  });
})();
