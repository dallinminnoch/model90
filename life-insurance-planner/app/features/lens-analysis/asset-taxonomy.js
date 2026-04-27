(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: Lens analysis asset taxonomy.
  // Purpose: define raw asset category metadata for future PMI asset facts.
  // Non-goals: no DOM reads, no persistence, no bucket building, no treatment
  // logic, no offset math, no recommendations, and no Step 3 wiring.

  const DEFAULT_ASSET_CATEGORIES = Object.freeze([
    Object.freeze({
      categoryKey: "cashAndCashEquivalents",
      label: "Cash & Cash Equivalents",
      group: "liquid",
      description: "Checking, savings, money market, CDs, and other cash-like balances.",
      defaultPmiSourceKey: "cashSavings",
      legacySourceKeys: Object.freeze(["cashSavings"]),
      hasCurrentPmiSource: true,
      defaultTreatmentBias: "cash-like",
      notes: "Legacy PMI cashSavings maps here."
    }),
    Object.freeze({
      categoryKey: "emergencyFund",
      label: "Emergency Fund",
      group: "liquid",
      description: "Dedicated emergency reserve balance entered as a raw current asset fact.",
      defaultPmiSourceKey: "emergencyFund",
      legacySourceKeys: Object.freeze(["emergencyFund"]),
      hasCurrentPmiSource: true,
      defaultTreatmentBias: "cash-like",
      notes: "Separate from survivor transition needs and desired emergency fund targets."
    }),
    Object.freeze({
      categoryKey: "taxableBrokerageInvestments",
      label: "Taxable Brokerage / Investments",
      group: "investment",
      description: "Taxable brokerage and non-retirement investment account balances.",
      defaultPmiSourceKey: "brokerageAccounts",
      legacySourceKeys: Object.freeze(["brokerageAccounts"]),
      hasCurrentPmiSource: true,
      defaultTreatmentBias: "step-up-investment",
      notes: "Legacy PMI brokerageAccounts maps here."
    }),
    Object.freeze({
      categoryKey: "traditionalRetirementAssets",
      label: "Traditional Retirement Assets",
      group: "retirement",
      description: "Traditional 401(k), IRA, and similar pre-tax retirement account balances.",
      defaultPmiSourceKey: "retirementAssets",
      legacySourceKeys: Object.freeze(["retirementAssets"]),
      hasCurrentPmiSource: true,
      defaultTreatmentBias: "taxable-retirement",
      notes: "Legacy PMI retirementAssets may mix traditional, Roth, and other retirement balances."
    }),
    Object.freeze({
      categoryKey: "rothTaxAdvantagedRetirementAssets",
      label: "Roth / Tax-Advantaged Retirement Assets",
      group: "retirement",
      description: "Roth IRA, Roth 401(k), and similar tax-advantaged retirement account balances.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "roth-retirement",
      notes: "Requires a new PMI raw source field before becoming PMI-backed."
    }),
    Object.freeze({
      categoryKey: "qualifiedAnnuities",
      label: "Qualified Annuities",
      group: "annuity",
      description: "Qualified annuity balances held inside tax-qualified retirement arrangements.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "qualified-annuity",
      notes: "Requires a new PMI raw source field before becoming PMI-backed."
    }),
    Object.freeze({
      categoryKey: "nonqualifiedAnnuities",
      label: "Nonqualified Annuities",
      group: "annuity",
      description: "Nonqualified annuity account values or surrender values.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "nonqualified-annuity",
      notes: "Requires a new PMI raw source field before becoming PMI-backed."
    }),
    Object.freeze({
      categoryKey: "primaryResidenceEquity",
      label: "Primary Residence Equity",
      group: "realEstate",
      description: "Estimated equity in the client's primary residence.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze(["realEstateEquity"]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "real-estate-equity",
      notes: "Legacy PMI realEstateEquity maps here for compatibility, but old records cannot distinguish primary residence from other real estate."
    }),
    Object.freeze({
      categoryKey: "otherRealEstateEquity",
      label: "Other Real Estate Equity",
      group: "realEstate",
      description: "Estimated equity in rental, vacation, investment, or other non-primary real estate.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "real-estate-equity",
      notes: "Requires a new PMI raw source field before becoming PMI-backed."
    }),
    Object.freeze({
      categoryKey: "businessPrivateCompanyValue",
      label: "Business / Private Company Value",
      group: "business",
      description: "Estimated business ownership, private company, or closely held entity value.",
      defaultPmiSourceKey: "businessValue",
      legacySourceKeys: Object.freeze(["businessValue"]),
      hasCurrentPmiSource: true,
      defaultTreatmentBias: "business-illiquid",
      notes: "Legacy PMI businessValue maps here."
    }),
    Object.freeze({
      categoryKey: "educationSpecificSavings",
      label: "Education-Specific Savings",
      group: "restrictedPurpose",
      description: "529 plans, Coverdell accounts, or other education-dedicated savings.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "restricted-purpose",
      notes: "Future PMI source should remain a raw balance; education treatment stays in Analysis Setup."
    }),
    Object.freeze({
      categoryKey: "trustRestrictedAssets",
      label: "Trust / Restricted Assets",
      group: "restrictedPurpose",
      description: "Trust-owned, restricted, pledged, or otherwise limited-access asset balances.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "restricted-asset",
      notes: "Future treatment should account for access restrictions outside PMI."
    }),
    Object.freeze({
      categoryKey: "stockCompensationDeferredCompensation",
      label: "Stock Compensation / Deferred Compensation",
      group: "compensation",
      description: "RSUs, options, deferred compensation, and other employer-linked asset values.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "case-specific",
      notes: "Future library entries may need vesting and forfeiture raw facts."
    }),
    Object.freeze({
      categoryKey: "digitalAssetsCrypto",
      label: "Digital Assets / Crypto",
      group: "alternative",
      description: "Digital assets, cryptocurrency, and similar alternative asset balances.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "alternative-asset",
      notes: "Future treatment may account for volatility, custody, and access risk."
    }),
    Object.freeze({
      categoryKey: "otherCustomAsset",
      label: "Other / Custom Asset",
      group: "custom",
      description: "Advisor-defined asset category for raw asset facts not covered by the default list.",
      defaultPmiSourceKey: null,
      legacySourceKeys: Object.freeze([]),
      hasCurrentPmiSource: false,
      defaultTreatmentBias: "custom",
      notes: "Use for exceptional cases; do not use to reintroduce standard personal belongings as default categories."
    })
  ]);

  const LEGACY_ASSET_SOURCE_ALIASES = Object.freeze({
    cashSavings: Object.freeze({
      categoryKey: "cashAndCashEquivalents",
      note: "Legacy cash/savings scalar source."
    }),
    emergencyFund: Object.freeze({
      categoryKey: "emergencyFund",
      note: "Legacy emergency fund scalar source."
    }),
    brokerageAccounts: Object.freeze({
      categoryKey: "taxableBrokerageInvestments",
      note: "Legacy brokerage account scalar source."
    }),
    retirementAssets: Object.freeze({
      categoryKey: "traditionalRetirementAssets",
      note: "Legacy retirement scalar source; may include mixed traditional, Roth, and other retirement assets."
    }),
    realEstateEquity: Object.freeze({
      categoryKey: "primaryResidenceEquity",
      note: "Legacy real estate equity scalar source; old records cannot distinguish primary residence from other real estate."
    }),
    businessValue: Object.freeze({
      categoryKey: "businessPrivateCompanyValue",
      note: "Legacy business value scalar source."
    })
  });

  const DEFAULT_VISIBLE_ASSET_CATEGORY_KEYS = Object.freeze(
    DEFAULT_ASSET_CATEGORIES.map(function (category) {
      return category.categoryKey;
    })
  );

  // Future searchable asset-library entries should be maintained separately
  // from the default visible categories above.
  const FUTURE_SEARCHABLE_ASSET_LIBRARY_GROUPS = Object.freeze([
    "Cash, deposits, and short-term reserves",
    "Taxable investment accounts",
    "Retirement assets",
    "Annuities",
    "Real estate",
    "Business and private company value",
    "Stock compensation and employer benefits",
    "Education-specific assets",
    "Trusts, estates, and restricted assets",
    "Government, pension, and survivor income-like benefits",
    "Digital and alternative assets",
    "Receivables and contractual rights",
    "Special-case assets",
    "Custom asset types"
  ]);

  lensAnalysis.assetTaxonomy = Object.freeze({
    DEFAULT_ASSET_CATEGORIES,
    DEFAULT_VISIBLE_ASSET_CATEGORY_KEYS,
    LEGACY_ASSET_SOURCE_ALIASES,
    FUTURE_SEARCHABLE_ASSET_LIBRARY_GROUPS
  });
})(window);
