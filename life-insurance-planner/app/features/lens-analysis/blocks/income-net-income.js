(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: income-net-income Lens block module.
  // Purpose: define the net-income block contract, source fields, and pure builder.
  // Non-goals: no DOM reads, no persistence, no page wiring.

  const NET_INCOME_BLOCK_ID = "income-net-income";
  const NET_INCOME_BLOCK_TYPE = "income.net-income.current-pmi";
  const NET_INCOME_BLOCK_VERSION = 1;

  // Current active linked PMI raw fields used or emitted by the net-income card.
  // These are intentionally source-field names, not canonical Lens bucket names.
  const NET_INCOME_BLOCK_SOURCE_FIELDS = Object.freeze({
    grossAnnualIncome: "grossAnnualIncome",
    netAnnualIncome: "netAnnualIncome",
    netAnnualIncomeManualOverride: "netAnnualIncomeManualOverride",
    spouseOrPartnerIncomeApplicability: "spouseOrPartnerIncomeApplicability",
    spouseOrPartnerGrossAnnualIncome: "spouseIncome",
    spouseOrPartnerNetAnnualIncome: "spouseNetAnnualIncome",
    spouseOrPartnerNetAnnualIncomeManualOverride: "spouseNetAnnualIncomeManualOverride"
  });

  const NET_INCOME_BLOCK_OUTPUT_CONTRACT = Object.freeze({
    blockId: NET_INCOME_BLOCK_ID,
    blockType: NET_INCOME_BLOCK_TYPE,
    blockVersion: NET_INCOME_BLOCK_VERSION,
    outputs: {
      grossAnnualIncome: {
        type: "number|null",
        canonicalDestination: "incomeBasis.insuredGrossAnnualIncome",
        meaning: "Current insured gross annual income available to the net-income card."
      },
      netAnnualIncome: {
        type: "number|null",
        canonicalDestination: "incomeBasis.insuredNetAnnualIncome",
        meaning: "Current insured net annual income if the page calculation or manual override has produced it."
      },
      spouseOrPartnerGrossAnnualIncome: {
        type: "number|null",
        canonicalDestination: "incomeBasis.spouseOrPartnerGrossAnnualIncome",
        meaning: "Current spouse or partner gross annual income available to the net-income card."
      },
      spouseOrPartnerNetAnnualIncome: {
        type: "number|null",
        canonicalDestination: "incomeBasis.spouseOrPartnerNetAnnualIncome",
        meaning: "Current spouse or partner net annual income if the page calculation or manual override has produced it."
      }
    }
  });

  function getSpouseOrPartnerIncomeApplicability(sourceData) {
    const normalizedApplicability = String(
      sourceData && sourceData[NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerIncomeApplicability] || ""
    ).trim().toLowerCase();

    return normalizedApplicability === "separate" ? "separate" : "not_applicable";
  }

  function createNetIncomeBlockOutput(sourceData) {
    const data = sourceData && typeof sourceData === "object" ? sourceData : {};
    const spouseOrPartnerIncomeApplicability = getSpouseOrPartnerIncomeApplicability(data);
    const toOptionalNumber = lensAnalysis.toOptionalNumber;
    const createBlockOutput = lensAnalysis.createBlockOutput;
    const createOutputMetadata = lensAnalysis.createOutputMetadata;
    const createReportedNumericOutputMetadata = lensAnalysis.createReportedNumericOutputMetadata;

    const outputs = {
      grossAnnualIncome: toOptionalNumber(data[NET_INCOME_BLOCK_SOURCE_FIELDS.grossAnnualIncome]),
      netAnnualIncome: toOptionalNumber(data[NET_INCOME_BLOCK_SOURCE_FIELDS.netAnnualIncome]),
      spouseOrPartnerGrossAnnualIncome: spouseOrPartnerIncomeApplicability === "separate"
        ? toOptionalNumber(data[NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerGrossAnnualIncome])
        : null,
      spouseOrPartnerNetAnnualIncome: spouseOrPartnerIncomeApplicability === "separate"
        ? toOptionalNumber(data[NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerNetAnnualIncome])
        : null
    };

    return createBlockOutput({
      blockId: NET_INCOME_BLOCK_ID,
      blockType: NET_INCOME_BLOCK_TYPE,
      blockVersion: NET_INCOME_BLOCK_VERSION,
      outputs,
      outputMetadata: {
        grossAnnualIncome: createReportedNumericOutputMetadata(
          outputs.grossAnnualIncome,
          NET_INCOME_BLOCK_SOURCE_FIELDS.grossAnnualIncome,
          NET_INCOME_BLOCK_OUTPUT_CONTRACT.outputs.grossAnnualIncome.canonicalDestination
        ),
        netAnnualIncome: createOutputMetadata({
          sourceType: outputs.netAnnualIncome == null
            ? "missing"
            : (data[NET_INCOME_BLOCK_SOURCE_FIELDS.netAnnualIncomeManualOverride] === true ? "manual_override" : "calculated"),
          confidence: outputs.netAnnualIncome == null
            ? "unknown"
            : (data[NET_INCOME_BLOCK_SOURCE_FIELDS.netAnnualIncomeManualOverride] === true ? "user_edited" : "estimated"),
          rawField: NET_INCOME_BLOCK_SOURCE_FIELDS.netAnnualIncome,
          canonicalDestination: NET_INCOME_BLOCK_OUTPUT_CONTRACT.outputs.netAnnualIncome.canonicalDestination
        }),
        spouseOrPartnerGrossAnnualIncome: spouseOrPartnerIncomeApplicability !== "separate"
          ? createOutputMetadata({
              sourceType: "not_applicable",
              confidence: "not_applicable",
              rawField: NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerGrossAnnualIncome,
              canonicalDestination: NET_INCOME_BLOCK_OUTPUT_CONTRACT.outputs.spouseOrPartnerGrossAnnualIncome.canonicalDestination
            })
          : createReportedNumericOutputMetadata(
              outputs.spouseOrPartnerGrossAnnualIncome,
              NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerGrossAnnualIncome,
              NET_INCOME_BLOCK_OUTPUT_CONTRACT.outputs.spouseOrPartnerGrossAnnualIncome.canonicalDestination
            ),
        spouseOrPartnerNetAnnualIncome: createOutputMetadata({
          sourceType: spouseOrPartnerIncomeApplicability !== "separate"
            ? "not_applicable"
            : (outputs.spouseOrPartnerNetAnnualIncome == null
              ? "missing"
              : (data[NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerNetAnnualIncomeManualOverride] === true ? "manual_override" : "calculated")),
          confidence: spouseOrPartnerIncomeApplicability !== "separate"
            ? "not_applicable"
            : (outputs.spouseOrPartnerNetAnnualIncome == null
              ? "unknown"
              : (data[NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerNetAnnualIncomeManualOverride] === true ? "user_edited" : "estimated")),
          rawField: NET_INCOME_BLOCK_SOURCE_FIELDS.spouseOrPartnerNetAnnualIncome,
          canonicalDestination: NET_INCOME_BLOCK_OUTPUT_CONTRACT.outputs.spouseOrPartnerNetAnnualIncome.canonicalDestination
        })
      }
    });
  }

  lensAnalysis.NET_INCOME_BLOCK_ID = NET_INCOME_BLOCK_ID;
  lensAnalysis.NET_INCOME_BLOCK_TYPE = NET_INCOME_BLOCK_TYPE;
  lensAnalysis.NET_INCOME_BLOCK_VERSION = NET_INCOME_BLOCK_VERSION;
  lensAnalysis.NET_INCOME_BLOCK_SOURCE_FIELDS = NET_INCOME_BLOCK_SOURCE_FIELDS;
  lensAnalysis.NET_INCOME_BLOCK_OUTPUT_CONTRACT = NET_INCOME_BLOCK_OUTPUT_CONTRACT;
  lensAnalysis.createNetIncomeBlockOutput = createNetIncomeBlockOutput;
})();
