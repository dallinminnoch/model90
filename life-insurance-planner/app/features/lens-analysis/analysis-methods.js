(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis pure analysis method layer.
  // Purpose: consume a normalized Lens model and return traceable method
  // results. Keep formulas out of PMI pages so they can later move behind an
  // API without changing the page layer.
  // Non-goals: no DOM, no storage, no Lens model building, no recommendation
  // mutation, no coverage placement, and no Needs/HLV calculations in this pass.

  const DEFAULT_DIME_INCOME_YEARS = 10;

  const DIME_NON_MORTGAGE_DEBT_FIELDS = Object.freeze([
    Object.freeze({
      key: "otherRealEstateLoanBalance",
      sourcePath: "debtPayoff.otherRealEstateLoanBalance",
      label: "Other real estate loans"
    }),
    Object.freeze({
      key: "autoLoanBalance",
      sourcePath: "debtPayoff.autoLoanBalance",
      label: "Auto loans"
    }),
    Object.freeze({
      key: "creditCardBalance",
      sourcePath: "debtPayoff.creditCardBalance",
      label: "Credit card debt"
    }),
    Object.freeze({
      key: "studentLoanBalance",
      sourcePath: "debtPayoff.studentLoanBalance",
      label: "Student loans"
    }),
    Object.freeze({
      key: "personalLoanBalance",
      sourcePath: "debtPayoff.personalLoanBalance",
      label: "Personal loans"
    }),
    Object.freeze({
      key: "outstandingTaxLiabilities",
      sourcePath: "debtPayoff.outstandingTaxLiabilities",
      label: "Outstanding tax liabilities"
    }),
    Object.freeze({
      key: "businessDebtBalance",
      sourcePath: "debtPayoff.businessDebtBalance",
      label: "Business debt"
    }),
    Object.freeze({
      key: "otherDebtPayoffNeeds",
      sourcePath: "debtPayoff.otherDebtPayoffNeeds",
      label: "Other debt payoff needs"
    })
  ]);

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function getPath(source, path) {
    if (!isPlainObject(source) || !path) {
      return undefined;
    }

    return String(path).split(".").reduce(function (value, segment) {
      return value == null ? undefined : value[segment];
    }, source);
  }

  function toOptionalNumber(value) {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    const normalized = String(value)
      .replace(/,/g, "")
      .replace(/[^0-9.-]/g, "")
      .trim();

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function createWarning(code, message, severity, sourcePaths) {
    return {
      code,
      message,
      severity: severity || "info",
      sourcePaths: Array.isArray(sourcePaths) ? sourcePaths : []
    };
  }

  function addWarning(warnings, code, message, severity, sourcePaths) {
    warnings.push(createWarning(code, message, severity, sourcePaths));
  }

  function createTraceRow(options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    return {
      key: normalizedOptions.key,
      label: normalizedOptions.label,
      formula: normalizedOptions.formula,
      inputs: normalizedOptions.inputs || {},
      value: normalizedOptions.value,
      sourcePaths: Array.isArray(normalizedOptions.sourcePaths) ? normalizedOptions.sourcePaths : []
    };
  }

  function normalizeNonNegativeNumber(value, sourcePath, warnings, warningContext) {
    const numericValue = toOptionalNumber(value);
    if (numericValue == null) {
      return {
        value: null,
        hasValue: false
      };
    }

    if (numericValue < 0) {
      addWarning(
        warnings,
        warningContext.negativeCode,
        warningContext.negativeMessage,
        "warning",
        [sourcePath]
      );
      return {
        value: 0,
        hasValue: true
      };
    }

    return {
      value: numericValue,
      hasValue: true
    };
  }

  function normalizeComponentNumber(options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const warnings = normalizedOptions.warnings;
    const normalized = normalizeNonNegativeNumber(
      normalizedOptions.value,
      normalizedOptions.sourcePath,
      warnings,
      {
        negativeCode: normalizedOptions.negativeCode,
        negativeMessage: normalizedOptions.negativeMessage
      }
    );

    if (!normalized.hasValue && normalizedOptions.warnWhenMissing === true) {
      addWarning(
        warnings,
        normalizedOptions.missingCode,
        normalizedOptions.missingMessage,
        normalizedOptions.missingSeverity || "info",
        [normalizedOptions.sourcePath]
      );
    }

    return normalized.value == null ? 0 : normalized.value;
  }

  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  function createDebtComponent(lensModel, warnings) {
    const debtPayoff = isPlainObject(lensModel?.debtPayoff) ? lensModel.debtPayoff : {};
    let hasAnyExplicitDebtValue = false;
    let total = 0;
    const inputs = {};

    DIME_NON_MORTGAGE_DEBT_FIELDS.forEach(function (field) {
      const rawValue = debtPayoff[field.key];
      const normalized = normalizeNonNegativeNumber(rawValue, field.sourcePath, warnings, {
        negativeCode: "negative-debt-component",
        negativeMessage: field.label + " was negative and was treated as 0 for DIME."
      });

      inputs[field.key] = normalized.value;

      if (!normalized.hasValue) {
        return;
      }

      hasAnyExplicitDebtValue = true;
      total += normalized.value;
    });

    if (hasAnyExplicitDebtValue) {
      return {
        value: total,
        source: "explicit-non-mortgage-debt-fields",
        inputs,
        sourcePaths: DIME_NON_MORTGAGE_DEBT_FIELDS.map(function (field) {
          return field.sourcePath;
        })
      };
    }

    const fallbackTotal = toOptionalNumber(debtPayoff.totalDebtPayoffNeed);
    if (fallbackTotal != null) {
      const mortgage = Math.max(0, toOptionalNumber(debtPayoff.mortgageBalance) || 0);
      const normalizedFallbackTotal = Math.max(0, fallbackTotal);
      if (fallbackTotal < 0) {
        addWarning(
          warnings,
          "negative-debt-component",
          "totalDebtPayoffNeed was negative and was treated as 0 for DIME.",
          "warning",
          ["debtPayoff.totalDebtPayoffNeed"]
        );
      }
      const safeFallbackDebt = Math.max(0, normalizedFallbackTotal - mortgage);

      addWarning(
        warnings,
        "debt-component-fallback-used",
        "DIME debt used totalDebtPayoffNeed as a fallback because individual non-mortgage debt fields were missing.",
        "warning",
        ["debtPayoff.totalDebtPayoffNeed", "debtPayoff.mortgageBalance"]
      );

      if (mortgage > 0) {
        addWarning(
          warnings,
          "possible-mortgage-double-count-prevented",
          "Mortgage balance was subtracted from the fallback debt total so DIME mortgage is not double counted.",
          "info",
          ["debtPayoff.totalDebtPayoffNeed", "debtPayoff.mortgageBalance"]
        );
      }

      return {
        value: normalizeComponentNumber({
          value: safeFallbackDebt,
          sourcePath: "debtPayoff.totalDebtPayoffNeed",
          warnings,
          negativeCode: "negative-debt-component",
          negativeMessage: "Fallback debt component was negative and was treated as 0 for DIME."
        }),
        source: mortgage > 0 ? "total-debt-payoff-minus-mortgage-fallback" : "total-debt-payoff-fallback",
        inputs: {
          totalDebtPayoffNeed: normalizedFallbackTotal,
          mortgageBalance: mortgage
        },
        sourcePaths: ["debtPayoff.totalDebtPayoffNeed", "debtPayoff.mortgageBalance"]
      };
    }

    addWarning(
      warnings,
      "missing-non-mortgage-debt-fields",
      "No non-mortgage debt fields were available; DIME debt component defaulted to 0.",
      "info",
      DIME_NON_MORTGAGE_DEBT_FIELDS.map(function (field) {
        return field.sourcePath;
      })
    );

    return {
      value: 0,
      source: "missing-default-zero",
      inputs,
      sourcePaths: DIME_NON_MORTGAGE_DEBT_FIELDS.map(function (field) {
        return field.sourcePath;
      })
    };
  }

  function getDimeIncomeYears(settings, warnings) {
    if (!hasOwn(settings, "dimeIncomeYears")) {
      return DEFAULT_DIME_INCOME_YEARS;
    }

    const years = toOptionalNumber(settings.dimeIncomeYears);
    if (years == null || years <= 0) {
      addWarning(
        warnings,
        "invalid-dime-income-years",
        "Invalid DIME income years setting; defaulted to 10 years.",
        "warning",
        ["settings.dimeIncomeYears"]
      );
      return DEFAULT_DIME_INCOME_YEARS;
    }

    return years;
  }

  function getBooleanSetting(settings, settingName, defaultValue) {
    return hasOwn(settings, settingName) ? settings[settingName] !== false : defaultValue;
  }

  function roundToIncrement(value, increment) {
    if (!Number.isFinite(value) || !Number.isFinite(increment) || increment <= 0) {
      return value;
    }

    return Math.round(value / increment) * increment;
  }

  function applyOptionalRounding(result, settings, warnings) {
    if (!hasOwn(settings, "roundingIncrement")) {
      return result;
    }

    const roundingIncrement = toOptionalNumber(settings.roundingIncrement);
    if (roundingIncrement == null || roundingIncrement <= 0) {
      addWarning(
        warnings,
        "invalid-rounding-increment",
        "Invalid rounding increment was ignored.",
        "warning",
        ["settings.roundingIncrement"]
      );
      return result;
    }

    return {
      ...result,
      grossNeed: roundToIncrement(result.grossNeed, roundingIncrement),
      netCoverageGap: roundToIncrement(result.netCoverageGap, roundingIncrement)
    };
  }

  function runDimeAnalysis(lensModel, settings) {
    const model = isPlainObject(lensModel) ? lensModel : {};
    const normalizedSettings = isPlainObject(settings) ? settings : {};
    const warnings = [];
    const trace = [];
    const dimeIncomeYears = getDimeIncomeYears(normalizedSettings, warnings);
    const includeExistingCoverageOffset = getBooleanSetting(
      normalizedSettings,
      "includeExistingCoverageOffset",
      true
    );
    const includeOffsetAssets = normalizedSettings.includeOffsetAssets === true;

    if (!includeOffsetAssets) {
      addWarning(
        warnings,
        "offset-assets-disabled-by-default",
        "Offset assets were not applied because DIME only includes asset offsets when includeOffsetAssets is true.",
        "info",
        ["settings.includeOffsetAssets", "offsetAssets.totalAvailableOffsetAssetValue"]
      );
    }

    const debtComponent = createDebtComponent(model, warnings);
    const annualIncomeReplacementBase = normalizeComponentNumber({
      value: getPath(model, "incomeBasis.annualIncomeReplacementBase"),
      sourcePath: "incomeBasis.annualIncomeReplacementBase",
      warnings,
      warnWhenMissing: true,
      missingCode: "missing-annual-income-replacement-base",
      missingMessage: "annualIncomeReplacementBase was missing; DIME income component defaulted to 0.",
      negativeCode: "negative-annual-income-replacement-base",
      negativeMessage: "annualIncomeReplacementBase was negative and was treated as 0 for DIME."
    });
    const income = annualIncomeReplacementBase * dimeIncomeYears;
    const mortgage = normalizeComponentNumber({
      value: getPath(model, "debtPayoff.mortgageBalance"),
      sourcePath: "debtPayoff.mortgageBalance",
      warnings,
      warnWhenMissing: true,
      missingCode: "missing-mortgage-balance",
      missingMessage: "mortgageBalance was missing; DIME mortgage component defaulted to 0.",
      negativeCode: "negative-mortgage-balance",
      negativeMessage: "mortgageBalance was negative and was treated as 0 for DIME."
    });
    const education = normalizeComponentNumber({
      value: getPath(model, "educationSupport.totalEducationFundingNeed"),
      sourcePath: "educationSupport.totalEducationFundingNeed",
      warnings,
      warnWhenMissing: true,
      missingCode: "missing-education-funding-need",
      missingMessage: "totalEducationFundingNeed was missing; DIME education component defaulted to 0.",
      negativeCode: "negative-education-funding-need",
      negativeMessage: "totalEducationFundingNeed was negative and was treated as 0 for DIME."
    });
    const existingCoverageOffset = includeExistingCoverageOffset
      ? normalizeComponentNumber({
          value: getPath(model, "existingCoverage.totalExistingCoverage"),
          sourcePath: "existingCoverage.totalExistingCoverage",
          warnings,
          warnWhenMissing: true,
          missingCode: "existing-coverage-missing",
          missingMessage: "totalExistingCoverage was missing; existing coverage offset defaulted to 0.",
          missingSeverity: "info",
          negativeCode: "negative-existing-coverage",
          negativeMessage: "totalExistingCoverage was negative and was treated as 0 for DIME."
        })
      : 0;
    const assetOffset = includeOffsetAssets
      ? normalizeComponentNumber({
          value: getPath(model, "offsetAssets.totalAvailableOffsetAssetValue"),
          sourcePath: "offsetAssets.totalAvailableOffsetAssetValue",
          warnings,
          warnWhenMissing: true,
          missingCode: "offset-assets-missing",
          missingMessage: "totalAvailableOffsetAssetValue was missing; asset offset defaulted to 0.",
          missingSeverity: "info",
          negativeCode: "negative-offset-assets",
          negativeMessage: "totalAvailableOffsetAssetValue was negative and was treated as 0 for DIME."
        })
      : 0;

    const grossNeed = debtComponent.value + income + mortgage + education;
    const totalOffset = existingCoverageOffset + assetOffset;
    const rawUncappedGap = grossNeed - totalOffset;
    const netCoverageGap = Math.max(rawUncappedGap, 0);

    trace.push(createTraceRow({
      key: "debt",
      label: "Debt",
      formula: debtComponent.source === "explicit-non-mortgage-debt-fields"
        ? "Sum of non-mortgage debt fields"
        : "Fallback debt total minus mortgage when available",
      inputs: debtComponent.inputs,
      value: debtComponent.value,
      sourcePaths: debtComponent.sourcePaths
    }));
    trace.push(createTraceRow({
      key: "income",
      label: "Income",
      formula: "annualIncomeReplacementBase x dimeIncomeYears",
      inputs: {
        annualIncomeReplacementBase,
        dimeIncomeYears
      },
      value: income,
      sourcePaths: ["incomeBasis.annualIncomeReplacementBase", "settings.dimeIncomeYears"]
    }));
    trace.push(createTraceRow({
      key: "mortgage",
      label: "Mortgage",
      formula: "mortgageBalance",
      inputs: {
        mortgageBalance: mortgage
      },
      value: mortgage,
      sourcePaths: ["debtPayoff.mortgageBalance"]
    }));
    trace.push(createTraceRow({
      key: "education",
      label: "Education",
      formula: "totalEducationFundingNeed",
      inputs: {
        totalEducationFundingNeed: education
      },
      value: education,
      sourcePaths: ["educationSupport.totalEducationFundingNeed"]
    }));
    trace.push(createTraceRow({
      key: "grossNeed",
      label: "Gross DIME Need",
      formula: "debt + income + mortgage + education",
      inputs: {
        debt: debtComponent.value,
        income,
        mortgage,
        education
      },
      value: grossNeed,
      sourcePaths: []
    }));
    trace.push(createTraceRow({
      key: "existingCoverageOffset",
      label: "Existing Coverage Offset",
      formula: includeExistingCoverageOffset
        ? "existingCoverage.totalExistingCoverage"
        : "disabled by settings",
      inputs: {
        includeExistingCoverageOffset
      },
      value: existingCoverageOffset,
      sourcePaths: ["existingCoverage.totalExistingCoverage", "settings.includeExistingCoverageOffset"]
    }));
    trace.push(createTraceRow({
      key: "assetOffset",
      label: "Asset Offset",
      formula: includeOffsetAssets
        ? "offsetAssets.totalAvailableOffsetAssetValue"
        : "disabled by settings",
      inputs: {
        includeOffsetAssets
      },
      value: assetOffset,
      sourcePaths: ["offsetAssets.totalAvailableOffsetAssetValue", "settings.includeOffsetAssets"]
    }));
    trace.push(createTraceRow({
      key: "netCoverageGap",
      label: "Net Coverage Gap",
      formula: "max(grossNeed - totalOffset, 0)",
      inputs: {
        grossNeed,
        totalOffset
      },
      value: netCoverageGap,
      sourcePaths: []
    }));

    const baseResult = {
      method: "dime",
      label: "DIME Analysis",
      grossNeed,
      netCoverageGap,
      rawUncappedGap,
      components: {
        debt: debtComponent.value,
        income,
        mortgage,
        education
      },
      commonOffsets: {
        existingCoverageOffset,
        assetOffset,
        totalOffset
      },
      assumptions: {
        dimeIncomeYears,
        includeExistingCoverageOffset,
        includeOffsetAssets,
        debtComponentSource: debtComponent.source,
        incomeComponentSource: "incomeBasis.annualIncomeReplacementBase",
        mortgageComponentSource: "debtPayoff.mortgageBalance",
        educationComponentSource: "educationSupport.totalEducationFundingNeed"
      },
      warnings,
      trace
    };

    return applyOptionalRounding(baseResult, normalizedSettings, warnings);
  }

  function runAnalysisMethods(lensModel, settings) {
    return {
      dime: runDimeAnalysis(lensModel, settings)
    };
  }

  const analysisMethods = {
    runDimeAnalysis,
    runAnalysisMethods
  };

  lensAnalysis.analysisMethods = Object.assign(
    lensAnalysis.analysisMethods || {},
    analysisMethods
  );
})(window);
