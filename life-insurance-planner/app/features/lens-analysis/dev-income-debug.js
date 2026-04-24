(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});
  const lensAnalysisDev = LensApp.lensAnalysisDev || (LensApp.lensAnalysisDev = {});

  // TEMP DEV ONLY: Lens pipeline inspection.
  // Remove or replace before production.

  const DEBUG_QUERY_PARAM = "lensIncomeDebug";
  const PANEL_ID = "lens-income-debug-panel";
  const STYLE_ID = "lens-income-debug-style";
  const TABLE_BODY_ID = "lens-income-debug-table-body";
  const SUMMARY_ID = "lens-income-debug-summary";
  const NET_INCOME_BLOCK_ID = lensAnalysis.NET_INCOME_BLOCK_ID || "income-net-income";
  const DEBT_PAYOFF_BLOCK_ID = lensAnalysis.DEBT_PAYOFF_BLOCK_ID || "debt-payoff";
  const HOUSING_ONGOING_SUPPORT_BLOCK_ID = lensAnalysis.HOUSING_ONGOING_SUPPORT_BLOCK_ID || "housing-ongoing-support";
  const NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID = lensAnalysis.NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID || "non-housing-ongoing-support";
  const EDUCATION_SUPPORT_BLOCK_ID = lensAnalysis.EDUCATION_SUPPORT_BLOCK_ID || "education-support";
  const FINAL_EXPENSES_BLOCK_ID = lensAnalysis.FINAL_EXPENSES_BLOCK_ID || "final-expenses";

  const HOUSING_RUNTIME_ONLY_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "housingStatus",
      destinationField: null
    }),
    Object.freeze({
      sourceOutputKey: "mortgageBalance",
      destinationField: null
    }),
    Object.freeze({
      sourceOutputKey: "monthlyAssociatedHousingCosts",
      destinationField: null
    })
  ]);

  // TEMP DEBUG/AUDIT ONLY.
  // These rows help compare the current authoritative housing-card total
  // against an independently recomputed monthly support total.
  const HOUSING_AUDIT_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "monthlyHousingSupportCost",
      destinationField: null
    }),
    Object.freeze({
      sourceOutputKey: "recomputedMonthlyHousingSupportCost",
      destinationField: null
    }),
    Object.freeze({
      sourceOutputKey: "housingSupportCostVariance",
      destinationField: null
    }),
    Object.freeze({
      sourceOutputKey: "housingSupportCostMatches",
      destinationField: null
    })
  ]);

  const INCOME_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "grossAnnualIncome",
      destinationField: "insuredGrossAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "netAnnualIncome",
      destinationField: "insuredNetAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "bonusVariableAnnualIncome",
      destinationField: "bonusVariableAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "annualEmployerBenefitsValue",
      destinationField: "annualEmployerBenefitsValue"
    }),
    Object.freeze({
      sourceOutputKey: "annualIncomeReplacementBase",
      destinationField: "annualIncomeReplacementBase"
    }),
    Object.freeze({
      sourceOutputKey: "spouseOrPartnerGrossAnnualIncome",
      destinationField: "spouseOrPartnerGrossAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "spouseOrPartnerNetAnnualIncome",
      destinationField: "spouseOrPartnerNetAnnualIncome"
    }),
    Object.freeze({
      sourceOutputKey: "insuredRetirementHorizonYears",
      destinationField: "insuredRetirementHorizonYears"
    })
  ]);

  const ECONOMIC_ASSUMPTIONS_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "incomeGrowthRatePercent",
      destinationField: "incomeGrowthRatePercent"
    })
  ]);

  const DEBT_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "mortgageBalance",
      destinationField: "mortgageBalance"
    }),
    Object.freeze({
      sourceOutputKey: "otherRealEstateLoanBalance",
      destinationField: "otherRealEstateLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "autoLoanBalance",
      destinationField: "autoLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "creditCardBalance",
      destinationField: "creditCardBalance"
    }),
    Object.freeze({
      sourceOutputKey: "studentLoanBalance",
      destinationField: "studentLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "personalLoanBalance",
      destinationField: "personalLoanBalance"
    }),
    Object.freeze({
      sourceOutputKey: "outstandingTaxLiabilities",
      destinationField: "outstandingTaxLiabilities"
    }),
    Object.freeze({
      sourceOutputKey: "businessDebtBalance",
      destinationField: "businessDebtBalance"
    }),
    Object.freeze({
      sourceOutputKey: "otherDebtPayoffNeeds",
      destinationField: "otherDebtPayoffNeeds"
    }),
    Object.freeze({
      sourceOutputKey: "totalDebtPayoffNeed",
      destinationField: "totalDebtPayoffNeed"
    })
  ]);

  const ONGOING_SUPPORT_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "monthlyMortgagePayment",
      destinationField: "monthlyMortgagePayment"
    }),
    Object.freeze({
      sourceOutputKey: "mortgageRemainingTermMonths",
      destinationField: "mortgageRemainingTermMonths"
    }),
    Object.freeze({
      sourceOutputKey: "mortgageInterestRatePercent",
      destinationField: "mortgageInterestRatePercent"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyRentOrHousingPayment",
      destinationField: "monthlyRentOrHousingPayment"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyUtilities",
      destinationField: "monthlyUtilities"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHousingInsurance",
      destinationField: "monthlyHousingInsurance"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyPropertyTax",
      destinationField: "monthlyPropertyTax"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHoaCost",
      destinationField: "monthlyHoaCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyMaintenanceAndRepairs",
      destinationField: "monthlyMaintenanceAndRepairs"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHousingSupportCost",
      destinationField: "monthlyHousingSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "annualHousingSupportCost",
      destinationField: "annualHousingSupportCost"
    })
  ]);

  const NON_HOUSING_ONGOING_SUPPORT_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "monthlyOtherInsuranceCost",
      destinationField: "monthlyOtherInsuranceCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHealthcareOutOfPocketCost",
      destinationField: "monthlyHealthcareOutOfPocketCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyFoodCost",
      destinationField: "monthlyFoodCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyTransportationCost",
      destinationField: "monthlyTransportationCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyChildcareAndDependentCareCost",
      destinationField: "monthlyChildcareAndDependentCareCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyPhoneAndInternetCost",
      destinationField: "monthlyPhoneAndInternetCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyHouseholdSuppliesCost",
      destinationField: "monthlyHouseholdSuppliesCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyOtherHouseholdExpenses",
      destinationField: "monthlyOtherHouseholdExpenses"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyNonHousingEssentialSupportCost",
      destinationField: "monthlyNonHousingEssentialSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "annualNonHousingEssentialSupportCost",
      destinationField: "annualNonHousingEssentialSupportCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyTravelAndDiscretionaryCost",
      destinationField: "monthlyTravelAndDiscretionaryCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlySubscriptionsCost",
      destinationField: "monthlySubscriptionsCost"
    }),
    Object.freeze({
      sourceOutputKey: "monthlyDiscretionaryPersonalSpending",
      destinationField: "monthlyDiscretionaryPersonalSpending"
    }),
    Object.freeze({
      sourceOutputKey: "annualDiscretionaryPersonalSpending",
      destinationField: "annualDiscretionaryPersonalSpending"
    })
  ]);

  const ONGOING_SUPPORT_COMPOSITION_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      destinationField: "monthlyTotalEssentialSupportCost"
    }),
    Object.freeze({
      destinationField: "annualTotalEssentialSupportCost"
    })
  ]);

  const EDUCATION_SUPPORT_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "linkedDependentCount",
      destinationField: "linkedDependentCount"
    }),
    Object.freeze({
      sourceOutputKey: "desiredAdditionalDependentCount",
      destinationField: "desiredAdditionalDependentCount"
    }),
    Object.freeze({
      sourceOutputKey: "perLinkedDependentEducationFunding",
      destinationField: "perLinkedDependentEducationFunding"
    }),
    Object.freeze({
      sourceOutputKey: "perDesiredAdditionalDependentEducationFunding",
      destinationField: "perDesiredAdditionalDependentEducationFunding"
    }),
    Object.freeze({
      sourceOutputKey: "sameEducationFundingForDesiredAdditionalDependents",
      destinationField: "sameEducationFundingForDesiredAdditionalDependents"
    }),
    Object.freeze({
      sourceOutputKey: "linkedDependentEducationFundingNeed",
      destinationField: "linkedDependentEducationFundingNeed"
    }),
    Object.freeze({
      sourceOutputKey: "desiredAdditionalDependentEducationFundingNeed",
      destinationField: "desiredAdditionalDependentEducationFundingNeed"
    }),
    Object.freeze({
      sourceOutputKey: "totalEducationFundingNeed",
      destinationField: "totalEducationFundingNeed"
    })
  ]);

  const FINAL_EXPENSES_DEBUG_FIELDS = Object.freeze([
    Object.freeze({
      sourceOutputKey: "funeralAndBurialCost",
      destinationField: "funeralAndBurialCost"
    }),
    Object.freeze({
      sourceOutputKey: "medicalEndOfLifeCost",
      destinationField: "medicalEndOfLifeCost"
    }),
    Object.freeze({
      sourceOutputKey: "estateSettlementCost",
      destinationField: "estateSettlementCost"
    }),
    Object.freeze({
      sourceOutputKey: "otherFinalExpenses",
      destinationField: "otherFinalExpenses"
    }),
    Object.freeze({
      sourceOutputKey: "totalFinalExpenseNeed",
      destinationField: "totalFinalExpenseNeed"
    })
  ]);

  function isLensIncomeDebugEnabled(locationLike) {
    const search = locationLike && typeof locationLike.search === "string" ? locationLike.search : "";
    const value = new URLSearchParams(search).get(DEBUG_QUERY_PARAM);
    const normalizedValue = String(value || "").trim().toLowerCase();
    return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "income";
  }

  function formatDebugValue(value) {
    if (value == null || value === "") {
      return "null";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return "[unserializable]";
      }
    }

    return String(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function appendBucketInspectionRows(rows, options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const blockOutput = normalizedOptions.blockOutput && typeof normalizedOptions.blockOutput === "object"
      ? normalizedOptions.blockOutput
      : {};
    const runtimeOutputs = blockOutput.outputs && typeof blockOutput.outputs === "object"
      ? blockOutput.outputs
      : {};
    const runtimeOutputMetadata = blockOutput.outputMetadata && typeof blockOutput.outputMetadata === "object"
      ? blockOutput.outputMetadata
      : {};
    const normalizedBucket = normalizedOptions.normalizedBucket && typeof normalizedOptions.normalizedBucket === "object"
      ? normalizedOptions.normalizedBucket
      : {};
    const normalizationMetadata = normalizedOptions.normalizationMetadata && typeof normalizedOptions.normalizationMetadata === "object"
      ? normalizedOptions.normalizationMetadata
      : {};
    const normalizationFieldMetadata = normalizationMetadata.fields && typeof normalizationMetadata.fields === "object"
      ? normalizationMetadata.fields
      : {};
    const sourceBlockId = normalizationMetadata.sourceBlockId || blockOutput.blockId || null;
    const runtimeSection = normalizedOptions.runtimeSection || "Runtime Block Output";

    normalizedOptions.fields.forEach(function (field) {
      const runtimeMetadata = runtimeOutputMetadata[field.sourceOutputKey] || {};
      const hasNormalizedField = Boolean(field.destinationField);
      const normalizedFieldMetadata = hasNormalizedField
        ? (normalizationFieldMetadata[field.destinationField] || {})
        : {};

      rows.push({
        section: runtimeSection,
        field: field.sourceOutputKey,
        value: runtimeOutputs[field.sourceOutputKey],
        sourceBlock: blockOutput.blockId || null,
        confidence: runtimeMetadata.confidence || null
      });

      if (!hasNormalizedField) {
        return;
      }

      rows.push({
        section: normalizedOptions.normalizedSection,
        field: field.destinationField,
        value: normalizedBucket[field.destinationField],
        sourceBlock: normalizedFieldMetadata.sourceBlockId || sourceBlockId,
        confidence: normalizedFieldMetadata.confidence || null
      });

      rows.push({
        section: "Normalization Metadata",
        field: field.destinationField,
        value: normalizedFieldMetadata.sourceType || null,
        sourceBlock: normalizedFieldMetadata.sourceBlockId || sourceBlockId,
        confidence: normalizedFieldMetadata.confidence || null
      });
    });
  }

  function appendNormalizedBucketRows(rows, options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const normalizedBucket = normalizedOptions.normalizedBucket && typeof normalizedOptions.normalizedBucket === "object"
      ? normalizedOptions.normalizedBucket
      : {};
    const normalizationMetadata = normalizedOptions.normalizationMetadata && typeof normalizedOptions.normalizationMetadata === "object"
      ? normalizedOptions.normalizationMetadata
      : {};
    const normalizationFieldMetadata = normalizationMetadata.fields && typeof normalizationMetadata.fields === "object"
      ? normalizationMetadata.fields
      : {};
    const sourceBlockId = normalizationMetadata.sourceBlockId || null;

    normalizedOptions.fields.forEach(function (field) {
      const normalizedFieldMetadata = normalizationFieldMetadata[field.destinationField] || {};

      rows.push({
        section: normalizedOptions.normalizedSection,
        field: field.destinationField,
        value: normalizedBucket[field.destinationField],
        sourceBlock: normalizedFieldMetadata.sourceBlockId || sourceBlockId,
        confidence: normalizedFieldMetadata.confidence || null
      });

      rows.push({
        section: "Normalization Metadata",
        field: field.destinationField,
        value: normalizedFieldMetadata.sourceType || null,
        sourceBlock: normalizedFieldMetadata.sourceBlockId || sourceBlockId,
        confidence: normalizedFieldMetadata.confidence || null
      });
    });
  }

  function createInspectionRows(blockOutputs, lensModel) {
    const safeBlockOutputs = blockOutputs && typeof blockOutputs === "object" ? blockOutputs : {};
    const rows = [];

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[NET_INCOME_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.incomeBasis,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.incomeBasis,
      normalizedSection: "Normalized incomeBasis",
      fields: INCOME_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[NET_INCOME_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.assumptions && lensModel.assumptions.economicAssumptions,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.assumptions && lensModel.normalizationMetadata.assumptions.economicAssumptions,
      normalizedSection: "Normalized assumptions.economicAssumptions",
      fields: ECONOMIC_ASSUMPTIONS_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[DEBT_PAYOFF_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.debtPayoff,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.debtPayoff,
      normalizedSection: "Normalized debtPayoff",
      fields: DEBT_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[HOUSING_ONGOING_SUPPORT_BLOCK_ID],
      normalizedBucket: null,
      normalizationMetadata: null,
      runtimeSection: "Runtime housing context",
      normalizedSection: "Runtime housing context",
      fields: HOUSING_RUNTIME_ONLY_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[HOUSING_ONGOING_SUPPORT_BLOCK_ID],
      normalizedBucket: null,
      normalizationMetadata: null,
      runtimeSection: "Runtime housing audit",
      normalizedSection: "Runtime housing audit",
      fields: HOUSING_AUDIT_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[HOUSING_ONGOING_SUPPORT_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.ongoingSupport,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.ongoingSupport,
      normalizedSection: "Normalized ongoingSupport",
      fields: ONGOING_SUPPORT_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.ongoingSupport,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.ongoingSupport,
      runtimeSection: "Runtime non-housing-ongoing-support",
      normalizedSection: "Normalized ongoingSupport",
      fields: NON_HOUSING_ONGOING_SUPPORT_DEBUG_FIELDS
    });

    appendNormalizedBucketRows(rows, {
      normalizedBucket: lensModel && lensModel.ongoingSupport,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.ongoingSupport,
      normalizedSection: "Normalized ongoingSupport",
      fields: ONGOING_SUPPORT_COMPOSITION_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[EDUCATION_SUPPORT_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.educationSupport,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.educationSupport,
      runtimeSection: "Runtime education-support",
      normalizedSection: "Normalized educationSupport",
      fields: EDUCATION_SUPPORT_DEBUG_FIELDS
    });

    appendBucketInspectionRows(rows, {
      blockOutput: safeBlockOutputs[FINAL_EXPENSES_BLOCK_ID],
      normalizedBucket: lensModel && lensModel.finalExpenses,
      normalizationMetadata: lensModel && lensModel.normalizationMetadata && lensModel.normalizationMetadata.finalExpenses,
      runtimeSection: "Runtime final-expenses",
      normalizedSection: "Normalized finalExpenses",
      fields: FINAL_EXPENSES_DEBUG_FIELDS
    });

    return rows;
  }

  function createSummaryText(blockOutputs, lensModel) {
    const safeBlockOutputs = blockOutputs && typeof blockOutputs === "object" ? blockOutputs : {};
    const availableBlocks = [NET_INCOME_BLOCK_ID, DEBT_PAYOFF_BLOCK_ID, HOUSING_ONGOING_SUPPORT_BLOCK_ID, NON_HOUSING_ONGOING_SUPPORT_BLOCK_ID, EDUCATION_SUPPORT_BLOCK_ID, FINAL_EXPENSES_BLOCK_ID].filter(function (blockId) {
      return safeBlockOutputs[blockId];
    });
    return "Runtime blocks: " + (availableBlocks.length ? availableBlocks.join(", ") : "none");
  }

  function ensureDebugStyles() {
    if (!document || document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + PANEL_ID + " {",
      "  position: fixed;",
      "  right: 16px;",
      "  bottom: 16px;",
      "  width: min(760px, calc(100vw - 32px));",
      "  max-height: 44vh;",
      "  overflow: auto;",
      "  z-index: 9999;",
      "  padding: 12px;",
      "  border: 1px solid #1f2937;",
      "  border-radius: 10px;",
      "  background: rgba(255, 255, 255, 0.97);",
      "  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);",
      "  color: #111827;",
      "  font: 12px/1.4 Consolas, 'SFMono-Regular', Menlo, monospace;",
      "}",
      "#" + PANEL_ID + " h2 {",
      "  margin: 0 0 6px;",
      "  font-size: 13px;",
      "}",
      "#" + PANEL_ID + " p {",
      "  margin: 0 0 10px;",
      "}",
      "#" + PANEL_ID + " table {",
      "  width: 100%;",
      "  border-collapse: collapse;",
      "}",
      "#" + PANEL_ID + " th,",
      "#" + PANEL_ID + " td {",
      "  padding: 6px 8px;",
      "  border: 1px solid #d1d5db;",
      "  text-align: left;",
      "  vertical-align: top;",
      "}",
      "#" + PANEL_ID + " th {",
      "  position: sticky;",
      "  top: 0;",
      "  background: #f3f4f6;",
      "}",
      "#" + PANEL_ID + " td {",
      "  background: #ffffff;",
      "  word-break: break-word;",
      "}",
      "#" + PANEL_ID + " [data-null='true'] {",
      "  color: #6b7280;",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureDebugPanel() {
    if (!document || !document.body) {
      return null;
    }

    let panel = document.getElementById(PANEL_ID);
    if (panel) {
      return panel;
    }

    ensureDebugStyles();

    panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = [
      "<h2>TEMP DEV ONLY: Lens pipeline inspection. Remove or replace before production.</h2>",
      "<p id=\"" + SUMMARY_ID + "\"></p>",
      "<table>",
      "  <thead>",
      "    <tr>",
      "      <th>Section</th>",
      "      <th>Field</th>",
      "      <th>Value</th>",
      "      <th>Source Block</th>",
      "      <th>Confidence</th>",
      "    </tr>",
      "  </thead>",
      "  <tbody id=\"" + TABLE_BODY_ID + "\"></tbody>",
      "</table>"
    ].join("");
    document.body.appendChild(panel);
    return panel;
  }

  function refreshLensIncomeDebugPanel(runtimeNamespace) {
    if (!isLensIncomeDebugEnabled(window.location)) {
      return null;
    }

    const createLensModelFromBlockOutputs = lensAnalysis.createLensModelFromBlockOutputs;
    if (typeof createLensModelFromBlockOutputs !== "function") {
      return null;
    }

    const panel = ensureDebugPanel();
    if (!panel) {
      return null;
    }

    const runtime = runtimeNamespace && typeof runtimeNamespace === "object"
      ? runtimeNamespace
      : (LensApp.lensAnalysisRuntime || {});
    const blockOutputs = runtime.blockOutputs && typeof runtime.blockOutputs === "object"
      ? runtime.blockOutputs
      : {};
    const lensModel = createLensModelFromBlockOutputs(blockOutputs);
    const rows = createInspectionRows(blockOutputs, lensModel);
    const summaryNode = document.getElementById(SUMMARY_ID);
    const tableBody = document.getElementById(TABLE_BODY_ID);

    if (summaryNode) {
      summaryNode.textContent = createSummaryText(blockOutputs, lensModel);
    }

    if (tableBody) {
      tableBody.innerHTML = rows.map(function (row) {
        const valueText = formatDebugValue(row.value);
        const sourceBlockText = formatDebugValue(row.sourceBlock);
        const confidenceText = formatDebugValue(row.confidence);
        return [
          "<tr>",
          "  <td>" + escapeHtml(row.section) + "</td>",
          "  <td>" + escapeHtml(row.field) + "</td>",
          "  <td data-null=\"" + (valueText === "null" ? "true" : "false") + "\">" + escapeHtml(valueText) + "</td>",
          "  <td data-null=\"" + (sourceBlockText === "null" ? "true" : "false") + "\">" + escapeHtml(sourceBlockText) + "</td>",
          "  <td data-null=\"" + (confidenceText === "null" ? "true" : "false") + "\">" + escapeHtml(confidenceText) + "</td>",
          "</tr>"
        ].join("");
      }).join("");
    }

    return {
      blockOutputs: blockOutputs,
      lensModel: lensModel,
      incomeBasis: lensModel.incomeBasis,
      ongoingSupport: lensModel.ongoingSupport,
      educationSupport: lensModel.educationSupport,
      finalExpenses: lensModel.finalExpenses,
      debtPayoff: lensModel.debtPayoff,
      normalizationMetadata: lensModel.normalizationMetadata || null
    };
  }

  function mountLensIncomeDebugPanel(runtimeNamespace) {
    if (!isLensIncomeDebugEnabled(window.location)) {
      return null;
    }

    ensureDebugPanel();
    return refreshLensIncomeDebugPanel(runtimeNamespace);
  }

  lensAnalysisDev.DEBUG_QUERY_PARAM = DEBUG_QUERY_PARAM;
  lensAnalysisDev.isLensIncomeDebugEnabled = isLensIncomeDebugEnabled;
  lensAnalysisDev.mountLensIncomeDebugPanel = mountLensIncomeDebugPanel;
  lensAnalysisDev.refreshLensIncomeDebugPanel = refreshLensIncomeDebugPanel;
})();
