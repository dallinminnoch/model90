(function () {
  const LensApp = window.LensApp || (window.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: lens-analysis feature module.
  // Purpose: define the canonical destination shape that raw PMI/profile data
  // should normalize into before any Lens method runs.
  // Non-goals: no DOM, no save/load logic, no formula logic, no page branching.
  const LENS_MODEL_SCHEMA_VERSION = "1.0.0";

  function createEmptyLensModel() {
    return {
      schemaVersion: LENS_MODEL_SCHEMA_VERSION,

      // Income facts and income-replacement planning inputs.
      // `spouseOrPartner*` means the current partner income context before the
      // insured's death. `survivor*` means the post-loss survivor income
      // assumption used in replacement modeling.
      incomeBasis: {
        insuredGrossAnnualIncome: null,
        insuredNetAnnualIncome: null,
        bonusVariableAnnualIncome: null,
        annualEmployerBenefitsValue: null,
        // Neutral annual base for future analysis. This is not a total
        // replacement need, death benefit recommendation, or method result.
        annualIncomeReplacementBase: null,
        spouseOrPartnerGrossAnnualIncome: null,
        spouseOrPartnerNetAnnualIncome: null,
        survivorEarnedAnnualIncome: null,
        householdIncomeContributionPercent: null,
        incomeReplacementDurationYears: null,
        insuredRetirementHorizonYears: null,
        spouseOrPartnerRetirementHorizonYears: null,
        dependentSupportDurationYears: null,
        survivorIncomeStartDelayMonths: null,
        spouseOrPartnerIncomeGrowthRatePercent: null,
        householdExpenseReductionPercentAtDeath: null,
        spouseOrPartnerWorkReductionPercentAtDeath: null
      },

      // Outstanding balances or payoff amounts to clear at death. Mortgage
      // stays explicit so DIME can keep it distinct from other debt. The
      // total is a method-agnostic card-level summary of these inputs, not a
      // method-specific analysis result.
      debtPayoff: {
        mortgageBalance: null,
        otherRealEstateLoanBalance: null,
        autoLoanBalance: null,
        creditCardBalance: null,
        studentLoanBalance: null,
        personalLoanBalance: null,
        businessDebtBalance: null,
        outstandingTaxLiabilities: null,
        otherDebtPayoffNeeds: null,
        totalDebtPayoffNeed: null
      },

      // Recurring survivor-support needs. Housing fields capture the current
      // monthly and annual support burden before any future mortgage payoff or
      // timeline adjustments. These are neutral facts, not recommendations.
      ongoingSupport: {
        currentMonthlyHouseholdExpenses: null,
        monthlyHousingSupportCost: null,
        annualHousingSupportCost: null,
        monthlyMortgagePayment: null,
        // Mortgage timing fact for future analysis. This pass does not decide
        // when mortgage support should phase out.
        mortgageRemainingTermMonths: null,
        mortgageInterestRatePercent: null,
        monthlyRentOrHousingPayment: null,
        monthlyUtilities: null,
        monthlyHousingInsurance: null,
        monthlyPropertyTax: null,
        monthlyHoaCost: null,
        monthlyMaintenanceAndRepairs: null,
        monthlyAssociatedHousingCosts: null,
        monthlyFoodCost: null,
        monthlyTransportationCost: null,
        monthlyChildcareAndDependentCareCost: null,
        monthlyPhoneAndInternetCost: null,
        monthlyHouseholdSuppliesCost: null,
        monthlyHealthcareOutOfPocketCost: null,
        monthlyOtherInsuranceCost: null,
        monthlySubscriptionsCost: null,
        monthlyTravelAndDiscretionaryCost: null,
        monthlyOtherHouseholdExpenses: null
      },

      // Dependent-support and education-funding needs. Current and projected
      // dependents stay separate so normalization can preserve source meaning.
      educationSupport: {
        currentDependentCount: null,
        projectedDependentCount: null,
        estimatedEducationCostPerCurrentDependent: null,
        estimatedEducationCostPerProjectedDependent: null,
        educationFundingTargetPercent: null,
        yearsUntilFirstEducationFundingNeed: null
      },

      // Final life-event expenses. A total can be derived later, but the
      // canonical model keeps the underlying components explicit.
      finalExpenses: {
        funeralAndBurialCost: null,
        medicalFinalExpenses: null,
        estateSettlementCost: null,
        totalEstimatedFinalExpenses: null
      },

      // Offsets and in-force coverage. The destination model separates raw
      // asset offsets from current coverage because they reduce need through
      // different mechanisms and can come from different systems later.
      offsetsAndCoverage: {
        offsetAssetValues: {
          cashSavings: null,
          emergencyFund: null,
          brokerageAccounts: null,
          retirementAssets: null,
          realEstateEquity: null,
          businessValue: null
        },
        offsetAssetAvailabilityRules: {
          cashSavings: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null },
          emergencyFund: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null },
          brokerageAccounts: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null },
          retirementAssets: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null },
          realEstateEquity: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null },
          businessValue: { isIncludedInOffset: null, liquidityCategory: null, percentAvailableForOffset: null }
        },
        offsetAssetTotals: {
          liquidAssetsAvailable: null,
          retirementAssetsAvailable: null,
          realEstateEquityAvailable: null,
          businessValueAvailable: null,
          otherAssetsAvailable: null,
          totalAssetsAvailableForOffset: null
        },
        currentCoverage: {
          individualInForceCoverageAmount: null,
          groupInForceCoverageAmount: null,
          totalInForceCoverageAmount: null,
          groupCoveragePortabilityStatus: null,
          individualCoverageType: null,
          individualCoverageYearsRemaining: null,
          coverageSourceType: null
        },
        offsetAssetConfidenceLevel: null
      },

      // Shared Lens assumptions and tax/filing context. Tax context is kept
      // separate from economic assumptions so factual filing inputs do not get
      // mixed with rate assumptions.
      assumptions: {
        taxContext: {
          maritalStatus: null,
          filingStatus: null,
          residenceStateCode: null,
          primaryDeductionMethod: null,
          spouseOrPartnerDeductionMethod: null
        },
        economicAssumptions: {
          inflationRatePercent: null,
          discountRatePercent: null,
          investmentReturnRatePercent: null,
          incomeGrowthRatePercent: null
        }
      },

      // One-time survivor obligations. These amounts should not be blended into
      // recurring support, debt payoff, or asset offsets.
      oneTimeObligations: {
        immediateLiquidityNeed: null,
        housingTransitionReserve: null,
        specialPurposeFundingTotal: null,
        survivorEmergencyReserveGoal: null,
        otherOneTimeObligationsTotal: null
      }
    };
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(function (key) {
      deepFreeze(value[key]);
    });

    return Object.freeze(value);
  }

  const EMPTY_LENS_MODEL = deepFreeze(createEmptyLensModel());

  lensAnalysis.LENS_MODEL_SCHEMA_VERSION = LENS_MODEL_SCHEMA_VERSION;
  lensAnalysis.EMPTY_LENS_MODEL = EMPTY_LENS_MODEL;
  lensAnalysis.createEmptyLensModel = createEmptyLensModel;
})();
