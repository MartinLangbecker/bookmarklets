javascript:(() => {
    /* Seat totals for each class */
    const ECONOMY_TOTAL = 602;
    const KOMFORT_TOTAL = 66;

    if (!document.getElementById("custom-ticket-info-style")) {
        const style = document.createElement("style");
        style.id = "custom-ticket-info-style";
        style.textContent = `
            .ticket-info { background: #F8F8F8; border-radius: 7px; margin-top: 4px; padding: 4px 2px 5px 2px; min-height: 50px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; box-sizing: border-box; color: #000 !important; }
            .ticket-info > div { font-size: 11px; margin: 2px 0 2px 0; line-height: 1.3; color: #000 !important; }
            .ticket-info-price { font-weight: bold; color: #000 !important; }`;
        document.head.appendChild(style);
    }

    const getAvailabilityEmoji = (vacant, total) => {
        if (!vacant || vacant === 0) return "❌";
        const quarter = total / 4;
        if (vacant > 3 * quarter) return "🟢";
        if (vacant > 2 * quarter) return "🟡";
        if (vacant > 1 * quarter) return "🟠";
        return "🔴";
    };

    document.querySelectorAll("a.js_departure-date:not(.disabled)").forEach((anchor) => {
        const trainPricesStr = anchor.dataset.train_prices;
        const economy = { price: null, vacant_seats: 0 };
        const komfort = { price: null, vacant_seats: 0 };

        if (trainPricesStr) {
            try {
                const trainPrices = JSON.parse(trainPricesStr);
                const economyObj = trainPrices.find((tp) => tp.comfort_class === "gv_economy");
                const komfortObj = trainPrices.find((tp) => tp.comfort_class === "gv_premium");
                if (economyObj) {
                    economy.price = economyObj.day_price_full || null;
                    economy.vacant_seats = economyObj.vacant_seats_count || 0;
                }
                if (komfortObj) {
                    komfort.price = komfortObj.day_price_full || "-";
                    komfort.vacant_seats = komfortObj.vacant_seats_count || 0;
                }
            } catch (e) {
                console.error("Fehler beim Parsen von data-train_prices:", e);
            }
        }

        const economyIcon = getAvailabilityEmoji(economy.vacant_seats, ECONOMY_TOTAL);
        const komfortIcon = getAvailabilityEmoji(komfort.vacant_seats, KOMFORT_TOTAL);

        const oldPriceDiv = anchor.querySelector(".ticket-info");
        if (oldPriceDiv) oldPriceDiv.remove();

        const ticketInfoHtml = `
            <div class="ticket-info">
                <div class="ticket-info-price">Economy: ${economy.price ?? "-"}${economy.price ? "€" : ""}</div>
                <div>${economyIcon} ${economy.vacant_seats} frei️</div>
                <div class="ticket-info-price">Komfort: ${komfort.price ?? "-"}${komfort.price ? "€" : ""}</div>
                <div>${komfortIcon} ${komfort.vacant_seats} frei</div>
            </div>`;
        anchor.querySelector(".day").insertAdjacentHTML("beforeend", ticketInfoHtml);
    });
})();
