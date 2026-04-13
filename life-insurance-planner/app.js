(function () {
  const STORAGE_KEYS = {
    profile: "lipPlannerProfile",
    includeDetailed: "lipPlannerIncludeDetailed",
    recommendation: "lipPlannerRecommendation",
    strategy: "lipPlannerStrategy",
    notes: "lipPlannerNotes",
    clientStatus: "lensClientStatus",
    clientView: "lensClientView",
    clientViewIntent: "lensClientViewIntent",
    clientItemsShown: "lensClientItemsShown",
    clientItemsShownReset: "lensClientItemsShownReset",
    clientRecords: "lensClientRecords",
    authUsers: "lipPlannerAuthUsers",
    authSession: "lipPlannerAuthSession",
    language: "lensLanguage",
    pendingClientRecords: "lensPendingClientRecords",
    linkedCaseRef: "lensLinkedCaseRef",
    linkedRecordId: "lensLinkedRecordId",
    federalTaxBrackets: "lensFederalTaxBrackets",
    temporaryAnalysisSession: "lensTemporaryAnalysisSession",
    analysisInternalNavigation: "lensAnalysisInternalNavigation"
  };

  const DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS = [
    { rate: "10%", minIncome: "0", maxIncome: "11600" },
    { rate: "12%", minIncome: "11601", maxIncome: "47150" },
    { rate: "22%", minIncome: "47151", maxIncome: "100525" },
    { rate: "24%", minIncome: "100526", maxIncome: "191950" },
    { rate: "32%", minIncome: "191951", maxIncome: "243725" },
    { rate: "35%", minIncome: "243726", maxIncome: "609350" },
    { rate: "37%", minIncome: "609351", maxIncome: "" }
  ];

  const FEDERAL_TAX_BRACKET_FILINGS = [
    "Single",
    "Married Filing Jointly",
    "Married Filing Separately",
    "Head of Household",
    "Qualifying Surviving Spouse"
  ];
  const ADMIN_CREDENTIALS = {
    email: "admin@lens.com",
    password: "admin1001"
  };
  const DEFAULT_CLIENT_RECORDS = [
    {
      id: "cl-80421",
      viewType: "households",
      displayName: "Carter Household",
      lastName: "Carter",
      summary: "Household protection review",
      caseRef: "HH/80421",
      lastReview: "2026-03-10",
      insured: "2",
      source: "Referral",
      statusGroup: "in-review",
      statusLabels: ["Income", "Debt"],
      priority: "high",
      coverageAmount: 1850000,
      coverageGap: 1450000
    },
    {
      id: "cl-80437",
      viewType: "individuals",
      displayName: "Daniel Brooks",
      lastName: "Brooks",
      summary: "Key person coverage update",
      caseRef: "CL/80437",
      lastReview: "2026-03-08",
      insured: "Yes",
      source: "CPA",
      statusGroup: "coverage-placed",
      statusLabels: ["Business", "Estate"],
      priority: "medium",
      coverageAmount: 1200000,
      coverageGap: 780000
    },
    {
      id: "cl-80462",
      viewType: "individuals",
      displayName: "Sophia Nguyen",
      lastName: "Nguyen",
      summary: "Family education funding plan",
      caseRef: "CL/80462",
      lastReview: "2026-03-07",
      insured: "Yes",
      source: "Seminar",
      statusGroup: "prospects",
      statusLabels: ["Education", "Income"],
      priority: "high",
      coverageAmount: 2600000,
      coverageGap: 2100000
    },
    {
      id: "cl-80488",
      viewType: "individuals",
      displayName: "Michael Torres",
      lastName: "Torres",
      summary: "Mortgage and survivor income analysis",
      caseRef: "CL/80488",
      lastReview: "2026-03-05",
      insured: "Yes",
      source: "Website",
      statusGroup: "coverage-placed",
      statusLabels: ["Mortgage", "Needs"],
      priority: "medium",
      coverageAmount: 1350000,
      coverageGap: 920000
    },
    {
      id: "cl-80501",
      viewType: "households",
      displayName: "Mitchell Household",
      lastName: "Mitchell",
      summary: "Coverage review before renewal",
      caseRef: "HH/80501",
      lastReview: "2026-03-02",
      insured: "2",
      source: "Client Referral",
      statusGroup: "closed",
      statusLabels: ["Review", "Retention"],
      priority: "low",
      coverageAmount: 620000,
      coverageGap: 430000
    }
  ];

  const allSteps = [
    { id: "profile-1", label: "Analysis Setup", path: "profile.html" },
    { id: "income-loss", label: "Income Loss Impact", path: "income-loss-impact.html" },
    { id: "estimate", label: "Estimate Need", path: "analysis-estimate.html" },
    { id: "detail", label: "Detailed Analysis", path: "analysis-detail.html" },
    { id: "recommendations", label: "Coverage Options", path: "recommendations.html" },
    { id: "planner", label: "Policy Planner", path: "planner.html" },
    { id: "summary", label: "Summary", path: "summary.html" }
  ];
  const TRANSLATIONS = {
    en: {
      "pageTitle.home": "Life Evaluation & Needs Analysis",
      "pageTitle.lens": "LENS | Life Evaluation & Needs Analysis",
      "pageTitle.clients": "Clients | Advisor Planning Suite",
      "nav.records": "Records",
      "nav.clients": "Clients",
      "nav.financialProducts": "Products",
      "nav.resources": "Resources",
      "search.placeholder": "Search",
      "language.label": "Language",
      "language.english": "English",
      "language.spanish": "Spanish",
      "language.french": "French",
      "account.signIn": "Sign In",
      "account.welcome": "Welcome, {name}",
      "account.helpCenter": "Help Center",
      "account.settings": "Settings",
      "account.accountDetails": "Account Details",
      "account.signOut": "Sign Out",
      "account.adminView": "Admin View",
      "home.banner": "Built by Agents, for Agents",
      "home.eyebrow": "Home",
      "home.openLens": "Open LENS",
      "home.activeModuleText": "Life Evaluation & Needs Analysis is the active planning module currently available in this workspace.",
      "home.activeModuleLabel": "Active Module",
      "product.name": "Life Evaluation & Needs Analysis",
      "home.moduleDescription": "Guide clients through profile intake, need estimation, analysis review, recommendation framing, policy strategy discussion, and a final planning summary.",
      "home.metricWorkflow": "Workflow",
      "home.metricWorkflowValue": "Profile to Summary",
      "home.metricPurpose": "Purpose",
      "home.metricPurposeValue": "Needs-Based Planning",
      "home.metricFormat": "Format",
      "home.metricFormatValue": "Advisor-Facing",
      "home.notesLabel": "Workspace Notes",
      "home.notesText": "Use this home screen as a stable launch point for planning tools rather than dropping directly into a single calculator-like experience.",
      "home.searchLabel": "Search",
      "home.searchText": "The search bar is prepared for future cases, saved plans, internal references, and additional modules.",
      "lens.eyebrow": "Advisor Planning Workflow",
      "lens.subtitle": "A structured advisor tool for estimating life insurance needs and shaping durable protection strategies during client meetings.",
      "lens.copy": "Use a guided workflow to capture client data, evaluate death benefit needs, compare planning approaches, and frame thoughtful coverage recommendations without dropping into carrier-specific quoting.",
      "lens.startPlanning": "Start Planning",
      "lens.metricFocus": "Focus",
      "lens.metricFocusValue": "Needs-Based Planning",
      "lens.metricUseCase": "Use Case",
      "lens.metricUseCaseValue": "Advisor-Led Meetings",
      "clients.heading": "Client Directory",
      "clients.subtitle": "A dedicated space for client records and future case management tools.",
      "clients.helper": "This page is currently a placeholder for future client record workflows.",
      "clients.recordsLabel": "Client Records",
      "clients.mainHeading": "Client directory and saved case files",
      "clients.mainCopy": "This section is ready for future client search, saved plans, case notes, and status tracking. For now it acts as the first records destination in the main navigation.",
      "clients.metricStatus": "Status",
      "clients.metricStatusValue": "Placeholder",
      "clients.metricNextBuild": "Next Build",
      "clients.metricNextBuildValue": "Client List",
      "clients.metricPurposeValue": "Recordkeeping",
      "clients.plannedUseLabel": "Planned Use",
      "clients.plannedUseText": "Use this area later for recently viewed clients, search results, and cross-links into planning workflows.",
      "clients.currentStateLabel": "Current State",
      "clients.currentStateText": "Navigation is in place. Data-backed record management can be added when you are ready."
    },
    es: {
      "pageTitle.home": "Evaluacion de Vida y Analisis de Necesidades",
      "pageTitle.lens": "LENS | Evaluacion de Vida y Analisis de Necesidades",
      "pageTitle.clients": "Clientes | Suite de Planificacion para Asesores",
      "nav.records": "Records",
      "nav.clients": "Clientes",
      "nav.financialProducts": "Products",
      "nav.resources": "Resources",
      "search.placeholder": "Buscar",
      "language.label": "Idioma",
      "language.english": "Ingles",
      "language.spanish": "Espanol",
      "language.french": "Frances",
      "account.signIn": "Iniciar sesion",
      "account.welcome": "Bienvenido, {name}",
      "account.helpCenter": "Centro de ayuda",
      "account.settings": "Configuracion",
      "account.accountDetails": "Detalles de la cuenta",
      "account.signOut": "Cerrar sesion",
      "account.adminView": "Vista de administrador",
      "home.banner": "Creado por agentes, para agentes",
      "home.eyebrow": "Inicio",
      "home.openLens": "Abrir LENS",
      "home.activeModuleText": "Evaluacion de Vida y Analisis de Necesidades es el modulo activo disponible en este espacio de trabajo.",
      "home.activeModuleLabel": "Modulo activo",
      "product.name": "Evaluacion de Vida y Analisis de Necesidades",
      "home.moduleDescription": "Guie a los clientes a traves del perfil, la estimacion de necesidad, la revision del analisis, la recomendacion de cobertura, la estrategia de poliza y el resumen final.",
      "home.metricWorkflow": "Flujo",
      "home.metricWorkflowValue": "Perfil a resumen",
      "home.metricPurpose": "Objetivo",
      "home.metricPurposeValue": "Planificacion basada en necesidades",
      "home.metricFormat": "Formato",
      "home.metricFormatValue": "Orientado al asesor",
      "home.notesLabel": "Notas del espacio de trabajo",
      "home.notesText": "Use esta pantalla principal como punto de partida estable para herramientas de planificacion en lugar de entrar directamente en una sola calculadora.",
      "home.searchLabel": "Busqueda",
      "home.searchText": "La barra de busqueda esta preparada para futuros casos, planes guardados, referencias internas y modulos adicionales.",
      "lens.eyebrow": "Flujo de planificacion del asesor",
      "lens.subtitle": "Una herramienta estructurada para estimar necesidades de seguro de vida y definir estrategias de proteccion durante reuniones con clientes.",
      "lens.copy": "Use un flujo guiado para capturar datos del cliente, evaluar necesidades de beneficio por fallecimiento, comparar enfoques de planificacion y definir recomendaciones sin entrar en cotizaciones por aseguradora.",
      "lens.startPlanning": "Comenzar planificacion",
      "lens.metricFocus": "Enfoque",
      "lens.metricFocusValue": "Planificacion basada en necesidades",
      "lens.metricUseCase": "Caso de uso",
      "lens.metricUseCaseValue": "Reuniones dirigidas por asesores",
      "clients.heading": "Directorio de clientes",
      "clients.subtitle": "Un espacio dedicado a los registros de clientes y futuras herramientas de gestion de casos.",
      "clients.helper": "Esta pagina es actualmente un marcador para futuros flujos de trabajo de registros de clientes.",
      "clients.recordsLabel": "Registros de clientes",
      "clients.mainHeading": "Directorio de clientes y expedientes guardados",
      "clients.mainCopy": "Esta seccion esta lista para futuras busquedas de clientes, planes guardados, notas de casos y seguimiento de estado. Por ahora funciona como el primer destino de registros en la navegacion principal.",
      "clients.metricStatus": "Estado",
      "clients.metricStatusValue": "Marcador",
      "clients.metricNextBuild": "Siguiente desarrollo",
      "clients.metricNextBuildValue": "Lista de clientes",
      "clients.metricPurposeValue": "Mantenimiento de registros",
      "clients.plannedUseLabel": "Uso previsto",
      "clients.plannedUseText": "Use esta area mas adelante para clientes vistos recientemente, resultados de busqueda y enlaces a flujos de planificacion.",
      "clients.currentStateLabel": "Estado actual",
      "clients.currentStateText": "La navegacion ya esta lista. La gestion de registros con datos reales puede agregarse cuando este listo."
    },
    fr: {
      "pageTitle.home": "Evaluation de Vie et Analyse des Besoins",
      "pageTitle.lens": "LENS | Evaluation de Vie et Analyse des Besoins",
      "pageTitle.clients": "Clients | Suite de planification pour conseillers",
      "nav.records": "Records",
      "nav.clients": "Clients",
      "nav.financialProducts": "Products",
      "nav.resources": "Resources",
      "search.placeholder": "Recherche",
      "language.label": "Langue",
      "language.english": "Anglais",
      "language.spanish": "Espagnol",
      "language.french": "Francais",
      "account.signIn": "Se connecter",
      "account.welcome": "Bienvenue, {name}",
      "account.helpCenter": "Centre d'aide",
      "account.settings": "Parametres",
      "account.accountDetails": "Details du compte",
      "account.signOut": "Se deconnecter",
      "account.adminView": "Vue administrateur",
      "home.banner": "Cree par des agents, pour des agents",
      "home.eyebrow": "Accueil",
      "home.openLens": "Ouvrir LENS",
      "home.activeModuleText": "Evaluation de Vie et Analyse des Besoins est le module actif actuellement disponible dans cet espace de travail.",
      "home.activeModuleLabel": "Module actif",
      "product.name": "Evaluation de Vie et Analyse des Besoins",
      "home.moduleDescription": "Guidez les clients a travers le profil, l'estimation du besoin, l'analyse detaillee, la recommandation de couverture, la strategie de police et le resume final.",
      "home.metricWorkflow": "Flux",
      "home.metricWorkflowValue": "Du profil au resume",
      "home.metricPurpose": "Objectif",
      "home.metricPurposeValue": "Planification basee sur les besoins",
      "home.metricFormat": "Format",
      "home.metricFormatValue": "Destine aux conseillers",
      "home.notesLabel": "Notes de l'espace de travail",
      "home.notesText": "Utilisez cet ecran d'accueil comme point de depart stable pour les outils de planification plutot que d'entrer directement dans un seul calculateur.",
      "home.searchLabel": "Recherche",
      "home.searchText": "La barre de recherche est prete pour les futurs dossiers, plans enregistres, references internes et modules supplementaires.",
      "lens.eyebrow": "Flux de planification conseiller",
      "lens.subtitle": "Un outil structure pour estimer les besoins en assurance vie et definir des strategies de protection pendant les reunions clients.",
      "lens.copy": "Utilisez un flux guide pour saisir les donnees client, evaluer les besoins, comparer les approches de planification et formuler des recommandations sans passer par des devis assureur.",
      "lens.startPlanning": "Commencer",
      "lens.metricFocus": "Orientation",
      "lens.metricFocusValue": "Planification basee sur les besoins",
      "lens.metricUseCase": "Cas d'usage",
      "lens.metricUseCaseValue": "Reunions menees par le conseiller",
      "clients.heading": "Repertoire clients",
      "clients.subtitle": "Un espace dedie aux dossiers clients et aux futurs outils de gestion de cas.",
      "clients.helper": "Cette page est actuellement un espace reserve pour les futurs flux de gestion des dossiers clients.",
      "clients.recordsLabel": "Dossiers clients",
      "clients.mainHeading": "Repertoire clients et dossiers enregistres",
      "clients.mainCopy": "Cette section est prete pour la recherche client, les plans enregistres, les notes de dossier et le suivi du statut. Pour l'instant, elle sert de premier point d'entree des dossiers dans la navigation principale.",
      "clients.metricStatus": "Statut",
      "clients.metricStatusValue": "Espace reserve",
      "clients.metricNextBuild": "Prochaine etape",
      "clients.metricNextBuildValue": "Liste des clients",
      "clients.metricPurposeValue": "Tenue de dossiers",
      "clients.plannedUseLabel": "Usage prevu",
      "clients.plannedUseText": "Utilisez cet espace plus tard pour les clients recents, les resultats de recherche et les liens vers les flux de planification.",
      "clients.currentStateLabel": "Etat actuel",
      "clients.currentStateText": "La navigation est en place. La gestion des dossiers avec donnees reelles pourra etre ajoutee plus tard."
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    function safeInitialize(label, initializer) {
      try {
        initializer();
      } catch (error) {
        console.error(`[LENS init] ${label} failed`, error);
      }
    }

    if (document.body?.dataset?.step) {
      document.body.classList.remove("is-modal-open");
      document.body.style.overflowY = "auto";
    }

    safeInitialize("homepage", initializeHomepage);
    safeInitialize("auth-page", initializeAuthPage);
    safeInitialize("admin-portal", initializeAdminPortal);
    safeInitialize("workflow-nav", initializeWorkflowNav);
    safeInitialize("return-home", initializeReturnHomeButton);
    safeInitialize("language-selector", initializeLanguageSelector);
    safeInitialize("translations", applyTranslations);
    safeInitialize("account-profile", initializeAccountProfile);
    safeInitialize("profile-form", initializeProfileForm);
    safeInitialize("estimate-page", initializeEstimatePage);
    safeInitialize("recommendation-selection", initializeRecommendationSelection);
    safeInitialize("strategy-selection", initializeStrategySelection);
    safeInitialize("summary-page", initializeSummaryPage);
    safeInitialize("notes-sync", initializeNotesSync);
    safeInitialize("client-creation-form", initializeClientCreationForm);
    safeInitialize("survivorship-adjustments", initializeSurvivorshipAdjustments);
    safeInitialize("client-directory", initializeClientDirectory);
    safeInitialize("client-detail-page", initializeClientDetailPage);
    safeInitialize("client-directory-nav-links", initializeClientDirectoryNavLinks);
  });

  function initializeLanguageSelector() {
    const slots = document.querySelectorAll("[data-language-slot]");
    if (!slots.length) {
      return;
    }

    const currentLanguage = getCurrentLanguage();
    const languageIconPath = window.location.pathname.includes("/pages/")
      ? "../Images/Untitled design.png"
      : "Images/Untitled design.png";

    slots.forEach((slot) => {
      slot.innerHTML = `
        <div class="language-dropdown">
          <button class="language-trigger" type="button" aria-label="${translate("language.label")}">
            <img class="language-icon-image" src="${languageIconPath}" alt="" aria-hidden="true">
          </button>
          <div class="language-dropdown-menu">
            <button class="language-menu-item ${currentLanguage === "en" ? "is-active" : ""}" type="button" data-language-option="en">${translate("language.english")}</button>
            <button class="language-menu-item ${currentLanguage === "es" ? "is-active" : ""}" type="button" data-language-option="es">${translate("language.spanish")}</button>
            <button class="language-menu-item ${currentLanguage === "fr" ? "is-active" : ""}" type="button" data-language-option="fr">${translate("language.french")}</button>
          </div>
        </div>
      `;
    });

    document.querySelectorAll("[data-language-option]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEYS.language, button.dataset.languageOption);
        window.location.reload();
      });
    });
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = translate(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      element.setAttribute("placeholder", translate(key));
    });
  }

  function initializeHomepage() {
    const startPlanningButton = document.getElementById("start-planning");

    if (!startPlanningButton) {
      return;
    }

    startPlanningButton.addEventListener("click", () => {
      sessionStorage.removeItem(STORAGE_KEYS.includeDetailed);
    });
  }

  function initializeAuthPage() {
    const form = document.getElementById("auth-form");

    if (!form) {
      return;
    }

    if (form.dataset.localAuth === "true") {
      return;
    }

    const feedback = document.getElementById("auth-feedback");
    const submitButton = document.getElementById("auth-submit-button");
    const modeButtons = document.querySelectorAll("[data-auth-mode]");
    const registerFieldsHost = document.getElementById("auth-register-fields");
    const modeField = form.querySelector("[name='authMode']");
    let currentMode = "signin";

    updateAuthMode(currentMode, modeButtons, registerFieldsHost, submitButton, feedback, modeField);

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentMode = button.dataset.authMode;
        updateAuthMode(currentMode, modeButtons, registerFieldsHost, submitButton, feedback, modeField);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      currentMode = modeField?.value || currentMode;
      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim().toLowerCase();
      const password = String(formData.get("password") || "").trim();
      const users = loadJson(STORAGE_KEYS.authUsers) || [];

      if (!email || !password) {
        setAuthFeedback(feedback, "Enter your email and password.");
        return;
      }

      if (currentMode === "register") {
        if (!name) {
          setAuthFeedback(feedback, "Enter your name to create an account.");
          return;
        }

        if (email === ADMIN_CREDENTIALS.email) {
          setAuthFeedback(feedback, "That email is reserved.");
          return;
        }

        const existingUser = users.find((user) => user.email === email);
        if (existingUser) {
          setAuthFeedback(feedback, "An account with that email already exists.");
          return;
        }

        const newUser = { name, email, password, status: "active" };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.authUsers, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify({ name, email, role: "user" }));
        window.location.href = "../index.html";
        return;
      }

      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify({
          name: "Lens Admin",
          email: ADMIN_CREDENTIALS.email,
          role: "admin"
        }));
        window.location.href = "../index.html";
        return;
      }

      const disabledUser = users.find((user) => {
        const status = user.status || "active";
        return user.email === email && user.password === password && status !== "active";
      });

      if (disabledUser) {
        setAuthFeedback(feedback, "This account has been disabled. Contact an administrator.");
        return;
      }

      const matchedUser = users.find((user) => {
        const status = user.status || "active";
        return user.email === email && user.password === password && status === "active";
      });

      if (!matchedUser) {
        if (email === ADMIN_CREDENTIALS.email) {
          setAuthFeedback(feedback, "Admin credentials were not accepted. Use the Sign In tab and enter the exact admin password.");
        } else {
          setAuthFeedback(feedback, "We could not match that email and password.");
        }
        return;
      }

      localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify({
        name: matchedUser.name,
        email: matchedUser.email,
        role: "user"
      }));
      window.location.href = "../index.html";
    });
  }

  function initializeAdminPortal() {
    const adminPage = document.getElementById("admin-accounts-page");

    if (!adminPage) {
      return;
    }

    const session = loadJson(STORAGE_KEYS.authSession);
    if (session?.role !== "admin") {
      window.location.href = "sign-in.html";
      return;
    }

    renderAdminAccounts();

    const signOutButton = document.getElementById("admin-sign-out");
    if (signOutButton) {
      signOutButton.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEYS.authSession);
        window.location.href = "sign-in.html";
      });
    }

    const accountsHost = document.getElementById("admin-accounts-list");
    if (accountsHost) {
      accountsHost.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-admin-action]");
        if (!actionButton) {
          return;
        }

        const action = actionButton.dataset.adminAction;
        const email = actionButton.dataset.email;
        updateManagedAccount(email, action);
      });
    }

  }

  function renderAdminAccounts() {
    const users = getManagedUsers();
    const accountsHost = document.getElementById("admin-accounts-list");
    const countHost = document.getElementById("admin-account-count");
    const activeCountHost = document.getElementById("admin-active-count");

    if (countHost) {
      countHost.textContent = String(users.length);
    }

    if (activeCountHost) {
      activeCountHost.textContent = String(users.filter((user) => (user.status || "active") === "active").length);
    }

    if (!accountsHost) {
      return;
    }

    if (!users.length) {
      accountsHost.innerHTML = `
        <div class="admin-empty-state">
          <h3>No registered accounts</h3>
          <p class="panel-copy">User accounts will appear here after registration.</p>
        </div>
      `;
      return;
    }

    accountsHost.innerHTML = users.map((user) => {
      const status = user.status || "active";
      const toggleAction = status === "active" ? "disable" : "enable";
      const toggleLabel = status === "active" ? "Disable" : "Enable";

      return `
        <article class="admin-account-card">
          <div class="admin-account-main">
            <div class="admin-account-name">${user.name}</div>
            <div class="admin-account-email">${user.email}</div>
          </div>
          <div class="admin-account-meta">
            <span class="admin-status-badge ${status === "active" ? "is-active" : "is-disabled"}">${status}</span>
            <div class="admin-account-actions">
              <button class="admin-action-button" type="button" data-admin-action="${toggleAction}" data-email="${user.email}">${toggleLabel}</button>
              <button class="admin-action-button is-danger" type="button" data-admin-action="delete" data-email="${user.email}">Delete</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateManagedAccount(email, action) {
    const users = getManagedUsers();
    const nextUsers = users
      .map((user) => {
        if (user.email !== email) {
          return user;
        }

        if (action === "enable") {
          return { ...user, status: "active" };
        }

        if (action === "disable") {
          return { ...user, status: "disabled" };
        }

        return user;
      })
      .filter((user) => !(action === "delete" && user.email === email));

    localStorage.setItem(STORAGE_KEYS.authUsers, JSON.stringify(nextUsers));

    const session = loadJson(STORAGE_KEYS.authSession);
    if (session?.email === email && action !== "enable") {
      localStorage.removeItem(STORAGE_KEYS.authSession);
    }

    renderAdminAccounts();
  }

  function getManagedUsers() {
    const users = loadJson(STORAGE_KEYS.authUsers) || [];

    return users
      .filter((user) => user.email !== ADMIN_CREDENTIALS.email)
      .map((user) => ({
        ...user,
        status: user.status || "active"
      }));
  }

  function normalizeFederalTaxBracketRow(row) {
    if (typeof row === "string") {
      const rate = String(row || "").trim();
      return rate ? { rate, minIncome: "", maxIncome: "" } : null;
    }

    if (!row || typeof row !== "object") {
      return null;
    }

    const rate = String(row.rate || row.percentage || "").trim();
    const minIncome = String(row.minIncome || row.rangeStart || "").trim();
    const maxIncome = String(row.maxIncome || row.rangeEnd || "").trim();

    if (!rate) {
      return null;
    }

    return { rate, minIncome, maxIncome };
  }

  function buildDefaultFederalTaxBracketConfig() {
    return {
      "Single": DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS.map((row) => ({ ...row })),
      "Married Filing Jointly": DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS.map((row) => ({ ...row })),
      "Married Filing Separately": DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS.map((row) => ({ ...row })),
      "Head of Household": DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS.map((row) => ({ ...row })),
      "Qualifying Surviving Spouse": DEFAULT_SINGLE_FEDERAL_TAX_BRACKETS.map((row) => ({ ...row }))
    };
  }

  function getFederalTaxBracketConfig() {
    const stored = loadJson(STORAGE_KEYS.federalTaxBrackets);
    const defaults = buildDefaultFederalTaxBracketConfig();

    if (Array.isArray(stored)) {
      const normalizedRows = stored.map(normalizeFederalTaxBracketRow).filter(Boolean);
      defaults.Single = normalizedRows.length ? normalizedRows : defaults.Single;
      return defaults;
    }

    if (!stored || typeof stored !== "object") {
      return defaults;
    }

    FEDERAL_TAX_BRACKET_FILINGS.forEach((filingStatus) => {
      const rows = Array.isArray(stored[filingStatus]) ? stored[filingStatus] : [];
      const normalizedRows = rows.map(normalizeFederalTaxBracketRow).filter(Boolean);
      if (normalizedRows.length) {
        defaults[filingStatus] = normalizedRows;
      }
    });

    return defaults;
  }

  function getFederalTaxBracketOptions(filingStatus) {
    const config = getFederalTaxBracketConfig();
    const normalizedStatus = String(filingStatus || "").trim();

    return (config[normalizedStatus] || config.Single || [])
      .map(normalizeFederalTaxBracketRow)
      .filter(Boolean);
  }

  function updateAuthMode(mode, modeButtons, registerFieldsHost, submitButton, feedback, modeField) {
    modeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authMode === mode);
    });

    if (modeField) {
      modeField.value = mode;
    }

    if (registerFieldsHost) {
      if (mode === "register") {
        registerFieldsHost.innerHTML = `
          <div class="field-group auth-register-only">
            <label for="auth-name">Name</label>
            <input id="auth-name" name="name" type="text" placeholder="Advisor name" required>
          </div>
        `;
      } else {
        registerFieldsHost.innerHTML = "";
      }
    }

    submitButton.textContent = mode === "register" ? "Create Account" : "Sign In";
    setAuthFeedback(feedback, "");
  }

  function setAuthFeedback(element, message) {
    if (!element) {
      return;
    }

    element.textContent = message;
  }

  function setFormFeedback(element, message) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.hidden = !message;
  }

  function initializeAccountProfile() {
    const accountSlots = document.querySelectorAll("[data-account-slot]");
    const session = loadJson(STORAGE_KEYS.authSession);

    accountSlots.forEach((slot) => {
      if (session?.name) {
        slot.innerHTML = renderAccountProfile(session, "account-profile");
      } else {
        const prefix = getPathPrefix();
        slot.innerHTML = renderSignedOutAccount(prefix);
      }
    });

    document.querySelectorAll("[data-sign-out]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        performSignOut();
      });
    });

    bindAccountDropdowns();
  }

  function renderAccountProfile(session, className) {
    const firstName = getFirstName(session.name);
    const prefix = getPathPrefix();
    const adminViewItem = session.role === "admin"
      ? `<a class="account-menu-item account-menu-item-link" href="${prefix}pages/admin-accounts.html">${translate("account.adminView")}</a>`
      : "";

    return `
      <div class="account-dropdown">
        <button class="${className} account-dropdown-toggle" type="button">
          <span class="account-icon" aria-hidden="true">
            <span class="account-icon-head"></span>
            <span class="account-icon-body"></span>
          </span>
          <span class="sr-only">Open account menu for ${firstName}</span>
        </button>
        <div class="account-dropdown-menu">
          <div class="account-menu-section">
            <span class="account-menu-welcome">${translate("account.welcome", { name: firstName })}</span>
          </div>
          <div class="account-menu-divider"></div>
          <div class="account-menu-section">
            <button class="account-menu-item" type="button">${translate("account.helpCenter")}</button>
            <button class="account-menu-item" type="button">${translate("account.settings")}</button>
            ${adminViewItem}
          </div>
          <div class="account-menu-divider"></div>
          <div class="account-menu-section">
            <button class="account-menu-item account-menu-item-danger" type="button" data-sign-out>${translate("account.signOut")}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSignedOutAccount(prefix) {
    return `
      <div class="account-dropdown">
        <a class="account-profile account-dropdown-toggle account-profile-signed-out" href="${prefix}pages/sign-in.html">
          <span class="account-icon" aria-hidden="true">
            <span class="account-icon-head"></span>
            <span class="account-icon-body"></span>
          </span>
          <span class="sr-only">Open sign in menu</span>
        </a>
        <div class="account-dropdown-menu">
          <div class="account-menu-section">
            <a class="account-menu-item account-menu-item-link" href="${prefix}pages/sign-in.html">${translate("account.signIn")}</a>
          </div>
          <div class="account-menu-divider"></div>
          <div class="account-menu-section">
            <button class="account-menu-item" type="button">${translate("account.helpCenter")}</button>
            <button class="account-menu-item" type="button">${translate("account.settings")}</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindAccountDropdowns() {
    document.querySelectorAll(".account-dropdown").forEach((dropdown) => {
      let closeTimer = null;

      const openDropdown = () => {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }

        dropdown.classList.add("is-open");
      };

      const closeDropdown = () => {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
        }

        closeTimer = window.setTimeout(() => {
          dropdown.classList.remove("is-open");
          closeTimer = null;
        }, 180);
      };

      dropdown.addEventListener("mouseenter", openDropdown);
      dropdown.addEventListener("mouseleave", closeDropdown);
      dropdown.addEventListener("focusin", openDropdown);
      dropdown.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!dropdown.contains(document.activeElement)) {
            dropdown.classList.remove("is-open");
          }
        }, 0);
      });
    });
  }

  function initializeWorkflowNav() {
    const navHost = document.getElementById("workflow-nav");
    const currentStep = document.body.dataset.step;

    if (!navHost || !currentStep) {
      return;
    }

    if (currentStep === "detail") {
      sessionStorage.setItem(STORAGE_KEYS.includeDetailed, "true");
    }

    const steps = getActiveSteps(currentStep);
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    const currentNumber = currentIndex >= 0 ? currentIndex + 1 : 1;

    navHost.className = "workflow-nav";
    navHost.innerHTML = `
      <header class="workflow-header">
        <div class="step-track" style="--step-count:${steps.length}">
          ${steps.map((step, index) => renderStep(step, index, currentIndex)).join("")}
        </div>
      </header>
    `;

  }

  function initializeReturnHomeButton() {
    const isHomePage = document.body.classList.contains("app-home");

    if (isHomePage) {
      return;
    }

    const button = document.createElement("a");
    button.href = "../index.html";
    button.className = "return-home-button";
    button.textContent = "Return to Home";
    document.body.appendChild(button);
  }

  function getPathPrefix() {
    return window.location.pathname.includes("/pages/") ? "../" : "";
  }

  function renderStep(step, index, currentIndex) {
    let stateClass = "";

    if (index < currentIndex) {
      stateClass = "is-complete";
    } else if (index === currentIndex) {
      stateClass = "is-current";
    }

    return `
      <a class="step-item ${stateClass}" href="${step.path}">
        <span class="step-number">${index + 1}</span>
        <span class="step-title">${step.label}</span>
      </a>
    `;
  }

  function getActiveSteps(currentStep) {
    return allSteps;
  }

  function initializeProfileForm() {
    const form = document.getElementById("client-profile-form");

    if (!form) {
      return;
    }

    populateForm(form, loadJson(STORAGE_KEYS.profile));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const existingProfile = loadJson(STORAGE_KEYS.profile) || {};
      const profile = { ...existingProfile, ...Object.fromEntries(formData.entries()) };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));

      const nextPage = form.dataset.nextPage || "analysis-estimate.html";
      window.location.href = nextPage;
    });
  }

  function initializeEstimatePage() {
    const resultValue = document.getElementById("balanced-estimate-value");
    const viewDetailedButton = document.getElementById("view-detailed-analysis");
    const skipDetailedButton = document.getElementById("skip-detailed-analysis");

    if (resultValue) {
      resultValue.textContent = window.PlannerCalculations.getBalancedEstimate();
    }

    if (document.getElementById("estimate-chart-placeholder")) {
      window.PlannerCharts.renderEstimateNeedPlaceholder("estimate-chart-placeholder");
    }

    if (viewDetailedButton) {
      viewDetailedButton.addEventListener("click", () => {
        sessionStorage.setItem(STORAGE_KEYS.includeDetailed, "true");
        window.location.href = "analysis-detail.html";
      });
    }

    if (skipDetailedButton) {
      skipDetailedButton.addEventListener("click", () => {
        sessionStorage.setItem(STORAGE_KEYS.includeDetailed, "false");
        window.location.href = "recommendations.html";
      });
    }
  }

  function initializeRecommendationSelection() {
    const cards = document.querySelectorAll("[data-recommendation]");

    if (!cards.length) {
      return;
    }

    const savedRecommendation = localStorage.getItem(STORAGE_KEYS.recommendation) || "Balanced Protection";
    localStorage.setItem(STORAGE_KEYS.recommendation, savedRecommendation);
    setSelectedCard(cards, savedRecommendation, "recommendation");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const value = card.dataset.recommendation;
        localStorage.setItem(STORAGE_KEYS.recommendation, value);
        setSelectedCard(cards, value, "recommendation");
      });
    });

    const continueButton = document.getElementById("to-policy-planner");
    if (continueButton) {
      continueButton.addEventListener("click", () => {
        window.location.href = "planner.html";
      });
    }
  }

  function initializeStrategySelection() {
    const cards = document.querySelectorAll("[data-strategy]");

    if (!cards.length) {
      return;
    }

    const savedStrategy = localStorage.getItem(STORAGE_KEYS.strategy) || "Hybrid Strategy";
    localStorage.setItem(STORAGE_KEYS.strategy, savedStrategy);
    setSelectedCard(cards, savedStrategy, "strategy");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const value = card.dataset.strategy;
        localStorage.setItem(STORAGE_KEYS.strategy, value);
        setSelectedCard(cards, value, "strategy");
      });
    });

    const continueButton = document.getElementById("to-summary");
    if (continueButton) {
      continueButton.addEventListener("click", () => {
        const notesField = document.getElementById("advisor-notes");
        if (notesField) {
          localStorage.setItem(STORAGE_KEYS.notes, notesField.value);
        }
        window.location.href = "summary.html";
      });
    }
  }

  function setSelectedCard(cards, selectedValue, type) {
    cards.forEach((card) => {
      const cardValue = type === "recommendation" ? card.dataset.recommendation : card.dataset.strategy;
      card.classList.toggle("is-selected", cardValue === selectedValue);
    });
  }

  function initializeSummaryPage() {
    const summaryPage = document.getElementById("summary-page");

    if (!summaryPage) {
      return;
    }

    const profile = loadJson(STORAGE_KEYS.profile);
    const recommendation = localStorage.getItem(STORAGE_KEYS.recommendation) || "Balanced Protection";
    const strategy = localStorage.getItem(STORAGE_KEYS.strategy) || "Hybrid Strategy";
    const notes = localStorage.getItem(STORAGE_KEYS.notes) || "Advisor notes will appear here.";
    const includeDetailed = sessionStorage.getItem(STORAGE_KEYS.includeDetailed) !== "false";

    setText("summary-client-name", profile?.clientName || "Client name pending");
    setText("summary-age-gender", buildInlineValue(profile?.age, profile?.gender));
    setText("summary-income", formatCurrency(profile?.annualIncome));
    setText("summary-family", buildFamilySummary(profile || {}));
    setText("summary-balanced-need", window.PlannerCalculations.getBalancedEstimate());
    setText("summary-detailed-analysis", includeDetailed ? "DIME, Needs Analysis, and Human Life Value placeholders included." : "Detailed Analysis step was skipped in this planning path.");
    setText("summary-recommendation", recommendation);
    setText("summary-strategy", strategy);
    setText("summary-notes", notes);
  }

  function initializeNotesSync() {
    const notesField = document.getElementById("advisor-notes");

    if (!notesField) {
      return;
    }

    notesField.value = localStorage.getItem(STORAGE_KEYS.notes) || "";
    notesField.addEventListener("input", () => {
      localStorage.setItem(STORAGE_KEYS.notes, notesField.value);
    });
  }

  function initializeClientCreationForm() {
    const form = document.getElementById("client-creation-form");
    const feedback = document.getElementById("client-creation-feedback");
    const dateOfBirthField = form?.querySelector("[data-date-of-birth]");
    const ageField = form?.querySelector("[data-age-field]");
    const advisorNameField = form?.querySelector("[data-advisor-name]");
    const householdIdField = form?.querySelector("[data-household-id]");
    const createdDateField = form?.querySelector("[data-created-date]");
    const lastUpdatedDateField = form?.querySelector("[data-last-updated-date]");
    const phoneNumberField = form?.querySelector("#phone-number");
    const assignmentModeField = form?.querySelector("[data-profile-assignment-mode]");
    const assignmentNameField = form?.querySelector("[data-profile-assignment-name]");
    const assignmentTargetIdField = form?.querySelector("[data-profile-assignment-target-id]");
    const assignmentTargetTypeField = form?.querySelector("[data-profile-assignment-target-type]");
    const dependentFields = form?.querySelector("[data-profile-dependent-fields]");
    const searchHouseholdsButton = form?.querySelector("[data-search-households]");
    const searchCompaniesButton = form?.querySelector("[data-search-companies]");
    const searchModal = document.querySelector("[data-profile-search-modal]");
    const searchModalTitle = document.querySelector("[data-profile-search-title]");
    const searchModalInput = document.querySelector("[data-profile-search-input]");
    const searchModalResults = document.querySelector("[data-profile-search-results]");
    const searchModalCloseButtons = document.querySelectorAll("[data-profile-search-close]");
    let activeSearchType = "";

    if (!form) {
      return;
    }

    const currentSession = getCurrentSession();
    const today = formatDateInputValue(new Date());

    if (advisorNameField && !advisorNameField.value) {
      advisorNameField.value = currentSession?.name || "";
    }

    if (createdDateField && !createdDateField.value) {
      createdDateField.value = today;
    }

    if (lastUpdatedDateField && !lastUpdatedDateField.value) {
      lastUpdatedDateField.value = today;
    }

    if (householdIdField && !householdIdField.value) {
      householdIdField.value = "Assigned on save";
    }

    function syncAgeField() {
      if (!ageField) {
        return;
      }

      const birthDateValue = String(dateOfBirthField?.value || "").trim();
      ageField.value = birthDateValue ? String(calculateAgeFromDate(birthDateValue)) : "";
    }

    function syncPhoneNumberField() {
      if (!phoneNumberField) {
        return;
      }

      phoneNumberField.value = formatPhoneNumberInput(phoneNumberField.value);
    }

    function getAssignmentKind(mode) {
      if (mode.endsWith("household")) {
        return "household";
      }
      if (mode.endsWith("company")) {
        return "company";
      }
      return "";
    }

    function getViewTypeForKind(kind) {
      return kind === "company" ? "companies" : "households";
    }

    function getAssignmentRecords(kind) {
      const viewType = getViewTypeForKind(kind);
      return getClientRecords()
        .filter((record) => record.viewType === viewType)
        .sort((first, second) => first.displayName.localeCompare(second.displayName));
    }

    function syncAssignmentNameState() {
      const mode = String(assignmentModeField?.value || "");
      const isCreate = mode.startsWith("create-");
      const isExisting = mode.startsWith("existing-");
      const kind = getAssignmentKind(mode);

      if (!assignmentNameField) {
        return;
      }

      assignmentNameField.disabled = !mode;
      assignmentNameField.readOnly = isExisting || !mode;

      if (!mode) {
        assignmentNameField.value = "";
        assignmentNameField.placeholder = "Please select to continue";
      } else if (isCreate && kind === "household") {
        assignmentNameField.placeholder = "Enter new household name";
      } else if (isCreate && kind === "company") {
        assignmentNameField.placeholder = "Enter new company profile name";
      } else if (isExisting && kind === "household") {
        assignmentNameField.placeholder = "Select an existing household";
      } else if (isExisting && kind === "company") {
        assignmentNameField.placeholder = "Select an existing company profile";
      }
    }

    function hasUnlockedAssignment() {
      const mode = String(assignmentModeField?.value || "");
      if (!mode) {
        return false;
      }

      if (mode.startsWith("existing-")) {
        return Boolean(String(assignmentTargetIdField?.value || "").trim());
      }

      return Boolean(String(assignmentNameField?.value || "").trim());
    }

    function syncDependentFieldset() {
      if (dependentFields) {
        dependentFields.disabled = !hasUnlockedAssignment();
      }
      syncHouseholdIdPreview();
    }

    function syncAssignmentControls() {
      const mode = String(assignmentModeField?.value || "");
      const previousKind = String(assignmentTargetTypeField?.value || "");
      const kind = getAssignmentKind(mode);
      const isExistingHousehold = mode === "existing-household";
      const isExistingCompany = mode === "existing-company";

      if (searchHouseholdsButton) {
        searchHouseholdsButton.disabled = !isExistingHousehold;
      }
      if (searchCompaniesButton) {
        searchCompaniesButton.disabled = !isExistingCompany;
      }

      if (!mode) {
        if (assignmentTargetIdField) {
          assignmentTargetIdField.value = "";
        }
        if (assignmentTargetTypeField) {
          assignmentTargetTypeField.value = "";
        }
        if (assignmentNameField) {
          assignmentNameField.value = "";
        }
      } else if (assignmentTargetTypeField) {
        if (previousKind && previousKind !== kind && assignmentNameField) {
          assignmentNameField.value = "";
        }
        if (previousKind && previousKind !== kind && assignmentTargetIdField) {
          assignmentTargetIdField.value = "";
        }
        assignmentTargetTypeField.value = kind;
      }

      if (mode.startsWith("create-")) {
        if (assignmentTargetIdField) {
          assignmentTargetIdField.value = "";
        }
      } else if (mode.startsWith("existing-")) {
        if (assignmentNameField && assignmentTargetIdField && !assignmentTargetIdField.value) {
          assignmentNameField.value = "";
        }
      }

      syncAssignmentNameState();
      syncDependentFieldset();
    }

    function syncHouseholdIdPreview() {
      if (!householdIdField) {
        return;
      }

      const mode = String(assignmentModeField?.value || "");
      if (mode.startsWith("existing-")) {
        householdIdField.value = String(assignmentTargetIdField?.value || "").trim() || "Select an existing profile";
        return;
      }

      if (mode.startsWith("create-")) {
        householdIdField.value = "Generated on save";
        return;
      }

      householdIdField.value = "Assigned on save";
    }

    function closeSearchModal() {
      if (searchModal) {
        searchModal.hidden = true;
      }
      activeSearchType = "";
      if (searchModalInput) {
        searchModalInput.value = "";
      }
    }

    function renderSearchResults() {
      if (!searchModalResults) {
        return;
      }

      const records = activeSearchType ? getAssignmentRecords(activeSearchType) : [];
      const query = String(searchModalInput?.value || "").trim().toLowerCase();
      const filteredRecords = query
        ? records.filter((record) => String(record.displayName || "").toLowerCase().includes(query))
        : records;

      searchModalResults.innerHTML = "";

      if (!filteredRecords.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "profile-search-results-empty";
          emptyState.textContent = activeSearchType === "company"
            ? "No business profiles found."
            : "No households found.";
        searchModalResults.appendChild(emptyState);
        return;
      }

      filteredRecords.forEach((record) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "profile-search-result-button";
        button.textContent = record.displayName;
        button.addEventListener("click", () => {
          if (assignmentTargetIdField) {
            assignmentTargetIdField.value = record.id;
          }
          if (assignmentTargetTypeField) {
            assignmentTargetTypeField.value = activeSearchType;
          }
          if (assignmentNameField) {
            assignmentNameField.value = record.displayName;
          }
          closeSearchModal();
          syncDependentFieldset();
          setFormFeedback(feedback, "");
        });
        searchModalResults.appendChild(button);
      });
    }

    function openSearchModal(kind) {
      activeSearchType = kind;
      if (searchModalTitle) {
          searchModalTitle.textContent = kind === "company" ? "Search Business Profiles" : "Search Existing Households";
      }
      if (searchModalInput) {
        searchModalInput.value = "";
      }
      renderSearchResults();
      if (searchModal) {
        searchModal.hidden = false;
      }
      window.setTimeout(() => {
        searchModalInput?.focus();
      }, 20);
    }

    syncAssignmentControls();
    syncAgeField();

    assignmentModeField?.addEventListener("change", () => {
      if (assignmentTargetIdField) {
        assignmentTargetIdField.value = "";
      }
      if (assignmentTargetTypeField) {
        assignmentTargetTypeField.value = "";
      }
      if (assignmentNameField) {
        assignmentNameField.value = "";
      }
      syncAssignmentControls();
      setFormFeedback(feedback, "");
    });
    assignmentNameField?.addEventListener("input", () => {
      if (String(assignmentModeField?.value || "").startsWith("create-")) {
        syncDependentFieldset();
        setFormFeedback(feedback, "");
      }
    });
    searchHouseholdsButton?.addEventListener("click", () => {
      if (!searchHouseholdsButton.disabled) {
        openSearchModal("household");
      }
    });
    searchCompaniesButton?.addEventListener("click", () => {
      if (!searchCompaniesButton.disabled) {
        openSearchModal("company");
      }
    });
    searchModalInput?.addEventListener("input", renderSearchResults);
    searchModalCloseButtons.forEach((button) => {
      button.addEventListener("click", closeSearchModal);
    });
    dateOfBirthField?.addEventListener("input", syncAgeField);
    dateOfBirthField?.addEventListener("change", syncAgeField);
    phoneNumberField?.addEventListener("input", syncPhoneNumberField);
    phoneNumberField?.addEventListener("blur", syncPhoneNumberField);

    form.addEventListener("invalid", (event) => {
      const field = event.target;
      if (!field || !field.id) {
        return;
      }

      const label = form.querySelector(`label[for="${field.id}"]`);
      setFormFeedback(feedback, `Complete ${label?.textContent || "all required fields"} before saving.`);
    }, true);

    form.addEventListener("input", () => {
      setFormFeedback(feedback, "");
    });

    form.addEventListener("change", () => {
      setFormFeedback(feedback, "");
    });

    if (form.dataset.localClientSave !== "true") {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        saveClientCreationForm(form, feedback);
      });
    }
  }

  function initializeClientDirectory() {
    const letterButtons = document.querySelectorAll("[data-client-letter]");
    const rowsHost = document.getElementById("client-table-rows");
    const emptyState = document.getElementById("client-empty-state");
    const searchField = document.querySelector(".client-table-search input");
    const exportDropdown = document.querySelector("[data-export-dropdown]");
    const exportButton = document.querySelector("[data-export-button]");
    const exportOptions = document.querySelectorAll("[data-export-action]");
    const addClientButton = document.querySelector("[data-add-client-button]");
    const viewButtons = document.querySelectorAll("[data-client-view]");
    const statusButtons = document.querySelectorAll("[data-client-status]");
    const itemsDropdown = document.querySelector("[data-items-dropdown]");
    const itemsTrigger = document.querySelector("[data-items-trigger]");
    const itemsOptions = document.querySelectorAll("[data-items-option]");
    const paginationHost = document.getElementById("client-pagination-numbers");
    const prevPageButton = document.getElementById("client-prev-page");
    const nextPageButton = document.getElementById("client-next-page");
    const nameHeading = document.getElementById("client-table-heading-name");
    const insuredHeading = document.getElementById("client-table-heading-insured");
    const coverageHeading = document.getElementById("client-table-heading-coverage");
    const sourceHeading = document.getElementById("client-table-heading-source");
    const statusHeading = document.getElementById("client-table-heading-status");
    const addClientModal = document.querySelector("[data-add-client-modal]");
    const addClientModalCloseTargets = document.querySelectorAll("[data-add-client-modal-close]");

    if (!letterButtons.length || !rowsHost) {
      return;
    }

    ensureClientRecords();
    mergePendingClientRecords();
    let allRecords = getClientRecords();
    const selectedRecordIds = new Set();
    let activeLetter = "all";
    const navigationEntry = window.performance.getEntriesByType("navigation")[0];
    const shouldRestoreClientStatus = navigationEntry?.type === "reload";
    let activeStatus = shouldRestoreClientStatus ? (sessionStorage.getItem(STORAGE_KEYS.clientStatus) || "all") : "all";
    const shouldRestoreClientView = navigationEntry?.type === "reload";
    const forcedClientView = sessionStorage.getItem(STORAGE_KEYS.clientViewIntent);
    let activeView = forcedClientView || (shouldRestoreClientView ? (sessionStorage.getItem(STORAGE_KEYS.clientView) || "individuals") : "individuals");
    const shouldResetItemsShown = sessionStorage.getItem(STORAGE_KEYS.clientItemsShownReset) === "true";
    const shouldRestoreItemsShown = navigationEntry?.type === "reload" && !shouldResetItemsShown;
    let itemsShown = Number(shouldRestoreItemsShown ? (sessionStorage.getItem(STORAGE_KEYS.clientItemsShown) || "15") : "15");
    let currentPage = 1;

    if (!shouldRestoreClientStatus) {
      sessionStorage.setItem(STORAGE_KEYS.clientStatus, "all");
    }

    if (!shouldRestoreClientView) {
      sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
    }

    if (!shouldRestoreItemsShown) {
      sessionStorage.setItem(STORAGE_KEYS.clientItemsShown, "15");
    }

    sessionStorage.removeItem(STORAGE_KEYS.clientViewIntent);
    sessionStorage.removeItem(STORAGE_KEYS.clientItemsShownReset);

    function syncItemsShownControls() {
      if (itemsTrigger) {
        itemsTrigger.textContent = `Items Shown (${itemsShown})`;
      }

      itemsOptions.forEach((option) => {
        option.classList.toggle("is-active", Number(option.dataset.itemsOption) === itemsShown);
      });
    }

    function syncStatusButtons() {
      const counts = buildStatusCounts(allRecords, activeView);

      statusButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.clientStatus === activeStatus);
        const counter = button.querySelector("[data-status-count]");
        if (counter) {
          counter.textContent = String(counts[button.dataset.clientStatus] || 0);
        }
      });
    }

    function syncTableHeadings() {
      if (nameHeading) {
        nameHeading.textContent = activeView === "households" ? "Household" : "Client";
      }
      if (insuredHeading) {
        insuredHeading.textContent = activeView === "households" ? "Members" : "Insured";
        insuredHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (coverageHeading) {
        coverageHeading.textContent = activeView === "households" ? "Coverage Gap" : "Coverage Amount";
        coverageHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (sourceHeading) {
        sourceHeading.textContent = activeView === "households" ? "Dependents" : "Source";
        sourceHeading.classList.toggle("is-households-view", activeView === "households");
      }
      if (statusHeading) {
        statusHeading.textContent = activeView === "households" ? "Policies" : "Client Status";
        statusHeading.classList.toggle("is-households-view", activeView === "households");
      }
    }

    function syncExportButtonState() {
      if (!exportButton) {
        return;
      }

      const hasSelection = selectedRecordIds.size > 0;
      exportButton.classList.toggle("is-active", hasSelection);
      exportButton.disabled = !hasSelection;
      exportButton.setAttribute("aria-disabled", String(!hasSelection));

      if (!hasSelection && exportDropdown) {
        exportDropdown.classList.remove("is-open");
        exportButton.setAttribute("aria-expanded", "false");
      }

      if (addClientButton) {
        addClientButton.classList.toggle("is-inactive", hasSelection);
      }
    }

    function openAddClientModal() {
      if (!addClientModal) {
        return;
      }

      addClientModal.hidden = false;
      addClientModal.classList.add("is-open");
      document.body.classList.add("is-modal-open");
    }

    function closeAddClientModal() {
      if (!addClientModal) {
        return;
      }

      addClientModal.hidden = true;
      addClientModal.classList.remove("is-open");
      document.body.classList.remove("is-modal-open");
    }

    function getSelectedRecords() {
      return allRecords.filter((record) => selectedRecordIds.has(record.id));
    }

    function getFilteredRecords() {
      const query = (searchField?.value || "").trim().toLowerCase();

      return allRecords.filter((record) => {
        const matchesView = record.viewType === activeView;
        const matchesLetter = activeLetter === "all" || getLastInitial(record.lastName) === activeLetter;
        const matchesStatus = activeStatus === "all" || record.statusGroup === activeStatus;
        const matchesSearch = !query
          || String(record.displayName || "").toLowerCase().includes(query)
          || String(record.summary || "").toLowerCase().includes(query)
          || String(record.caseRef || "").toLowerCase().includes(query);

        return matchesView && matchesLetter && matchesStatus && matchesSearch;
      });
    }

    function renderPagination(totalPages) {
      if (!paginationHost || !prevPageButton || !nextPageButton) {
        return;
      }

      prevPageButton.disabled = currentPage <= 1;
      nextPageButton.disabled = currentPage >= totalPages;
      paginationHost.innerHTML = "";

      for (let page = 1; page <= totalPages; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "client-page-number";
        if (page === currentPage) {
          button.classList.add("is-active");
        }
        button.textContent = String(page);
        button.addEventListener("click", () => {
          currentPage = page;
          renderDirectory();
        });
        paginationHost.appendChild(button);
      }
    }

    function renderDirectory() {
      allRecords = getClientRecords();
      const filteredRecords = getFilteredRecords();
      const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsShown));
      currentPage = Math.min(currentPage, totalPages);
      const startIndex = (currentPage - 1) * itemsShown;
      const visibleRecords = filteredRecords.slice(startIndex, startIndex + itemsShown);

      rowsHost.innerHTML = visibleRecords.map((record) => renderClientRow(record, selectedRecordIds.has(record.id))).join("");
      if (emptyState) {
        emptyState.hidden = visibleRecords.length > 0;
      }

      rowsHost.querySelectorAll("[data-client-checkbox]").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          const recordId = checkbox.dataset.clientCheckbox;
          if (checkbox.checked) {
            selectedRecordIds.add(recordId);
          } else {
            selectedRecordIds.delete(recordId);
          }
          syncExportButtonState();
        });
      });

      rowsHost.querySelectorAll("[data-priority-trigger]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const dropdown = button.closest("[data-priority-dropdown]");
          const row = button.closest(".client-table");
          if (!dropdown) {
            return;
          }

          rowsHost.querySelectorAll("[data-priority-dropdown].is-open").forEach((item) => {
            if (item !== dropdown) {
              item.classList.remove("is-open");
              item.querySelector("[data-priority-trigger]")?.setAttribute("aria-expanded", "false");
              item.closest(".client-table")?.classList.remove("is-priority-open");
            }
          });

          const isOpen = dropdown.classList.toggle("is-open");
          button.setAttribute("aria-expanded", String(isOpen));
          row?.classList.toggle("is-priority-open", isOpen);
        });
      });

      rowsHost.querySelectorAll("[data-priority-option]").forEach((option) => {
        option.addEventListener("click", (event) => {
          event.stopPropagation();
          const recordId = option.dataset.priorityRecord;
          const priority = normalizePriority(option.dataset.priorityOption);
          if (!recordId) {
            return;
          }

          updateClientPriority(recordId, priority);
          renderDirectory();
        });
      });

      rowsHost.querySelectorAll("[data-client-open]").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target.closest("[data-client-checkbox]") || event.target.closest("[data-priority-dropdown]")) {
            return;
          }

          const recordId = row.dataset.clientOpen;
          if (!recordId) {
            return;
          }

          window.location.href = `client-detail.html?id=${encodeURIComponent(recordId)}`;
        });

        row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          if (event.target.closest("[data-client-checkbox]") || event.target.closest("[data-priority-dropdown]")) {
            return;
          }

          event.preventDefault();
          const recordId = row.dataset.clientOpen;
          if (!recordId) {
            return;
          }

          window.location.href = `client-detail.html?id=${encodeURIComponent(recordId)}`;
        });
      });

      syncTableHeadings();
      renderPagination(totalPages);
      syncStatusButtons();
      syncExportButtonState();
    }

    letterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeLetter = button.dataset.clientLetter || "all";
        currentPage = 1;

        letterButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });

        renderDirectory();
      });
    });

    if (searchField) {
      searchField.addEventListener("input", () => {
        currentPage = 1;
        renderDirectory();
      });
    }

    viewButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.clientView === activeView);
      button.addEventListener("click", () => {
        activeView = button.dataset.clientView || "individuals";
        sessionStorage.setItem(STORAGE_KEYS.clientView, activeView);
        currentPage = 1;
        viewButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        renderDirectory();
      });
    });

    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeStatus = button.dataset.clientStatus || "all";
        sessionStorage.setItem(STORAGE_KEYS.clientStatus, activeStatus);
        currentPage = 1;
        renderDirectory();
      });
    });

    itemsOptions.forEach((option) => {
      option.addEventListener("click", () => {
        itemsShown = Number(option.dataset.itemsOption) || 15;
        sessionStorage.setItem(STORAGE_KEYS.clientItemsShown, String(itemsShown));
        currentPage = 1;
        syncItemsShownControls();
        renderDirectory();
        if (itemsDropdown) {
          itemsDropdown.classList.remove("is-open");
          itemsTrigger?.setAttribute("aria-expanded", "false");
        }
        option.blur();
        itemsTrigger?.blur();
      });
    });

    if (itemsDropdown && itemsTrigger) {
      itemsTrigger.addEventListener("click", () => {
        const isOpen = itemsDropdown.classList.toggle("is-open");
        itemsTrigger.setAttribute("aria-expanded", String(isOpen));
      });

      itemsDropdown.addEventListener("mouseleave", () => {
        itemsDropdown.classList.remove("is-open");
        itemsTrigger.setAttribute("aria-expanded", "false");
      });
    }

    if (prevPageButton) {
      prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          renderDirectory();
        }
      });
    }

    if (nextPageButton) {
      nextPageButton.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(getFilteredRecords().length / itemsShown));
        if (currentPage < totalPages) {
          currentPage += 1;
          renderDirectory();
        }
      });
    }

    if (addClientButton) {
      addClientButton.addEventListener("click", (event) => {
        event.preventDefault();
        openAddClientModal();
      });
    }

    addClientModalCloseTargets.forEach((target) => {
      target.addEventListener("click", closeAddClientModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAddClientModal();
      }
    });

    if (addClientModal) {
      addClientModal.addEventListener("click", (event) => {
        if (event.target === addClientModal) {
          closeAddClientModal();
        }
      });
    }

    if (exportButton && exportDropdown) {
      exportButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!selectedRecordIds.size) {
          return;
        }

        const isOpen = exportDropdown.classList.toggle("is-open");
        exportButton.setAttribute("aria-expanded", String(isOpen));
      });
    }

    exportOptions.forEach((option) => {
      option.addEventListener("click", async (event) => {
        event.stopPropagation();
        const selectedRecords = getSelectedRecords();
        if (!selectedRecords.length) {
          return;
        }

        const action = option.dataset.exportAction;
        if (action === "print") {
          printClientRecords(selectedRecords);
        } else if (action === "share") {
          await shareClientRecords(selectedRecords);
        } else {
          exportClientRecords(selectedRecords);
        }

        exportDropdown?.classList.remove("is-open");
        exportButton?.setAttribute("aria-expanded", "false");
      });
    }

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (target.closest("[data-export-dropdown]")) {
        return;
      }

      exportDropdown?.classList.remove("is-open");
      exportButton?.setAttribute("aria-expanded", "false");

      if (target.closest("[data-priority-dropdown]")) {
        return;
      }

      rowsHost.querySelectorAll("[data-priority-dropdown].is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector("[data-priority-trigger]")?.setAttribute("aria-expanded", "false");
        dropdown.closest(".client-table")?.classList.remove("is-priority-open");
      });
    });

    syncItemsShownControls();
    renderDirectory();
  }

  function initializeClientDirectoryNavLinks() {
    const clientDirectoryNavLinks = document.querySelectorAll("[data-client-directory-nav]");

    clientDirectoryNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        sessionStorage.setItem(STORAGE_KEYS.clientItemsShownReset, "true");
      });
    });
  }

  function initializeClientDetailPage() {
    const host = document.querySelector("[data-client-detail-host]");
    const title = document.querySelector("[data-client-detail-title]");
    const subtitle = document.querySelector("[data-client-detail-subtitle]");

    if (!host || !title || !subtitle) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const recordId = String(params.get("id") || "").trim();
    const record = getClientRecords().find((item) => item.id === recordId);

    if (!record) {
      title.textContent = "Client Not Found";
      subtitle.textContent = "The requested client record is not available in this advisor workspace.";
      host.innerHTML = `
        <section class="client-detail-card">
          <p class="client-detail-empty">No saved client matched this record id.</p>
        </section>
      `;
      return;
    }

    const isHousehold = record.viewType === "households";
    const dependentsCount = Number(record.dependentsCount || 0);
    const membersCount = Number(record.insured || 0);
    const householdMembersDisplay = Number.isFinite(membersCount) && membersCount > 0
      ? String(membersCount)
      : "Not provided";
    const policiesDisplay = getPoliciesDisplay(record);
    const dependentAgesDisplay = String(record.dependentAges || "").trim() || "Not provided";

    function buildIndividualSections(currentRecord) {
      return [
        {
          title: "Overview",
          fields: [
            ["Client", currentRecord.displayName],
            ["Case Ref", currentRecord.caseRef],
            ["Client Status", getClientStatusDisplay(currentRecord.statusGroup)],
            ["Priority", getPriorityDisplay(currentRecord.priority)],
            ["Source", currentRecord.source],
            ["Date Created", formatDateForDirectory(getDirectoryCreatedDate(currentRecord))],
            ["Coverage Amount", formatCurrencyCompact(currentRecord.coverageAmount)],
            ["Coverage Gap", formatCurrencyCompact(currentRecord.coverageGap)]
          ]
        },
        {
          title: "Profile Information",
          fields: [
            ["First Name", currentRecord.firstName],
            ["Middle Name", currentRecord.middleName],
            ["Last Name", currentRecord.lastName],
            ["Preferred Name", currentRecord.preferredName],
            ["Date of Birth", formatDateForDirectory(currentRecord.dateOfBirth)],
            ["Age", currentRecord.age],
            ["Insurance Rating Sex", currentRecord.insuranceRatingSex],
            ["Marital Status", currentRecord.maritalStatus],
            ["Spouse/Partner Date of Birth", formatDateForDirectory(currentRecord.spouseDateOfBirth)],
            ["Spouse/Partner Age", currentRecord.spouseAge]
          ]
        },
        {
          title: "Contact",
          fields: [
            ["Email Address", currentRecord.emailAddress],
            ["Phone Number", currentRecord.phoneNumber],
            ["Preferred Contact Method", currentRecord.preferredContactMethod],
            ["Street Address", currentRecord.streetAddress],
            ["City", currentRecord.city],
            ["State", currentRecord.state],
            ["ZIP Code", currentRecord.zipCode],
            ["Country", currentRecord.country]
          ]
        },
        {
          title: "Household and Advisory",
          fields: [
            ["Household / Company Role", currentRecord.householdRole],
            ["Business Type", currentRecord.businessType],
            ["Business Planning Focus", currentRecord.businessPlanningFocus],
            ["Ownership %", currentRecord.ownershipPercent],
            ["Buy-Sell / Key Person Relevant?", currentRecord.businessCoverageRelevance],
            ["Assignment Name", currentRecord.householdName],
            ["Assignment Type", currentRecord.profileGroupType],
            ["Dependents / Children", currentRecord.hasDependents],
            ["Amount of Dependents / Children", currentRecord.dependentsCount],
            ["Current Children Ages", currentRecord.dependentAges],
            ["Projected Dependents / Children", currentRecord.projectedDependents],
            ["Projected Dependents Count", currentRecord.projectedDependentsCount],
            ["Advisor Name", currentRecord.advisorName],
            ["Firm Name", currentRecord.firmName],
            ["Client Notes", currentRecord.clientNotes]
          ]
        }
      ];
    }

    function buildHouseholdSections(currentRecord) {
      return [
        {
          title: "Overview",
          fields: [
            ["Household", currentRecord.displayName],
            ["Case Ref", currentRecord.caseRef],
            ["Date Created", formatDateForDirectory(getDirectoryCreatedDate(currentRecord))],
            ["Members", householdMembersDisplay],
            ["Dependents", dependentsCount || "0"],
            ["Policies", policiesDisplay],
            ["Coverage Gap", formatCurrencyCompact(currentRecord.coverageGap)],
            ["Priority", getPriorityDisplay(currentRecord.priority)]
          ]
        },
        {
          title: "Household Members",
          fields: [
            ["Primary Adults", householdMembersDisplay],
            ["Marital Status", currentRecord.maritalStatus],
            ["Spouse / Partner Age", currentRecord.spouseAge],
            ["Current Children Ages", dependentAgesDisplay]
          ]
        },
        {
          title: "Household Structure",
          fields: [
            ["Dependents / Children", currentRecord.hasDependents],
            ["Current Dependents Count", dependentsCount || "0"],
            ["Projected Dependents / Children", currentRecord.projectedDependents],
            ["Projected Dependents Count", currentRecord.projectedDependentsCount],
            ["Assignment Name", currentRecord.householdName || currentRecord.displayName],
            ["Assignment Type", currentRecord.profileGroupType]
          ]
        },
        {
          title: "Coverage and Planning",
          fields: [
            ["Coverage Gap", formatCurrencyCompact(currentRecord.coverageGap)],
            ["Coverage Amount", formatCurrencyCompact(currentRecord.coverageAmount)],
            ["Policies", policiesDisplay],
            ["Business Planning Focus", currentRecord.businessPlanningFocus],
            ["Buy-Sell / Key Person Relevant?", currentRecord.businessCoverageRelevance]
          ]
        },
        {
          title: "Advisor Notes",
          fields: [
            ["Advisor Name", currentRecord.advisorName],
            ["Firm Name", currentRecord.firmName],
            ["Source", currentRecord.source],
            ["Client Notes", currentRecord.clientNotes]
          ]
        }
      ];
    }

    title.textContent = record.displayName || (isHousehold ? "Household Detail" : "Client Detail");
    subtitle.textContent = isHousehold
      ? `Household Profile | ${record.caseRef || "Case ref pending"}`
      : `${getClientStatusDisplay(record.statusGroup)} | ${record.caseRef || "Case ref pending"}`;

    const sections = isHousehold ? buildHouseholdSections(record) : buildIndividualSections(record);

    host.innerHTML = sections.map((section) => `
      <section class="client-detail-card">
        <div class="client-detail-card-header">
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="client-detail-grid">
          ${section.fields.map(([label, value]) => `
            <div class="client-detail-field">
              <span class="client-detail-label">${escapeHtml(label)}</span>
              <span class="client-detail-value">${escapeHtml(formatClientDetailValue(value))}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `).join("");
  }

  function initializeSurvivorshipAdjustments() {
    const survivorWorkingSelects = document.querySelectorAll("select[name='survivorContinuesWorking']");

    survivorWorkingSelects.forEach((select) => {
      const section = select.closest(".profile-form-section");
      if (!section) {
        return;
      }

      const dependentFields = [
        section.querySelector("[name='survivorIncome']"),
        section.querySelector("[name='incomeReplacementDuration']"),
        section.querySelector("[name='survivorNetAnnualIncome']"),
        section.querySelector("[name='expenseReductionAtDeath']"),
        section.querySelector("[name='childDependencyDuration']")
      ].filter(Boolean);

      const syncDependentState = () => {
        const shouldEnable = String(select.value || "").trim().toLowerCase() === "yes";

        dependentFields.forEach((field) => {
          const fieldGroup = field.closest(".field-group");
          field.disabled = !shouldEnable;

          if (!shouldEnable) {
            field.value = "";
          }

          if (fieldGroup) {
            fieldGroup.classList.toggle("is-disabled", !shouldEnable);
          }
        });
      };

      select.addEventListener("change", syncDependentState);
      select.addEventListener("input", syncDependentState);
      syncDependentState();
    });
  }

  function performSignOut() {
    localStorage.removeItem(STORAGE_KEYS.authSession);
    const prefix = getPathPrefix();
    window.location.href = `${prefix}index.html`;
  }

  function ensureClientRecords() {
    const storageKey = getClientRecordsStorageKey();
    if (!localStorage.getItem(storageKey)) {
      const legacyRecords = loadJson(STORAGE_KEYS.clientRecords);
      const initialRecords = Array.isArray(legacyRecords)
        ? legacyRecords
        : (getStorageIdentity() === "guest" ? DEFAULT_CLIENT_RECORDS : []);
      writeClientRecords(initialRecords);

      if (Array.isArray(legacyRecords)) {
        localStorage.removeItem(STORAGE_KEYS.clientRecords);
      }
      return;
    }

    const records = loadJson(storageKey);
    if (!Array.isArray(records)) {
      writeClientRecords(getStorageIdentity() === "guest" ? DEFAULT_CLIENT_RECORDS : []);
      return;
    }

    const normalizedRecords = normalizeClientRecords(records);

    if (JSON.stringify(records) !== JSON.stringify(normalizedRecords)) {
      writeClientRecords(normalizedRecords);
    }
  }

  function getClientRecords() {
    ensureClientRecords();
    return loadJson(getClientRecordsStorageKey()) || [];
  }

  function mergePendingClientRecords() {
    const pendingRecords = loadJsonSession(STORAGE_KEYS.pendingClientRecords);
    if (!Array.isArray(pendingRecords) || !pendingRecords.length) {
      return;
    }

    const existingRecords = getClientRecords();
    const existingIds = new Set(existingRecords.map((record) => record.id));
    const mergedRecords = [
      ...pendingRecords.filter((record) => record && !existingIds.has(record.id)),
      ...existingRecords
    ];

    writeClientRecords(mergedRecords);
    sessionStorage.removeItem(STORAGE_KEYS.pendingClientRecords);
  }

  function writeClientRecords(records) {
    localStorage.setItem(getClientRecordsStorageKey(), JSON.stringify(normalizeClientRecords(records)));
  }

  function normalizeClientRecords(records) {
    return records
      .filter((record) => record && typeof record === "object")
      .map((record, index) => {
        const preferredName = String(record.preferredName || "").trim();
        const firstName = String(record.firstName || "").trim();
        const lastName = String(record.lastName || "").trim();
        const displayName = String(record.displayName || "").trim()
          || `${preferredName || firstName} ${lastName}`.trim()
          || `Client ${index + 1}`;
        const viewType = ["individuals", "households", "companies"].includes(String(record.viewType || ""))
          ? String(record.viewType)
          : "individuals";
        const statusGroup = ["prospects", "in-review", "coverage-placed", "closed"].includes(String(record.statusGroup || ""))
          ? String(record.statusGroup)
          : "prospects";

        return {
          ...record,
          id: String(record.id || `cl-normalized-${index}`),
          viewType,
          displayName,
          firstName,
          lastName,
          summary: String(record.summary || record.clientNotes || "New client profile"),
          caseRef: normalizeRecordCaseRef(viewType, record.caseRef, index),
          lastReview: String(record.lastReview || record.lastUpdatedDate || record.dateProfileCreated || formatDateInputValue(new Date())),
          dateProfileCreated: String(record.dateProfileCreated || record.lastReview || record.lastUpdatedDate || formatDateInputValue(new Date())),
          insured: String(record.insured || (viewType === "individuals" ? "Yes" : "1")),
          source: String(record.source || record.dataSource || "Advisor Entered"),
          statusGroup,
          priority: normalizePriority(record.priority),
          coverageAmount: Number(record.coverageAmount || 0),
          coverageGap: Number(record.coverageGap || 0),
          policyCount: Number(record.policyCount || 0)
        };
      });
  }

  function getClientRecordsStorageKey() {
    return `${STORAGE_KEYS.clientRecords}:${getStorageIdentity()}`;
  }

  function getStorageIdentity() {
    const session = getCurrentSession();
    return session?.email ? String(session.email).trim().toLowerCase() : "guest";
  }

  function getCurrentSession() {
    return loadJson(STORAGE_KEYS.authSession);
  }

  function buildNextCaseRef(records, prefix) {
    const normalizedPrefix = String(prefix || "CL").trim().toUpperCase();
    const highestNumber = records.reduce((highest, record) => {
      const match = String(record.caseRef || "").match(new RegExp(`${normalizedPrefix}/(\\d+)`));
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 80400);

    return `${normalizedPrefix}/${highestNumber + 1}`;
  }

  function normalizeCaseRef(value) {
    return String(value || "").trim().toUpperCase();
  }

  function normalizeRecordCaseRef(viewType, caseRef, index) {
    const normalizedViewType = String(viewType || "").trim();
    const normalizedCaseRef = normalizeCaseRef(caseRef);

    if (normalizedViewType === "households") {
      const householdMatch = normalizedCaseRef.match(/(?:HH|CL)\/(\d+)/);
      if (householdMatch) {
        return `HH/${householdMatch[1]}`;
      }
      return `HH/${80401 + index}`;
    }

    if (!normalizedCaseRef) {
      return `CL/${80401 + index}`;
    }

    return normalizedCaseRef;
  }

  function setLinkedCaseRef(caseRef) {
    const normalized = normalizeCaseRef(caseRef);
    if (!normalized) {
      sessionStorage.removeItem(STORAGE_KEYS.linkedCaseRef);
      return "";
    }

    sessionStorage.setItem(STORAGE_KEYS.linkedCaseRef, normalized);
    return normalized;
  }

  function getLinkedCaseRef() {
    return normalizeCaseRef(sessionStorage.getItem(STORAGE_KEYS.linkedCaseRef));
  }

  function setLinkedRecordId(recordId) {
    const normalized = String(recordId || "").trim();
    if (!normalized) {
      sessionStorage.removeItem(STORAGE_KEYS.linkedRecordId);
      return "";
    }

    sessionStorage.setItem(STORAGE_KEYS.linkedRecordId, normalized);
    return normalized;
  }

  function getLinkedRecordId() {
    return String(sessionStorage.getItem(STORAGE_KEYS.linkedRecordId) || "").trim();
  }

  function serializeFormSnapshot(form) {
    const formData = new FormData(form);
    const snapshot = {};

    for (const [key, value] of formData.entries()) {
      const normalizedValue = typeof value === "string" ? value.trim() : value;

      if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
        if (Array.isArray(snapshot[key])) {
          snapshot[key].push(normalizedValue);
        } else {
          snapshot[key] = [snapshot[key], normalizedValue];
        }
        continue;
      }

      snapshot[key] = normalizedValue;
    }

    return snapshot;
  }

  function loadSessionJson(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null");
    } catch (_error) {
      return null;
    }
  }

  function saveSessionJson(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function parseMoneyValue(value) {
    const normalized = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(normalized) ? normalized : 0;
  }

  function clampPercentValue(value) {
    return Math.max(0, Math.min(100, parseMoneyValue(value)));
  }

  function getTruthyYes(value) {
    return ["yes", "true", "1", "included"].includes(String(value || "").trim().toLowerCase());
  }

  function getTemporaryAnalysisSession() {
    const session = loadSessionJson(STORAGE_KEYS.temporaryAnalysisSession);
    return session && typeof session === "object" ? session : null;
  }

  function clearTemporaryAnalysisSession() {
    sessionStorage.removeItem(STORAGE_KEYS.temporaryAnalysisSession);
  }

  function markAnalysisInternalNavigation() {
    sessionStorage.setItem(STORAGE_KEYS.analysisInternalNavigation, "true");
  }

  function consumeAnalysisInternalNavigation() {
    const flagged = sessionStorage.getItem(STORAGE_KEYS.analysisInternalNavigation) === "true";
    sessionStorage.removeItem(STORAGE_KEYS.analysisInternalNavigation);
    return flagged;
  }

  function saveTemporaryAnalysisSession(payload) {
    if (!payload || typeof payload !== "object") {
      clearTemporaryAnalysisSession();
      return null;
    }

    const nextSession = {
      hasData: true,
      savedAt: new Date().toISOString(),
      variant: String(payload.variant || "").trim(),
      sourcePage: String(payload.sourcePage || "").trim(),
      data: payload.data && typeof payload.data === "object" ? payload.data : {},
      meta: payload.meta && typeof payload.meta === "object" ? payload.meta : {}
    };

    return saveSessionJson(STORAGE_KEYS.temporaryAnalysisSession, nextSession);
  }

  function hasTemporaryAnalysisData() {
    return Boolean(getTemporaryAnalysisSession()?.hasData);
  }

  function applySnapshotToForm(form, snapshot) {
    if (!form || !snapshot || typeof snapshot !== "object") {
      return;
    }

    Object.entries(snapshot).forEach(([name, value]) => {
      const control = form.elements.namedItem(name);

      if (!control || value == null || value === "") {
        return;
      }

      if (control instanceof RadioNodeList) {
        Array.from(control).forEach((input) => {
          input.checked = String(input.value) === String(value);
        });
        return;
      }

      if (control.type === "checkbox") {
        control.checked = Boolean(value);
        return;
      }

      control.value = value;
      control.dispatchEvent?.(new Event("input", { bubbles: true }));
      control.dispatchEvent?.(new Event("change", { bubbles: true }));
    });
  }

  function restoreTemporaryAnalysisForm(form, variant) {
    const session = getTemporaryAnalysisSession();
    if (!session || !session.hasData || String(session.variant || "").trim() !== String(variant || "").trim()) {
      return null;
    }

    applySnapshotToForm(form, session.data || {});
    return session;
  }

  function getClientRecordByReference(recordId, caseRef) {
    const normalizedId = String(recordId || "").trim();
    const normalizedCaseRef = normalizeCaseRef(caseRef);
    const records = getClientRecords();

    if (normalizedId) {
      const matchedById = records.find((record) => String(record?.id || "").trim() === normalizedId);
      if (matchedById) {
        return matchedById;
      }
    }

    if (normalizedCaseRef) {
      return records.find((record) => normalizeCaseRef(record?.caseRef) === normalizedCaseRef) || null;
    }

    return null;
  }

  function getLatestProtectionModelingPayload(record) {
    if (!record || typeof record !== "object") {
      return null;
    }

    if (record.protectionModeling && typeof record.protectionModeling === "object") {
      return record.protectionModeling;
    }

    if (Array.isArray(record.protectionModelingEntries) && record.protectionModelingEntries.length) {
      return record.protectionModelingEntries[record.protectionModelingEntries.length - 1];
    }

    return null;
  }

  function hasEnteredMoneyValue(value) {
    return String(value ?? "").trim() !== "";
  }

  function buildAnalysisBucketsFromData(rawData, meta) {
    const data = rawData && typeof rawData === "object" ? rawData : {};
    const context = meta && typeof meta === "object" ? meta : {};
    const hasExplicitAssetTotal = hasEnteredMoneyValue(data.availableAssetsTotal);
    const hasExplicitAssetBuckets = [
      data.liquidAssetsAvailable,
      data.retirementAssetsAvailable,
      data.businessValueAvailable,
      data.otherAssetsAvailable
    ].some(hasEnteredMoneyValue);
    const educationFundingTotal = parseMoneyValue(data.educationFundingTotal)
      || ((parseMoneyValue(data.estimatedCostPerChild) * Math.max(0, parseMoneyValue(data.childrenNeedingFunding))) * (clampPercentValue(data.costToFundPercent || 100) / 100));
    const finalExpensesTotal = parseMoneyValue(data.finalExpensesTotal)
      || parseMoneyValue(data.funeralBurialEstimate)
      + parseMoneyValue(data.medicalEndOfLifeCosts)
      + parseMoneyValue(data.estateSettlementCosts);
    const debtPayoffTotal = parseMoneyValue(data.debtPayoffTotal)
      || parseMoneyValue(data.mortgageBalance)
      + parseMoneyValue(data.otherPersonalDebtTotal)
      + parseMoneyValue(data.otherRealEstateLoans)
      + parseMoneyValue(data.autoLoans)
      + parseMoneyValue(data.creditCardDebt)
      + parseMoneyValue(data.studentLoans)
      + parseMoneyValue(data.personalLoans)
      + parseMoneyValue(data.businessDebt);
    const availableAssetsTotal = hasExplicitAssetTotal
      ? parseMoneyValue(data.availableAssetsTotal)
      : hasExplicitAssetBuckets
        ? (
          parseMoneyValue(data.liquidAssetsAvailable)
          + parseMoneyValue(data.retirementAssetsAvailable)
          + parseMoneyValue(data.businessValueAvailable)
          + parseMoneyValue(data.otherAssetsAvailable)
        )
        : (
          parseMoneyValue(data.cashSavings)
          + parseMoneyValue(data.emergencyFund)
          + parseMoneyValue(data.brokerageAccounts)
          + parseMoneyValue(data.liquidAssetsAvailable)
          + (getTruthyYes(data.retirementAssetsIncludeInOffset) || !data.retirementAssetsIncludeInOffset
            ? parseMoneyValue(data.retirementAssetsAvailable) || (parseMoneyValue(data.retirementAssets) * (clampPercentValue(data.retirementAssetsPercentAvailable || 100) / 100))
            : 0)
          + (getTruthyYes(data.businessValueIncludeInOffset) || !data.businessValueIncludeInOffset
            ? parseMoneyValue(data.businessValueAvailable) || (parseMoneyValue(data.businessValue) * (clampPercentValue(data.businessValuePercentAvailable || 100) / 100))
            : 0)
          + parseMoneyValue(data.otherAssetsAvailable)
        );
    const existingCoverageTotal = parseMoneyValue(data.existingCoverageTotal)
      || parseMoneyValue(data.individualDeathBenefit)
      + parseMoneyValue(data.groupLifeCoverage)
      + parseMoneyValue(data.currentCoverageAmount)
      + parseMoneyValue(data.currentLifeInsuranceCoverage);
    const survivorNetAnnualIncome = parseMoneyValue(data.survivorNetAnnualIncome)
      || parseMoneyValue(data.spouseNetAnnualIncome)
      || parseMoneyValue(data.survivorIncome)
      || parseMoneyValue(data.spouseIncome);
    const baseNetIncome = parseMoneyValue(data.netAnnualIncome) || parseMoneyValue(data.grossAnnualIncome);
    const replacementPercent = clampPercentValue(
      hasEnteredMoneyValue(data.targetIncomeReplacementPercentage)
        ? data.targetIncomeReplacementPercentage
        : (hasEnteredMoneyValue(data.householdIncomeUsePercent) ? data.householdIncomeUsePercent : 100)
    ) / 100;
    const annualIncomeToReplace = parseMoneyValue(data.annualIncomeToReplace) || Math.max((baseNetIncome * replacementPercent) - survivorNetAnnualIncome, 0);
    const yearsUntilRetirement = Math.max(
      0,
      Math.round(
        Math.max(
          parseMoneyValue(data.yearsUntilRetirement),
          parseMoneyValue(data.spouseYearsUntilRetirement)
        )
      )
    );
    const yearsUntilDeath = Math.max(0, Math.round(parseMoneyValue(context.yearsUntilDeath)));
    const supportDuration = Math.max(
      1,
      Math.round(parseMoneyValue(data.incomeReplacementDuration) || Math.max(yearsUntilRetirement - yearsUntilDeath, 0) || 12)
    );
    const currentAge = Math.max(
      0,
      Math.round(parseMoneyValue(context.currentAge) || parseMoneyValue(data.currentAge) || parseMoneyValue(data.age))
    );

    return {
      currentAge,
      yearsUntilRetirement,
      annualIncomeToReplace,
      survivorNetAnnualIncome,
      supportDuration,
      immediateLiquidityBuffer: parseMoneyValue(data.immediateLiquidityBuffer),
      debtPayoffTotal,
      finalExpensesTotal,
      educationFundingTotal,
      specialOneTimeGoals: parseMoneyValue(data.specialOneTimeGoals),
      emergencyReserveGoal: parseMoneyValue(data.emergencyReserveGoal),
      otherSurvivorLumpSumNeed: parseMoneyValue(data.otherSurvivorLumpSumNeed),
      availableAssetsTotal,
      existingCoverageTotal,
      incomeGrowthRate: clampPercentValue(data.incomeGrowthRate),
      employerBenefitsValue: parseMoneyValue(data.employerBenefitsValue),
      variant: String(context.variant || "").trim()
    };
  }

  function getActiveAnalysisSource() {
    const temporarySession = getTemporaryAnalysisSession();
    if (temporarySession?.hasData) {
      return {
        sourceType: "temporary",
        session: temporarySession,
        record: null,
        buckets: buildAnalysisBucketsFromData(temporarySession.data || {}, {
          ...(temporarySession.meta || {}),
          variant: temporarySession.variant
        })
      };
    }

    const linkedRecord = getClientRecordByReference(getLinkedRecordId(), getLinkedCaseRef());
    const modelingPayload = getLatestProtectionModelingPayload(linkedRecord);
    const linkedData = modelingPayload?.data || {};

    return {
      sourceType: "linked",
      session: null,
      record: linkedRecord,
      buckets: buildAnalysisBucketsFromData(linkedData, {
        currentAge: parseMoneyValue(linkedRecord?.age) || calculateAgeFromDate(linkedRecord?.dateOfBirth),
        variant: String(modelingPayload?.variant || "").trim()
      }),
      modelingPayload
    };
  }

  function updateClientRecordByCaseRef(caseRef, updater) {
    const normalizedCaseRef = normalizeCaseRef(caseRef);
    if (!normalizedCaseRef || typeof updater !== "function") {
      return null;
    }

    const records = getClientRecords();
    const recordIndex = records.findIndex((record) => normalizeCaseRef(record.caseRef) === normalizedCaseRef);

    if (recordIndex < 0) {
      return null;
    }

    const currentRecord = records[recordIndex];
    const updatedRecord = updater({
      ...currentRecord
    });

    if (!updatedRecord || typeof updatedRecord !== "object") {
      return null;
    }

    const nextRecords = [...records];
    nextRecords[recordIndex] = updatedRecord;
    writeClientRecords(nextRecords);
    return nextRecords[recordIndex];
  }

  function applyLinkedWorkflowSectionToRecord(record, sectionName, sectionPayload) {
    const nextRecord = {
      ...record,
      lastUpdatedDate: sectionPayload.savedAt,
      lastReview: sectionPayload.savedAt
    };

    if (sectionName === "preliminaryUnderwriting") {
      nextRecord.preliminaryUnderwriting = sectionPayload;
      nextRecord.preliminaryUnderwritingCompleted = true;
    }

    if (sectionName === "protectionModeling") {
      const existingEntries = Array.isArray(nextRecord.protectionModelingEntries)
        ? nextRecord.protectionModelingEntries.slice()
        : [];
      nextRecord.protectionModelingEntries = [...existingEntries, sectionPayload];
      nextRecord.protectionModeling = sectionPayload;
      nextRecord.pmiCompleted = true;
    }

    return nextRecord;
  }

  function saveLinkedWorkflowSection(caseRef, sectionName, payload, meta) {
    const normalizedCaseRef = setLinkedCaseRef(caseRef);
    if (!normalizedCaseRef || !sectionName) {
      return null;
    }

    const today = formatDateInputValue(new Date());
    const sectionPayload = {
      completed: true,
      linkedCaseRef: normalizedCaseRef,
      savedAt: today,
      ...(meta && typeof meta === "object" ? meta : {}),
      data: payload && typeof payload === "object" ? payload : {}
    };

    return updateClientRecordByCaseRef(normalizedCaseRef, (record) => {
      return applyLinkedWorkflowSectionToRecord(record, sectionName, sectionPayload);
    });
  }

  function saveLinkedWorkflowSectionWithFallback(caseRef, sectionName, payload, meta) {
    const savedRecord = saveLinkedWorkflowSection(caseRef, sectionName, payload, meta);
    if (savedRecord) {
      return savedRecord;
    }

    const normalizedCaseRef = normalizeCaseRef(caseRef);
    if (!normalizedCaseRef || !sectionName) {
      return null;
    }

    const today = formatDateInputValue(new Date());
    const sectionPayload = {
      completed: true,
      linkedCaseRef: normalizedCaseRef,
      savedAt: today,
      ...(meta && typeof meta === "object" ? meta : {}),
      data: payload && typeof payload === "object" ? payload : {}
    };

    const storageKey = getClientRecordsStorageKey();

    try {
      const records = loadJson(storageKey);
      if (!Array.isArray(records)) {
        return null;
      }

      const recordIndex = records.findIndex((record) => normalizeCaseRef(record?.caseRef) === normalizedCaseRef);
      if (recordIndex < 0) {
        return null;
      }

      const nextRecords = records.slice();
      nextRecords[recordIndex] = applyLinkedWorkflowSectionToRecord(records[recordIndex] || {}, sectionName, sectionPayload);
      localStorage.setItem(storageKey, JSON.stringify(nextRecords));
      return nextRecords[recordIndex];
    } catch (_error) {
    }

    return null;
  }

  function formatDateInputValue(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function calculateAgeFromDate(value) {
    if (!value) {
      return 0;
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return 0;
    }

    const birthYear = Number(match[1]);
    const birthMonthIndex = Number(match[2]) - 1;
    const birthDay = Number(match[3]);
    if (!Number.isFinite(birthYear) || !Number.isFinite(birthMonthIndex) || !Number.isFinite(birthDay)) {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDelta = today.getMonth() - birthMonthIndex;
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDay)) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  function mapClientStageToStatusGroup(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "active client" || normalized === "coverage placed") {
      return "coverage-placed";
    }

    if (normalized === "review client" || normalized === "in review") {
      return "in-review";
    }

    if (normalized === "closed") {
      return "closed";
    }

    return "prospects";
  }

  function formatPhoneNumberInput(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
    if (!digits) {
      return "";
    }

    if (digits.length < 4) {
      return `(${digits}`;
    }

    if (digits.length < 7) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function formatHouseholdDisplayName(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "New Household";
    }

    return /household$/i.test(trimmed) ? trimmed : `${trimmed} Household`;
  }

  function formatCompanyDisplayName(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "New Company Profile";
    }

    return trimmed;
  }

  function deriveStatusLabels(statusGroup, clientType) {
    const statusMap = {
      prospects: clientType === "household" ? ["Discovery", "Household"] : ["Discovery", "Individual"],
      "in-review": clientType === "household" ? ["Review", "Needs"] : ["Review", "Income"],
      "coverage-placed": clientType === "household" ? ["Placed", "Review"] : ["Placed", "Policy"],
      closed: clientType === "household" ? ["Closed", "Archive"] : ["Closed", "Archive"]
    };

    if (clientType === "company") {
      const companyStatusMap = {
        prospects: ["Discovery", "Company"],
        "in-review": ["Review", "Business"],
        "coverage-placed": ["Placed", "Business"],
        closed: ["Closed", "Archive"]
      };

      return companyStatusMap[statusGroup] || ["Review"];
    }

    return statusMap[statusGroup] || ["Review"];
  }

  function normalizePriority(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high") {
      return normalized;
    }

    return "";
  }

  function getPriorityDisplay(priority) {
    const normalized = normalizePriority(priority);
    const displayMap = {
      low: "Low",
      medium: "Medium",
      high: "High"
    };

    return displayMap[normalized] || "Set Priority";
  }

  function getClientStatusDisplay(statusGroup) {
    const statusMap = {
      prospects: "Prospect",
      "in-review": "In Review",
      "coverage-placed": "Coverage Placed",
      closed: "Closed"
    };

    return statusMap[statusGroup] || "Prospect";
  }

  function buildStatusCounts(records, activeView) {
    return records
      .filter((record) => record.viewType === activeView)
      .reduce((counts, record) => {
        counts.all += 1;
        counts[record.statusGroup] = (counts[record.statusGroup] || 0) + 1;
        return counts;
      }, { all: 0, prospects: 0, "in-review": 0, "coverage-placed": 0, closed: 0 });
  }

  function getLastInitial(lastName) {
    const value = String(lastName || "").trim().toUpperCase();
    return value ? value.charAt(0) : "";
  }

  function renderClientRow(record, isSelected) {
    const clientStatus = getClientStatusDisplay(record.statusGroup);
    const priority = normalizePriority(record.priority);
    const isHouseholdAvatar = record.viewType === "households";
    const avatarClasses = `client-avatar${isHouseholdAvatar ? " client-avatar-household" : ""}`;
    const avatarStyle = isHouseholdAvatar ? "" : ` style="background: ${getAvatarBackground(record.age, record.dateOfBirth)};"`;

    return `
      <div class="client-table client-table-clickable" role="row" tabindex="0" data-client-open="${record.id}">
        <div class="client-table-cell client-table-cell-check"><input type="checkbox" aria-label="Select ${record.displayName}" data-client-checkbox="${record.id}" ${isSelected ? "checked" : ""}></div>
        <div class="client-table-cell client-table-cell-client">
          <span class="${avatarClasses}"${avatarStyle}>${getInitials(record.displayName, record.viewType, record.lastName)}</span>
          <div>
            <strong>${record.displayName}</strong>
            <span>${getClientDirectorySubtitle(record)}</span>
          </div>
        </div>
        <div class="client-table-cell">${record.caseRef}</div>
        <div class="client-table-cell client-table-cell-last-review">${formatDateForDirectory(getDirectoryCreatedDate(record))}</div>
        <div class="client-table-cell client-table-cell-insured-value">${record.insured}</div>
        <div class="client-table-cell client-table-cell-source-value${record.viewType === "households" ? " is-households-view" : ""}">${record.viewType === "households" ? getDependentsDisplay(record) : record.source}</div>
        <div class="client-table-cell client-table-cell-status-value${record.viewType === "households" ? " is-households-view" : ""}">${record.viewType === "households" ? getPoliciesDisplay(record) : clientStatus}</div>
        <div class="client-table-cell client-table-cell-coverage-amount-value">${formatCurrencyCompact(record.viewType === "households" ? record.coverageGap : record.coverageAmount)}</div>
        <div class="client-table-cell client-table-cell-value client-table-cell-priority-value">
          <div class="client-priority-dropdown" data-priority-dropdown="${record.id}">
            <button class="client-priority-button ${priority ? `client-priority-button-${priority}` : "client-priority-button-unset"}" type="button" data-priority-trigger aria-expanded="false">
              ${getPriorityDisplay(priority)}
            </button>
            <div class="client-priority-menu">
              <button class="client-priority-option client-priority-option-low ${priority === "low" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="low">Low</button>
              <button class="client-priority-option client-priority-option-medium ${priority === "medium" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="medium">Medium</button>
              <button class="client-priority-option client-priority-option-high ${priority === "high" ? "is-active" : ""}" type="button" data-priority-record="${record.id}" data-priority-option="high">High</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportClientRecords(records) {
    const header = ["Client", "Case Ref", "Date Created", "Insured", "Source", "Client Status", "Coverage Amount", "Priority"];
    const rows = records.map((record) => [
      record.displayName,
      record.caseRef,
      formatDateForDirectory(getDirectoryCreatedDate(record)),
      record.insured,
      record.source,
      getClientStatusDisplay(record.statusGroup),
      formatCurrencyCompact(record.coverageAmount),
      getPriorityDisplay(record.priority)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "client-directory-export.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function printClientRecords(records) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1120,height=860");
    if (!printWindow) {
      return;
    }

    const rowsMarkup = records.map((record) => `
      <tr>
        <td>${escapeHtml(record.displayName)}</td>
        <td>${escapeHtml(record.caseRef)}</td>
        <td>${escapeHtml(formatDateForDirectory(getDirectoryCreatedDate(record)))}</td>
        <td>${escapeHtml(record.insured)}</td>
        <td>${escapeHtml(record.source)}</td>
        <td>${escapeHtml(getClientStatusDisplay(record.statusGroup))}</td>
        <td>${escapeHtml(formatCurrencyCompact(record.coverageAmount))}</td>
        <td>${escapeHtml(getPriorityDisplay(record.priority))}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Client Directory Export</title>
          <style>
            body {
              margin: 0;
              padding: 2rem;
              font-family: "Segoe UI", Arial, sans-serif;
              color: #102134;
              background: #ffffff;
            }
            h1 {
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
            }
            p {
              margin: 0 0 1.5rem;
              color: #475467;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.95rem;
            }
            th,
            td {
              padding: 0.8rem 0.75rem;
              border: 1px solid #d6dde7;
              text-align: left;
            }
            th {
              background: #f5f7fb;
              color: #000000;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <h1>Client Directory Export</h1>
          <p>${records.length} selected ${records.length === 1 ? "profile" : "profiles"}</p>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Case Ref</th>
                <th>Date Created</th>
                <th>Insured</th>
                <th>Source</th>
                <th>Client Status</th>
                <th>Coverage Amount</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  }

  async function shareClientRecords(records) {
    const summary = buildClientShareSummary(records);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Client Directory Selection",
          text: summary
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await copyTextToClipboard(summary);
    if (copied) {
      window.alert("Selected client details copied to the clipboard.");
      return;
    }

    window.alert("Sharing is not available in this browser.");
  }

  function buildClientShareSummary(records) {
    const lines = records.map((record) => (
      `${record.displayName} | ${record.caseRef} | ${getClientStatusDisplay(record.statusGroup)} | ${formatCurrencyCompact(record.coverageAmount)} | ${getPriorityDisplay(record.priority)}`
    ));

    return [
      "Client Directory Selection",
      "",
      ...lines
    ].join("\n");
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        return false;
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateForDirectory(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
  }

  function getDirectoryCreatedDate(record) {
    return String(record?.dateProfileCreated || record?.lastReview || "").trim();
  }

  function formatCurrencyCompact(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: amount >= 1000000 ? "compact" : "standard",
      maximumFractionDigits: amount >= 1000000 ? 2 : 0
    }).format(amount);
  }

  function updateClientPriority(recordId, priority) {
    const records = getClientRecords().map((record) => (
      record.id === recordId
        ? { ...record, priority: normalizePriority(priority) }
        : record
    ));

    writeClientRecords(records);
  }

  function getInitials(name, viewType, lastName) {
    if (viewType === "households") {
      const householdLastInitial = getLastInitial(lastName);
      if (householdLastInitial) {
        return householdLastInitial;
      }

      const trimmed = String(name || "").trim().replace(/\s+Household$/i, "");
      const parts = trimmed.split(/\s+/).filter(Boolean);
      const fallbackLastName = parts.length ? parts[parts.length - 1] : "";
      return (fallbackLastName.charAt(0).toUpperCase() || "H");
    }

    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CL";
  }

  function getAvatarAge(ageValue, dateOfBirthValue) {
    const directAge = Number(String(ageValue || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(directAge) && directAge >= 0) {
      return Math.max(0, Math.min(100, directAge));
    }

    const birthDateValue = String(dateOfBirthValue || "").trim();
    if (!birthDateValue) {
      return null;
    }

    const calculatedAge = calculateAgeFromDate(birthDateValue);
    return Number.isFinite(calculatedAge) ? Math.max(0, Math.min(100, calculatedAge)) : null;
  }

  function interpolateNumber(start, end, progress) {
    return start + ((end - start) * progress);
  }

  function getAvatarHue(ageValue, dateOfBirthValue) {
    const age = getAvatarAge(ageValue, dateOfBirthValue);
    if (age === null) {
      return 210;
    }

    if (age <= 18) {
      return interpolateNumber(48, 60, age / 18);
    }

    if (age <= 30) {
      return interpolateNumber(60, 210, (age - 18) / 12);
    }

    if (age <= 65) {
      return interpolateNumber(210, 280, (age - 30) / 35);
    }

    return interpolateNumber(280, 360, (age - 65) / 35);
  }

  function getAvatarBackground(ageValue, dateOfBirthValue) {
    const hue = getAvatarHue(ageValue, dateOfBirthValue);
    const highlightHue = hue;
    const shadowHue = (hue + 22) % 360;
    return `linear-gradient(135deg, hsl(${highlightHue} 72% 66%), hsl(${shadowHue} 68% 44%))`;
  }

  function getClientDirectorySubtitle(record) {
    const assignmentName = String(record.householdName || "").trim();
    if (assignmentName) {
      return assignmentName;
    }

    if (record.viewType === "households" || record.viewType === "companies") {
      return String(record.summary || "").trim() || "Profile";
    }

    return "No household linked";
  }

  function getDependentsDisplay(record) {
    const count = Number(record?.dependentsCount || 0);
    if (Number.isFinite(count) && count > 0) {
      return String(count);
    }

    return String(record?.hasDependents || "").trim().toLowerCase() === "yes" ? "Yes" : "-";
  }

  function getPoliciesDisplay(record) {
    const count = Number(record?.policyCount || 0);
    return Number.isFinite(count) && count > 0 ? String(count) : "0";
  }

  function populateForm(form, values) {
    if (!values) {
      return;
    }

    Object.entries(values).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (field) {
        field.value = value;
      }
    });
  }

  function loadJson(key) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function loadJsonSession(key) {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function getFirstName(name) {
    return name.split(" ").filter(Boolean)[0] || name;
  }

  function getCurrentLanguage() {
    const storedLanguage = localStorage.getItem(STORAGE_KEYS.language);
    return TRANSLATIONS[storedLanguage] ? storedLanguage : "en";
  }

  function translate(key, replacements = {}) {
    const language = getCurrentLanguage();
    const dictionary = TRANSLATIONS[language] || TRANSLATIONS.en;
    const fallback = TRANSLATIONS.en[key] || key;
    let value = dictionary[key] || fallback;

    Object.entries(replacements).forEach(([replacementKey, replacementValue]) => {
      value = value.replace(`{${replacementKey}}`, replacementValue);
    });

    return value;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  window.performLensSignOut = performSignOut;

  function buildInlineValue(first, second) {
    const parts = [first, second].filter(Boolean);
    return parts.length ? parts.join(" | ") : "Pending profile inputs";
  }

  function buildFamilySummary(profile) {
    const parts = [];

    if (profile.maritalStatus) {
      parts.push(profile.maritalStatus);
    }

    if (profile.dependents) {
      parts.push(`${profile.dependents} dependents`);
    }

    if (profile.youngestChildAge) {
      parts.push(`Youngest child age ${profile.youngestChildAge}`);
    }

    return parts.length ? parts.join(" | ") : "Family profile pending";
  }

  function saveClientCreationForm(form, feedback) {
    const currentSession = getCurrentSession();
    const today = formatDateInputValue(new Date());

    setFormFeedback(feedback, "");

    if (!form.reportValidity()) {
      return false;
    }

    const formData = new FormData(form);
    const records = getClientRecords();
    const clientStage = String(formData.get("clientStatus") || "Prospect");
    const statusGroup = mapClientStageToStatusGroup(clientStage);
    const advisorySource = String(formData.get("acquisitionSource") || "").trim();
    const advisorySourceOther = String(formData.get("acquisitionSourceOther") || "").trim();
    const source = advisorySource === "Other" ? (advisorySourceOther || "Other") : (advisorySource || "Advisor Entered");
    const coverageAmount = 0;
    const coverageGap = 0;
    const priority = normalizePriority(String(formData.get("advisoryPriority") || ""));
    if (!priority) {
      setFormFeedback(feedback, "Select a priority before continuing.");
      return false;
    }
    const firstName = String(formData.get("firstName") || "").trim();
    const preferredName = String(formData.get("preferredName") || "").trim();
    const summary = String(formData.get("clientNotes") || "").trim() || "New client profile";
    const lastName = String(formData.get("lastName") || "").trim();
    const assignmentMode = String(formData.get("profileAssignmentMode") || "").trim();
    const assignmentTargetId = String(formData.get("profileAssignmentTargetId") || "").trim();
    const requestedAssignmentName = String(formData.get("profileAssignmentName") || "").trim();
    const advisorName = String(formData.get("advisorName") || "").trim() || currentSession?.name || "";
    const createdBy = currentSession?.name || "Advisor";
    const dateProfileCreated = String(formData.get("dateProfileCreated") || today);
    const lastUpdatedDate = String(formData.get("lastUpdatedDate") || today);
    let householdId = "";
    let householdName = "";
    let profileGroupType = "";
    let nextRecords = [...records];

    if (!assignmentMode) {
      setFormFeedback(feedback, "Select how this client should be assigned before continuing.");
      return false;
    }

    if (assignmentMode === "existing-household" || assignmentMode === "existing-company") {
      const expectedType = assignmentMode === "existing-company" ? "companies" : "households";
      const existingProfile = nextRecords.find((record) => record.id === assignmentTargetId && record.viewType === expectedType);
      if (!existingProfile) {
          setFormFeedback(feedback, expectedType === "companies" ? "Select a valid business profile before saving." : "Select a valid household before saving.");
        return false;
      }

      householdId = existingProfile.id;
      householdName = existingProfile.displayName;
      profileGroupType = expectedType === "companies" ? "company" : "household";
      nextRecords = nextRecords.map((record) => {
        if (record.id !== existingProfile.id) {
          return record;
        }

        const currentCount = Number(record.insured || 0);
        const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;
        return {
          ...record,
          insured: String(nextCount),
          lastReview: lastUpdatedDate,
          statusGroup,
          priority,
          source,
          lastUpdatedDate
        };
      });
    } else if (assignmentMode === "create-household" || assignmentMode === "create-company") {
      if (!requestedAssignmentName) {
        setFormFeedback(feedback, assignmentMode === "create-company"
          ? "Enter a company profile name before saving."
          : "Enter a household name before saving.");
        return false;
      }

      const isCompany = assignmentMode === "create-company";
      householdName = isCompany ? formatCompanyDisplayName(requestedAssignmentName) : formatHouseholdDisplayName(requestedAssignmentName || lastName || firstName);
      householdId = `${isCompany ? "co" : "hh"}-${Date.now()}`;
      profileGroupType = isCompany ? "company" : "household";
      const groupRecord = {
        id: householdId,
        viewType: isCompany ? "companies" : "households",
        displayName: householdName,
        lastName,
        summary: isCompany ? "Business profile" : "Household profile",
        caseRef: buildNextCaseRef(nextRecords, isCompany ? "CL" : "HH"),
        lastReview: lastUpdatedDate,
        insured: "1",
        source,
        statusGroup,
        statusLabels: deriveStatusLabels(statusGroup, isCompany ? "company" : "household"),
        priority,
        coverageAmount,
        coverageGap,
        advisorName,
        createdBy,
        dateProfileCreated,
        lastUpdatedDate,
        householdId,
        dataSource: source
      };
      nextRecords.unshift(groupRecord);
    } else {
      setFormFeedback(feedback, "Choose how this client should be assigned before saving.");
      return false;
    }

    const record = {
      id: `cl-${Date.now()}`,
      viewType: "individuals",
      displayName: `${preferredName || firstName} ${lastName}`.trim(),
      firstName,
      middleName: String(formData.get("middleName") || "").trim(),
      lastName,
      preferredName,
      summary,
      caseRef: buildNextCaseRef(nextRecords, "CL"),
      lastReview: lastUpdatedDate,
      insured: "Yes",
      source,
      statusGroup,
      statusLabels: deriveStatusLabels(statusGroup, "individual"),
      priority,
      coverageAmount,
      coverageGap,
      householdId,
      householdName,
      profileGroupType,
      dateOfBirth: String(formData.get("dateOfBirth") || ""),
      age: Number(formData.get("age") || 0),
      targetRetirementAge: String(formData.get("targetRetirementAge") || "").trim(),
      insuranceRatingSex: String(formData.get("insuranceRatingSex") || ""),
      maritalStatus: String(formData.get("maritalStatus") || ""),
      spouseDateOfBirth: String(formData.get("spouseDateOfBirth") || ""),
      spouseAge: Number(formData.get("spouseAge") || 0),
      householdRole: String(formData.get("householdRole") || ""),
      businessType: String(formData.get("businessType") || ""),
      businessPlanningFocus: String(formData.get("businessPlanningFocus") || ""),
      ownershipPercent: Number(formData.get("ownershipPercent") || 0),
      businessCoverageRelevance: String(formData.get("businessCoverageRelevance") || ""),
      hasDependents: String(formData.get("hasDependents") || "No"),
      projectedDependents: String(formData.get("projectedDependents") || "No"),
      projectedDependentsCount: Number(formData.get("projectedDependentsCount") || 0),
      dependentsCount: Number(formData.get("dependentsCount") || 0),
      dependentAges: String(formData.get("dependentAges") || "").trim(),
      emailAddress: String(formData.get("emailAddress") || "").trim(),
      phoneNumber: String(formData.get("phoneNumber") || "").trim(),
      preferredContactMethod: String(formData.get("preferredContactMethod") || ""),
      streetAddress: String(formData.get("streetAddress") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      zipCode: String(formData.get("zipCode") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      occupation: String(formData.get("occupation") || "").trim(),
      employerName: String(formData.get("employerName") || "").trim(),
      employmentStatus: String(formData.get("employmentStatus") || ""),
      advisorName,
      firmName: String(formData.get("firmName") || "").trim(),
      dateProfileCreated,
      lastUpdatedDate,
      createdBy,
      dataSource: source,
      planningPriority: "",
      clientStage,
      clientNotes: String(formData.get("clientNotes") || "").trim()
    };

    nextRecords.unshift(record);
    writeClientRecords(nextRecords);
    sessionStorage.setItem(STORAGE_KEYS.pendingClientRecords, JSON.stringify([record]));
    setLinkedCaseRef(record.caseRef);
    sessionStorage.setItem(STORAGE_KEYS.clientViewIntent, "individuals");
    sessionStorage.setItem(STORAGE_KEYS.clientView, "individuals");
    sessionStorage.setItem(STORAGE_KEYS.clientStatus, "all");
    sessionStorage.setItem(STORAGE_KEYS.clientItemsShownReset, "true");
    window.location.href = "clients.html";
    return true;
  }

  const ANALYSIS_TOOL_PATHS = new Set([
    "profile.html",
    "manual-protection-modeling-inputs.html",
    "manual-simplified-pmi.html",
    "manual-minimum-inputs.html",
    "income-loss-impact.html",
    "analysis-estimate.html",
    "analysis-detail.html",
    "recommendations.html",
    "planner.html",
    "summary.html"
  ]);

  function getPathBasename(value) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return "";
    }

    const withoutQuery = normalized.split("#")[0].split("?")[0];
    const parts = withoutQuery.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : "";
  }

  function isAnalysisToolPath(value) {
    return ANALYSIS_TOOL_PATHS.has(getPathBasename(value));
  }

  function ensureTemporaryAnalysisLeaveModal() {
    let modal = document.querySelector("[data-analysis-leave-modal]");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.className = "lens-leave-modal";
    modal.setAttribute("data-analysis-leave-modal", "");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="lens-leave-modal-backdrop" data-analysis-leave-stay></div>
      <div class="lens-leave-modal-panel" role="dialog" aria-modal="true" aria-labelledby="analysis-leave-title">
        <h2 id="analysis-leave-title">Leave LENS Analysis?</h2>
        <p>If you leave the analysis tool, temporary manual input data will be lost.</p>
        <div class="lens-leave-modal-actions">
          <button class="btn btn-secondary" type="button" data-analysis-leave-stay>Stay</button>
          <button class="btn btn-primary" type="button" data-analysis-leave-confirm>Leave</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function promptTemporaryAnalysisLeave(onLeave) {
    if (!hasTemporaryAnalysisData()) {
      onLeave?.();
      return false;
    }

    const modal = ensureTemporaryAnalysisLeaveModal();
    const stayButtons = Array.from(modal.querySelectorAll("[data-analysis-leave-stay]"));
    const leaveButton = modal.querySelector("[data-analysis-leave-confirm]");

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("is-modal-open");
    }

    modal.hidden = false;
    document.body.classList.add("is-modal-open");

    const handleLeave = () => {
      clearTemporaryAnalysisSession();
      closeModal();
      onLeave?.();
    };

    leaveButton.onclick = handleLeave;
    stayButtons.forEach((button) => {
      button.onclick = closeModal;
    });

    return true;
  }

  function initializeTemporaryAnalysisLeaveGuard() {
    if (!isAnalysisToolPath(window.location.pathname)) {
      return;
    }

    if (document.body.dataset.analysisLeaveGuardInitialized === "true") {
      return;
    }
    document.body.dataset.analysisLeaveGuardInitialized = "true";

    let allowUnload = consumeAnalysisInternalNavigation();
    if (!history.state || history.state.analysisLeaveGuard !== true) {
      try {
        history.pushState({ ...(history.state || {}), analysisLeaveGuard: true }, "", window.location.href);
      } catch (_error) {
      }
    }

    window.addEventListener("beforeunload", (event) => {
      if (allowUnload || !hasTemporaryAnalysisData()) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    });

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
      } else {
        const nextUrl = new URL(anchor.getAttribute("href"), window.location.href);
        if (!hasTemporaryAnalysisData() || nextUrl.href === window.location.href) {
          return;
        }

        if (isAnalysisToolPath(nextUrl.pathname)) {
          allowUnload = true;
          markAnalysisInternalNavigation();
          return;
        }

        event.preventDefault();
        promptTemporaryAnalysisLeave(() => {
          allowUnload = true;
          window.location.href = nextUrl.href;
        });
        return;
      }

      const signOutButton = event.target.closest("[data-site-header-sign-out]");
      if (!signOutButton || !hasTemporaryAnalysisData()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      promptTemporaryAnalysisLeave(() => {
        allowUnload = true;
        localStorage.removeItem(STORAGE_KEYS.authSession);
        const isNestedPage = window.location.pathname.includes("/pages/");
        window.location.href = isNestedPage ? "../index.html" : "index.html";
      });
    }, true);

    window.addEventListener("popstate", () => {
      if (allowUnload || !hasTemporaryAnalysisData()) {
        return;
      }

      try {
        history.pushState({ ...(history.state || {}), analysisLeaveGuard: true }, "", window.location.href);
      } catch (_error) {
      }

      promptTemporaryAnalysisLeave(() => {
        allowUnload = true;
        history.back();
      });
    });
  }

  window.saveLensClientCreationForm = saveClientCreationForm;
  window.getLensLinkedCaseRef = getLinkedCaseRef;
  window.setLensLinkedCaseRef = setLinkedCaseRef;
  window.getLensLinkedRecordId = getLinkedRecordId;
  window.setLensLinkedRecordId = setLinkedRecordId;
  window.getLensTemporaryAnalysisSession = getTemporaryAnalysisSession;
  window.hasLensTemporaryAnalysisSession = hasTemporaryAnalysisData;
  window.promptLensAnalysisExit = promptTemporaryAnalysisLeave;
  window.saveLensTemporaryAnalysisSession = saveTemporaryAnalysisSession;
  window.clearLensTemporaryAnalysisSession = clearTemporaryAnalysisSession;
  window.restoreLensTemporaryAnalysisForm = restoreTemporaryAnalysisForm;
  window.getLensAnalysisSource = getActiveAnalysisSource;
  window.buildLensAnalysisBucketsFromData = buildAnalysisBucketsFromData;
  window.beginLensAnalysisInternalNavigation = markAnalysisInternalNavigation;
  window.getLensFederalTaxBrackets = getFederalTaxBracketOptions;
  window.serializeLensFormSnapshot = serializeFormSnapshot;
  window.saveLensLinkedWorkflowSection = saveLinkedWorkflowSection;
  window.saveLensLinkedWorkflowSectionWithFallback = saveLinkedWorkflowSectionWithFallback;
  document.addEventListener("DOMContentLoaded", () => {
    if (isAnalysisToolPath(window.location.pathname)) {
      initializeTemporaryAnalysisLeaveGuard();
      return;
    }

    if (getTemporaryAnalysisSession()?.hasData) {
      clearTemporaryAnalysisSession();
    }
  });

  function formatCurrency(value) {
    const number = Number(value);
    if (!number) {
      return "Value pending";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(number);
  }

  function formatClientDetailValue(value) {
    if (value === null || value === undefined) {
      return "Not provided";
    }

    if (typeof value === "number") {
      return value ? String(value) : "Not provided";
    }

    const normalized = String(value).trim();
    return normalized || "Not provided";
  }
})();
