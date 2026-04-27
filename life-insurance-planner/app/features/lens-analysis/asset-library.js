(function (global) {
  const LensApp = global.LensApp || (global.LensApp = {});
  const lensAnalysis = LensApp.lensAnalysis || (LensApp.lensAnalysis = {});

  // Owner: Lens analysis asset library metadata.
  // Purpose: define value-only asset/account types that PMI can add as raw
  // assetRecords[]. Treatment assumptions stay in Analysis Setup.

  const ASSET_LIBRARY_ENTRIES = Object.freeze([
    Object.freeze({
      typeKey: "checkingSavingsAccount",
      label: "Checking / Savings Account",
      categoryKey: "cashAndCashEquivalents",
      group: "Cash, deposits, and short-term reserves",
      description: "Bank checking, savings, or cash management account balance.",
      aliases: Object.freeze(["cash", "bank account", "deposit account", "savings"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "moneyMarketCd",
      label: "Money Market / CD",
      categoryKey: "cashAndCashEquivalents",
      group: "Cash, deposits, and short-term reserves",
      description: "Money market, certificate of deposit, or similar short-term reserve.",
      aliases: Object.freeze(["money market", "cd", "certificate of deposit"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "jointBrokerageAccount",
      label: "Joint Brokerage Account",
      categoryKey: "taxableBrokerageInvestments",
      group: "Taxable investment accounts",
      description: "Joint taxable investment account value.",
      aliases: Object.freeze(["brokerage", "joint investment", "taxable account"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "individualBrokerageAccount",
      label: "Individual Brokerage Account",
      categoryKey: "taxableBrokerageInvestments",
      group: "Taxable investment accounts",
      description: "Individual taxable brokerage or investment account value.",
      aliases: Object.freeze(["brokerage", "investment account", "taxable investment"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "traditional401k",
      label: "Traditional 401(k)",
      categoryKey: "traditionalRetirementAssets",
      group: "Retirement assets",
      description: "Pre-tax employer retirement account balance.",
      aliases: Object.freeze(["401k", "pre tax retirement", "traditional retirement"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "traditionalIra",
      label: "Traditional IRA",
      categoryKey: "traditionalRetirementAssets",
      group: "Retirement assets",
      description: "Traditional IRA or similar pre-tax retirement account balance.",
      aliases: Object.freeze(["ira", "pre tax ira", "traditional retirement"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "rothIra",
      label: "Roth IRA",
      categoryKey: "rothTaxAdvantagedRetirementAssets",
      group: "Retirement assets",
      description: "Roth IRA or Roth retirement account balance.",
      aliases: Object.freeze(["roth", "tax advantaged retirement", "roth retirement"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "qualifiedFixedAnnuity",
      label: "Qualified Fixed Annuity",
      categoryKey: "qualifiedAnnuities",
      group: "Annuities",
      description: "Qualified fixed annuity balance or account value.",
      aliases: Object.freeze(["qualified annuity", "fixed annuity", "retirement annuity"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "nonqualifiedVariableAnnuity",
      label: "Nonqualified Variable Annuity",
      categoryKey: "nonqualifiedAnnuities",
      group: "Annuities",
      description: "Nonqualified variable annuity balance or account value.",
      aliases: Object.freeze(["nonqualified annuity", "variable annuity"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "rentalPropertyEquity",
      label: "Rental Property Equity",
      categoryKey: "otherRealEstateEquity",
      group: "Real estate",
      description: "Estimated net equity in rental or investment real estate.",
      aliases: Object.freeze(["rental", "investment property", "real estate equity"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "vacationHomeEquity",
      label: "Vacation Home Equity",
      categoryKey: "otherRealEstateEquity",
      group: "Real estate",
      description: "Estimated net equity in a vacation or secondary residence.",
      aliases: Object.freeze(["vacation home", "second home", "real estate"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "closelyHeldBusinessValue",
      label: "Closely Held Business Value",
      categoryKey: "businessPrivateCompanyValue",
      group: "Business and private company value",
      description: "Estimated value of closely held business ownership.",
      aliases: Object.freeze(["business", "private company", "closely held company"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "privateCompanyEquity",
      label: "Private Company Equity",
      categoryKey: "businessPrivateCompanyValue",
      group: "Business and private company value",
      description: "Private company ownership or equity interest value.",
      aliases: Object.freeze(["private equity", "company ownership", "business equity"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "vestedRsuValue",
      label: "Vested RSU Value",
      categoryKey: "stockCompensationDeferredCompensation",
      group: "Stock compensation and employer benefits",
      description: "Current value of vested restricted stock units.",
      aliases: Object.freeze(["rsu", "stock compensation", "restricted stock"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "deferredCompensationBalance",
      label: "Deferred Compensation Balance",
      categoryKey: "stockCompensationDeferredCompensation",
      group: "Stock compensation and employer benefits",
      description: "Nonqualified deferred compensation account balance.",
      aliases: Object.freeze(["deferred comp", "employer benefit", "executive compensation"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "plan529Account",
      label: "529 Plan Account",
      categoryKey: "educationSpecificSavings",
      group: "Education-specific assets",
      description: "Education-dedicated 529 plan account value.",
      aliases: Object.freeze(["529", "college savings", "education savings"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "trustOwnedAsset",
      label: "Trust-Owned Asset",
      categoryKey: "trustRestrictedAssets",
      group: "Trusts, estates, and restricted assets",
      description: "Asset owned by a trust or other restricted arrangement.",
      aliases: Object.freeze(["trust", "restricted asset", "estate asset"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "cryptocurrencyWallet",
      label: "Cryptocurrency Wallet",
      categoryKey: "digitalAssetsCrypto",
      group: "Digital and alternative assets",
      description: "Cryptocurrency wallet, exchange account, or digital asset balance.",
      aliases: Object.freeze(["crypto", "digital assets", "bitcoin", "ethereum"]),
      isCustomType: false
    }),
    Object.freeze({
      typeKey: "customAssetAccount",
      label: "Custom Asset",
      categoryKey: "otherCustomAsset",
      group: "Custom asset types",
      description: "Advisor-defined raw asset value not covered by the standard library.",
      aliases: Object.freeze(["custom", "other asset", "misc asset"]),
      isCustomType: true
    })
  ]);

  const ASSET_LIBRARY_GROUPS = Object.freeze(
    ASSET_LIBRARY_ENTRIES.reduce(function (groups, entry) {
      if (entry.group && groups.indexOf(entry.group) === -1) {
        groups.push(entry.group);
      }
      return groups;
    }, [])
  );

  function cloneEntry(entry) {
    return Object.assign({}, entry, {
      aliases: Array.isArray(entry.aliases) ? entry.aliases.slice() : []
    });
  }

  function getAssetLibraryEntries() {
    return ASSET_LIBRARY_ENTRIES.map(cloneEntry);
  }

  function findAssetLibraryEntry(typeKey) {
    const normalizedTypeKey = String(typeKey == null ? "" : typeKey).trim();
    if (!normalizedTypeKey) {
      return null;
    }

    const entry = ASSET_LIBRARY_ENTRIES.find(function (candidate) {
      return candidate.typeKey === normalizedTypeKey;
    });
    return entry ? cloneEntry(entry) : null;
  }

  lensAnalysis.assetLibrary = Object.freeze({
    ASSET_LIBRARY_ENTRIES,
    ASSET_LIBRARY_GROUPS,
    getAssetLibraryEntries,
    findAssetLibraryEntry
  });
})(window);
