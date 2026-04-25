(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});
  const schemaVersion = lensAnalysis.LENS_MODEL_SCHEMA_VERSION || "1.0.0";

  // Owner: lens-analysis feature module.
  // Purpose: document how current raw PMI/profile fields should normalize into
  // the canonical Lens model. This file is planning inventory, not runtime
  // normalization logic. Keep page wiring, persistence, and formulas out of it.
  const LENS_NORMALIZATION_PLAN = {
    canonicalSchemaVersion: schemaVersion,

    namingConventions: {
      annualIncomeFields: "Annual income fields end with `AnnualIncome` and stay separate for insured, spouseOrPartner, and survivor meanings.",
      monthlyExpenseFields: "Recurring support expense fields start with `monthly` to make periodicity explicit.",
      spouseVsSurvivor: "`spouseOrPartner*` means current partner context before loss; `survivor*` means post-loss survivor income assumptions.",
      coverageVsOffsets: "Profile policy coverage normalizes into `existingCoverage`; offset assets live under `offsetAsset*` structures. Legacy currentCoverage aliases remain compatibility notes only."
    },

    sources: {
      activeLinkedPmi: {
        role: "Primary current PMI source",
        files: [
          "pages/next-step.html",
          "pages/confidential-inputs.html"
        ]
      },
      rootClientProfile: {
        role: "Profile-level client facts captured outside PMI",
        files: [
          "app/features/client-intake.js"
        ]
      },
      existingCoverageProfile: {
        role: "Coverage totals and saved policy data captured outside PMI",
        files: [
          "pages/existing-coverage-details.html"
        ]
      },
      legacyPmi: {
        role: "Older parallel PMI schema still reachable from legacy routing",
        files: [
          "pages/protection-modeling-advisor.html",
          "pages/protection-modeling-confidential.html"
        ]
      },
      manualTemporaryAnalysis: {
        role: "Manual session-only Lens data, not profile-backed",
        files: [
          "pages/manual-protection-modeling-inputs.html"
        ]
      }
    },

    bucketMappings: {
      incomeBasis: [
        { rawField: "grossAnnualIncome", canonicalField: "incomeBasis.insuredGrossAnnualIncome", availability: "activeLinkedPmi", note: "Current gross annual income for the insured person." },
        { rawField: "netAnnualIncome", canonicalField: "incomeBasis.insuredNetAnnualIncome", availability: "activeLinkedPmi-derived", note: "Derived readonly today; not reliably persisted unless manually overridden." },
        { rawField: "bonusVariableIncome", canonicalField: "incomeBasis.bonusVariableAnnualIncome", availability: "activeLinkedPmi", note: "Variable annual income kept separate from the insured net-income field." },
        { rawField: "spouseIncome", canonicalField: "incomeBasis.spouseOrPartnerGrossAnnualIncome", availability: "activeLinkedPmi", note: "Current partner gross annual income before loss." },
        { rawField: "spouseNetAnnualIncome", canonicalField: "incomeBasis.spouseOrPartnerNetAnnualIncome", availability: "activeLinkedPmi-derived", note: "Derived readonly today; not reliably persisted unless manually overridden." },
        { rawField: "survivorIncome", canonicalField: "incomeBasis.survivorEarnedAnnualIncome", availability: "activeLinkedPmi-conditional", note: "Post-loss survivor earned income assumption when work continues." },
        { rawField: "survivorNetAnnualIncome", canonicalField: "incomeBasis.survivorEarnedAnnualIncome", availability: "activeLinkedPmi-conditional", note: "Preferred survivor-income source when the post-loss value is net rather than gross." },
        { rawField: "employerBenefitsValue", canonicalField: "incomeBasis.annualEmployerBenefitsValue", availability: "activeLinkedPmi", note: "Annual employer-provided benefits value kept separate from the insured net-income field." },
        { rawField: "annualIncomeReplacementBase", canonicalField: "incomeBasis.annualIncomeReplacementBase", availability: "activeLinkedPmiCardOutput", note: "Neutral annual income-replacement base from the Income and Economic Value card, not a recommendation or total need." },
        { rawField: "householdIncomeUsePercent", canonicalField: "incomeBasis.householdIncomeContributionPercent", availability: "activeLinkedPmi-derived", note: "Current UI-derived contribution ratio. Keep distinct from any future explicit replacement-target percent." },
        { rawField: "incomeReplacementDuration", canonicalField: "incomeBasis.incomeReplacementDurationYears", availability: "activeLinkedPmi-conditional", note: "Explicit replacement-duration override when survivor assumptions are enabled." },
        { rawField: "yearsUntilRetirement", canonicalField: "incomeBasis.insuredRetirementHorizonYears", availability: "activeLinkedPmi", note: "Current insured work-horizon field." },
        { rawField: "spouseYearsUntilRetirement", canonicalField: "incomeBasis.spouseOrPartnerRetirementHorizonYears", availability: "activeLinkedPmi-conditional", note: "Current spouse-or-partner work-horizon field." },
        { rawField: "childDependencyDuration", canonicalField: "incomeBasis.dependentSupportDurationYears", availability: "activeLinkedPmi-conditional", note: "Current dependent-support duration input." },
        { rawField: "survivorIncomeStartDelayMonths", canonicalField: "incomeBasis.survivorIncomeStartDelayMonths", availability: "activeLinkedPmi-conditional", note: "Current survivor-income timing field." },
        { rawField: "spouseIncomeGrowthRate", canonicalField: "incomeBasis.spouseOrPartnerIncomeGrowthRatePercent", availability: "activeLinkedPmi-conditional", note: "Current spouse-or-partner income growth assumption." },
        { rawField: "expenseReductionAtDeath", canonicalField: "incomeBasis.householdExpenseReductionPercentAtDeath", availability: "activeLinkedPmi-conditional", note: "Current household-expense reduction assumption after death." },
        { rawField: "spouseExpectedWorkReductionAtDeath", canonicalField: "incomeBasis.spouseOrPartnerWorkReductionPercentAtDeath", availability: "activeLinkedPmi-conditional", note: "Current spouse-or-partner work-reduction assumption after death." }
      ],

      debtPayoff: [
        { rawField: "mortgageBalance", canonicalField: "debtPayoff.mortgageBalance", availability: "activeLinkedPmi", note: "Keep distinct for DIME treatment." },
        { rawField: "otherRealEstateLoans", canonicalField: "debtPayoff.otherRealEstateLoanBalance", availability: "activeLinkedPmi", note: "Outstanding balance on non-primary real-estate debt." },
        { rawField: "autoLoans", canonicalField: "debtPayoff.autoLoanBalance", availability: "activeLinkedPmi", note: "Outstanding auto-loan balance." },
        { rawField: "creditCardDebt", canonicalField: "debtPayoff.creditCardBalance", availability: "activeLinkedPmi", note: "Outstanding revolving card balance." },
        { rawField: "studentLoans", canonicalField: "debtPayoff.studentLoanBalance", availability: "activeLinkedPmi", note: "Outstanding student-loan balance." },
        { rawField: "personalLoans", canonicalField: "debtPayoff.personalLoanBalance", availability: "activeLinkedPmi", note: "Outstanding personal-loan balance." },
        { rawField: "businessDebt", canonicalField: "debtPayoff.businessDebtBalance", availability: "activeLinkedPmi", note: "Outstanding business-debt balance." },
        { rawField: "taxLiabilities", canonicalField: "debtPayoff.outstandingTaxLiabilities", availability: "activeLinkedPmi", note: "Outstanding tax liabilities to clear; captured today but ignored by the live bucket builder." },
        { rawField: "otherLoanObligations", canonicalField: "debtPayoff.otherDebtPayoffNeeds", availability: "activeLinkedPmi", note: "Other payoff needs that do not fit the named debt categories." },
        { rawField: "totalDebtPayoffNeed", canonicalField: "debtPayoff.totalDebtPayoffNeed", availability: "activeLinkedPmiCardOutput", note: "Method-agnostic card-level summary of the debt payoff inputs; not a DIME-specific formula result." }
      ],

      ongoingSupport: [
        { rawField: "currentTotalMonthlySpending", canonicalField: "ongoingSupport.currentMonthlyHouseholdExpenses", availability: "legacyPmi", note: "Legacy explicit monthly total; absent from the active linked PMI." },
        { rawField: "calculatedMonthlyMortgagePayment", canonicalField: "ongoingSupport.monthlyHousingSupportCost", availability: "activeLinkedPmiCardOutput", note: "Current card-level monthly housing support total before future payoff or timeline adjustments." },
        { rawField: "annualHousingSupportCost", canonicalField: "ongoingSupport.annualHousingSupportCost", availability: "activeLinkedPmiCardOutput", note: "Annualized housing support cost derived from the current monthly housing support total." },
        { rawField: "monthlyHousingSupportCost + monthlyNonHousingEssentialSupportCost", canonicalField: "ongoingSupport.monthlyTotalEssentialSupportCost", availability: "activeLinkedPmiBucketComposition", note: "Neutral combined essential support summary composed from normalized housing and non-housing baseline support. Discretionary personal spending is excluded." },
        { rawField: "monthlyTotalEssentialSupportCost", canonicalField: "ongoingSupport.annualTotalEssentialSupportCost", availability: "activeLinkedPmiBucketComposition", note: "Annualized combined essential support summary derived from the monthly composed total." },
        { rawField: "monthlyMortgagePaymentOnly", canonicalField: "ongoingSupport.monthlyMortgagePayment", availability: "activeLinkedPmiCardOutput", note: "Current monthly mortgage payment excluding property tax and housing insurance." },
        { rawField: "mortgageTermRemainingYears + mortgageTermRemainingMonths", canonicalField: "ongoingSupport.mortgageRemainingTermMonths", availability: "activeLinkedPmi-derived", note: "Current mortgage timing fact normalized into total remaining months." },
        { rawField: "mortgageInterestRate", canonicalField: "ongoingSupport.mortgageInterestRatePercent", availability: "activeLinkedPmi", note: "Current mortgage interest rate percent kept as timing/context data only." },
        { rawField: "monthlyHousingCost", canonicalField: "ongoingSupport.monthlyRentOrHousingPayment", availability: "activeLinkedPmi", note: "Current renter housing payment field." },
        { rawField: "otherMonthlyRenterHousingCosts", canonicalField: "ongoingSupport.monthlyOtherRenterHousingCost", availability: "activeLinkedPmi", note: "Renter-only recurring housing support component included in renter monthly and annual housing support, not a transition need." },
        { rawField: "utilitiesCost", canonicalField: "ongoingSupport.monthlyUtilities", availability: "activeLinkedPmi", note: "Current monthly utilities field." },
        { rawField: "housingInsuranceCost", canonicalField: "ongoingSupport.monthlyHousingInsurance", availability: "activeLinkedPmi", note: "Current monthly housing-insurance field, including renter insurance when captured there." },
        { rawField: "propertyTax", canonicalField: "ongoingSupport.monthlyPropertyTax", availability: "activeLinkedPmi", note: "Current monthly property-tax input." },
        { rawField: "monthlyHoaCost", canonicalField: "ongoingSupport.monthlyHoaCost", availability: "activeLinkedPmi", note: "Current monthly HOA field." },
        { rawField: "monthlyMaintenanceRecommendation", canonicalField: "ongoingSupport.monthlyMaintenanceAndRepairs", availability: "activeLinkedPmiCardOutput", note: "Current monthly maintenance and repairs value from the card-level recommendation or manual override." },
        { rawField: "foodCost", canonicalField: "ongoingSupport.monthlyFoodCost", availability: "activeLinkedPmi", note: "Current monthly food field." },
        { rawField: "transportationCost", canonicalField: "ongoingSupport.monthlyTransportationCost", availability: "activeLinkedPmi", note: "Current monthly transportation field." },
        { rawField: "childcareDependentCareCost", canonicalField: "ongoingSupport.monthlyChildcareAndDependentCareCost", availability: "activeLinkedPmi", note: "Current monthly childcare and dependent-care field." },
        { rawField: "phoneInternetCost", canonicalField: "ongoingSupport.monthlyPhoneAndInternetCost", availability: "activeLinkedPmi", note: "Current monthly phone and internet field." },
        { rawField: "householdSuppliesCost", canonicalField: "ongoingSupport.monthlyHouseholdSuppliesCost", availability: "activeLinkedPmi", note: "Current monthly household-supplies field." },
        { rawField: "healthcareOutOfPocketCost", canonicalField: "ongoingSupport.monthlyHealthcareOutOfPocketCost", availability: "activeLinkedPmi", note: "Current monthly healthcare out-of-pocket field." },
        { rawField: "insuranceCost", canonicalField: "ongoingSupport.monthlyOtherInsuranceCost", availability: "activeLinkedPmi", note: "Current monthly non-housing insurance field." },
        { rawField: "otherHouseholdExpenses", canonicalField: "ongoingSupport.monthlyOtherHouseholdExpenses", availability: "activeLinkedPmi", note: "Current monthly miscellaneous household-expense field." },
        { rawField: "monthlyNonHousingEssentialSupportCost", canonicalField: "ongoingSupport.monthlyNonHousingEssentialSupportCost", availability: "activeLinkedPmiCardOutput", note: "Current baseline non-housing survivor-support cost from the Expenses and Lifestyle card, excluding discretionary personal spending by default." },
        { rawField: "annualNonHousingEssentialSupportCost", canonicalField: "ongoingSupport.annualNonHousingEssentialSupportCost", availability: "activeLinkedPmiCardOutput", note: "Annualized baseline non-housing survivor-support cost derived from the monthly essential total." },
        { rawField: "subscriptionsCost", canonicalField: "ongoingSupport.monthlySubscriptionsCost", availability: "activeLinkedPmi", note: "Current monthly recurring personal spending stored separately as discretionary context and excluded from baseline support by default." },
        { rawField: "travelDiscretionaryCost", canonicalField: "ongoingSupport.monthlyTravelAndDiscretionaryCost", availability: "activeLinkedPmi", note: "Current monthly travel and entertainment spending stored separately as discretionary context and excluded from baseline support by default." },
        { rawField: "monthlyDiscretionaryPersonalSpending", canonicalField: "ongoingSupport.monthlyDiscretionaryPersonalSpending", availability: "activeLinkedPmiCardOutput", note: "Current monthly discretionary personal spending aggregate stored separately from baseline survivor support." },
        { rawField: "annualDiscretionaryPersonalSpending", canonicalField: "ongoingSupport.annualDiscretionaryPersonalSpending", availability: "activeLinkedPmiCardOutput", note: "Annualized discretionary personal spending aggregate stored separately from baseline survivor support." }
      ],

      educationSupport: [
        { rawField: "childrenNeedingFunding", canonicalField: "educationSupport.linkedDependentCount", availability: "activeLinkedPmi-linkedProfile", note: "Linked/current profile dependent count used for neutral education funding." },
        { rawField: "projectedDependentsCount", canonicalField: "educationSupport.desiredAdditionalDependentCount", availability: "activeLinkedPmi-linkedProfile", note: "Additional planned dependent count used for neutral education funding." },
        { rawField: "estimatedCostPerChild", canonicalField: "educationSupport.perLinkedDependentEducationFunding", availability: "activeLinkedPmi", note: "Education funding amount per linked/current dependent." },
        { rawField: "projectedEducationFundingPerDependent", canonicalField: "educationSupport.perDesiredAdditionalDependentEducationFunding", availability: "activeLinkedPmi", note: "Education funding amount per additional planned dependent. When sameEducationFunding is Yes, page logic copies the linked-dependent amount into this field before block creation." },
        { rawField: "sameEducationFunding", canonicalField: "educationSupport.sameEducationFundingForDesiredAdditionalDependents", availability: "activeLinkedPmi", note: "Whether additional planned dependents use the same per-dependent education funding amount." },
        { rawField: "childrenNeedingFunding * estimatedCostPerChild", canonicalField: "educationSupport.linkedDependentEducationFundingNeed", availability: "activeLinkedPmiBlockOutput", note: "Neutral linked/current dependent lump-sum education funding target; not inflation-projected, present-valued, offset-adjusted, or a recommendation." },
        { rawField: "projectedDependentsCount * projectedEducationFundingPerDependent", canonicalField: "educationSupport.desiredAdditionalDependentEducationFundingNeed", availability: "activeLinkedPmiBlockOutput", note: "Neutral additional planned dependent lump-sum education funding target; not inflation-projected, present-valued, offset-adjusted, or a recommendation." },
        { rawField: "linkedDependentEducationFundingNeed + desiredAdditionalDependentEducationFundingNeed", canonicalField: "educationSupport.totalEducationFundingNeed", availability: "activeLinkedPmiBlockOutput", note: "Neutral total lump-sum education funding target; not inflation-projected, present-valued, offset-adjusted, or a recommendation." }
      ],

      finalExpenses: [
        { rawField: "funeralBurialEstimate", canonicalField: "finalExpenses.funeralAndBurialCost", availability: "activeLinkedPmi", note: "One-time funeral and burial cost estimate." },
        { rawField: "medicalEndOfLifeCosts", canonicalField: "finalExpenses.medicalEndOfLifeCost", availability: "activeLinkedPmi", note: "One-time medical end-of-life cost estimate." },
        { rawField: "estateSettlementCosts", canonicalField: "finalExpenses.estateSettlementCost", availability: "activeLinkedPmi", note: "One-time estate settlement cost estimate." },
        { rawField: "otherFinalExpenses", canonicalField: "finalExpenses.otherFinalExpenses", availability: "activeLinkedPmi", note: "Other narrow one-time final expenses not captured by the named final-expense fields." },
        { rawField: "funeralBurialEstimate + medicalEndOfLifeCosts + estateSettlementCosts + otherFinalExpenses", canonicalField: "finalExpenses.totalFinalExpenseNeed", availability: "activeLinkedPmiBlockOutput", note: "Neutral lump-sum final expense target; not inflation-adjusted, offset-adjusted, present-valued, or a recommendation." }
      ],

      transitionNeeds: [
        { rawField: "immediateLiquidityBuffer", canonicalField: "transitionNeeds.survivorLiquidityBuffer", availability: "activeLinkedPmi", note: "Short-term survivor cash need for the immediate aftermath of death." },
        { rawField: "desiredEmergencyFund", canonicalField: "transitionNeeds.desiredEmergencyFund", availability: "activeLinkedPmi", note: "Longer-term survivor emergency reserve target after the initial transition period." },
        { rawField: "relocationReserve", canonicalField: "transitionNeeds.housingTransitionReserve", availability: "activeLinkedPmi", note: "One-time housing transition or relocation reserve; available for every housing status." },
        { rawField: "otherTransitionNeeds", canonicalField: "transitionNeeds.otherTransitionNeeds", availability: "activeLinkedPmi", note: "Other one-time survivor transition needs not captured by liquidity buffer, desired emergency fund, or housing transition reserve." },
        { rawField: "immediateLiquidityBuffer + desiredEmergencyFund + relocationReserve + otherTransitionNeeds", canonicalField: "transitionNeeds.totalTransitionNeed", availability: "activeLinkedPmiBlockOutput", note: "Neutral lump-sum survivor transition target; not offset-adjusted, inflation-adjusted, present-valued, or a recommendation." }
      ],

      existingCoverage: [
        { rawField: "coveragePolicies[]", canonicalField: "existingCoverage.profilePolicySummaries", availability: "rootClientProfile-existingCoverageProfile", note: "Compact safe summaries of linked profile coverage policy records for debug/future analysis, not raw full policy storage." },
        { rawField: "coveragePolicies.length", canonicalField: "existingCoverage.profilePolicyCount", availability: "rootClientProfile-existingCoverageProfile", note: "Count of linked profile coverage policy records." },
        { rawField: "coveragePolicies[] classified individual", canonicalField: "existingCoverage.individualProfileCoverageTotal", availability: "rootClientProfile-existingCoverageProfile", note: "Total face amount for profile policies classified as individual by coverage-policy-utils." },
        { rawField: "coveragePolicies[] classified groupEmployer", canonicalField: "existingCoverage.groupProfileCoverageTotal", availability: "rootClientProfile-existingCoverageProfile", note: "Total face amount for profile policies classified as Group Life or group/employer by coverage-policy-utils." },
        { rawField: "coveragePolicies[] classified unclassified", canonicalField: "existingCoverage.unclassifiedProfileCoverageTotal", availability: "rootClientProfile-existingCoverageProfile", note: "Total face amount for simple, blank, or unknown profile policy records." },
        { rawField: "coveragePolicies[] totals", canonicalField: "existingCoverage.totalProfileCoverage", availability: "rootClientProfile-existingCoverageProfile", note: "Sum of individual, group/employer, and unclassified profile policy coverage. Does not use legacy scalar coverage fields." },
        { rawField: "coveragePolicies[] source presence", canonicalField: "existingCoverage.coverageSource", availability: "rootClientProfile-existingCoverageProfile", note: "`profile-policies` when profile policy records exist, otherwise `none`." },
        { rawField: "coveragePolicies[] totals", canonicalField: "existingCoverage.totalExistingCoverage", availability: "rootClientProfile-existingCoverageProfile", note: "Same as totalProfileCoverage for now. This is not offset math, a coverage gap, or a recommendation." }
      ],

      offsetsAndCoverage: [
        { rawField: "cashSavings", canonicalField: "offsetsAndCoverage.offsetAssetValues.cashSavings", availability: "activeLinkedPmi", note: "Current liquid asset field." },
        { rawField: "emergencyFund", canonicalField: "offsetsAndCoverage.offsetAssetValues.emergencyFund", availability: "activeLinkedPmi", note: "Current emergency fund asset field. This is an asset/offset, not a survivor transition need." },
        { rawField: "brokerageAccounts", canonicalField: "offsetsAndCoverage.offsetAssetValues.brokerageAccounts", availability: "activeLinkedPmi", note: "Current brokerage asset field." },
        { rawField: "retirementAssets", canonicalField: "offsetsAndCoverage.offsetAssetValues.retirementAssets", availability: "activeLinkedPmi", note: "Current retirement asset field." },
        { rawField: "realEstateEquity", canonicalField: "offsetsAndCoverage.offsetAssetValues.realEstateEquity", availability: "activeLinkedPmi", note: "Captured today but not honored by the live bucket builder." },
        { rawField: "businessValue", canonicalField: "offsetsAndCoverage.offsetAssetValues.businessValue", availability: "activeLinkedPmi", note: "Current business-value field." },
        { rawField: "cashSavingsIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.cashSavings.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "cashSavingsLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.cashSavings.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "cashSavingsPercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.cashSavings.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "emergencyFundIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.emergencyFund.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "emergencyFundLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.emergencyFund.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "emergencyFundPercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.emergencyFund.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "brokerageAccountsIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.brokerageAccounts.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "brokerageAccountsLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.brokerageAccounts.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "brokerageAccountsPercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.brokerageAccounts.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "retirementAssetsIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.retirementAssets.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "retirementAssetsLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.retirementAssets.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "retirementAssetsPercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.retirementAssets.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "realEstateEquityIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.realEstateEquity.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "realEstateEquityLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.realEstateEquity.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "realEstateEquityPercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.realEstateEquity.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "businessValueIncludeInOffset", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.businessValue.isIncludedInOffset", availability: "activeLinkedPmi", note: "Current include-in-offset control." },
        { rawField: "businessValueLiquidityType", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.businessValue.liquidityCategory", availability: "activeLinkedPmi", note: "Current liquidity control." },
        { rawField: "businessValuePercentAvailable", canonicalField: "offsetsAndCoverage.offsetAssetAvailabilityRules.businessValue.percentAvailableForOffset", availability: "activeLinkedPmi", note: "Current availability control." },
        { rawField: "liquidAssetsAvailable", canonicalField: "offsetsAndCoverage.offsetAssetTotals.liquidAssetsAvailable", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "retirementAssetsAvailable", canonicalField: "offsetsAndCoverage.offsetAssetTotals.retirementAssetsAvailable", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "businessValueAvailable", canonicalField: "offsetsAndCoverage.offsetAssetTotals.businessValueAvailable", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "otherAssetsAvailable", canonicalField: "offsetsAndCoverage.offsetAssetTotals.otherAssetsAvailable", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "availableAssetsTotal", canonicalField: "offsetsAndCoverage.offsetAssetTotals.totalAssetsAvailableForOffset", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "individualDeathBenefit", canonicalField: "offsetsAndCoverage.currentCoverage.individualInForceCoverageAmount", availability: "legacyPmi-or-manualOnly", note: "Not present on the active linked PMI." },
        { rawField: "groupLifeCoverage", canonicalField: "offsetsAndCoverage.currentCoverage.groupInForceCoverageAmount", availability: "legacyPmi-or-manualOnly", note: "Not present on the active linked PMI." },
        { rawField: "existingCoverageTotal", canonicalField: "offsetsAndCoverage.currentCoverage.totalInForceCoverageAmount", availability: "analysisAliasOnly", note: "Supported by live analysis, not collected in the active linked PMI." },
        { rawField: "groupLifePortability", canonicalField: "offsetsAndCoverage.currentCoverage.groupCoveragePortabilityStatus", availability: "legacyPmi-or-manualOnly", note: "Not present on the active linked PMI." },
        { rawField: "individualPolicyType", canonicalField: "offsetsAndCoverage.currentCoverage.individualCoverageType", availability: "legacyPmi-or-manualOnly", note: "Not present on the active linked PMI." },
        { rawField: "individualYearsRemaining", canonicalField: "offsetsAndCoverage.currentCoverage.individualCoverageYearsRemaining", availability: "legacyPmi-or-manualOnly", note: "Not present on the active linked PMI." },
        { rawField: "currentCoverage", canonicalField: "offsetsAndCoverage.currentCoverage.totalInForceCoverageAmount", availability: "rootClientProfile", note: "Separate profile-level fallback written by existing-coverage flow." },
        { rawField: "coverageAmount", canonicalField: "offsetsAndCoverage.currentCoverage.totalInForceCoverageAmount", availability: "rootClientProfile", note: "Mirror of currentCoverage on the root record." },
        { rawField: "assetsConfidenceLevel", canonicalField: "offsetsAndCoverage.offsetAssetConfidenceLevel", availability: "activeLinkedPmi", note: "Current confidence selector with no live analysis consumer yet." }
      ],

      assumptions: [
        { rawField: "maritalStatus", canonicalField: "assumptions.taxContext.maritalStatus", availability: "rootClientProfile", note: "Current source of marital-status truth for the linked flow." },
        { rawField: "filingStatus", canonicalField: "assumptions.taxContext.filingStatus", availability: "activeLinkedPmi", note: "Current tax filing-status field." },
        { rawField: "stateOfResidence", canonicalField: "assumptions.taxContext.residenceStateCode", availability: "activeLinkedPmi", note: "Current tax state field, often hydrated from root profile state." },
        { rawField: "deductionMethod", canonicalField: "assumptions.taxContext.primaryDeductionMethod", availability: "activeLinkedPmi", note: "Current primary deduction-method field." },
        { rawField: "spouseDeductionMethod", canonicalField: "assumptions.taxContext.spouseOrPartnerDeductionMethod", availability: "activeLinkedPmi", note: "Current spouse-or-partner deduction-method field." },
        { rawField: "inflationRateAssumption", canonicalField: "assumptions.economicAssumptions.inflationRatePercent", availability: "activeLinkedPmi", note: "Current economic assumption field." },
        { rawField: "discountRate", canonicalField: "assumptions.economicAssumptions.discountRatePercent", availability: "activeLinkedPmi", note: "Current economic assumption field." },
        { rawField: "investmentReturnAssumption", canonicalField: "assumptions.economicAssumptions.investmentReturnRatePercent", availability: "activeLinkedPmi", note: "Current economic assumption field." },
        { rawField: "incomeGrowthRate", canonicalField: "assumptions.economicAssumptions.incomeGrowthRatePercent", availability: "activeLinkedPmi", note: "Current economic assumption field." }
      ],

      oneTimeObligations: [
        { rawField: "immediateLiquidityBuffer", canonicalField: "oneTimeObligations.immediateLiquidityNeed", availability: "legacyPlanPlaceholder", note: "Legacy one-time-obligations placeholder retained for compatibility notes. Active runtime canonical destination is transitionNeeds.survivorLiquidityBuffer." },
        { rawField: "relocationReserve", canonicalField: "oneTimeObligations.housingTransitionReserve", availability: "legacyPlanPlaceholder", note: "Legacy one-time-obligations placeholder retained for compatibility notes. Active runtime canonical destination is transitionNeeds.housingTransitionReserve." },
        { rawField: "specialOneTimeGoals", canonicalField: "oneTimeObligations.specialPurposeFundingTotal", availability: "analysisAliasOnly", note: "Expected by live bucket builder but not collected in the active linked PMI." },
        { rawField: "emergencyReserveGoal", canonicalField: "oneTimeObligations.survivorEmergencyReserveGoal", availability: "analysisAliasOnly", note: "Expected by live bucket builder but not collected in the active linked PMI." },
        { rawField: "otherSurvivorLumpSumNeed", canonicalField: "oneTimeObligations.otherOneTimeObligationsTotal", availability: "analysisAliasOnly", note: "Expected by live bucket builder but not collected in the active linked PMI." }
      ]
    },

    rootProfileFactsUsedDuringNormalization: [
      { rawField: "age", canonicalField: null, note: "Supporting context only. Current age should not be conflated with retirement horizon." },
      { rawField: "dateOfBirth", canonicalField: null, note: "Useful fallback for age derivation before formulas." },
      { rawField: "spouseAge", canonicalField: null, note: "Supporting context only. Spouse-or-partner age should not be conflated with retirement horizon." },
      { rawField: "spouseDateOfBirth", canonicalField: null, note: "Useful fallback for spouse-or-partner age derivation before formulas." },
      { rawField: "dependentsCount", canonicalField: "educationSupport.linkedDependentCount", note: "Current linked PMI hydrates childrenNeedingFunding from this profile field." },
      { rawField: "projectedDependentsCount", canonicalField: "educationSupport.desiredAdditionalDependentCount", note: "Current linked PMI hydrates projectedDependentsCount from this profile field." },
      { rawField: "dependentAges", canonicalField: null, note: "Profile fact worth preserving later for education timing, but not part of the first canonical destination shape." },
      { rawField: "hasDependents", canonicalField: null, note: "Profile fact worth preserving later for form logic, but not required in the first canonical model." },
      { rawField: "projectedDependents", canonicalField: null, note: "Profile fact worth preserving later for form logic, but not required in the first canonical model." }
    ],

    nonCanonicalOrUiOnlyRawFields: [
      { rawField: "linkedMaritalStatusDisplay", reason: "Display-only linked status mirror; should not normalize into the canonical model." },
      { rawField: "standardDeduction", reason: "Derived tax-display value; do not store as canonical analysis input." },
      { rawField: "spouseStandardDeduction", reason: "Derived tax-display value; do not store as canonical analysis input." },
      { rawField: "taxableIncome", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "spouseTaxableIncome", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "federalTaxBracket", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "spouseFederalTaxBracket", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "stateIncomeTaxBracket", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "spouseStateIncomeTaxBracket", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "primaryPayrollTaxes", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "spousePayrollTaxes", reason: "Derived display/support value; not a first-pass canonical Lens field." },
      { rawField: "associatedMonthlyCosts", reason: "Housing-card subtotal and UI convenience only; future analysis should use monthlyHousingSupportCost or the granular housing fields instead of this overlapping subtotal." },
      { rawField: "mortgageTermRemaining", reason: "Useful derived helper, but not part of the first canonical bucket design." },
      { rawField: "costToFundPercent", reason: "Legacy funding target percent; excluded from the current neutral education-support block because method logic later decides offsets, funding percentages, and recommendations." },
      { rawField: "yearsUntilCollege", reason: "Legacy education timing field; excluded from the current neutral education-support block because timing and child-age projection belong in later analysis." },
      { rawField: "viewport", reason: "Pure UI state; should never normalize into a backend-ready Lens model." }
    ],

    knownMissingCanonicalFields: [
      { canonicalField: "incomeBasis.householdIncomeContributionPercent", reason: "Active linked PMI calculates a contribution ratio but does not reliably persist it, and there is still no separate explicit replacement-target field." },
      { canonicalField: "ongoingSupport.currentMonthlyHouseholdExpenses", reason: "Active linked PMI captures line-item expenses but has no canonical current total field." },
      { canonicalField: "offsetsAndCoverage.currentCoverage.individualInForceCoverageAmount", reason: "Active linked PMI no longer captures individual policy totals directly." },
      { canonicalField: "offsetsAndCoverage.currentCoverage.groupInForceCoverageAmount", reason: "Active linked PMI no longer captures group policy totals directly." },
      { canonicalField: "oneTimeObligations.specialPurposeFundingTotal", reason: "Expected by live analysis code but absent from the active linked PMI." },
      { canonicalField: "oneTimeObligations.survivorEmergencyReserveGoal", reason: "Expected by live analysis code but absent from the active linked PMI." },
      { canonicalField: "oneTimeObligations.otherOneTimeObligationsTotal", reason: "Expected by live analysis code but absent from the active linked PMI." }
    ],

    deprecatedOrStaleAliases: [
      { rawField: "annualIncome", canonicalField: "incomeBasis.insuredGrossAnnualIncome", reason: "Legacy consumer alias still read by downstream summary code." },
      { rawField: "householdIncome", canonicalField: "incomeBasis.insuredGrossAnnualIncome", reason: "Legacy consumer alias still read by downstream summary code." },
      { rawField: "currentCoverageAmount", canonicalField: "offsetsAndCoverage.currentCoverage.totalInForceCoverageAmount", reason: "Legacy/stale coverage alias still read by downstream summary code." },
      { rawField: "currentLifeInsuranceCoverage", canonicalField: "offsetsAndCoverage.currentCoverage.totalInForceCoverageAmount", reason: "Legacy/stale coverage alias still read by downstream summary code." },
      { rawField: "monthlySpending", canonicalField: "ongoingSupport.currentMonthlyHouseholdExpenses", reason: "Legacy/stale spending alias still read by downstream summary code." },
      { rawField: "householdMonthlySpending", canonicalField: "ongoingSupport.currentMonthlyHouseholdExpenses", reason: "Legacy/stale spending alias still read by downstream summary code." },
      { rawField: "otherPersonalDebtTotal", canonicalField: "debtPayoff.otherDebtPayoffNeeds", reason: "Legacy/stale debt alias supported by the live bucket builder." },
      { rawField: "totalDebtBalance", canonicalField: "debtPayoff", reason: "Legacy/stale summary alias, not a first-class canonical field." }
    ],

    openQuestions: [
      { topic: "Contribution vs replacement target", note: "The current canonical model preserves `householdIncomeContributionPercent`, but a separate explicit replacement-target percent may still be needed later." },
      { topic: "Tax context ownership", note: "Tax and filing facts are nested under `assumptions.taxContext` for now; if the model later grows a dedicated case-context bucket, these may move there." },
      { topic: "Coverage aggregation vs policy detail", note: "The existingCoverage bucket stores compact policy summaries and aggregate profile-policy totals. If policy-level analysis becomes first-class, it may need a richer policy collection later." }
    ]
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(function (key) {
      deepFreeze(value[key]);
    });

    return Object.freeze(value);
  }

  lensAnalysis.LENS_NORMALIZATION_PLAN = deepFreeze(LENS_NORMALIZATION_PLAN);
})();
