(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis feature module.
  // Purpose: translate runtime block outputs into the canonical Lens model.
  // Non-goals: no DOM reads, no persistence, no formulas, no page wiring.

  const INCOME_NET_INCOME_BLOCK_ID = lensAnalysis.NET_INCOME_BLOCK_ID || "income-net-income";
  const DEBT_PAYOFF_BLOCK_ID = lensAnalysis.DEBT_PAYOFF_BLOCK_ID || "debt-payoff";
  const HOUSING_ONGOING_SUPPORT_BLOCK_ID = lensAnalysis.HOUSING_ONGOING_SUPPORT_BLOCK_ID || "housing-ongoing-support";
  const NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID = lensAnalysis.NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID || "non-housing-ongoing-support";
  const EDUCATION_SUPPORT_BLOCK_ID = lensAnalysis.EDUCATION_SUPPORT_BLOCK_ID || "education-support";
  const ONGOING_SUPPORT_COMPOSITION_BLOCK_ID = "ongoingSupport-composition";
  const ONGOING_SUPPORT_COMPOSITION_BLOCK_TYPE = "bucket-composition";

  // This pass normalizes the currently proven runtime block outputs into the
  // canonical incomeBasis, debtPayoff, ongoingSupport, educationSupport, and
  // assumptions destinations.
  const INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "grossAnnualIncome",
      destinationField: "insuredGrossAnnualIncome",
      sourceMetadataKey: "grossAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "netAnnualIncome",
      destinationField: "insuredNetAnnualIncome",
      sourceMetadataKey: "netAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "bonusVariableAnnualIncome",
      destinationField: "bonusVariableAnnualIncome",
      sourceMetadataKey: "bonusVariableAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "annualEmployerBenefitsValue",
      destinationField: "annualEmployerBenefitsValue",
      sourceMetadataKey: "annualEmployerBenefitsValue"
    }),
    Object.freeze({
      sourceOutputKey: "annualIncomeReplacementBase",
      destinationField: "annualIncomeReplacementBase",
      sourceMetadataKey: "annualIncomeReplacementBase"
    }),
    Object.freeze({
      sourceOutputKey: "spouseOrPartnerGrossAnnualIncome",
      destinationField: "spouseOrPartnerGrossAnnualIncome",
      sourceMetadataKey: "spouseOrPartnerGrossAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "spouseOrPartnerNetAnnualIncome",
      destinationField: "spouseOrPartnerNetAnnualIncome",
      sourceMetadataKey: "spouseOrPartnerNetAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "insuredRetirementHorizonYears",
      destinationField: "insuredRetirementHorizonYears",
      sourceMetadataKey: "insuredRetirementHorizonYears"
    })
  ]);

  const ECONOMIC_ASSUMPTIONS_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "incomeGrowthRatePercent",
      destinationField: "incomeGrowthRatePercent",
      sourceMetadataKey: "incomeGrowthRatePercent"
    })
  ]);

  const DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "mortgageBalance",
      destinationField: "mortgageBalance",
      sourceMetadataKey: "mortgageBalance"
    }),
    Object.freeze({
      sourceOutputKey: "otherRealEstateLoanBalance",
      destinationField: "otherRealEstateLoanBalance",
      sourceMetadataKey: "otherRealEstateLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "autoLoanBalance",
      destinationField: "autoLoanBalance",
      sourceMetadataKey: "autoLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "creditCardBalance",
      destinationField: "creditCardBalance",
      sourceMetadataKey: "creditCardBalance"
    }),
    Object.freeze({
      sourceOutputKey: "studentLoanBalance",
      destinationField: "studentLoanBalance",
      sourceMetadataKey: "studentLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "personalLoanBalance",
      destinationField: "personalLoanBalance",
      sourceMetadataKey: "personalLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "outstandingTaxLiabilities",
      destinationField: "outstandingTaxLiabilities",
      sourceMetadataKey: "outstandingTaxLiabilities"
    }),
    Object.freeze({
      sourceOutputKey: "businessDebtBalance",
      destinationField: "businessDebtBalance",
      sourceMetadataKey: "businessDebtBalance"
    }),
    Object.freeze({
      sourceOutputKey: "otherDebtPayoffNeeds",
      destinationField: "otherDebtPayoffNeeds",
      sourceMetadataKey: "otherDebtPayoffNeeds"
    }),
    Object.freeze({
      sourceOutputKey: "totalDebtPayoffNeed",
      destinationField: "totalDebtPayoffNeed",
      sourceMetadataKey: "totalDebtPayoffNeed"
    })
  ]);

  const ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "monthlyMortgagePayment",
      destinationField: "monthlyMortgagePayment",
      sourceMetadataKey: "monthlyMortgagePayment"
    }),
    Object.freeze({
      sourceOutputKey: "mortgageRemainingTermMonths",
      destinationField: "mortgageRemainingTermMonths",
      sourceMetadataKey: "mortgageRemainingTermMonths"
    }),
    Object.freeze({
      sourceOutputKey: "mortgageInterestRatePercent",
      destinationField: "mortgageInterestRatePercent",
      sourceMetadataKey: "mortgageInterestRatePercent"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyRentOrHousingPayment",
      destinationField: "monthlyRentOrHousingPayment",
      sourceMetadataKey: "monthlyRentOrHousingPayment"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyUtilities",
      destinationField: "monthlyUtilities",
      sourceMetadataKey: "monthlyUtilities"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHousingInsurance",
      destinationField: "monthlyHousingInsurance",
      sourceMetadataKey: "monthlyHousingInsurance"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyPropertyTax",
      destinationField: "monthlyPropertyTax",
      sourceMetadataKey: "monthlyPropertyTax"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHoaCost",
      destinationField: "monthlyHoaCost",
      sourceMetadataKey: "monthlyHoaCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyMaintenanceAndRepairs",
      destinationField: "monthlyMaintenanceAndRepairs",
      sourceMetadataKey: "monthlyMaintenanceAndRepairs"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHousingSupportCost",
      destinationField: "monthlyHousingSupportCost",
      sourceMetadataKey: "monthlyHousingSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "annualHousingSupportCost",
      destinationField: "annualHousingSupportCost",
      sourceMetadataKey: "annualHousingSupportCost"
    })
  ]);

  const NON_HOUSING_ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "monthlyOtherInsuranceCost",
      destinationField: "monthlyOtherInsuranceCost",
      sourceMetadataKey: "monthlyOtherInsuranceCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHealthcareOutOfPocketCost",
      destinationField: "monthlyHealthcareOutOfPocketCost",
      sourceMetadataKey: "monthlyHealthcareOutOfPocketCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyFoodCost",
      destinationField: "monthlyFoodCost",
      sourceMetadataKey: "monthlyFoodCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyTransportationCost",
      destinationField: "monthlyTransportationCost",
      sourceMetadataKey: "monthlyTransportationCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyChildcareAndDependentCareCost",
      destinationField: "monthlyChildcareAndDependentCareCost",
      sourceMetadataKey: "monthlyChildcareAndDependentCareCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyPhoneAndInternetCost",
      destinationField: "monthlyPhoneAndInternetCost",
      sourceMetadataKey: "monthlyPhoneAndInternetCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHouseholdSuppliesCost",
      destinationField: "monthlyHouseholdSuppliesCost",
      sourceMetadataKey: "monthlyHouseholdSuppliesCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyOtherHouseholdExpenses",
      destinationField: "monthlyOtherHouseholdExpenses",
      sourceMetadataKey: "monthlyOtherHouseholdExpenses"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyNonHousingEssentialSupportCost",
      destinationField: "monthlyNonHousingEssentialSupportCost",
      sourceMetadataKey: "monthlyNonHousingEssentialSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "annualNonHousingEssentialSupportCost",
      destinationField: "annualNonHousingEssentialSupportCost",
      sourceMetadataKey: "annualNonHousingEssentialSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyTravelAndDiscretionaryCost",
      destinationField: "monthlyTravelAndDiscretionaryCost",
      sourceMetadataKey: "monthlyTravelAndDiscretionaryCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlySubscriptionsCost",
      destinationField: "monthlySubscriptionsCost",
      sourceMetadataKey: "monthlySubscriptionsCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyDiscretionaryPersonalSpending",
      destinationField: "monthlyDiscretionaryPersonalSpending",
      sourceMetadataKey: "monthlyDiscretionaryPersonalSpending"
    }),
    Object.freeze({
      sourceOutputKey: "annualDiscretionaryPersonalSpending",
      destinationField: "annualDiscretionaryPersonalSpending",
      sourceMetadataKey: "annualDiscretionaryPersonalSpending"
    })
  ]);

  const EDUCATION_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = Object.freeze([
    Object.freeze({
      sourceOutputKey: "linkedDependentCount",
      destinationField: "linkedDependentCount",
      sourceMetadataKey: "linkedDependentCount"
    }),
    Object.freeze({
      sourceOutputKey: "desiredAdditionalDependentCount",
      destinationField: "desiredAdditionalDependentCount",
      sourceMetadataKey: "desiredAdditionalDependentCount"
    }),
    Object.freeze({
      sourceOutputKey: "perLinkedDependentEducationFunding",
      destinationField: "perLinkedDependentEducationFunding",
      sourceMetadataKey: "perLinkedDependentEducationFunding"
    }),
    Object.freeze({
      sourceOutputKey: "perDesiredAdditionalDependentEducationFunding",
      destinationField: "perDesiredAdditionalDependentEducationFunding",
      sourceMetadataKey: "perDesiredAdditionalDependentEducationFunding"
    }),
    Object.freeze({
      sourceOutputKey: "sameEducationFundingForDesiredAdditionalDependents",
      destinationField: "sameEducationFundingForDesiredAdditionalDependents",
      sourceMetadataKey: "sameEducationFundingForDesiredAdditionalDependents",
      valueType: "boolean"
    }),
    Object.freeze({
      sourceOutputKey: "linkedDependentEducationFundingNeed",
      destinationField: "linkedDependentEducationFundingNeed",
      sourceMetadataKey: "linkedDependentEducationFundingNeed"
    }),
    Object.freeze({
      sourceOutputKey: "desiredAdditionalDependentEducationFundingNeed",
      destinationField: "desiredAdditionalDependentEducationFundingNeed",
      sourceMetadataKey: "desiredAdditionalDependentEducationFundingNeed"
    }),
    Object.freeze({
      sourceOutputKey: "totalEducationFundingNeed",
      destinationField: "totalEducationFundingNeed",
      sourceMetadataKey: "totalEducationFundingNeed"
    })
  ]);

  function clonePlainValue(value) {
    if (Array.isArray(value)) {
      return value.map(clonePlainValue);
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    return Object.keys(value).reduce(function (nextValue, key) {
      nextValue[key] = clonePlainValue(value[key]);
      return nextValue;
    }, {});
  }

  function createEmptyLensModelInstance() {
    if (typeof lensAnalysis.createEmptyLensModel === "function") {
      return lensAnalysis.createEmptyLensModel();
    }

    if (lensAnalysis.EMPTY_LENS_MODEL && typeof lensAnalysis.EMPTY_LENS_MODEL === "object") {
      return clonePlainValue(lensAnalysis.EMPTY_LENS_MODEL);
    }

    throw new Error("Lens schema is unavailable. Load schema.js before normalize-lens-model.js.");
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

  function toOptionalBoolean(value) {
    if (value == null || value === "") {
      return null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === "yes" || normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "no" || normalized === "false" || normalized === "0") {
      return false;
    }

    return null;
  }

  function normalizeBlockOutputValue(value, mapping) {
    const normalizedMapping = mapping && typeof mapping === "object" ? mapping : {};

    if (normalizedMapping.valueType === "boolean") {
      return toOptionalBoolean(value);
    }

    return toOptionalNumber(value);
  }

  function cloneOutputMetadata(outputMetadata, metadataKey, blockOutput) {
    if (!outputMetadata || typeof outputMetadata !== "object" || !metadataKey) {
      return null;
    }

    const sourceMetadata = outputMetadata[metadataKey];
    if (!sourceMetadata || typeof sourceMetadata !== "object") {
      return null;
    }

    const nextMetadata = clonePlainValue(sourceMetadata);
    nextMetadata.sourceBlockId = blockOutput && typeof blockOutput.blockId === "string"
      ? blockOutput.blockId
      : null;
    nextMetadata.sourceBlockType = blockOutput && typeof blockOutput.blockType === "string"
      ? blockOutput.blockType
      : null;
    return nextMetadata;
  }

  function normalizeBucketFromBlockOutput(targetBucket, blockOutputs, options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const safeBlockOutputs = blockOutputs && typeof blockOutputs === "object" ? blockOutputs : {};
    const sources = Array.isArray(normalizedOptions.sources) && normalizedOptions.sources.length
      ? normalizedOptions.sources
      : [normalizedOptions];
    const hasSingleSource = sources.length === 1;
    const primaryBlockOutput = hasSingleSource
      ? safeBlockOutputs[sources[0].blockId]
      : null;
    const bucketNormalizationMetadata = {
      sourceBlockId: primaryBlockOutput && typeof primaryBlockOutput.blockId === "string"
        ? primaryBlockOutput.blockId
        : null,
      sourceBlockType: primaryBlockOutput && typeof primaryBlockOutput.blockType === "string"
        ? primaryBlockOutput.blockType
        : null,
      fields: {}
    };

    sources.forEach(function (source) {
      const blockOutput = safeBlockOutputs[source.blockId];
      const outputValues = blockOutput && typeof blockOutput.outputs === "object"
        ? blockOutput.outputs
        : {};
      const outputMetadata = blockOutput && typeof blockOutput.outputMetadata === "object"
        ? blockOutput.outputMetadata
        : {};

      source.mapping.forEach(function (mapping) {
        targetBucket[mapping.destinationField] = normalizeBlockOutputValue(
          outputValues[mapping.sourceOutputKey],
          mapping
        );
        bucketNormalizationMetadata.fields[mapping.destinationField] = cloneOutputMetadata(
          outputMetadata,
          mapping.sourceMetadataKey,
          blockOutput
        );
      });
    });

    return bucketNormalizationMetadata;
  }

  function sumOptionalBucketComponents(values) {
    let hasAnyValue = false;
    let total = 0;

    values.forEach(function (value) {
      const numericValue = toOptionalNumber(value);
      if (numericValue == null) {
        return;
      }

      hasAnyValue = true;
      total += numericValue;
    });

    return hasAnyValue ? total : null;
  }

  function createBucketCompositionMetadata(options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const componentFields = Array.isArray(normalizedOptions.componentFields)
      ? normalizedOptions.componentFields.filter(Boolean)
      : [];
    const value = normalizedOptions.value;

    return {
      sourceType: value == null ? "missing" : "calculated",
      confidence: value == null ? "unknown" : "calculated_from_bucket_components",
      rawField: componentFields.length ? componentFields.join(" + ") : null,
      canonicalDestination: normalizedOptions.canonicalDestination || null,
      sourceBlockId: ONGOING_SUPPORT_COMPOSITION_BLOCK_ID,
      sourceBlockType: ONGOING_SUPPORT_COMPOSITION_BLOCK_TYPE
    };
  }

  function applyOngoingSupportComposition(targetBucket, normalizationMetadata) {
    const safeTargetBucket = targetBucket && typeof targetBucket === "object" ? targetBucket : {};
    const safeNormalizationMetadata = normalizationMetadata && typeof normalizationMetadata === "object"
      ? normalizationMetadata
      : {};
    const fieldMetadata = safeNormalizationMetadata.fields && typeof safeNormalizationMetadata.fields === "object"
      ? safeNormalizationMetadata.fields
      : (safeNormalizationMetadata.fields = {});

    const monthlyTotalEssentialSupportCost = sumOptionalBucketComponents([
      safeTargetBucket.monthlyHousingSupportCost,
      safeTargetBucket.monthlyNonHousingEssentialSupportCost
    ]);
    const annualTotalEssentialSupportCost = monthlyTotalEssentialSupportCost == null
      ? null
      : monthlyTotalEssentialSupportCost * 12;

    safeTargetBucket.monthlyTotalEssentialSupportCost = monthlyTotalEssentialSupportCost;
    safeTargetBucket.annualTotalEssentialSupportCost = annualTotalEssentialSupportCost;

    fieldMetadata.monthlyTotalEssentialSupportCost = createBucketCompositionMetadata({
      value: monthlyTotalEssentialSupportCost,
      componentFields: ["monthlyHousingSupportCost", "monthlyNonHousingEssentialSupportCost"],
      canonicalDestination: "ongoingSupport.monthlyTotalEssentialSupportCost"
    });
    fieldMetadata.annualTotalEssentialSupportCost = createBucketCompositionMetadata({
      value: annualTotalEssentialSupportCost,
      componentFields: ["monthlyTotalEssentialSupportCost"],
      canonicalDestination: "ongoingSupport.annualTotalEssentialSupportCost"
    });
  }

  function createLensModelFromBlockOutputs(blockOutputs) {
    const lensModel = createEmptyLensModelInstance();
    const incomeBasisNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel.incomeBasis, blockOutputs, {
      blockId: INCOME_NET_INCOME_BLOCK_ID,
      mapping: INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP
    });
    const debtPayoffNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel.debtPayoff, blockOutputs, {
      blockId: DEBT_PAYOFF_BLOCK_ID,
      mapping: DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP
    });
    const ongoingSupportNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel.ongoingSupport, blockOutputs, {
      sources: [
        {
          blockId: HOUSING_ONGOING_SUPPORT_BLOCK_ID,
          mapping: ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP
        },
        {
          blockId: NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID,
          mapping: NON_HOUSING_ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP
        }
      ]
    });
    const educationSupportNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel.educationSupport, blockOutputs, {
      blockId: EDUCATION_SUPPORT_BLOCK_ID,
      mapping: EDUCATION_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP
    });
    const economicAssumptionsNormalizationMetadata = normalizeBucketFromBlockOutput(
      lensModel.assumptions.economicAssumptions,
      blockOutputs,
      {
        blockId: INCOME_NET_INCOME_BLOCK_ID,
        mapping: ECONOMIC_ASSUMPTIONS_BLOCK_OUTPUT_NORMALIZATION_MAP
      }
    );
    applyOngoingSupportComposition(lensModel.ongoingSupport, ongoingSupportNormalizationMetadata);

    // Provenance stays outside the canonical bucket facts so future formulas
    // can read canonical buckets directly without mixing data and metadata.
    lensModel.normalizationMetadata = {
      incomeBasis: incomeBasisNormalizationMetadata,
      debtPayoff: debtPayoffNormalizationMetadata,
      ongoingSupport: ongoingSupportNormalizationMetadata,
      educationSupport: educationSupportNormalizationMetadata,
      assumptions: {
        economicAssumptions: economicAssumptionsNormalizationMetadata
      }
    };

    return lensModel;
  }

  lensAnalysis.INCOME_NET_INCOME_BLOCK_ID = INCOME_NET_INCOME_BLOCK_ID;
  lensAnalysis.DEBT_PAYOFF_BLOCK_ID = DEBT_PAYOFF_BLOCK_ID;
  lensAnalysis.HOUSING_ONGOING_SUPPORT_BLOCK_ID = HOUSING_ONGOING_SUPPORT_BLOCK_ID;
  lensAnalysis.NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID = NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID;
  lensAnalysis.EDUCATION_SUPPORT_BLOCK_ID = EDUCATION_SUPPORT_BLOCK_ID;
  lensAnalysis.INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP = INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.ECONOMIC_ASSUMPTIONS_BLOCK_OUTPUT_NORMALIZATION_MAP = ECONOMIC_ASSUMPTIONS_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP = DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.NON_HOUSING_ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = NON_HOUSING_ONGOING_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.EDUCATION_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP = EDUCATION_SUPPORT_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.createLensModelFromBlockOutputs = createLensModelFromBlockOutputs;
})();
