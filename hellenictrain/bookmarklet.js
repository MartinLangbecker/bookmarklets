javascript: (() => {
  /*
    Inject custom styles, once.
  */
  const styles = `
      #bahn-bm-root { background:#fff; box-shadow:0 2px 24px #0003; margin-top:40px; margin-bottom:40px; }
      #bahn-bm-root h3 { font-size:1.4rem; margin-bottom:12px; }
      #bahn-bm-root label { display:block; font-weight:bold; margin-top:8px; }
      #bahn-bm-root input, #bahn-bm-root select { margin:2px 0 8px; width:100%; max-width:295px; display:block; padding:7px 10px; border-radius:4px; border:1px solid #CCC; }
      #bahn-bm-root input[type="radio"] { width:auto; display:inline; margin-right:6px; }
      #bahn-bm-root .bahn-bm-radio-group { margin-bottom:12px; }
      #bahn-bm-root .bahn-bm-row { display:flex; flex-wrap:wrap; gap:16px; }
      #bahn-bm-root .bahn-bm-col { flex:1; min-width:200px; }
      #bahn-bm-root button { margin-top:14px; padding:10px 22px; background:#0047bb; color:#fff; font-weight:bold; border:none; border-radius:4px; cursor:pointer; }
      #bahn-bm-root .bahn-bm-result { margin-top:16px; padding:16px 10px; background:#f8f7fa;}
      .bahn-bm-ticket-details .bm-title { font-size:1.1rem; font-weight:bold; margin-bottom:10px; }
      .bahn-bm-ticket-details .bm-row { display:flex; align-items:center; margin-bottom:8px; gap:14px; flex-wrap:wrap;}
      .bahn-bm-ticket-details .bm-label { min-width:96px; color:#888; font-weight:bold; }
      .bahn-bm-ticket-details .bm-value { font-family:inherit; font-size:1.08em; }
      .bahn-bm-ticket-details .bm-pax-table { width:100%; border-collapse:collapse; margin-top:18px;}
      .bahn-bm-ticket-details .bm-pax-table th,
      .bahn-bm-ticket-details .bm-pax-table td { border:1px solid #ddd; padding:4px 10px;}
      .bahn-bm-ticket-details .bm-pax-table th { background: #e3e6ed;}
      .bahn-bm-ticket-details .bm-pax-table td { background:#fff;}
      .bahn-bm-ticket-details .bm-section-title { margin-top: 18px; font-size:1.05em; font-weight:bold; color:#225; }
      .bahn-bm-ticket-details .bm-offer-info { font-size:0.95em; color:#446; }
      .bahn-bm-ticket-details .bm-price { font-size:1.13em; font-weight:bold; }
      .bahn-bm-ticket-details .bm-small { font-size:0.95em; color:#666; }
      .bahn-bm-managebox { margin-top:24px; margin-bottom:16px; background:#f3f5f7; padding:18px; box-shadow:0 1px 5px #0001; }
      .bahn-bm-managebox-title { font-size:1.1em; font-weight:bold; margin-bottom:8px; color:#00307f; }
      .bahn-bm-management-panel { display: flex; flex-direction: column; gap:0; }
      .bahn-bm-management-panel .bm-panel-item { color:#0047bb; background:transparent; text-decoration:none; font-weight:600; border:none; border-bottom:1px solid #e3e6ed; text-align:left; padding:10px 0 10px 0; cursor:pointer; font-size:1em; transition: background 0.1s; }
      .bahn-bm-management-panel .bm-panel-item:last-child { border-bottom:none; }
      .bahn-bm-management-panel .bm-panel-item:hover { background:#d9e2ee; }
      .bahn-bm-managebox-result { margin-top:18px; padding:12px 10px; background:#f0f5fd; color:#222; font-family:monospace; font-size:13px; border:1px solid #e0ebfc; white-space:pre-wrap; word-break:break-all; border-radius:6px; }
    `;
  if (!document.getElementById("bahn-bm-styles")) {
    const styleElem = document.createElement("style");
    styleElem.id = "bahn-bm-styles";
    styleElem.innerHTML = styles;
    document.head.appendChild(styleElem);
  }

  /*
    Remove old container if present.
  */
  const prevContainer = document.getElementById("bahn-bm-container");
  if (prevContainer) prevContainer.remove();

  /*
    Helper: Send ticket search request to endpoint.
  */
  const sendTicketSearch = (payload) => {
    return fetch(
      "https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website/travel/recover",
      {
        headers: { "content-type": "application/json" },
        method: "POST",
        body: JSON.stringify(payload),
        referrer:
          "https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/",
      },
    ).then((res) => res.json());
  };

  /*
    Find IDs for management actions.
  */
  const findIds = (solution, requestedAction) => {
    if (requestedAction === "ADD_ADDITIONAL_SERVICE") {
      return solution?.resourceId ? [solution.resourceId] : [];
    }
    const foundAction = solution?.solutionActions?.find(
      (actionObj) => actionObj.action === requestedAction,
    );
    if (foundAction?.resourceIds?.length > 0) {
      return foundAction.resourceIds;
    }
    return [];
  };

  /*
    Definitions for management actions, only accepts IDs as arguments.
  */
  const MANAGEMENT_URL =
    "https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website/secondcontact/select";
  const ACTIONS_TO_REQUEST = {
    changeDateTime: (resourceIds) => ({
      url: MANAGEMENT_URL,
      body: { action: "BOOKING_CHANGE", resourceIds },
      method: "POST",
    }),
    changeTicket: (resourceIds) => ({
      url: MANAGEMENT_URL,
      body: { action: "TRAVEL_CHANGE", resourceIds },
      method: "POST",
    }),
    addServices: (resourceIds) => ({
      url: MANAGEMENT_URL,
      body: { action: "ADD_ADDITIONAL_SERVICE", resourceIds },
      method: "POST",
    }),
    refund: (resourceIds) => ({
      url: MANAGEMENT_URL,
      body: { action: "REFUND", resourceIds },
      method: "POST",
    }),
  };

  /*
    Management panel option metadata.
  */
  const MANAGEMENT_OPTIONS = [
    {
      key: "changeDateTime",
      label: "Change Date/Time",
      action: "BOOKING_CHANGE",
    },
    { key: "changeTicket", label: "Change Ticket", action: "TRAVEL_CHANGE" },
    {
      key: "addServices",
      label: "Add Services",
      action: "ADD_ADDITIONAL_SERVICE",
    },
    { key: "refund", label: "Refund", action: "REFUND" },
    {
      key: "downloadPdf",
      label: "Download PDF",
      action: "DOWNLOAD_PDF",
    },
  ];

  /*
    Helper: Checks if a date is in DST.
  */
  const isDST = (date) => {
    const jan = new Date(Date.UTC(date.getFullYear(), 0, 1));
    return date.getTimezoneOffset() < jan.getTimezoneOffset();
  };

  /*
    Helper: Format a time in a given zone.
  */
  const formatZoned = (iso, zone) => {
    if (!iso) return "";
    const date = new Date(iso);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: zone,
    };
    const dateStr = date.toLocaleString("de-DE", options);
    let abbr = "";
    if (zone === "Europe/Berlin") abbr = isDST(date) ? "CEST" : "CET";
    if (zone === "Europe/Athens") abbr = isDST(date) ? "EEST" : "EET";
    return `${dateStr.replace(",", "")} ${abbr}`;
  };

  /*
    Render a management panel as a DOM node, for a solution object.
  */
  const renderManagementPanel = (solution) => {
    const manageRoot = document.createElement("div");
    manageRoot.className = "bahn-bm-managebox";
    manageRoot.id = "bahn-bm-management-panel-root";
    manageRoot.innerHTML = `
      <div class="bahn-bm-managebox-title">Manage</div>
      <div class="bahn-bm-management-panel">
        ${MANAGEMENT_OPTIONS.map(
          (option) => `
          <button class="bm-panel-item" type="button" data-manage-key="${option.key}">${option.label}</button>
        `,
        ).join("")}
      </div>
      <div class="bahn-bm-managebox-result" style="display:none;"></div>
    `;

    const panel = manageRoot.querySelector(".bahn-bm-management-panel");
    const outbox = manageRoot.querySelector(".bahn-bm-managebox-result");

    panel.querySelectorAll(".bm-panel-item").forEach((button) => {
      const key = button.dataset.manageKey;
      const mgmtConf = MANAGEMENT_OPTIONS.find((option) => option.key === key);

      button.addEventListener("click", async () => {
        if (key === "downloadPdf") {
          /* PDF download logic */
          outbox.style.display = "block";
          outbox.textContent = "Downloading PDF...";
          const resourceId = solution.resourceId;
          try {
            const res = await fetch(
              ACTIONS_TO_REQUEST.downloadPdf(resourceId).url,
              {
                method: "GET",
                credentials: "same-origin",
              },
            );
            if (!res.ok) {
              outbox.textContent =
                "Failed to download PDF. Status: " + res.status;
              return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Ticket_${resourceId || "unknown"}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              a.remove();
              window.URL.revokeObjectURL(url);
            }, 2000);
            outbox.textContent =
              "PDF downloaded (may open in a new tab or download folder).";
          } catch (e) {
            outbox.textContent = `Failed to download PDF: ${e}`;
          }
          return;
        }
        /* Normal action logic */
        const resourceIds = findIds(solution, mgmtConf.action);
        if (!ACTIONS_TO_REQUEST[key]) {
          outbox.style.display = "block";
          outbox.textContent = "Action not implemented.";
          return;
        }
        outbox.style.display = "block";
        outbox.textContent = "Loading ...";
        const req = ACTIONS_TO_REQUEST[key](resourceIds);
        fetch(req.url, {
          method: req.method || "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(req.body),
        })
          .then((response) => response.json())
          .then((json) => {
            outbox.textContent = JSON.stringify(json, null, 2);
          })
          .catch((error) => {
            outbox.textContent = `Error: ${error}`;
          });
      });
    });
    return manageRoot;
  };

  /*
    Format search result as HTML, but inserts manage panel placeholders.
  */
  const formatTicketResponse = (ticketData) => {
    if (
      !ticketData?.solutions ||
      !Array.isArray(ticketData.solutions) ||
      ticketData.solutions.length === 0
    ) {
      return "<div>No valid ticket data found.</div>";
    }
    const purchaseDate = ticketData.purchaseDate
      ? `<div class="bm-row"><span class="bm-label">Purchased on:</span><span class="bm-value">${formatZoned(ticketData.purchaseDate, "Europe/Berlin")}</span></div>`
      : "";
    let html = '<div class="bahn-bm-ticket-details">';
    if (purchaseDate)
      html += `<div class="bm-title">Trip Details</div>${purchaseDate}`;
    ticketData.solutions.forEach((solution, idx) => {
      const container = solution.solutionContainer;
      if (!container) return;
      const summary = container.solutionSummary || {};
      const origin = summary.origin || "";
      const destination = summary.destination || "";
      const depTime = summary.departureTime
        ? formatZoned(summary.departureTime, "Europe/Athens")
        : "";
      const arrTime = summary.arrivalTime
        ? formatZoned(summary.arrivalTime, "Europe/Athens")
        : "";
      const passengerArr = [];
      if (summary.adults)
        passengerArr.push(
          `${summary.adults} Adult${summary.adults > 1 ? "s" : ""}`,
        );
      if (summary.children)
        passengerArr.push(
          `${summary.children} Child${summary.children > 1 ? "ren" : ""}`,
        );
      html += `
        <div class="bm-row">
          <span class="bm-label">From:</span><span class="bm-value">${origin}</span>
          <span class="bm-label">To:</span><span class="bm-value">${destination}</span>
        </div>
        <div class="bm-row">
          <span class="bm-label">Departure:</span><span class="bm-value">${depTime}</span>
          <span class="bm-label">Arrival:</span><span class="bm-value">${arrTime}</span>
        </div>
        <div class="bm-row">
          <span class="bm-label">Passengers:</span><span class="bm-value">${passengerArr.join(", ") || "Unknown"}</span>
          <span class="bm-label">Price:</span><span class="bm-value bm-price">${summary.totalPrice ? summary.totalPrice.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + (summary.totalPrice.currency || "") : "-"}</span>
        </div>
      `;
      (container.nodeSummaries || []).forEach((node) => {
        const nodeView = node.nodeView || {};
        const train = nodeView.train || {};
        html += `
          <div class="bm-section-title">Connection</div>
          <div class="bm-row bm-small">
            <span class="bm-label">From:</span><span class="bm-value">${nodeView.origin || ""}</span>
            <span class="bm-label">Time:</span><span class="bm-value">${nodeView.departureTime ? formatZoned(nodeView.departureTime, "Europe/Athens") : ""}</span>
          </div>
          <div class="bm-row bm-small">
            <span class="bm-label">To:</span><span class="bm-value">${nodeView.destination || ""}</span>
            <span class="bm-label">Time:</span><span class="bm-value">${nodeView.arrivalTime ? formatZoned(nodeView.arrivalTime, "Europe/Athens") : ""}</span>
          </div>
          <div class="bm-row bm-small">
            <span class="bm-label">Mode:</span><span class="bm-value">${train.denomination || ""} ${train.name || ""}</span>
            ${node.pnr ? `<span class="bm-label">PNR:</span><span class="bm-value">${node.pnr}</span>` : ""}
          </div>
        `;
        const offers = (node.offerContainerSummaryViews || []).flatMap(
          (summaryView) => summaryView.offerSummaryViews || [],
        );
        if (offers.length > 0) {
          html += `
            <div class="bm-section-title">Passenger Details</div>
            <table class="bm-pax-table">
              <tr><th>Name</th><th>Service</th><th>Offer</th><th>Seat</th><th>Car</th><th>CP</th><th>Price</th></tr>
              ${offers
                .map((offer) => {
                  const passenger = offer.traveller || {};
                  const seatInfo = offer.seatInfo?.[0] || {};
                  return `
                    <tr>
                      <td>${[passenger.firstName || "", passenger.lastName || ""].join(" ")}</td>
                      <td>${offer.serviceName || ""}</td>
                      <td>${offer.offerName || ""}</td>
                      <td>${seatInfo.seat || ""}</td>
                      <td>${seatInfo.wagon || ""}</td>
                      <td>${offer.cpCode || ""}</td>
                      <td>${offer.price ? offer.price.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + (offer.price.currency || "") : ""}</td>
                    </tr>`;
                })
                .join("")}
            </table>
          `;
        }
      });
      /* Insert a unique panel placeholder per solution. */
      html += `<div class="bm-manage-placeholder" data-placeholder-idx="${idx}"></div>`;
    });
    html += "</div>";
    return html;
  };

  /*
    Build main UI and insert into the DOM.
  */
  const html = `
    <div class="container" id="bahn-bm-container">
      <div id="bahn-bm-root" class="card border-0 rounded-0 mt-5 py-4 px-sm-4 search-widgets search-widgets-bg">
        <h3>Find & Manage Train Tickets (Beta)</h3>
        <div class="bahn-bm-radio-group">
          <label><input type="radio" name="bm-mode" value="findTicket" checked /> Find Ticket</label>
          <label><input type="radio" name="bm-mode" value="findWithPnrCp" /> Find by PNR/CP</label>
          <label><input type="radio" name="bm-mode" value="guest" /> Guest Ticket (no Account)</label>
        </div>
        <div class="bahn-bm-fields" id="bahn-bm-fields-findTicket">
          <div class="bahn-bm-row">
            <div class="bahn-bm-col"><label for="bm-email">E-Mail</label><input id="bm-email" type="email" placeholder="E-Mail"></div>
            <div class="bahn-bm-col"><label for="bm-pnr">PNR / Ticket Code</label><input id="bm-pnr" type="text" placeholder="Code"></div>
          </div>
        </div>
        <div class="bahn-bm-fields" id="bahn-bm-fields-findWithPnrCp" style="display:none;">
          <div class="bahn-bm-row">
            <div class="bahn-bm-col"><label for="bm-pnr2">PNR</label><input id="bm-pnr2" type="text" placeholder="PNR"></div>
            <div class="bahn-bm-col"><label for="bm-cp2">CP</label><input id="bm-cp2" type="text" placeholder="CP"></div>
          </div>
        </div>
        <div class="bahn-bm-fields" id="bahn-bm-fields-guest" style="display:none;">
          <div class="bahn-bm-row">
            <div class="bahn-bm-col"><label for="bm-vorname">First name</label><input id="bm-vorname" type="text" placeholder="First name"></div>
            <div class="bahn-bm-col"><label for="bm-nachname">Last name</label><input id="bm-nachname" type="text" placeholder="Last name"></div>
            <div class="bahn-bm-col"><label for="bm-code">Lookup Code</label><input id="bm-code" type="text" placeholder="Lookup code"></div>
          </div>
        </div>
        <button id="bm-search-btn" type="button">Search</button>
        <div class="bahn-bm-result" id="bahn-bm-result" style="display:none;"></div>
      </div>
    </div>
  `;
  const mainContent = document.querySelector("#main-content") || document.body;
  mainContent.insertAdjacentHTML("beforeend", html);

  /*
    Update display of fields based on search mode.
  */
  const updateFields = () => {
    const mode = document.querySelector('input[name="bm-mode"]:checked')?.value;
    document.getElementById("bahn-bm-fields-findTicket").style.display =
      mode === "findTicket" ? "" : "none";
    document.getElementById("bahn-bm-fields-findWithPnrCp").style.display =
      mode === "findWithPnrCp" ? "" : "none";
    document.getElementById("bahn-bm-fields-guest").style.display =
      mode === "guest" ? "" : "none";
    document.getElementById("bahn-bm-result").style.display = "none";
    document.getElementById("bahn-bm-result").innerHTML = "";
  };
  document.querySelectorAll('input[name="bm-mode"]').forEach((radio) => {
    radio.addEventListener("change", updateFields);
  });

  /*
    Run the search and render results.
    After HTML is inserted, attach each real management panel to its placeholder.
  */
  const searchAction = () => {
    const mode = document.querySelector('input[name="bm-mode"]:checked')?.value;
    const resultDiv = document.getElementById("bahn-bm-result");
    resultDiv.style.display = "none";
    resultDiv.innerHTML = "";

    const printError = (msg) => {
      resultDiv.style.display = "";
      resultDiv.innerHTML = `<div style="color:#c80f2d;font-weight:bold;padding:8px;">${msg}</div>`;
    };

    let payload;
    if (mode === "findTicket") {
      const email = document.getElementById("bm-email")?.value.trim();
      const pnr = document.getElementById("bm-pnr")?.value.trim();
      if (!email || !pnr) {
        printError("Please enter email and PNR.");
        return;
      }
      payload = { recoverType: "PNR_EMAIL", pnr, email };
    } else if (mode === "findWithPnrCp") {
      const pnr = document.getElementById("bm-pnr2")?.value.trim();
      const cpCode = document.getElementById("bm-cp2")?.value.trim();
      if (!pnr || !cpCode) {
        printError("Please enter PNR and CP.");
        return;
      }
      payload = { recoverType: "PNR_CP", pnr, cpCode };
    } else if (mode === "guest") {
      const name = document.getElementById("bm-vorname")?.value.trim();
      const surname = document.getElementById("bm-nachname")?.value.trim();
      const rescueCode = document.getElementById("bm-code")?.value.trim();
      if (!name || !surname || !rescueCode) {
        printError("Please enter first name, last name, and lookup code.");
        return;
      }
      payload = { recoverType: "RESCUE_CODE", name, surname, rescueCode };
    } else {
      printError("Only ticket search features are implemented.");
      return;
    }

    resultDiv.style.display = "";
    resultDiv.innerHTML = "Loading ...";
    sendTicketSearch(payload)
      .then((json) => {
        if (json?.solutions?.length > 0) {
          resultDiv.innerHTML = formatTicketResponse(json);
          /*
               After HTML insertion, add real panels to placeholders
            */
          if (json.solutions) {
            json.solutions.forEach((solution, idx) => {
              const ph = resultDiv.querySelector(
                `.bm-manage-placeholder[data-placeholder-idx="${idx}"]`,
              );
              if (ph) ph.replaceWith(renderManagementPanel(solution));
            });
          }
        } else if (json?.message) {
          printError(json.message);
        } else {
          printError("No trip found.");
        }
      })
      .catch((error) => {
        printError(`Request error: ${error}`);
      });
  };

  document
    .getElementById("bm-search-btn")
    ?.addEventListener("click", searchAction);

  document
    .querySelectorAll(
      '#bahn-bm-root input[type="text"], #bahn-bm-root input[type="email"]',
    )
    .forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
          searchAction();
        }
      });
    });
})();
