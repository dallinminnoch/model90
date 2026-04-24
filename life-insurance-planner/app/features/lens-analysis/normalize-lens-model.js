(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis feature module.
  // Purpose: translate runtime block outputs into the canonical Lens model.
  // Non-goals: no DOM reads, no persistence, no formulas, no page wiring.

  const INCOME_NET_INCOME_BLOCK_ID = lensAnalysis.NET_INCOME_BLOCK_ID || "income-net-income";
  const DEBT_PAYOFF_BLOCK_ID = lensAnalysis.DEBT_PAYOFF_BLOCK_ID || "debt-payoff";

  // This pass only normalizes the first proven block output into the
  // canonical incomeBasis bucket. Other buckets stay at their empty defaults.
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
      sourceOutputKey: "spouseOrPartnerGrossAnnualIncome",
      destinationField: "spouseOrPartnerGrossAnnualIncome",
      sourceMetadataKey: "spouseOrPartnerGrossAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "spouseOrPartnerNetAnnualIncome",
      destinationField: "spouseOrPartnerNetAnnualIncome",
      sourceMetadataKey: "spouseOrPartnerNetAnnualIncome"
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

  function cloneOutputMetadata(outputMetadata, metadataKey) {
    if (!outputMetadata || typeof outputMetadata !== "object" || !metadataKey) {
      return null;
    }

    const sourceMetadata = outputMetadata[metadataKey];
    if (!sourceMetadata || typeof sourceMetadata !== "object") {
      return null;
    }

    return clonePlainValue(sourceMetadata);
  }

  function normalizeBucketFromBlockOutput(lensModel, blockOutputs, options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const safeBlockOutputs = blockOutputs && typeof blockOutputs === "object" ? blockOutputs : {};
    const blockOutput = safeBlockOutputs[normalizedOptions.blockId];
    const outputValues = blockOutput && typeof blockOutput.outputs === "object"
      ? blockOutput.outputs
      : {};
    const outputMetadata = blockOutput && typeof blockOutput.outputMetadata === "object"
      ? blockOutput.outputMetadata
      : {};
    const bucketNormalizationMetadata = {
      sourceBlockId: blockOutput && typeof blockOutput.blockId === "string"
        ? blockOutput.blockId
        : null,
      sourceBlockType: blockOutput && typeof blockOutput.blockType === "string"
        ? blockOutput.blockType
        : null,
      fields: {}
    };

    normalizedOptions.mapping.forEach(function (mapping) {
      lensModel[normalizedOptions.bucketName][mapping.destinationField] = toOptionalNumber(
        outputValues[mapping.sourceOutputKey]
      );
      bucketNormalizationMetadata.fields[mapping.destinationField] = cloneOutputMetadata(
        outputMetadata,
        mapping.sourceMetadataKey
      );
    });

    return bucketNormalizationMetadata;
  }

  function createLensModelFromBlockOutputs(blockOutputs) {
    const lensModel = createEmptyLensModelInstance();
    const incomeBasisNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel, blockOutputs, {
      blockId: INCOME_NET_INCOME_BLOCK_ID,
      bucketName: "incomeBasis",
      mapping: INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP
    });
    const debtPayoffNormalizationMetadata = normalizeBucketFromBlockOutput(lensModel, blockOutputs, {
      blockId: DEBT_PAYOFF_BLOCK_ID,
      bucketName: "debtPayoff",
      mapping: DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP
    });

    // Provenance stays outside the canonical bucket facts so future formulas
    // can read canonical buckets directly without mixing data and metadata.
    lensModel.normalizationMetadata = {
      incomeBasis: incomeBasisNormalizationMetadata,
      debtPayoff: debtPayoffNormalizationMetadata
    };

    return lensModel;
  }

  lensAnalysis.INCOME_NET_INCOME_BLOCK_ID = INCOME_NET_INCOME_BLOCK_ID;
  lensAnalysis.DEBT_PAYOFF_BLOCK_ID = DEBT_PAYOFF_BLOCK_ID;
  lensAnalysis.INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP = INCOME_BASIS_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP = DEBT_PAYOFF_BLOCK_OUTPUT_NORMALIZATION_MAP;
  lensAnalysis.createLensModelFromBlockOutputs = createLensModelFromBlockOutputs;
})();
