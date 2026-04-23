javascript: (() => {
  const prev = document.getElementById("ht-bm-container");
  if (prev) {
    clearInterval(prev._bmInterval);
    prev.remove();
  }

  const BASE =
    "https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website";
  const DETAIL =
    "https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/#/my-travels/detail";

  /* ── i18n ── */
  const strings = {
    en: {
      title: "FIND YOUR TICKET",
      pnrEmail: "Email + PNR",
      pnrCp: "PNR + CP",
      guest: "Rescue Code",
      email: "E-Mail",
      pnr: "PNR / Ticket Code",
      firstName: "First name",
      lastName: "Last name",
      rescueCode: "Rescue code",
      search: "Search",
      searching: "Searching...",
      errEmail: "Please enter email and PNR.",
      errPnrCp: "Please enter PNR and CP.",
      errGuest: "Please enter first name, last name, and rescue code.",
      errNone: "No ticket found.",
    },
    it: {
      title: "TROVA IL TUO BIGLIETTO",
      pnrEmail: "Email + PNR",
      pnrCp: "PNR + CP",
      guest: "Codice di recupero",
      email: "E-Mail",
      pnr: "PNR / Codice biglietto",
      firstName: "Nome",
      lastName: "Cognome",
      rescueCode: "Codice di recupero",
      search: "Cerca",
      searching: "Ricerca in corso...",
      errEmail: "Inserisci email e PNR.",
      errPnrCp: "Inserisci PNR e CP.",
      errGuest: "Inserisci nome, cognome e codice di recupero.",
      errNone: "Nessun biglietto trovato.",
    },
    el: {
      title: "ΒΡΕΙΤΕ ΤΟ ΕΙΣΙΤΗΡΙΟ ΣΑΣ",
      pnrEmail: "Email + PNR",
      pnrCp: "PNR + CP",
      guest: "Κωδικός ανάκτησης",
      email: "E-Mail",
      pnr: "PNR / Κωδικός εισιτηρίου",
      firstName: "Όνομα",
      lastName: "Επώνυμο",
      rescueCode: "Κωδικός ανάκτησης",
      search: "Αναζήτηση",
      searching: "Αναζήτηση...",
      errEmail: "Εισάγετε email και PNR.",
      errPnrCp: "Εισάγετε PNR και CP.",
      errGuest: "Εισάγετε όνομα, επώνυμο και κωδικό ανάκτησης.",
      errNone: "Δεν βρέθηκε εισιτήριο.",
    },
  };

  const detectLang = () => {
    const hidden = document.querySelector(
      ".dropdown-menu .dropdown-item.aurelia-hide",
    );
    if (hidden) {
      const s = hidden.textContent.trim().toLowerCase();
      if (s.includes("english")) return "en";
      if (s.includes("italiano")) return "it";
      if (s.includes("ελληνικά")) return "el";
    }
    const el = document.querySelector('[i18n="header.search"]');
    if (el) {
      const s = el.textContent.trim().toLowerCase();
      if (s === "cerca") return "it";
      if (s === "αναζήτηση") return "el";
    }
    return "en";
  };

  let lang = detectLang();
  const t = (key) => (strings[lang] || strings.en)[key] || strings.en[key];

  /* ── helpers ── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const apiPost = (url, body) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      referrer:
        "https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/",
    }).then((r) => r.json());

  const val = (id) => document.getElementById(id)?.value.trim();
  const getMode = () => $('input[name="bm-mode"]:checked')?.value;
  const resultDiv = () => $("#ht-bm-result");

  const FIELDS = {
    pnrEmail: ["bm-email", "bm-pnr"],
    pnrCp: ["bm-pnr2", "bm-cp2"],
    guest: ["bm-vorname", "bm-nachname", "bm-code"],
  };

  /* ── build UI ── */
  const inputGroup = (key, id, type = "text") =>
    `<div class="input-group generic-shadow">
      <div class="input-group-prepend"><span class="input-group-text bm-label" data-key="${key}">${t(key)}:</span></div>
      <input id="${id}" type="${type}" class="form-control border-left-0 pl-1" />
    </div>`;

  const radioOpt = (value, key) =>
    `<div class="form-check form-check-inline">
      <label class="form-check-label text-white">
        <input type="radio" class="form-check-input" name="bm-mode" value="${value}" ${value === "pnrEmail" ? "checked" : ""} />
        <span class="bm-radio" data-key="${key}">${t(key)}</span>
      </label>
    </div>`;

  const container = document.querySelector("#main-content") || document.body;
  container.insertAdjacentHTML(
    "beforeend",
    `<div class="container" id="ht-bm-container">
      <div class="card border-0 rounded-0 mt-5 py-4 px-sm-4 search-widgets search-widgets-bg">
        <div class="px-3">
          <h5 class="mb-2 text-white font-weight-bold" id="ht-bm-title">${t("title")}</h5>
          <div class="mb-3">
            ${radioOpt("pnrEmail", "pnrEmail")}
            ${radioOpt("pnrCp", "pnrCp")}
            ${radioOpt("guest", "guest")}
          </div>
          <div class="d-flex align-items-center">
            <div class="flex-grow-1">
              <div id="ht-bm-fields-pnrEmail">
                <div class="row mb-2">
                  <div class="col-md-6 mb-2 mb-md-0">${inputGroup("email", "bm-email", "email")}</div>
                  <div class="col-md-6">${inputGroup("pnr", "bm-pnr")}</div>
                </div>
              </div>
              <div id="ht-bm-fields-pnrCp" style="display:none;">
                <div class="row mb-2">
                  <div class="col-md-6 mb-2 mb-md-0">${inputGroup("pnr", "bm-pnr2")}</div>
                  <div class="col-md-6">${inputGroup("pnrCp", "bm-cp2")}</div>
                </div>
              </div>
              <div id="ht-bm-fields-guest" style="display:none;">
                <div class="row mb-2">
                  <div class="col-md-4 mb-2 mb-md-0">${inputGroup("firstName", "bm-vorname")}</div>
                  <div class="col-md-4 mb-2 mb-md-0">${inputGroup("lastName", "bm-nachname")}</div>
                  <div class="col-md-4">${inputGroup("rescueCode", "bm-code")}</div>
                </div>
              </div>
            </div>
            <button id="bm-search-btn" type="button" class="btn btn-circle btn-orange btn-md d-none d-md-block ml-3"
              data-container="body" data-toggle="popover" data-trigger="hover" data-placement="top"
              data-content="${t("search")}" disabled>
              <span class="icon icon-4 icon-keyboard_arrow_right"></span>
            </button>
          </div>
          <button id="bm-search-btn-xs" type="button" class="btn btn-orange btn-block d-md-none mb-2" disabled>${t("search")}</button>
          <div id="ht-bm-result" style="display:none;"></div>
        </div>
      </div>
    </div>`,
  );

  /* ── popover ── */
  const initPopover = () => globalThis.jQuery?.("#bm-search-btn").popover();
  initPopover();

  /* ── language polling ── */
  const updateLang = () => {
    document.getElementById("ht-bm-title").textContent = t("title");
    $$(".bm-label").forEach((el) => {
      el.textContent = t(el.dataset.key) + ":";
    });
    $$(".bm-radio").forEach((el) => {
      el.textContent = t(el.dataset.key);
    });
    $("#bm-search-btn-xs").textContent = t("search");
    const rb = $("#bm-search-btn");
    rb.dataset.content = t("search");
    globalThis.jQuery?.(rb).popover("dispose");
    initPopover();
  };

  const langInterval = setInterval(() => {
    const newLang = detectLang();
    if (newLang === lang) return;
    lang = newLang;
    updateLang();
  }, 500);
  document.getElementById("ht-bm-container")._bmInterval = langInterval;

  /* ── validation ── */
  const checkValid = () => {
    const ids = FIELDS[getMode()] || [];
    const valid = ids.every((id) => val(id));
    $("#bm-search-btn").disabled = !valid;
    $("#bm-search-btn-xs").disabled = !valid;
  };

  /* ── mode switching ── */
  const updateFields = () => {
    const mode = getMode();
    ["pnrEmail", "pnrCp", "guest"].forEach((m) => {
      document.getElementById("ht-bm-fields-" + m).style.display =
        m === mode ? "" : "none";
    });
    resultDiv().style.display = "none";
    resultDiv().innerHTML = "";
    checkValid();
  };

  /* ── search ── */
  const showError = (msg) => {
    const r = resultDiv();
    r.style.display = "";
    r.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
  };

  const search = () => {
    const mode = getMode();
    resultDiv().style.display = "none";
    resultDiv().innerHTML = "";

    let payload;
    if (mode === "pnrEmail") {
      payload = {
        recoverType: "PNR_EMAIL",
        pnr: val("bm-pnr"),
        email: val("bm-email"),
      };
    } else if (mode === "pnrCp") {
      payload = {
        recoverType: "PNR_CP",
        pnr: val("bm-pnr2"),
        cpCode: val("bm-cp2"),
      };
    } else {
      payload = {
        recoverType: "RESCUE_CODE",
        name: val("bm-vorname"),
        surname: val("bm-nachname"),
        rescueCode: val("bm-code"),
      };
    }

    const r = resultDiv();
    r.style.display = "";
    r.innerHTML = `<div class="text-white">${t("searching")}</div>`;

    apiPost(`${BASE}/travel/recover`, payload)
      .then((json) => {
        const solution = [
          ...(json?.solutions || []),
          ...(json?.closedSolutions || []),
        ].find((s) => s?.resourceId);
        if (solution) {
          clearInterval(langInterval);
          globalThis.location.href = `${DETAIL}?resourceId=${encodeURIComponent(solution.resourceId)}`;
        } else {
          showError(json?.message || t("errNone"));
        }
      })
      .catch((e) => showError(`${e}`));
  };

  /* ── event listeners ── */
  $$('input[name="bm-mode"]').forEach((r) =>
    r.addEventListener("change", updateFields),
  );

  $$(
    '#ht-bm-container input[type="text"], #ht-bm-container input[type="email"]',
  ).forEach((input) => {
    input.addEventListener("input", checkValid);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !$("#bm-search-btn").disabled) search();
    });
  });

  $("#bm-search-btn").addEventListener("click", search);
  $("#bm-search-btn-xs").addEventListener("click", search);
})();
