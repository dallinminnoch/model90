(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis pure analysis method layer.
  // Purpose: consume a normalized Lens model and return traceable method
  // results. Keep formulas out of PMI pages so they can later move behind an
  // API without changing the page layer.
  // Non-goals: no DOM, no storage, no Lens model building, no recommendation
  // mutation, no coverage placement, and no HLV calculation in this pass.

  const DEFAULT_DIME_INCOME_YEARS = 10;
  const DEFAULT_NEEDS_SUPPORT_DURATION_YEARS = 10;

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

  const NEEDS_DEBT_PAYOFF_FALLBACK_FIELDS = Object.freeze([
    Object.freeze({
      key: "mortgageBalance",
      sourcePath: "debtPayoff.mortgageBalance",
      label: "Mortgage balance"
    }),
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

  function getPositiveNumber(value) {
    const number = toOptionalNumber(value);
    return number != null && number > 0 ? number : null;
  }

  function resolveNeedsSupportDuration(model, settings, warnings) {
    if (hasOwn(settings, "needsSupportDurationYears")) {
      const settingYears = getPositiveNumber(settings.needsSupportDurationYears);
      if (settingYears != null) {
        return {
          value: settingYears,
          source: "settings.needsSupportDurationYears",
          sourcePaths: ["settings.needsSupportDurationYears"]
        };
      }

      addWarning(
        warnings,
        "invalid-needs-support-duration-years",
        "Invalid Needs Analysis support duration setting was ignored.",
        "warning",
        ["settings.needsSupportDurationYears"]
      );
    }

    const survivorSupportYears = getPositiveNumber(getPath(model, "survivorScenario.incomeSupportDurationYears"));
    if (survivorSupportYears != null) {
      return {
        value: survivorSupportYears,
        source: "survivorScenario.incomeSupportDurationYears",
        sourcePaths: ["survivorScenario.incomeSupportDurationYears"]
      };
    }

    const retirementHorizonYears = getPositiveNumber(getPath(model, "incomeBasis.insuredRetirementHorizonYears"));
    if (retirementHorizonYears != null) {
      return {
        value: retirementHorizonYears,
        source: "incomeBasis.insuredRetirementHorizonYears",
        sourcePaths: ["incomeBasis.insuredRetirementHorizonYears"]
      };
    }

    addWarning(
      warnings,
      "support-duration-defaulted",
      "Needs Analysis support duration defaulted to 10 years because no valid duration source was available.",
      "info",
      [
        "settings.needsSupportDurationYears",
        "survivorScenario.incomeSupportDurationYears",
        "incomeBasis.insuredRetirementHorizonYears"
      ]
    );

    return {
      value: DEFAULT_NEEDS_SUPPORT_DURATION_YEARS,
      source: "default-10-years",
      sourcePaths: ["settings.needsSupportDurationYears"]
    };
  }

  function resolveSurvivorIncomeOffsetYears(model, settings, needsSupportDurationYears, warnings) {
    if (hasOwn(settings, "survivorIncomeOffsetYears")) {
      const settingYears = getPositiveNumber(settings.survivorIncomeOffsetYears);
      if (settingYears != null) {
        return {
          value: settingYears,
          source: "settings.survivorIncomeOffsetYears",
          sourcePaths: ["settings.survivorIncomeOffsetYears"]
        };
      }

      addWarning(
        warnings,
        "invalid-survivor-income-offset-years",
        "Invalid survivor income offset years setting was ignored.",
        "warning",
        ["settings.survivorIncomeOffsetYears"]
      );
    }

    const survivorSupportYears = getPositiveNumber(getPath(model, "survivorScenario.incomeSupportDurationYears"));
    if (survivorSupportYears != null) {
      return {
        value: survivorSupportYears,
        source: "survivorScenario.incomeSupportDurationYears",
        sourcePaths: ["survivorScenario.incomeSupportDurationYears"]
      };
    }

    return {
      value: needsSupportDurationYears,
      source: "needsSupportDurationYears",
      sourcePaths: ["settings.needsSupportDurationYears", "survivorScenario.incomeSupportDurationYears"]
    };
  }

  function createNeedsDebtPayoffComponent(model, warnings) {
    const debtPayoff = isPlainObject(model?.debtPayoff) ? model.debtPayoff : {};
    const totalDebtPayoffNeed = toOptionalNumber(debtPayoff.totalDebtPayoffNeed);

    if (totalDebtPayoffNeed != null) {
      return {
        value: normalizeComponentNumber({
          value: totalDebtPayoffNeed,
          sourcePath: "debtPayoff.totalDebtPayoffNeed",
          warnings,
          negativeCode: "negative-value-treated-as-zero",
          negativeMessage: "totalDebtPayoffNeed was negative and was treated as 0 for Needs Analysis."
        }),
        source: "debtPayoff.totalDebtPayoffNeed",
        inputs: {
          totalDebtPayoffNeed
        },
        sourcePaths: ["debtPayoff.totalDebtPayoffNeed"]
      };
    }

    let hasFallbackDebtValue = false;
    let fallbackTotal = 0;
    const fallbackInputs = {};

    NEEDS_DEBT_PAYOFF_FALLBACK_FIELDS.forEach(function (field) {
      const normalized = normalizeNonNegativeNumber(debtPayoff[field.key], field.sourcePath, warnings, {
        negativeCode: "negative-value-treated-as-zero",
        negativeMessage: field.label + " was negative and was treated as 0 for Needs Analysis."
      });

      fallbackInputs[field.key] = normalized.value;
      if (!normalized.hasValue) {
        return;
      }

      hasFallbackDebtValue = true;
      fallbackTotal += normalized.value;
    });

    if (hasFallbackDebtValue) {
      addWarning(
        warnings,
        "debt-payoff-fallback-used",
        "Needs Analysis debt payoff used the sum of available debt fields because totalDebtPayoffNeed was missing.",
        "info",
        NEEDS_DEBT_PAYOFF_FALLBACK_FIELDS.map(function (field) {
          return field.sourcePath;
        })
      );

      return {
        value: fallbackTotal,
        source: "sum-available-debt-payoff-fields",
        inputs: fallbackInputs,
        sourcePaths: NEEDS_DEBT_PAYOFF_FALLBACK_FIELDS.map(function (field) {
          return field.sourcePath;
        })
      };
    }

    addWarning(
      warnings,
      "missing-total-debt-payoff-need",
      "totalDebtPayoffNeed was missing; Needs Analysis debt payoff component defaulted to 0.",
      "info",
      ["debtPayoff.totalDebtPayoffNeed"]
    );

    return {
      value: 0,
      source: "missing-default-zero",
      inputs: fallbackInputs,
      sourcePaths: ["debtPayoff.totalDebtPayoffNeed"]
    };
  }

  function createEssentialSupportComponent(model, settings, needsSupportDurationYears, warnings) {
    const annualSupport = normalizeNonNegativeNumber(
      getPath(model, "ongoingSupport.annualTotalEssentialSupportCost"),
      "ongoingSupport.annualTotalEssentialSupportCost",
      warnings,
      {
        negativeCode: "negative-value-treated-as-zero",
        negativeMessage: "annualTotalEssentialSupportCost was negative and was treated as 0 for Needs Analysis."
      }
    );

    if (annualSupport.hasValue) {
      return {
        value: annualSupport.value * needsSupportDurationYears,
        source: "ongoingSupport.annualTotalEssentialSupportCost",
        formula: "annualTotalEssentialSupportCost x needsSupportDurationYears",
        inputs: {
          annualTotalEssentialSupportCost: annualSupport.value,
          needsSupportDurationYears
        },
        sourcePaths: ["ongoingSupport.annualTotalEssentialSupportCost"]
      };
    }

    if (settings.allowIncomeFallback === true) {
      const incomeReplacementBase = normalizeNonNegativeNumber(
        getPath(model, "incomeBasis.annualIncomeReplacementBase"),
        "incomeBasis.annualIncomeReplacementBase",
        warnings,
        {
          negativeCode: "negative-value-treated-as-zero",
          negativeMessage: "annualIncomeReplacementBase was negative and was treated as 0 for Needs Analysis income fallback."
        }
      );

      if (incomeReplacementBase.hasValue) {
        addWarning(
          warnings,
          "essential-support-income-fallback-used",
          "Needs Analysis used annualIncomeReplacementBase because annualTotalEssentialSupportCost was missing and allowIncomeFallback was true.",
          "warning",
          ["ongoingSupport.annualTotalEssentialSupportCost", "incomeBasis.annualIncomeReplacementBase"]
        );

        return {
          value: incomeReplacementBase.value * needsSupportDurationYears,
          source: "incomeBasis.annualIncomeReplacementBase",
          formula: "annualIncomeReplacementBase x needsSupportDurationYears",
          inputs: {
            annualIncomeReplacementBase: incomeReplacementBase.value,
            needsSupportDurationYears
          },
          sourcePaths: ["incomeBasis.annualIncomeReplacementBase"]
        };
      }
    }

    addWarning(
      warnings,
      "missing-essential-support-cost",
      "annualTotalEssentialSupportCost was missing; Needs Analysis essential support component defaulted to 0.",
      "warning",
      ["ongoingSupport.annualTotalEssentialSupportCost"]
    );

    return {
      value: 0,
      source: "missing-default-zero",
      formula: "annualTotalEssentialSupportCost x needsSupportDurationYears",
      inputs: {
        annualTotalEssentialSupportCost: null,
        needsSupportDurationYears
      },
      sourcePaths: ["ongoingSupport.annualTotalEssentialSupportCost"]
    };
  }

  function createAnnualDurationComponent(options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const annualValue = normalizeComponentNumber({
      value: normalizedOptions.value,
      sourcePath: normalizedOptions.sourcePath,
      warnings: normalizedOptions.warnings,
      warnWhenMissing: normalizedOptions.warnWhenMissing === true,
      missingCode: normalizedOptions.missingCode,
      missingMessage: normalizedOptions.missingMessage,
      missingSeverity: normalizedOptions.missingSeverity || "info",
      negativeCode: "negative-value-treated-as-zero",
      negativeMessage: normalizedOptions.negativeMessage
    });

    return annualValue * normalizedOptions.durationYears;
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

  function runNeedsAnalysis(lensModel, settings) {
    const model = isPlainObject(lensModel) ? lensModel : {};
    const normalizedSettings = isPlainObject(settings) ? settings : {};
    const warnings = [];
    const trace = [];
    const durationResult = resolveNeedsSupportDuration(model, normalizedSettings, warnings);
    const needsSupportDurationYears = durationResult.value;
    const includeExistingCoverageOffset = getBooleanSetting(
      normalizedSettings,
      "includeExistingCoverageOffset",
      true
    );
    const includeOffsetAssets = getBooleanSetting(normalizedSettings, "includeOffsetAssets", true);
    const includeTransitionNeeds = getBooleanSetting(normalizedSettings, "includeTransitionNeeds", true);
    const includeDiscretionarySupport = normalizedSettings.includeDiscretionarySupport === true;
    const includeSurvivorIncomeOffset = normalizedSettings.includeSurvivorIncomeOffset === true;

    if (!includeDiscretionarySupport) {
      addWarning(
        warnings,
        "discretionary-support-disabled",
        "Discretionary support was not included because includeDiscretionarySupport is not true.",
        "info",
        ["settings.includeDiscretionarySupport", "ongoingSupport.annualDiscretionaryPersonalSpending"]
      );
    }

    if (!includeSurvivorIncomeOffset) {
      addWarning(
        warnings,
        "survivor-income-offset-disabled",
        "Survivor income was not applied as an offset because includeSurvivorIncomeOffset is not true.",
        "info",
        ["settings.includeSurvivorIncomeOffset", "survivorScenario.survivorNetAnnualIncome"]
      );
    }

    const debtPayoffComponent = createNeedsDebtPayoffComponent(model, warnings);
    const essentialSupportComponent = createEssentialSupportComponent(
      model,
      normalizedSettings,
      needsSupportDurationYears,
      warnings
    );
    const education = normalizeComponentNumber({
      value: getPath(model, "educationSupport.totalEducationFundingNeed"),
      sourcePath: "educationSupport.totalEducationFundingNeed",
      warnings,
      warnWhenMissing: true,
      missingCode: "missing-education-funding-need",
      missingMessage: "totalEducationFundingNeed was missing; Needs Analysis education component defaulted to 0.",
      negativeCode: "negative-value-treated-as-zero",
      negativeMessage: "totalEducationFundingNeed was negative and was treated as 0 for Needs Analysis."
    });
    const finalExpenses = normalizeComponentNumber({
      value: getPath(model, "finalExpenses.totalFinalExpenseNeed"),
      sourcePath: "finalExpenses.totalFinalExpenseNeed",
      warnings,
      warnWhenMissing: true,
      missingCode: "missing-final-expense-need",
      missingMessage: "totalFinalExpenseNeed was missing; Needs Analysis final expenses component defaulted to 0.",
      negativeCode: "negative-value-treated-as-zero",
      negativeMessage: "totalFinalExpenseNeed was negative and was treated as 0 for Needs Analysis."
    });
    const transitionNeeds = includeTransitionNeeds
      ? normalizeComponentNumber({
          value: getPath(model, "transitionNeeds.totalTransitionNeed"),
          sourcePath: "transitionNeeds.totalTransitionNeed",
          warnings,
          warnWhenMissing: true,
          missingCode: "missing-transition-need",
          missingMessage: "totalTransitionNeed was missing; Needs Analysis transition needs component defaulted to 0.",
          negativeCode: "negative-value-treated-as-zero",
          negativeMessage: "totalTransitionNeed was negative and was treated as 0 for Needs Analysis."
        })
      : 0;
    const discretionarySupport = includeDiscretionarySupport
      ? createAnnualDurationComponent({
          value: getPath(model, "ongoingSupport.annualDiscretionaryPersonalSpending"),
          sourcePath: "ongoingSupport.annualDiscretionaryPersonalSpending",
          warnings,
          warnWhenMissing: true,
          missingCode: "missing-discretionary-support-cost",
          missingMessage: "annualDiscretionaryPersonalSpending was missing; discretionary support component defaulted to 0.",
          negativeMessage: "annualDiscretionaryPersonalSpending was negative and was treated as 0 for Needs Analysis.",
          durationYears: needsSupportDurationYears
        })
      : 0;

    const existingCoverageOffset = includeExistingCoverageOffset
      ? normalizeComponentNumber({
          value: getPath(model, "existingCoverage.totalExistingCoverage"),
          sourcePath: "existingCoverage.totalExistingCoverage",
          warnings,
          warnWhenMissing: true,
          missingCode: "missing-existing-coverage",
          missingMessage: "totalExistingCoverage was missing; existing coverage offset defaulted to 0.",
          missingSeverity: "info",
          negativeCode: "negative-value-treated-as-zero",
          negativeMessage: "totalExistingCoverage was negative and was treated as 0 for Needs Analysis."
        })
      : 0;
    const assetOffset = includeOffsetAssets
      ? normalizeComponentNumber({
          value: getPath(model, "offsetAssets.totalAvailableOffsetAssetValue"),
          sourcePath: "offsetAssets.totalAvailableOffsetAssetValue",
          warnings,
          warnWhenMissing: true,
          missingCode: "missing-offset-assets",
          missingMessage: "totalAvailableOffsetAssetValue was missing; asset offset defaulted to 0.",
          missingSeverity: "info",
          negativeCode: "negative-value-treated-as-zero",
          negativeMessage: "totalAvailableOffsetAssetValue was negative and was treated as 0 for Needs Analysis."
        })
      : 0;
    const survivorIncomeOffsetDuration = resolveSurvivorIncomeOffsetYears(
      model,
      normalizedSettings,
      needsSupportDurationYears,
      warnings
    );
    const survivorIncomeOffset = includeSurvivorIncomeOffset
      ? createAnnualDurationComponent({
          value: getPath(model, "survivorScenario.survivorNetAnnualIncome"),
          sourcePath: "survivorScenario.survivorNetAnnualIncome",
          warnings,
          warnWhenMissing: true,
          missingCode: "missing-survivor-net-income",
          missingMessage: "survivorNetAnnualIncome was missing; survivor income offset defaulted to 0.",
          negativeMessage: "survivorNetAnnualIncome was negative and was treated as 0 for Needs Analysis.",
          durationYears: survivorIncomeOffsetDuration.value
        })
      : 0;
    const survivorIncomeStartDelayMonths = toOptionalNumber(
      getPath(model, "survivorScenario.survivorIncomeStartDelayMonths")
    );

    if (includeSurvivorIncomeOffset && survivorIncomeStartDelayMonths != null && survivorIncomeStartDelayMonths > 0) {
      addWarning(
        warnings,
        "survivor-income-start-delay-not-applied-v1",
        "Survivor income start delay is captured in survivorScenario but is not applied to the v1 Needs Analysis survivor income offset.",
        "info",
        ["survivorScenario.survivorIncomeStartDelayMonths"]
      );
    }

    const grossNeed = debtPayoffComponent.value
      + essentialSupportComponent.value
      + education
      + finalExpenses
      + transitionNeeds
      + discretionarySupport;
    const totalOffset = existingCoverageOffset + assetOffset + survivorIncomeOffset;
    const rawUncappedGap = grossNeed - totalOffset;
    const netCoverageGap = Math.max(rawUncappedGap, 0);

    trace.push(createTraceRow({
      key: "debtPayoff",
      label: "Debt Payoff",
      formula: debtPayoffComponent.source === "debtPayoff.totalDebtPayoffNeed"
        ? "debtPayoff.totalDebtPayoffNeed"
        : "Sum of available debt payoff fields",
      inputs: debtPayoffComponent.inputs,
      value: debtPayoffComponent.value,
      sourcePaths: debtPayoffComponent.sourcePaths
    }));
    trace.push(createTraceRow({
      key: "essentialSupport",
      label: "Essential Support",
      formula: essentialSupportComponent.formula,
      inputs: essentialSupportComponent.inputs,
      value: essentialSupportComponent.value,
      sourcePaths: essentialSupportComponent.sourcePaths
    }));
    trace.push(createTraceRow({
      key: "education",
      label: "Education",
      formula: "educationSupport.totalEducationFundingNeed",
      inputs: {
        totalEducationFundingNeed: education
      },
      value: education,
      sourcePaths: ["educationSupport.totalEducationFundingNeed"]
    }));
    trace.push(createTraceRow({
      key: "finalExpenses",
      label: "Final Expenses",
      formula: "finalExpenses.totalFinalExpenseNeed",
      inputs: {
        totalFinalExpenseNeed: finalExpenses
      },
      value: finalExpenses,
      sourcePaths: ["finalExpenses.totalFinalExpenseNeed"]
    }));
    trace.push(createTraceRow({
      key: "transitionNeeds",
      label: "Transition Needs",
      formula: includeTransitionNeeds ? "transitionNeeds.totalTransitionNeed" : "disabled by settings",
      inputs: {
        includeTransitionNeeds
      },
      value: transitionNeeds,
      sourcePaths: ["transitionNeeds.totalTransitionNeed", "settings.includeTransitionNeeds"]
    }));
    trace.push(createTraceRow({
      key: "discretionarySupport",
      label: "Discretionary Support",
      formula: includeDiscretionarySupport
        ? "annualDiscretionaryPersonalSpending x needsSupportDurationYears"
        : "disabled by settings",
      inputs: {
        annualDiscretionaryPersonalSpending: includeDiscretionarySupport
          ? toOptionalNumber(getPath(model, "ongoingSupport.annualDiscretionaryPersonalSpending"))
          : null,
        needsSupportDurationYears,
        includeDiscretionarySupport
      },
      value: discretionarySupport,
      sourcePaths: ["ongoingSupport.annualDiscretionaryPersonalSpending", "settings.includeDiscretionarySupport"]
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
      key: "survivorIncomeOffset",
      label: "Survivor Income Offset",
      formula: includeSurvivorIncomeOffset
        ? "survivorNetAnnualIncome x survivorIncomeOffsetYears"
        : "disabled by settings",
      inputs: {
        survivorNetAnnualIncome: includeSurvivorIncomeOffset
          ? toOptionalNumber(getPath(model, "survivorScenario.survivorNetAnnualIncome"))
          : null,
        survivorIncomeOffsetYears: survivorIncomeOffsetDuration.value,
        includeSurvivorIncomeOffset
      },
      value: survivorIncomeOffset,
      sourcePaths: ["survivorScenario.survivorNetAnnualIncome", "settings.includeSurvivorIncomeOffset"]
    }));
    trace.push(createTraceRow({
      key: "grossNeed",
      label: "Gross Need",
      formula: "debtPayoff + essentialSupport + education + finalExpenses + transitionNeeds + discretionarySupport",
      inputs: {
        debtPayoff: debtPayoffComponent.value,
        essentialSupport: essentialSupportComponent.value,
        education,
        finalExpenses,
        transitionNeeds,
        discretionarySupport
      },
      value: grossNeed,
      sourcePaths: []
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
      method: "needsAnalysis",
      label: "Needs Analysis",
      grossNeed,
      netCoverageGap,
      rawUncappedGap,
      components: {
        debtPayoff: debtPayoffComponent.value,
        essentialSupport: essentialSupportComponent.value,
        education,
        finalExpenses,
        transitionNeeds,
        discretionarySupport
      },
      commonOffsets: {
        existingCoverageOffset,
        assetOffset,
        survivorIncomeOffset,
        totalOffset
      },
      assumptions: {
        needsSupportDurationYears,
        supportDurationSource: durationResult.source,
        includeExistingCoverageOffset,
        includeOffsetAssets,
        includeTransitionNeeds,
        includeDiscretionarySupport,
        includeSurvivorIncomeOffset,
        survivorIncomeOffsetYears: survivorIncomeOffsetDuration.value,
        survivorIncomeOffsetDurationSource: survivorIncomeOffsetDuration.source
      },
      warnings,
      trace
    };

    return applyOptionalRounding(baseResult, normalizedSettings, warnings);
  }

  function runAnalysisMethods(lensModel, settings) {
    return {
      dime: runDimeAnalysis(lensModel, settings),
      needsAnalysis: runNeedsAnalysis(lensModel, settings)
    };
  }

  const analysisMethods = {
    runDimeAnalysis,
    runNeedsAnalysis,
    runAnalysisMethods
  };

  lensAnalysis.analysisMethods = Object.assign(
    lensAnalysis.analysisMethods || {},
    analysisMethods
  );
})(window);
