javascript: (() => {
  const widgetId = "es-referral-widget";
  const widgetDataAttr = "data-bookmarklet";
  const widgetMarker = "es-referral";
  const referralParam = "referralCode";
  const referralBaseUrl = "/referral";

  const byId = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);

  const bookingRoot =
    byId("booking-search-root") || qs("#section-tickets .wrapper .tickets");
  if (!bookingRoot) {
    console.error("Referral helper: booking section not found.");
    return;
  }

  const existing = byId(widgetId);
  if (existing) {
    existing.remove();
    return;
  }

  const container = document.createElement("div");
  container.id = widgetId;
  container.setAttribute(widgetDataAttr, widgetMarker);
  container.className = "bg-white rounded padding-s text-dark-aubergine";

  const title = document.createElement("h3");
  title.className = "margin-0 text-heading";
  title.textContent = "Referral code";

  const description = document.createElement("p");
  description.className = "font-light text-desc";
  description.textContent =
    "Enter your referral code below to receive discounts.";

  const row = document.createElement("div");
  row.className = "flex gap items-center";

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "text";
  input.placeholder = "e.g. 20OFFINJUNE, EARTHDAY26, HOURRAIL15, EARLYBIRD2027, ...";
  input.setAttribute("aria-label", "Referral code");
  input.className = "es-input";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className =
    "bg-shock-orange button duration-150 ease-in hover:bg-darker-shock-orange rounded text-white";
  submit.textContent = "Apply code";

  row.appendChild(input);
  row.appendChild(submit);

  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(row);

  bookingRoot.before(container);

  const goToReferral = (code) => {
    const url = new URL(referralBaseUrl, location.origin);
    url.searchParams.set(referralParam, code);
    location.href = url.toString();
  };

  const handleSubmit = () => {
    const code = input.value.trim();
    if (!code) return;
    goToReferral(code);
  };

  submit.addEventListener("click", handleSubmit);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      handleSubmit();
    }
  });
})();
