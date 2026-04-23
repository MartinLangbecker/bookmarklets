# Hellenic Train BFF API Reference

Base URL: `https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website`

All requests require:
```
Content-Type: application/json
Referrer: https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/
credentials: include
```

Authenticated endpoints additionally require `Authorization: Bearer <token>` and `channel: 720`.

The backend is shared with Trenitalia. Many endpoints exist in code but are not active
on Hellenic Train (marked below). Error messages default to German.

---

## Ticket Recovery (no auth required)

### `POST /travel/recover`

Retrieves a ticket by one of three lookup methods. Sets a session cookie used by
subsequent page navigation.

**By email + PNR:**
```json
{ "recoverType": "PNR_EMAIL", "pnr": "XXXXXX", "email": "user@example.com" }
```

**By PNR + CP:**
```json
{ "recoverType": "PNR_CP", "pnr": "XXXXXX", "cpCode": "000000" }
```

**By guest rescue code:**
```json
{ "recoverType": "RESCUE_CODE", "name": "John", "surname": "Doe", "rescueCode": "..." }
```

**Response:**
```json
{
  "solutions": [ { "resourceId": "...", "solutionContainer": { ... }, "solutionActions": [ ... ], "status": "FINALIZED", "pdfAvailable": true } ],
  "closedSolutions": [ { "resourceId": "...", "status": "CLOSED", "statusDescription": "Changed/Refunded" } ],
  "purchaseDate": "2026-03-11T13:47:52.071+01:00",
  "travelContact": { "name": "JOHN", "surname": "DOE", "email": "user@example.com" }
}
```

Notes:
- Tickets purchased while logged in can be retrieved when logged out.
- Such tickets may have `null` PNR and CP values but have `idTravel` and `entitlementId`.
- `pdfAvailable: true` is unreliable for guest purchases.

---

## Trip Details (auth required)

### `GET /travel/detail?resourceId=<resourceId>`

Returns booking metadata for a solution. Lighter than `/travel/solutions/reopen`.

**Response:**
```json
{
  "resourceId": "...",
  "code": "<ticketCode>",
  "travelContact": { "name": "...", "surname": "...", "email": "...", "alternateEmail": null, "phoneNumber": null },
  "purchaseDate": null,
  "expirationDate": null,
  "travelDate": null,
  "lastModifyDate": null
}
```

Note: `code` is the ticket code printed on the PDF (same as `entitlementId` in the recover response).

### `GET /travel/solutions/reopen?resourceId=<resourceId>`

Returns full trip details for a solution (connections, passengers, seats, prices, actions).

### `GET /travel/solutions/enrich?resourceId=<resourceId>`

Returns enriched offer views including aztec barcode data (base64 JPEG).

### `GET /travel/reopenEntitlement?resourceId=<resourceId>&entitlementId=<entitlementId>&silentWarning=<bool>`

Reopens a specific entitlement (per-passenger ticket) within a solution. Takes both
`resourceId` and `entitlementId` as parameters.

### `GET /travel/history?resourceId=<resourceId>&index=<n>`

Returns travel history for a solution. The `index` parameter suggests pagination.

### `POST /travel/next/solutions?travelGroup=<group>`

Returns upcoming trips. The `travelGroup` parameter filters by type (e.g. `TICKET`).

### `POST /travel/solutions`

Returns trips linked to the logged-in account. Requires `Authorization: Bearer <token>`
and `channel: 720`. Cookie-based auth (`credentials: include`) is not sufficient.

```json
{
  "travelGroup": "TICKET",
  "searchType": "DEPARTURE_DATE",
  "fromDate": "01/01/2026",
  "toDate": "01/01/2027",
  "code": "",
  "limit": 10,
  "offset": 0
}
```

`searchType` can be `"DEPARTURE_DATE"` or `"PURCHASE_DATE"` (both verified on HT).
`code` filters by ticket code (empty = all).

**Response:**
```json
{
  "solutions": [{
    "typeDescription": "...",
    "description": "Kiato (05:28) - Athens (06:50)",
    "resourceId": "...",
    "departureDate": "...",
    "arrivalDate": "...",
    "creationDate": "...",
    "channel": "APP_TRAINOSE",
    "pnr": null,
    "downloadPdf": true,
    "closed": false,
    "statusDescription": null
  }],
  "favourites": []
}
```

Notes:
- Guest purchases are never returned here and cannot be retroactively linked to an account.
- Tickets bought while logged in have `pnr: null`.
- `travelName` defaults to Italian ("Il mio viaggio ...") regardless of language setting.

---

## Downloads (auth required)

### `GET /post/purchase/pdf?resourceId=<resourceId>`

Downloads ticket PDF. Returns `application/pdf` with `Content-Disposition` header.

- Returns `204 No Content` for guest purchases regardless of `pdfAvailable` flag.
- Only available from the "My Trips" overview, not the trip detail page.
- Parameter must be `resourceId` (solution-level). Using `entitlementId` returns a server error.

### `GET /post/purchase/pdf/history?resourceId=<resourceId>`

Historical PDF download (untested).

### `GET /invoice/receipt/pdf?resourceId=<resourceId>`

Fiscal receipt download by resourceId. **Not active on Hellenic Train** — returns
error 1007 "Fehler bei Fahrscheinausstellung".

### `GET /invoice/<orderId>/receipt/pdf`

Fiscal receipt download by orderId. **Not active on Hellenic Train.**

### `GET /post/purchase/receipt?resourceId=<resourceId>`

Another receipt endpoint (untested, likely also inactive).

---

## Post-Purchase Communication (auth required)

### `POST /post/purchase/send/email?resourceId=<resourceId>&email=<email>`

Resend confirmation email. Takes `resourceId` and `email` as query parameters, no body.
Tested while logged in — returns `204 No Content` and no email arrives. Likely broken
or disabled on Hellenic Train (may explain why purchase confirmation emails fail).

### `POST /post/purchase/send/sms?resourceId=<resourceId>`

Send ticket via SMS. Takes `resourceId` as query parameter. Request body is a
`travellerWithConsentsView` object (shape unknown). Returns a generic error — likely
not active on Hellenic Train.

### `GET /post/purchase/calendar?resourceId=<resourceId>`

Downloads iCal calendar entry for the trip.

### `GET /post/purchase/calendar/booking?resourceId=<resourceId>`

Downloads iCal calendar entry for a booking.

### Resend Email (possibly no auth — endpoints unknown)

The frontend state store references three resend methods whose service implementations
are in a separate webpack chunk (not captured):

- `resendEmailByNameOrEmail` — resend using name or email
- `resendEmailByRecoveryCode` — resend using recovery code
- `finalizeResendEmail` — finalize/confirm step

These follow a two-step pattern and may work without authentication (similar to
`/travel/recover`). Endpoint paths are unknown.

---

## Management Actions (session required)

### `POST /secondcontact/select`

Initiates or advances a management action.

**Step 1 — Initiate** (use `resourceIds` from `solutionActions`):
```json
{ "action": "BOOKING_CHANGE", "resourceIds": ["<solution-level-resourceId>"] }
```

**Step 2 — Confirm traveller selection** (use per-offer `resourceIds`):
```json
{ "action": "BOOKING_CHANGE", "resourceIds": ["<offer-resourceId-1>", "<offer-resourceId-2>"] }
```

**Response for BOOKING_CHANGE / TRAVEL_CHANGE:**
```json
{
  "action": "BOOKING_CHANGE",
  "cartId": "cb428a7f-...",
  "changePossibilities": {
    "departure": { "id": 830005043, "name": "Bologna Centrale", "timezone": "Europe/Rome" },
    "arrival": { "id": 830011119, "name": "Bari Centrale" },
    "departureLocations": [],
    "arrivalLocations": [],
    "date": true, "time": true, "travellers": true, "endpoints": true
  }
}
```

**Response for REFUND:**
```json
{
  "action": "REFUND",
  "cartId": "620427e4-...",
  "totalPrice": { "currency": "€", "amount": 116.00 },
  "penalties": { "currency": "€", "amount": 23.20 },
  "net": { "currency": "€", "amount": 92.80 },
  "paymentMethods": ["PayPal"]
}
```

**Response for ADD_ADDITIONAL_SERVICE (no services available):**
```json
{ "type": "ERROR", "message": "Es gibt keine zusätzlichen Dienstleistungen auf dieser Reise-Lösung" }
```

Available actions from `solutionActions`:

| Action | Status on Hellenic Train |
|---|---|
| `BOOKING_CHANGE` | Works |
| `TRAVEL_CHANGE` | Works |
| `REFUND` | Works |
| `ADD_ADDITIONAL_SERVICE` | Returns error (no services) |
| `SHOW_OTHER_EVENTS` | Not supported — returns "Parameter ungültig: action" |

### `POST /booking/change`

Search for alternative trains during a change flow.

```json
{
  "cartId": "cb428a7f-...",
  "departureLocationId": 830005043,
  "arrivalLocationId": 830011119,
  "departureTime": "2026-05-15T23:30:00.000",
  "adults": 2, "children": 0,
  "criteria": { "frecceOnly": false, "regionalOnly": false, "intercityOnly": false, "tourismOnly": false, "noChanges": false, "order": "DEPARTURE_DATE", "offset": 0, "limit": 10 },
  "advancedSearchRequest": { "bestFare": false, "bikeFilter": false, "forwardDiscountCodes": [] },
  "searchSimilar": true
}
```

Note: `departureTime` must omit timezone offset (local time, no `+02:00`).

### `POST /secondcontact/confirm`

Finalizes a management action.

```json
{ "cartId": "xxxxxxxx-...", "action": "REFUND" }
```

For change actions (unverified):
```json
{ "cartId": "xxxxxxxx-...", "action": "BOOKING_CHANGE", "solutionId": "xxxxxxxx-..." }
```

---

## Authentication

Auth service base URL: `https://newtickets.hellenictrain.gr/PicoAuth` (separate from BFF).

### `POST /PicoAuth/api/auth/login`

Login. Returns a Bearer token (JWT, 2h expiry).

```json
{ "userName": "<cardNumber>", "password": "...", "company": "TRAINOSE.B2C" }
```

**Response:**
```json
{
  "access_token": "<jwt>",
  "username": "<cardNumber>",
  "token_type": "Bearer",
  "expires_in": 7200,
  "scope": "api",
  "refresh_token": "<token>"
}
```

Note: `userName` is the loyalty card number (e.g. `2000112705`), not an email.
The token is stored in `localStorage` by the Aurelia app. Refresh mechanism is unknown.

### `PUT /account/password/change`

Change password. Requires Bearer token. Returns `204 No Content` on success.

```json
{ "userName": "<cardNumber>", "oldPassword": "...", "newPassword": "..." }
```

Password rules: min 8 chars, at least one uppercase, one lowercase, one digit, one
special character (`_*-+!?,:;.`). The website UI limits input to 15 characters, but
the backend accepts longer passwords.

### `POST /account/password/reset/mail`

Trigger password reset email. No auth required.

```json
{ "email": "user@example.com", "host": "https://newtickets.hellenictrain.gr/" }
```

Returns `204 No Content`. The `host` is used to construct the reset link in the email.
Password reset emails work correctly (unlike post-purchase confirmation emails).

If the same email is linked to both a Hellenic Train and a Trenitalia account (shared
PicoAuth identity), both platforms send a reset email simultaneously. The Trenitalia
email contains a broken link (double URL) because it prepends its own domain to the
`host` parameter.

The reset link format:
```
https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/#/recovery-password?idToken=<int>&token=<uuid>&tt1=<signature>
```

`idToken` is a sequential integer (not random). `tt1` is a signature included in the
button link but omitted from the plaintext fallback URL. The backend does not require
`tt1` — security relies on `token` (UUID) alone. Links expire after 3 hours.

### `POST /account/password/reset`

Reset password using the token from the reset email. No auth required.

```json
{ "idToken": "<int>", "token": "<uuid>", "password": "<newPassword>" }
```

Requires `channel: 720` and `x-csrf-token` headers.

**Response:**
```json
{ "username": "<cardNumber>" }
```

Returns the username (card number) whose password was changed.

Notes:
- The `tt1` parameter from the reset link is not sent in the request — only `idToken`
  and `token` are used. Security relies on the UUID `token` alone.
- The reset email's plaintext fallback URL omits `tt1`, which works fine since the
  backend doesn't require it.
- No check whether the new password is identical to the old one.

### `POST /user/profile`

Session initialization call made after login. Returns combined user + customer profile.
Body is optional — the user is identified from the Bearer token.

Returns `user` (basic info + groups), `customer` (full CRM profile), `channelsMap`,
`selectedChannel`, and `role`. Confirms channel 720 = `B2C_TRAINOSE`.

### `POST /registration/viewRegistration`

Returns profile data for the logged-in user (customer key, loyalty card, contacts, etc.).

### `POST /registration/verifyInternalRegistration`

Step 1 of profile update. Takes the full profile object (from `viewRegistration`) with
modifications plus `operation: "MODIFY"`. Returns the validated updated profile.

### `POST /registration/startInternalUpdate`

Step 2 of profile update. Takes the same object returned by `verifyInternalRegistration`.
Returns `204 No Content` on success.

Profile update flow:
```
viewRegistration → modify fields → verifyInternalRegistration → startInternalUpdate
```

Updatable fields include: `email`, `mobile`, `telephone`, `birthDate`, `gender`,
`marketingConsent`, `profilingConsent`, and other profile fields.

---

## Locations

### `GET /locations/search?name=<query>&limit=<n>`

Search stations by name.

### `GET /locations/search/location?id=<stationId>`

Get station details by numeric ID.

### `GET /locations/closest?latitude=<lat>&longitude=<lon>`

Find nearest station.

---

## Terminology

| Term | Description |
|---|---|
| PNR | Passenger Name Record — 6-char booking reference |
| CP | Codice/Cambio Prenotazione (unconfirmed) — reservation/booking code (numeric) |
| resourceId | Opaque internal ID for a solution or per-traveller offer |
| cartId | Temporary session ID for management action flows |
| entitlementId | Per-passenger ticket code (printed on PDF). Same as `code` in `/travel/detail` response. Not usable as `resourceId` parameter. |

## Notes

- Station IDs are numeric (e.g. `731001192` for Patra, `731021135` for Kiato).
- Timestamps in responses use `+02:00` (Europe/Athens) or `+01:00` (Europe/Rome).
- The `departureTime` in change search requests must omit the timezone offset.
- Smart Refund and Compensation actions are not available via the API (handled by the native detail page UI).
- Many Trenitalia features (receipts, Trenitalia Pass, Freccia Club, etc.) exist in the
  codebase but are not active on the Hellenic Train backend.
- Backend error messages are returned in the user's preferred language (set on the
  Trenitalia account, shared via PicoAuth). They are not hardcoded to German.
- Hellenic Train and Trenitalia share the same PicoAuth identity system. Accounts are
  separate but linked by email. Password resets trigger on both platforms simultaneously.
- Post-purchase emails (confirmation, resend) are broken on Hellenic Train. Password
  reset emails work correctly — different mail pipelines.
