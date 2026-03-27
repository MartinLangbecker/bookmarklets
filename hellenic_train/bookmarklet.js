javascript: (() => {
  /*
    Minimal CSS: Only grid layout for management panel. All other styles come from site CSS.
  */
  const minimalStyles = `
.bahn-bm-management-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom:1rem;
}
.bahn-bm-management-panel .bm-panel-item {
  width: 100%;
  margin: 0;
  white-space: normal;
}
.bahn-bm-management-panel .bm-panel-item:nth-child(5) {
  grid-column: span 2;
  justify-self: center;
  width: 60%;
}
.bahn-bm-managebox-result {
  margin-top:1rem;
  font-family:monospace;
  font-size:13px;
  white-space:pre-wrap;
  word-break:break-all;
  border-radius:0.5rem;
}
`;
  if (!document.getElementById("bahn-bm-minimal-styles")) {
    const styleElem = document.createElement("style");
    styleElem.id = "bahn-bm-minimal-styles";
    styleElem.innerHTML = minimalStyles;
    document.head.appendChild(styleElem);
  }
  const prevContainer = document.getElementById("bahn-bm-container");
  if (prevContainer) prevContainer.remove();
  const sendTicketSearch = (payload) =>
    fetch(
      "https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website/travel/recover",
      {
        headers: { "content-type": "application/json" },
        method: "POST",
        body: JSON.stringify(payload),
        referrer:
          "https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/",
      },
    ).then((res) => res.json());
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
    downloadPdf: (resourceId) => ({
      url: `https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website/post/purchase/pdf?resourceId=${resourceId}`,
      method: "GET",
    }),
  };
  const MANAGEMENT_OPTIONS = [
    {
      key: "changeDateTime",
      label: "Change Date/Time",
      action: "BOOKING_CHANGE",
    },
    {
      key: "changeTicket",
      label: "Change Ticket",
      action: "TRAVEL_CHANGE",
    },
    {
      key: "addServices",
      label: "Add Services",
      action: "ADD_ADDITIONAL_SERVICE",
    },
    { key: "refund", label: "Refund", action: "REFUND" },
    { key: "downloadPdf", label: "Download PDF", action: "DOWNLOAD_PDF" },
  ];
  const isDST = (date) => {
    const jan = new Date(Date.UTC(date.getFullYear(), 0, 1));
    return date.getTimezoneOffset() < jan.getTimezoneOffset();
  };
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
  const renderManagementPanel = (solution) => {
    const manageRoot = document.createElement("div");
    manageRoot.className = "card p-3 my-2 bahn-bm-managebox";
    manageRoot.id = "bahn-bm-management-panel-root";
    manageRoot.innerHTML = `
    <h5 class="mb-3">Manage</h5>
    <div class="bahn-bm-management-panel mb-2">
      ${MANAGEMENT_OPTIONS.map(
        (option) =>
          `<button class="btn btn-orange btn-block bm-panel-item" type="button" data-manage-key="${option.key}">${option.label}</button>`,
      ).join("")}
    </div>
    <div class="bahn-bm-managebox-result alert-secondary p-2" style="display:none;"></div>
  `;
    const panel = manageRoot.querySelector(".bahn-bm-management-panel");
    const outbox = manageRoot.querySelector(".bahn-bm-managebox-result");
    panel.querySelectorAll(".bm-panel-item").forEach((button) => {
      const key = button.dataset.manageKey;
      const mgmtConf = MANAGEMENT_OPTIONS.find((option) => option.key === key);
      button.addEventListener("click", async () => {
        if (key === "downloadPdf") {
          outbox.style.display = "block";
          outbox.textContent = "Downloading PDF...";
          const resourceId = solution.resourceId;
          try {
            const res = await fetch(
              ACTIONS_TO_REQUEST.downloadPdf(resourceId).url,
              { method: "GET", credentials: "same-origin" },
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
  const formatTicketResponse = (ticketData) => {
    if (
      !ticketData?.solutions ||
      !Array.isArray(ticketData.solutions) ||
      ticketData.solutions.length === 0
    ) {
      return "<div>No valid ticket data found.</div>";
    }
    const purchaseDate = ticketData.purchaseDate
      ? `<div class="mb-2"><b>Purchased on:</b> ${formatZoned(ticketData.purchaseDate, "Europe/Berlin")}</div>`
      : "";
    let html = '<div class="bahn-bm-ticket-details">';
    if (purchaseDate) html += `<h5>Trip Details</h5>${purchaseDate}`;
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
      <div><b>From:</b> ${origin} <b>To:</b> ${destination}</div>
      <div><b>Departure:</b> ${depTime} <b>Arrival:</b> ${arrTime}</div>
      <div><b>Passengers:</b> ${passengerArr.join(", ") || "Unknown"} <b>Price:</b> <span style="font-weight:bold;">${summary.totalPrice ? summary.totalPrice.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + (summary.totalPrice.currency || "") : "-"}</span></div>
    `;
      (container.nodeSummaries || []).forEach((node) => {
        const nodeView = node.nodeView || {};
        const train = nodeView.train || {};
        html += `
        <div class="mt-2"><strong>Connection</strong></div>
        <div><b>From:</b> ${nodeView.origin || ""} <b>Time:</b> ${nodeView.departureTime ? formatZoned(nodeView.departureTime, "Europe/Athens") : ""}</div>
        <div><b>To:</b> ${nodeView.destination || ""} <b>Time:</b> ${nodeView.arrivalTime ? formatZoned(nodeView.arrivalTime, "Europe/Athens") : ""}</div>
        <div><b>Mode:</b> ${train.denomination || ""} ${train.name || ""} ${node.pnr ? `<b>PNR:</b> ${node.pnr}` : ""}</div>
      `;
        const offers = (node.offerContainerSummaryViews || []).flatMap(
          (summaryView) => summaryView.offerSummaryViews || [],
        );
        if (offers.length > 0) {
          html += `
          <div class="mt-2"><b>Passenger Details</b></div>
          <table class="table table-bordered table-sm mt-1 mb-2">
            <thead><tr><th>Name</th><th>Service</th><th>Offer</th><th>Seat</th><th>Car</th><th>CP</th><th>Price</th></tr></thead>
            <tbody>
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
            </tbody>
          </table>
        `;
        }
      });
      html += `<div class="bm-manage-placeholder" data-placeholder-idx="${idx}"></div>`;
    });
    html += "</div>";
    return html;
  };
  const html = `
  <div class="container" id="bahn-bm-container">
    <div id="bahn-bm-root" class="card border-0 rounded p-3 mt-5">
      <h3>Find & Manage Train Tickets (Beta)</h3>
      <div class="form-group mb-3">
        <div class="form-check form-check-inline">
          <label class="form-check-label">
            <input type="radio" class="form-check-input" name="bm-mode" value="findTicket" checked /> Find Ticket
          </label>
        </div>
        <div class="form-check form-check-inline">
          <label class="form-check-label">
            <input type="radio" class="form-check-input" name="bm-mode" value="findWithPnrCp" /> Find by PNR/CP
          </label>
        </div>
        <div class="form-check form-check-inline">
          <label class="form-check-label">
            <input type="radio" class="form-check-input" name="bm-mode" value="guest" /> Guest Ticket (no Account)
          </label>
        </div>
      </div>
      <div id="bahn-bm-fields-findTicket">
        <div class="form-row">
          <div class="form-group col-md-6">
            <label for="bm-email">E-Mail</label>
            <input id="bm-email" type="email" class="form-control" placeholder="E-Mail" />
          </div>
          <div class="form-group col-md-6">
            <label for="bm-pnr">PNR / Ticket Code</label>
            <input id="bm-pnr" type="text" class="form-control" placeholder="Code" />
          </div>
        </div>
      </div>
      <div id="bahn-bm-fields-findWithPnrCp" style="display:none;">
        <div class="form-row">
          <div class="form-group col-md-6">
            <label for="bm-pnr2">PNR</label>
            <input id="bm-pnr2" type="text" class="form-control" placeholder="PNR" />
          </div>
          <div class="form-group col-md-6">
            <label for="bm-cp2">CP</label>
            <input id="bm-cp2" type="text" class="form-control" placeholder="CP" />
          </div>
        </div>
      </div>
      <div id="bahn-bm-fields-guest" style="display:none;">
        <div class="form-row">
          <div class="form-group col-md-4">
            <label for="bm-vorname">First name</label>
            <input id="bm-vorname" type="text" class="form-control" placeholder="First name" />
          </div>
          <div class="form-group col-md-4">
            <label for="bm-nachname">Last name</label>
            <input id="bm-nachname" type="text" class="form-control" placeholder="Last name" />
          </div>
          <div class="form-group col-md-4">
            <label for="bm-code">Lookup Code</label>
            <input id="bm-code" type="text" class="form-control" placeholder="Lookup code" />
          </div>
        </div>
      </div>
      <button id="bm-search-btn" type="button" class="btn btn-orange btn-block mb-3">Search</button>
      <div class="bahn-bm-result mt-4" id="bahn-bm-result" style="display:none;"></div>
    </div>
  </div>
`;
  const mainContent = document.querySelector("#main-content") || document.body;
  mainContent.insertAdjacentHTML("beforeend", html);
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
  Array.from(document.querySelectorAll('input[name="bm-mode"]')).forEach(
    (radio) => {
      radio.addEventListener("change", updateFields);
    },
  );
  const searchAction = () => {
    const mode = document.querySelector('input[name="bm-mode"]:checked')?.value;
    const resultDiv = document.getElementById("bahn-bm-result");
    resultDiv.style.display = "none";
    resultDiv.innerHTML = "";
    const printError = (msg) => {
      resultDiv.style.display = "";
      resultDiv.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
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
          json.solutions.forEach((solution, idx) => {
            const ph = resultDiv.querySelector(
              `.bm-manage-placeholder[data-placeholder-idx="${idx}"]`,
            );
            if (ph) ph.replaceWith(renderManagementPanel(solution));
          });
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
