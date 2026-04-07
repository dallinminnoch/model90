(function () {
  const WORKFLOW_STEPS = [
    { id: "profile-1", label: "Client Profile 1", path: "profile.html" },
    { id: "profile-2", label: "Client Profile 2", path: "profile-2.html" },
    { id: "profile-3", label: "Client Profile 3", path: "profile-3.html" },
    { id: "estimate", label: "Estimate Need", path: "analysis-estimate.html" },
    { id: "detail", label: "Detailed Analysis", path: "analysis-detail.html" },
    { id: "recommendations", label: "Coverage Options", path: "recommendations.html" },
    { id: "planner", label: "Policy Planner", path: "planner.html" },
    { id: "summary", label: "Summary", path: "summary.html" }
  ];

  const STORAGE_KEYS = {
    profile: "lipPlannerProfile",
    includeDetailed: "lipPlannerIncludeDetailed",
    recommendation: "lipPlannerRecommendation",
    strategy: "lipPlannerStrategy",
    notes: "lipPlannerNotes"
  };

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function formatCurrency(value) {
    const number = Number(value || 0);
    if (!number) {
      return "Value pending";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(number);
  }

  function getBalancedEstimate() {
    if (window.PlannerCalculations?.getBalancedEstimate) {
      return window.PlannerCalculations.getBalancedEstimate();
    }
    return "Your balanced estimated death benefit need will appear here";
  }

  function getCurrentStepIndex(stepId) {
    return WORKFLOW_STEPS.findIndex(function (step) {
      return step.id === stepId;
    });
  }

  function renderWorkflowNav() {
    const navHost = document.getElementById("workflow-nav");
    const currentStep = document.body.dataset.step;
    const currentIndex = getCurrentStepIndex(currentStep);

    if (!navHost || currentIndex < 0) {
      return;
    }

    navHost.className = "workflow-nav";
    navHost.innerHTML = `
      <header class="workflow-header">
        <div class="step-track" style="--step-count:${WORKFLOW_STEPS.length}">
          ${WORKFLOW_STEPS.map(function (step, index) {
            let stateClass = "";
            if (index < currentIndex) {
              stateClass = "is-complete";
            } else if (index === currentIndex) {
              stateClass = "is-current";
            }

            return `
              <a class="step-item ${stateClass}" href="${step.path}">
                <span class="step-number">Step ${index + 1}</span>
                <span class="step-title">${escapeHtml(step.label)}</span>
              </a>
            `;
          }).join("")}
        </div>
      </header>
    `;
  }

  function initializeProfileForms() {
    const form = document.getElementById("client-profile-form");
    if (!form) {
      return;
    }

    const savedProfile = loadJson(STORAGE_KEYS.profile) || {};
    Object.entries(savedProfile).forEach(function ([key, value]) {
      const field = form.elements.namedItem(key);
      if (field && value !== null && value !== undefined) {
        field.value = value;
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const nextProfile = { ...savedProfile, ...Object.fromEntries(formData.entries()) };
      saveJson(STORAGE_KEYS.profile, nextProfile);
      window.location.href = form.dataset.nextPage || "analysis-estimate.html";
    });
  }

  function initializeEstimatePage() {
    const resultValue = document.getElementById("balanced-estimate-value");
    const detailedButton = document.getElementById("view-detailed-analysis");
    const skipButton = document.getElementById("skip-detailed-analysis");

    if (resultValue) {
      resultValue.textContent = getBalancedEstimate();
    }

    if (document.getElementById("estimate-chart-placeholder") && window.PlannerCharts?.renderEstimateNeedPlaceholder) {
      window.PlannerCharts.renderEstimateNeedPlaceholder("estimate-chart-placeholder");
    }

    detailedButton?.addEventListener("click", function () {
      sessionStorage.setItem(STORAGE_KEYS.includeDetailed, "true");
      window.location.href = "analysis-detail.html";
    });

    skipButton?.addEventListener("click", function () {
      sessionStorage.setItem(STORAGE_KEYS.includeDetailed, "false");
      window.location.href = "recommendations.html";
    });
  }

  function initializeRecommendationsPage() {
    const cards = Array.from(document.querySelectorAll("[data-recommendation]"));
    if (!cards.length) {
      return;
    }

    const selected = localStorage.getItem(STORAGE_KEYS.recommendation) || "Balanced Protection";
    cards.forEach(function (card) {
      card.classList.toggle("is-selected", card.dataset.recommendation === selected);
      card.addEventListener("click", function () {
        const value = card.dataset.recommendation || "";
        localStorage.setItem(STORAGE_KEYS.recommendation, value);
        cards.forEach(function (item) {
          item.classList.toggle("is-selected", item === card);
        });
      });
    });

    document.getElementById("to-policy-planner")?.addEventListener("click", function () {
      window.location.href = "planner.html";
    });
  }

  function initializePlannerPage() {
    const cards = Array.from(document.querySelectorAll("[data-strategy]"));
    if (!cards.length) {
      return;
    }

    const selected = localStorage.getItem(STORAGE_KEYS.strategy) || "Hybrid Strategy";
    cards.forEach(function (card) {
      card.classList.toggle("is-selected", card.dataset.strategy === selected);
      card.addEventListener("click", function () {
        const value = card.dataset.strategy || "";
        localStorage.setItem(STORAGE_KEYS.strategy, value);
        cards.forEach(function (item) {
          item.classList.toggle("is-selected", item === card);
        });
      });
    });

    const notesField = document.getElementById("advisor-notes");
    if (notesField) {
      notesField.value = localStorage.getItem(STORAGE_KEYS.notes) || "";
    }

    document.getElementById("to-summary")?.addEventListener("click", function () {
      if (notesField) {
        localStorage.setItem(STORAGE_KEYS.notes, notesField.value);
      }
      window.location.href = "summary.html";
    });
  }

  function initializeSummaryPage() {
    const summaryPage = document.getElementById("summary-page");
    if (!summaryPage) {
      return;
    }

    const profile = loadJson(STORAGE_KEYS.profile) || {};
    const recommendation = localStorage.getItem(STORAGE_KEYS.recommendation) || "Balanced Protection";
    const strategy = localStorage.getItem(STORAGE_KEYS.strategy) || "Hybrid Strategy";
    const notes = localStorage.getItem(STORAGE_KEYS.notes) || "Advisor notes will appear here.";
    const includeDetailed = sessionStorage.getItem(STORAGE_KEYS.includeDetailed) !== "false";

    const familyParts = [];
    if (profile.maritalStatus) {
      familyParts.push(profile.maritalStatus);
    }
    if (profile.dependents) {
      familyParts.push(`${profile.dependents} dependents`);
    }

    setText("summary-client-name", profile.clientName || "Client name pending");
    setText("summary-age-gender", [profile.age, profile.gender].filter(Boolean).join(" | ") || "Pending profile inputs");
    setText("summary-income", formatCurrency(profile.annualIncome));
    setText("summary-family", familyParts.join(" | ") || "Family profile pending");
    setText("summary-balanced-need", getBalancedEstimate());
    setText("summary-detailed-analysis", includeDetailed ? "Detailed analysis included in planning path." : "Detailed analysis was skipped in this planning path.");
    setText("summary-recommendation", recommendation);
    setText("summary-strategy", strategy);
    setText("summary-notes", notes);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.body.dataset.step) {
      return;
    }

    document.body.classList.remove("is-modal-open");
    document.body.style.overflowY = "auto";

    renderWorkflowNav();
    initializeProfileForms();
    initializeEstimatePage();
    initializeRecommendationsPage();
    initializePlannerPage();
    initializeSummaryPage();
  });
})();
