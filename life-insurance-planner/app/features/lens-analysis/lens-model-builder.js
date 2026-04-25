(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis saved-data builder.
  // Purpose: derive the canonical Lens model from saved linked profile /
  // protectionModeling source data without depending on active PMI DOM fields.
  // Non-goals: no DOM reads, no storage writes/reads, no recommendation logic,
  // no coverage-gap math, and no legacy analysis bucket dependency.

  const SURVIVOR_NET_INCOME_TAX_BASIS = "Qualifying Surviving Spouse";
  const DEFAULT_ADDITIONAL_MEDICARE_THRESHOLDS = Object.freeze({
    "Single": "200000",
    "Married Filing Jointly": "250000",
    "Married Filing Separately": "125000",
    "Head of Household": "200000",
    "Qualifying Surviving Spouse": "250000"
  });

  function createWarning(code, message, details) {
    return {
      code,
      message,
      ...(details && typeof details === "object" ? { details } : {})
    };
  }

  function addWarning(warnings, code, message, details) {
    warnings.push(createWarning(code, message, details));
  }

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function clonePlainObject(value) {
    return isPlainObject(value) ? { ...value } : {};
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function isBlankValue(value) {
    return value == null || normalizeString(value) === "";
  }

  function toOptionalNumber(value) {
    if (typeof lensAnalysis.toOptionalNumber === "function") {
      return lensAnalysis.toOptionalNumber(value);
    }

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

  function parseCurrencyLikeNumber(value) {
    const optionalValue = toOptionalNumber(value);
    return optionalValue == null ? 0 : optionalValue;
  }

  function parsePercentLikeNumber(value) {
    return parseCurrencyLikeNumber(value) / 100;
  }

  function getFirstPresent(source, fieldNames) {
    const safeSource = source && typeof source === "object" ? source : {};
    const names = Array.isArray(fieldNames) ? fieldNames : [];

    for (let index = 0; index < names.length; index += 1) {
      const fieldName = names[index];
      if (Object.prototype.hasOwnProperty.call(safeSource, fieldName) && !isBlankValue(safeSource[fieldName])) {
        return safeSource[fieldName];
      }
    }

    return null;
  }

  function normalizeYesNoBoolean(value) {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    const normalized = normalizeString(value).toLowerCase();
    if (normalized === "yes" || normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "no" || normalized === "false" || normalized === "0") {
      return false;
    }

    return null;
  }

  function isTrue(value) {
    return value === true || normalizeString(value).toLowerCase() === "true";
  }

  function resolveSourceData(input, warnings) {
    const options = input && typeof input === "object" ? input : {};
    const profileRecord = isPlainObject(options.profileRecord) ? options.profileRecord : {};
    const protectionModelingPayload = isPlainObject(options.protectionModelingPayload)
      ? options.protectionModelingPayload
      : null;

    if (isPlainObject(options.sourceData)) {
      return {
        sourceData: clonePlainObject(options.sourceData),
        source: "sourceData"
      };
    }

    if (isPlainObject(protectionModelingPayload?.data)) {
      return {
        sourceData: clonePlainObject(protectionModelingPayload.data),
        source: "protectionModelingPayload.data"
      };
    }

    if (isPlainObject(profileRecord?.protectionModeling?.data)) {
      return {
        sourceData: clonePlainObject(profileRecord.protectionModeling.data),
        source: "profileRecord.protectionModeling.data"
      };
    }

    addWarning(
      warnings,
      "missing-source-data",
      "No saved protectionModeling source data was found; builder used an empty source object."
    );

    return {
      sourceData: {},
      source: "empty"
    };
  }

  function getProfileNumber(profileRecord, fieldNames) {
    const value = getFirstPresent(profileRecord, fieldNames);
    return toOptionalNumber(value);
  }

  function getLinkedDependentCount(profileRecord, sourceData, fieldName, profileFieldNames, warnings) {
    const profileValue = getProfileNumber(profileRecord, profileFieldNames);
    if (profileValue != null) {
      return profileValue;
    }

    const savedValue = toOptionalNumber(sourceData[fieldName]);
    if (savedValue != null) {
      addWarning(
        warnings,
        "linked-profile-dependent-fallback",
        "Linked profile dependent count was unavailable; saved PMI dependent count was used.",
        { fieldName }
      );
      return savedValue;
    }

    return null;
  }

  function getCoveragePolicies(profileRecord, warnings) {
    if (!profileRecord || !isPlainObject(profileRecord)) {
      addWarning(
        warnings,
        "missing-profile-record",
        "No linked profile record was provided; profile-linked coverage and dependent facts may be incomplete."
      );
      return [];
    }

    if (!Array.isArray(profileRecord.coveragePolicies)) {
      return [];
    }

    return profileRecord.coveragePolicies
      .filter(function (policy) {
        return policy && typeof policy === "object";
      })
      .map(function (policy) {
        return { ...policy };
      });
  }

  function getMaritalStatus(profileRecord, sourceData) {
    return normalizeString(
      getFirstPresent(profileRecord, ["maritalStatus", "linkedMaritalStatusDisplay"])
      || getFirstPresent(sourceData, ["linkedMaritalStatusDisplay", "maritalStatus"])
    );
  }

  function getStateOfResidence(profileRecord, sourceData) {
    return normalizeString(
      getFirstPresent(sourceData, ["stateOfResidence"])
      || getFirstPresent(profileRecord, ["state", "stateOfResidence"])
    ).toUpperCase();
  }

  function getIncomeCalculationMode(sourceData, profileRecord) {
    const maritalStatus = getMaritalStatus(profileRecord, sourceData);
    const filingStatus = normalizeString(sourceData.filingStatus);

    if (maritalStatus === "Married" && filingStatus === "Married Filing Jointly") {
      return "joint";
    }

    if (maritalStatus === "Married" && filingStatus === "Married Filing Separately") {
      return "separate";
    }

    return "single";
  }

  function getTaxUtils(input) {
    const taxConfig = input && typeof input === "object" ? input.taxConfig : null;
    return taxConfig?.taxUtils || global.LensPmiTaxUtils || {};
  }

  function getStandardDeductionConfig(taxConfig) {
    return taxConfig?.standardDeductions
      || taxConfig?.standardDeductionConfig
      || null;
  }

  function getFederalBracketRows(taxConfig, filingStatus) {
    const byStatus = taxConfig?.federalTaxBracketsByStatus
      || taxConfig?.federalTaxBrackets
      || taxConfig?.federalBracketsByStatus
      || null;
    const rows = byStatus && byStatus[filingStatus];
    return Array.isArray(rows) ? rows : null;
  }

  function getStateTaxConfig(taxConfig, stateCode, filingStatus) {
    const byState = taxConfig?.stateTaxConfigsByState
      || taxConfig?.stateTaxBracketsByState
      || taxConfig?.stateTaxConfigByState
      || null;
    const stateConfig = byState && byState[stateCode];

    if (!stateConfig || typeof stateConfig !== "object") {
      return null;
    }

    const hasIncomeTax = stateConfig.hasIncomeTax === false ? false : true;
    const mode = normalizeString(stateConfig.mode) === "flat" ? "flat" : "brackets";
    const filings = stateConfig.filings && typeof stateConfig.filings === "object"
      ? stateConfig.filings
      : null;
    const rows = filings && Array.isArray(filings[filingStatus])
      ? filings[filingStatus]
      : (Array.isArray(stateConfig.rows) ? stateConfig.rows : []);

    return {
      hasIncomeTax,
      mode,
      flatRate: normalizeString(stateConfig.flatRate),
      rows: hasIncomeTax ? rows : []
    };
  }

  function getDefaultAdditionalMedicareThresholds(taxConfig) {
    return function () {
      return {
        ...DEFAULT_ADDITIONAL_MEDICARE_THRESHOLDS,
        ...(taxConfig?.defaultAdditionalMedicareThresholds || {})
      };
    };
  }

  function canCalculateNetIncome(input, filingStatus, warnings, context) {
    const taxConfig = input?.taxConfig || null;
    const taxUtils = getTaxUtils(input);
    const standardDeductions = getStandardDeductionConfig(taxConfig);
    const federalRows = getFederalBracketRows(taxConfig, filingStatus);
    const payrollRows = Array.isArray(taxConfig?.payrollRows) ? taxConfig.payrollRows : null;

    const missing = [];
    if (typeof taxUtils.getStandardDeductionSplit !== "function") missing.push("getStandardDeductionSplit");
    if (typeof taxUtils.getProgressiveTaxAmount !== "function") missing.push("getProgressiveTaxAmount");
    if (typeof taxUtils.getProgressiveBracketTaxAmounts !== "function") missing.push("getProgressiveBracketTaxAmounts");
    if (typeof taxUtils.getBracketTaxAmounts !== "function") missing.push("getBracketTaxAmounts");
    if (typeof taxUtils.getPayrollTaxAmounts !== "function") missing.push("getPayrollTaxAmounts");
    if (typeof taxUtils.getNetIncome !== "function") missing.push("getNetIncome");
    if (!standardDeductions) missing.push("standardDeductions");
    if (!Array.isArray(federalRows)) missing.push("federalTaxBracketsByStatus[" + filingStatus + "]");
    if (!payrollRows) missing.push("payrollRows");

    if (missing.length) {
      addWarning(
        warnings,
        "tax-recomputation-unavailable",
        "Net-income recomputation was skipped because reusable tax helpers/config were incomplete.",
        {
          context,
          missing
        }
      );
      return false;
    }

    return true;
  }

  function getDeductionMethodValue(value) {
    return normalizeString(value).toLowerCase() === "itemized" ? "itemized" : "standard";
  }

  function getStandardDeductionAmount(taxConfig, filingStatus) {
    const standardDeductions = getStandardDeductionConfig(taxConfig);
    return parseCurrencyLikeNumber(standardDeductions?.[filingStatus]);
  }

  function getEffectiveDeductionValues(sourceData, profileRecord, taxConfig, taxUtils) {
    const filingStatus = normalizeString(sourceData.filingStatus);
    const incomeCalculationMode = getIncomeCalculationMode(sourceData, profileRecord);
    const primaryGrossIncome = parseCurrencyLikeNumber(sourceData.grossAnnualIncome);
    const spouseGrossIncome = parseCurrencyLikeNumber(sourceData.spouseIncome);
    const primaryMethod = getDeductionMethodValue(sourceData.deductionMethod);
    const spouseMethod = getDeductionMethodValue(sourceData.spouseDeductionMethod);
    const standardDeductionAmount = getStandardDeductionAmount(taxConfig, filingStatus);

    if (incomeCalculationMode === "joint") {
      return {
        primary: primaryMethod === "itemized"
          ? parseCurrencyLikeNumber(sourceData.yearlyTaxDeductions)
          : standardDeductionAmount,
        spouse: 0
      };
    }

    const split = taxUtils.getStandardDeductionSplit({
      filingStatus,
      deductionAmount: standardDeductionAmount,
      primaryIncome: primaryGrossIncome,
      spouseIncome: spouseGrossIncome
    });

    return {
      primary: primaryMethod === "itemized"
        ? parseCurrencyLikeNumber(sourceData.yearlyTaxDeductions)
        : split.primary,
      spouse: spouseMethod === "itemized"
        ? parseCurrencyLikeNumber(sourceData.spouseYearlyTaxDeductions)
        : split.spouse
    };
  }

  function getTaxableIncomeValues(sourceData, profileRecord, taxConfig, taxUtils) {
    const incomeCalculationMode = getIncomeCalculationMode(sourceData, profileRecord);
    const primaryGrossIncome = parseCurrencyLikeNumber(sourceData.grossAnnualIncome);
    const spouseGrossIncome = parseCurrencyLikeNumber(sourceData.spouseIncome);
    const deductions = getEffectiveDeductionValues(sourceData, profileRecord, taxConfig, taxUtils);

    if (incomeCalculationMode === "joint") {
      const combinedGrossIncome = primaryGrossIncome + spouseGrossIncome;
      const combinedTaxableIncome = Math.max(0, combinedGrossIncome - deductions.primary);

      if (!combinedGrossIncome) {
        return {
          incomeCalculationMode,
          combined: combinedTaxableIncome,
          primary: combinedTaxableIncome,
          spouse: 0
        };
      }

      return {
        incomeCalculationMode,
        combined: combinedTaxableIncome,
        primary: combinedTaxableIncome * (primaryGrossIncome / combinedGrossIncome),
        spouse: combinedTaxableIncome * (spouseGrossIncome / combinedGrossIncome)
      };
    }

    const primaryTaxableIncome = Math.max(0, primaryGrossIncome - deductions.primary);
    const spouseTaxableIncome = Math.max(0, spouseGrossIncome - deductions.spouse);
    return {
      incomeCalculationMode,
      combined: primaryTaxableIncome + spouseTaxableIncome,
      primary: primaryTaxableIncome,
      spouse: spouseTaxableIncome
    };
  }

  function calculateCurrentNetIncomeValues(input, sourceData, profileRecord, warnings) {
    const taxConfig = input?.taxConfig || {};
    const taxUtils = getTaxUtils(input);
    const filingStatus = normalizeString(sourceData.filingStatus);
    const selectedState = getStateOfResidence(profileRecord, sourceData);

    if (!filingStatus || !selectedState || !canCalculateNetIncome(input, filingStatus, warnings, "income-net-income")) {
      return null;
    }

    const stateConfig = getStateTaxConfig(taxConfig, selectedState, filingStatus);
    if (!stateConfig) {
      addWarning(
        warnings,
        "tax-recomputation-unavailable",
        "Net-income recomputation was skipped because reusable state tax config was not supplied.",
        { context: "income-net-income", stateOfResidence: selectedState }
      );
      return null;
    }

    const taxableIncomeValues = getTaxableIncomeValues(sourceData, profileRecord, taxConfig, taxUtils);
    const primaryGrossIncome = parseCurrencyLikeNumber(sourceData.grossAnnualIncome);
    const spouseGrossIncome = parseCurrencyLikeNumber(sourceData.spouseIncome);
    const federalRows = getFederalBracketRows(taxConfig, filingStatus);
    const federalTaxes = taxUtils.getProgressiveBracketTaxAmounts({
      filingStatus,
      primaryTaxableIncome: taxableIncomeValues.primary,
      spouseTaxableIncome: taxableIncomeValues.spouse,
      primaryBracketRows: federalRows,
      spouseBracketRows: federalRows,
      parseCurrencyLikeNumber,
      parsePercentLikeNumber
    });
    const stateTaxes = stateConfig.mode === "flat"
      ? taxUtils.getBracketTaxAmounts({
          filingStatus,
          primaryTaxableIncome: taxableIncomeValues.primary,
          spouseTaxableIncome: taxableIncomeValues.spouse,
          primaryRate: parsePercentLikeNumber(stateConfig.flatRate),
          spouseRate: parsePercentLikeNumber(stateConfig.flatRate)
        })
      : taxUtils.getProgressiveBracketTaxAmounts({
          filingStatus,
          primaryTaxableIncome: taxableIncomeValues.primary,
          spouseTaxableIncome: taxableIncomeValues.spouse,
          primaryBracketRows: Array.isArray(stateConfig.rows) ? stateConfig.rows : [],
          spouseBracketRows: Array.isArray(stateConfig.rows) ? stateConfig.rows : [],
          parseCurrencyLikeNumber,
          parsePercentLikeNumber
        });
    const payrollTaxes = taxUtils.getPayrollTaxAmounts({
      filingStatus,
      primaryEarnedIncome: primaryGrossIncome,
      spouseEarnedIncome: spouseGrossIncome,
      primaryTaxableIncome: primaryGrossIncome,
      spouseTaxableIncome: spouseGrossIncome,
      payrollRows: taxConfig.payrollRows,
      parseCurrencyLikeNumber,
      parsePercentLikeNumber,
      getDefaultAdditionalMedicareThresholds: getDefaultAdditionalMedicareThresholds(taxConfig)
    });
    const incomeCalculationMode = taxableIncomeValues.incomeCalculationMode;
    const combinedNetIncome = taxUtils.getNetIncome(
      primaryGrossIncome + spouseGrossIncome,
      federalTaxes.primary + federalTaxes.spouse,
      stateTaxes.primary + stateTaxes.spouse,
      payrollTaxes.primary + payrollTaxes.spouse
    );

    return {
      primary: incomeCalculationMode === "joint"
        ? combinedNetIncome
        : taxUtils.getNetIncome(primaryGrossIncome, federalTaxes.primary, stateTaxes.primary, payrollTaxes.primary),
      spouse: incomeCalculationMode === "separate"
        ? taxUtils.getNetIncome(spouseGrossIncome, federalTaxes.spouse, stateTaxes.spouse, payrollTaxes.spouse)
        : null
    };
  }

  function calculateSurvivorNetIncome(input, sourceData, profileRecord, grossIncome, warnings) {
    const taxConfig = input?.taxConfig || {};
    const taxUtils = getTaxUtils(input);
    const filingStatus = SURVIVOR_NET_INCOME_TAX_BASIS;
    const selectedState = getStateOfResidence(profileRecord, sourceData);

    if (!selectedState || !canCalculateNetIncome(input, filingStatus, warnings, "survivor-scenario")) {
      return null;
    }

    const stateConfig = getStateTaxConfig(taxConfig, selectedState, filingStatus);
    if (!stateConfig) {
      addWarning(
        warnings,
        "tax-recomputation-unavailable",
        "Survivor net-income recomputation was skipped because reusable state tax config was not supplied.",
        { context: "survivor-scenario", stateOfResidence: selectedState }
      );
      return null;
    }

    const standardDeduction = getStandardDeductionAmount(taxConfig, filingStatus);
    const taxableIncome = Math.max(0, grossIncome - standardDeduction);
    const federalTax = taxUtils.getProgressiveTaxAmount(
      taxableIncome,
      getFederalBracketRows(taxConfig, filingStatus),
      parseCurrencyLikeNumber,
      parsePercentLikeNumber
    );
    const stateTax = stateConfig.mode === "flat"
      ? taxableIncome * parsePercentLikeNumber(stateConfig.flatRate)
      : taxUtils.getProgressiveTaxAmount(
          taxableIncome,
          Array.isArray(stateConfig.rows) ? stateConfig.rows : [],
          parseCurrencyLikeNumber,
          parsePercentLikeNumber
        );
    const payrollTax = taxUtils.getPayrollTaxAmounts({
      filingStatus,
      primaryEarnedIncome: grossIncome,
      spouseEarnedIncome: 0,
      primaryTaxableIncome: grossIncome,
      spouseTaxableIncome: 0,
      payrollRows: taxConfig.payrollRows,
      parseCurrencyLikeNumber,
      parsePercentLikeNumber,
      getDefaultAdditionalMedicareThresholds: getDefaultAdditionalMedicareThresholds(taxConfig)
    }).primary;

    return taxUtils.getNetIncome(grossIncome, federalTax, stateTax, payrollTax);
  }

  function calculateTotalDebtPayoffNeed(sourceData) {
    const fields = [
      "mortgageBalance",
      "otherRealEstateLoans",
      "autoLoans",
      "creditCardDebt",
      "studentLoans",
      "personalLoans",
      "taxLiabilities",
      "businessDebt",
      "otherLoanObligations"
    ];
    let hasAnyValue = false;
    let total = 0;

    fields.forEach(function (fieldName) {
      const value = toOptionalNumber(sourceData[fieldName]);
      if (value == null) {
        return;
      }

      hasAnyValue = true;
      total += value;
    });

    return hasAnyValue ? total : null;
  }

  function createIncomeBlockSource(input, sourceData, profileRecord, warnings) {
    const incomeCalculationMode = getIncomeCalculationMode(sourceData, profileRecord);
    const primaryNetManualOverride = isTrue(sourceData.netAnnualIncomeManualOverride);
    const spouseNetManualOverride = isTrue(sourceData.spouseNetAnnualIncomeManualOverride);
    const needsPrimaryNetRecomputation = !primaryNetManualOverride
      && isBlankValue(sourceData.netAnnualIncome)
      && toOptionalNumber(sourceData.grossAnnualIncome) != null;
    const needsSpouseNetRecomputation = incomeCalculationMode === "separate"
      && !spouseNetManualOverride
      && isBlankValue(sourceData.spouseNetAnnualIncome)
      && toOptionalNumber(sourceData.spouseIncome) != null;
    const netValues = needsPrimaryNetRecomputation || needsSpouseNetRecomputation
      ? calculateCurrentNetIncomeValues(input, sourceData, profileRecord, warnings)
      : null;
    const source = {
      grossAnnualIncome: sourceData.grossAnnualIncome,
      netAnnualIncome: primaryNetManualOverride
        ? sourceData.netAnnualIncome
        : (netValues ? netValues.primary : sourceData.netAnnualIncome),
      netAnnualIncomeManualOverride: primaryNetManualOverride,
      bonusVariableIncome: sourceData.bonusVariableIncome,
      employerBenefitsValue: sourceData.employerBenefitsValue,
      yearsUntilRetirement: sourceData.yearsUntilRetirement,
      incomeGrowthRate: sourceData.incomeGrowthRate,
      spouseOrPartnerIncomeApplicability: incomeCalculationMode === "separate" ? "separate" : "not_applicable",
      spouseIncome: incomeCalculationMode === "separate" ? sourceData.spouseIncome : null,
      spouseNetAnnualIncome: incomeCalculationMode === "separate"
        ? (spouseNetManualOverride
          ? sourceData.spouseNetAnnualIncome
          : (netValues ? netValues.spouse : sourceData.spouseNetAnnualIncome))
        : null,
      spouseNetAnnualIncomeManualOverride: incomeCalculationMode === "separate" && spouseNetManualOverride
    };

    if (source.netAnnualIncome == null && toOptionalNumber(sourceData.grossAnnualIncome) != null) {
      addWarning(
        warnings,
        "net-income-missing",
        "Insured net annual income was not saved and could not be recomputed; annualIncomeReplacementBase may remain null."
      );
    }

    return source;
  }

  function createTaxContextSource(sourceData, profileRecord) {
    const primaryDeductionMethod = getDeductionMethodValue(sourceData.deductionMethod);
    const spouseDeductionMethod = getDeductionMethodValue(sourceData.spouseDeductionMethod);

    return {
      linkedMaritalStatusDisplay: getMaritalStatus(profileRecord, sourceData),
      filingStatus: sourceData.filingStatus,
      stateOfResidence: getStateOfResidence(profileRecord, sourceData),
      deductionMethod: primaryDeductionMethod,
      spouseDeductionMethod,
      yearlyTaxDeductions: primaryDeductionMethod === "itemized" ? sourceData.yearlyTaxDeductions : null,
      spouseYearlyTaxDeductions: spouseDeductionMethod === "itemized" ? sourceData.spouseYearlyTaxDeductions : null
    };
  }

  function createDebtPayoffSource(sourceData) {
    const manualOverride = isTrue(sourceData.totalDebtPayoffNeedManualOverride);
    return {
      mortgageBalance: sourceData.mortgageBalance,
      otherRealEstateLoans: sourceData.otherRealEstateLoans,
      autoLoans: sourceData.autoLoans,
      creditCardDebt: sourceData.creditCardDebt,
      studentLoans: sourceData.studentLoans,
      personalLoans: sourceData.personalLoans,
      taxLiabilities: sourceData.taxLiabilities,
      businessDebt: sourceData.businessDebt,
      otherLoanObligations: sourceData.otherLoanObligations,
      totalDebtPayoffNeed: manualOverride
        ? sourceData.totalDebtPayoffNeed
        : calculateTotalDebtPayoffNeed(sourceData),
      totalDebtPayoffNeedManualOverride: manualOverride
    };
  }

  function getHousingSupportCalculations() {
    return lensAnalysis.housingSupportCalculations || {};
  }

  function getHousingMaintenanceRows(input) {
    const builderInput = input && typeof input === "object" ? input : {};
    const builderOptions = builderInput.options && typeof builderInput.options === "object"
      ? builderInput.options
      : {};

    if (Array.isArray(builderOptions.housingMaintenanceRows)) {
      return builderOptions.housingMaintenanceRows;
    }

    if (Array.isArray(builderOptions.maintenanceRows)) {
      return builderOptions.maintenanceRows;
    }

    if (Array.isArray(builderInput.housingMaintenanceRows)) {
      return builderInput.housingMaintenanceRows;
    }

    if (Array.isArray(builderInput.maintenanceRows)) {
      return builderInput.maintenanceRows;
    }

    return null;
  }

  function shouldWarnAboutDefaultHousingMaintenanceRows(sourceData) {
    const housingStatus = normalizeString(sourceData.housingStatus);
    return (housingStatus === "Homeowner" || housingStatus === "Owns Free and Clear")
      && !isBlankValue(sourceData.homeSquareFootage);
  }

  function createHousingSource(input, sourceData, warnings) {
    const housingSupportCalculations = getHousingSupportCalculations();
    if (typeof housingSupportCalculations.calculateHousingSupportInputs === "function") {
      const maintenanceRows = getHousingMaintenanceRows(input);
      const housingCalculationResult = housingSupportCalculations.calculateHousingSupportInputs(
        sourceData,
        maintenanceRows ? { maintenanceRows } : {}
      );

      if (Array.isArray(housingCalculationResult?.warnings)) {
        housingCalculationResult.warnings.forEach(function (warning) {
          warnings.push(warning);
        });
      }

      if (!maintenanceRows && shouldWarnAboutDefaultHousingMaintenanceRows(sourceData)) {
        addWarning(
          warnings,
          "housing-maintenance-config-defaulted",
          "Saved-data housing support used the default maintenance table because no external housing maintenance rows were supplied to the builder."
        );
      }

      return housingCalculationResult?.blockSourceData || {};
    }

    const hasRawHousingData = [
      "housingStatus",
      "mortgageBalance",
      "mortgageTermRemainingYears",
      "mortgageTermRemainingMonths",
      "mortgageInterestRate",
      "monthlyHousingCost",
      "otherMonthlyRenterHousingCosts",
      "utilitiesCost",
      "housingInsuranceCost",
      "propertyTax",
      "monthlyHoaCost",
      "homeSquareFootage",
      "homeAgeYears"
    ].some(function (fieldName) {
      return !isBlankValue(sourceData[fieldName]);
    });

    const hasSavedHousingSupportTotal = isTrue(sourceData.calculatedMonthlyMortgagePaymentManualOverride)
      || !isBlankValue(sourceData.calculatedMonthlyMortgagePayment);

    if (hasRawHousingData && !hasSavedHousingSupportTotal) {
      addWarning(
        warnings,
        "housing-recomputation-unavailable",
        "Saved-data builder passed raw housing fields but did not recompute page-local housing support totals. Extract the active PMI housing helpers before relying on saved-data housing totals.",
        {
          missingHelpers: [
            "calculateMortgagePaymentOnlyAmount",
            "syncAssociatedMonthlyCostsField",
            "syncMaintenanceRecommendationField",
            "syncMonthlyMortgagePaymentField"
          ]
        }
      );
    }

    return {
      housingStatus: sourceData.housingStatus,
      mortgageBalance: sourceData.mortgageBalance,
      monthlyMortgagePaymentOnly: isTrue(sourceData.monthlyMortgagePaymentOnlyManualOverride)
        ? sourceData.monthlyMortgagePaymentOnly
        : null,
      monthlyMortgagePaymentOnlyManualOverride: isTrue(sourceData.monthlyMortgagePaymentOnlyManualOverride),
      mortgageTermRemainingYears: sourceData.mortgageTermRemainingYears,
      mortgageTermRemainingMonths: sourceData.mortgageTermRemainingMonths,
      mortgageInterestRate: sourceData.mortgageInterestRate,
      monthlyHousingCost: sourceData.monthlyHousingCost,
      otherMonthlyRenterHousingCosts: sourceData.otherMonthlyRenterHousingCosts,
      utilitiesCost: sourceData.utilitiesCost,
      housingInsuranceCost: sourceData.housingInsuranceCost,
      propertyTax: sourceData.propertyTax,
      monthlyHoaCost: sourceData.monthlyHoaCost,
      monthlyMaintenanceRecommendation: isTrue(sourceData.monthlyMaintenanceRecommendationManualOverride)
        ? sourceData.monthlyMaintenanceRecommendation
        : null,
      monthlyMaintenanceRecommendationManualOverride: isTrue(sourceData.monthlyMaintenanceRecommendationManualOverride),
      associatedMonthlyCosts: isTrue(sourceData.associatedMonthlyCostsManualOverride)
        ? sourceData.associatedMonthlyCosts
        : null,
      associatedMonthlyCostsManualOverride: isTrue(sourceData.associatedMonthlyCostsManualOverride),
      calculatedMonthlyMortgagePayment: isTrue(sourceData.calculatedMonthlyMortgagePaymentManualOverride)
        ? sourceData.calculatedMonthlyMortgagePayment
        : sourceData.calculatedMonthlyMortgagePayment,
      calculatedMonthlyMortgagePaymentManualOverride: isTrue(sourceData.calculatedMonthlyMortgagePaymentManualOverride)
    };
  }

  function createNonHousingSource(sourceData) {
    return {
      insuranceCost: sourceData.insuranceCost,
      healthcareOutOfPocketCost: sourceData.healthcareOutOfPocketCost,
      foodCost: sourceData.foodCost,
      transportationCost: sourceData.transportationCost,
      childcareDependentCareCost: sourceData.childcareDependentCareCost,
      phoneInternetCost: sourceData.phoneInternetCost,
      householdSuppliesCost: sourceData.householdSuppliesCost,
      otherHouseholdExpenses: sourceData.otherHouseholdExpenses,
      travelDiscretionaryCost: sourceData.travelDiscretionaryCost,
      subscriptionsCost: sourceData.subscriptionsCost
    };
  }

  function useSameEducationFunding(sourceData) {
    return normalizeString(sourceData.sameEducationFunding || "Yes") !== "No";
  }

  function createEducationSource(sourceData, profileRecord, warnings) {
    const sameFunding = useSameEducationFunding(sourceData);
    const projectedFunding = sameFunding
      ? sourceData.estimatedCostPerChild
      : sourceData.projectedEducationFundingPerDependent;

    return {
      childrenNeedingFunding: getLinkedDependentCount(
        profileRecord,
        sourceData,
        "childrenNeedingFunding",
        ["dependentsCount", "dependentCount"],
        warnings
      ),
      estimatedCostPerChild: sourceData.estimatedCostPerChild,
      sameEducationFunding: sameFunding ? "Yes" : "No",
      projectedDependentsCount: getLinkedDependentCount(
        profileRecord,
        sourceData,
        "projectedDependentsCount",
        ["projectedDependentsCount", "desiredDependentsCount"],
        warnings
      ),
      projectedEducationFundingPerDependent: projectedFunding
    };
  }

  function createFinalExpensesSource(sourceData) {
    return {
      funeralBurialEstimate: sourceData.funeralBurialEstimate,
      medicalEndOfLifeCosts: sourceData.medicalEndOfLifeCosts,
      estateSettlementCosts: sourceData.estateSettlementCosts,
      otherFinalExpenses: sourceData.otherFinalExpenses
    };
  }

  function createTransitionNeedsSource(sourceData) {
    return {
      immediateLiquidityBuffer: sourceData.immediateLiquidityBuffer,
      desiredEmergencyFund: sourceData.desiredEmergencyFund,
      relocationReserve: sourceData.relocationReserve,
      otherTransitionNeeds: sourceData.otherTransitionNeeds
    };
  }

  function createOffsetAssetsSource(sourceData) {
    const source = {};
    const assetDefinitions = Array.isArray(lensAnalysis.OFFSET_ASSET_DEFINITIONS)
      ? lensAnalysis.OFFSET_ASSET_DEFINITIONS
      : [];

    assetDefinitions.forEach(function (assetDefinition) {
      source[assetDefinition.valueField] = sourceData[assetDefinition.valueField];
      source[assetDefinition.includeField] = sourceData[assetDefinition.includeField];
      source[assetDefinition.liquidityField] = sourceData[assetDefinition.liquidityField];
      source[assetDefinition.percentField] = sourceData[assetDefinition.percentField];
    });
    source.assetsConfidenceLevel = sourceData.assetsConfidenceLevel;
    return source;
  }

  function createSurvivorScenarioSource(input, sourceData, profileRecord, warnings) {
    const survivorContinuesWorking = normalizeYesNoBoolean(sourceData.survivorContinuesWorking);
    const survivorGrossIncome = toOptionalNumber(sourceData.survivorIncome);
    let survivorNetIncome = sourceData.survivorNetAnnualIncome;
    let survivorNetManualOverride = isTrue(sourceData.survivorNetAnnualIncomeManualOverride);

    if (
      survivorContinuesWorking === true
      && isBlankValue(survivorNetIncome)
      && survivorGrossIncome != null
    ) {
      const calculatedSurvivorNetIncome = calculateSurvivorNetIncome(
        input,
        sourceData,
        profileRecord,
        survivorGrossIncome,
        warnings
      );

      if (calculatedSurvivorNetIncome != null) {
        survivorNetIncome = calculatedSurvivorNetIncome;
        survivorNetManualOverride = false;
      }
    }

    if (
      survivorContinuesWorking === true
      && (!Object.prototype.hasOwnProperty.call(sourceData, "survivorIncomeManualOverride")
        || !Object.prototype.hasOwnProperty.call(sourceData, "survivorNetAnnualIncomeManualOverride"))
    ) {
      addWarning(
        warnings,
        "survivor-manual-state-not-persisted",
        "Saved survivor gross/net income values do not carry full DOM manual/suggested state; metadata may be less precise than active PMI runtime metadata."
      );
    }

    return {
      survivorContinuesWorking: sourceData.survivorContinuesWorking,
      spouseExpectedWorkReductionAtDeath: sourceData.spouseExpectedWorkReductionAtDeath,
      survivorIncome: sourceData.survivorIncome,
      survivorIncomeManualOverride: isTrue(sourceData.survivorIncomeManualOverride),
      survivorNetAnnualIncome: survivorNetIncome,
      survivorNetAnnualIncomeManualOverride: survivorNetManualOverride,
      survivorIncomeStartDelayMonths: sourceData.survivorIncomeStartDelayMonths,
      incomeReplacementDuration: sourceData.incomeReplacementDuration,
      spouseIncomeGrowthRate: sourceData.spouseIncomeGrowthRate,
      spouseYearsUntilRetirement: sourceData.spouseYearsUntilRetirement,
      survivorNetIncomeTaxBasis: SURVIVOR_NET_INCOME_TAX_BASIS
    };
  }

  function createSavedProtectionModelingBlockSourceObjects(input, warnings) {
    const safeWarnings = Array.isArray(warnings) ? warnings : [];
    const options = input && typeof input === "object" ? input : {};
    const hasProfileRecord = isPlainObject(options.profileRecord);
    const profileRecord = hasProfileRecord ? options.profileRecord : {};
    const resolvedSource = resolveSourceData(options, safeWarnings);
    const sourceData = resolvedSource.sourceData;

    if (!hasProfileRecord) {
      addWarning(
        safeWarnings,
        "missing-profile-record",
        "No linked profile record was provided; profile-linked coverage and dependent facts may be incomplete."
      );
    }

    return {
      sourceData,
      sourceResolution: resolvedSource.source,
      blockSourceObjects: {
        "income-net-income": createIncomeBlockSource(options, sourceData, profileRecord, safeWarnings),
        "tax-context": createTaxContextSource(sourceData, profileRecord),
        "debt-payoff": createDebtPayoffSource(sourceData),
        "housing-ongoing-support": createHousingSource(options, sourceData, safeWarnings),
        "non-housing-ongoing-support": createNonHousingSource(sourceData),
        "education-support": createEducationSource(sourceData, profileRecord, safeWarnings),
        "final-expenses": createFinalExpensesSource(sourceData),
        "transition-needs": createTransitionNeedsSource(sourceData),
        "existing-coverage": {
          coveragePolicies: getCoveragePolicies(profileRecord, safeWarnings)
        },
        "offset-assets": createOffsetAssetsSource(sourceData),
        "survivor-scenario": createSurvivorScenarioSource(options, sourceData, profileRecord, safeWarnings)
      }
    };
  }

  function getBlockBuilders() {
    return {
      "income-net-income": lensAnalysis.createNetIncomeBlockOutput,
      "tax-context": lensAnalysis.createTaxContextBlockOutput,
      "debt-payoff": lensAnalysis.createDebtPayoffBlockOutput,
      "housing-ongoing-support": lensAnalysis.createHousingOngoingSupportBlockOutput,
      "non-housing-ongoing-support": lensAnalysis.createNonHousingOngoingSupportBlockOutput,
      "education-support": lensAnalysis.createEducationSupportBlockOutput,
      "final-expenses": lensAnalysis.createFinalExpensesBlockOutput,
      "transition-needs": lensAnalysis.createTransitionNeedsBlockOutput,
      "existing-coverage": lensAnalysis.createExistingCoverageBlockOutput,
      "offset-assets": lensAnalysis.createOffsetAssetsBlockOutput,
      "survivor-scenario": lensAnalysis.createSurvivorScenarioBlockOutput
    };
  }

  function buildBlockOutputs(blockSourceObjects, warnings) {
    const safeWarnings = Array.isArray(warnings) ? warnings : [];
    const blockOutputs = {};
    const blockBuilders = getBlockBuilders();

    Object.keys(blockSourceObjects).forEach(function (blockId) {
      const builder = blockBuilders[blockId];
      if (typeof builder !== "function") {
        addWarning(
          safeWarnings,
          "missing-block-builder",
          "Lens block builder is unavailable; block output was skipped.",
          { blockId }
        );
        return;
      }

      blockOutputs[blockId] = builder(blockSourceObjects[blockId]);
    });

    return blockOutputs;
  }

  function buildLensModelFromSavedProtectionModeling(input) {
    const warnings = [];
    const builderInput = input && typeof input === "object" ? input : {};
    const sourceResult = createSavedProtectionModelingBlockSourceObjects(builderInput, warnings);
    const blockOutputs = buildBlockOutputs(sourceResult.blockSourceObjects, warnings);
    const createLensModelFromBlockOutputs = lensAnalysis.createLensModelFromBlockOutputs;
    let lensModel = null;

    if (typeof createLensModelFromBlockOutputs !== "function") {
      addWarning(
        warnings,
        "missing-lens-normalizer",
        "createLensModelFromBlockOutputs is unavailable; normalized Lens model could not be built."
      );
    } else {
      lensModel = createLensModelFromBlockOutputs(blockOutputs);
    }

    return {
      lensModel,
      blockOutputs,
      warnings
    };
  }

  lensAnalysis.SURVIVOR_NET_INCOME_TAX_BASIS = SURVIVOR_NET_INCOME_TAX_BASIS;
  lensAnalysis.createSavedProtectionModelingBlockSourceObjects = createSavedProtectionModelingBlockSourceObjects;
  lensAnalysis.buildLensModelFromSavedProtectionModeling = buildLensModelFromSavedProtectionModeling;
})(window);
