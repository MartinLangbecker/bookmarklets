# Hellenic Train Bookmarklet — Design

## Background

Trenitalia owns Hellenic Train. Both use the same `Channels.Website.BFF.WEB` backend
platform. The Hellenic Train ticketing site is missing the "Retrieve Ticket" feature
present on Trenitalia's site — needed to recover tickets purchased without an account
when the confirmation email fails to deliver.

The bookmarklet provides a search form that calls the recovery API, then redirects to
the site's native trip detail page which already supports viewing details and managing
the ticket (change, refund, request compensation).

## Architecture

```
User enters credentials → POST /travel/recover → extract resourceId → redirect to detail page
                                                                    ↘ or show error
```

The bookmarklet is a single self-contained JavaScript IIFE that:
1. Injects a search form into `#main-content` using the site's existing Bootstrap classes
2. Calls the ticket recovery API
3. On success: redirects to `/#/my-travels/detail?resourceId=<resourceId>`
4. On failure: shows an inline error message

All ticket display and management is handled by the native site's detail page.

## Styling

The bookmarklet uses only classes already present on the Hellenic Train website:

- Card wrapper: `card border-0 rounded-0 search-widgets search-widgets-bg` (blue gradient)
- Title: `h5 mb-2 text-white font-weight-bold` (matches "YOUR NEXT TRIP")
- Inputs: `input-group generic-shadow` with `input-group-prepend` labels (matches From/To fields)
- Search button (desktop): `btn btn-circle btn-orange` with `icon-keyboard_arrow_right` icon,
  positioned to the right of the input fields — same layout as the site's connection search button.
  Shows a Bootstrap popover tooltip on hover.
- Search button (mobile): `btn btn-orange btn-block` full-width fallback, hidden on md+
- Errors: `alert alert-danger`
- Radio labels: `form-check-inline` with `text-white`

Both search buttons start disabled and are enabled only when all visible input fields
are filled in, matching the site's pattern where the search button is disabled until
origin/destination are set.

No custom CSS is injected.

## Internationalization

Three languages are supported: English (`en`), Italian (`it`), Greek (`el`).

Language detection uses two methods:
1. **Primary**: Checks which language dropdown item has the `aurelia-hide` class (the
   active language is hidden from the switcher)
2. **Fallback**: Reads the rendered text of the `[i18n="header.search"]` element
   ("Search" → en, "Cerca" → it, "Αναζήτηση" → el)

A 500ms polling interval checks for language changes. This is more reliable than a
`MutationObserver` because Aurelia's re-render cycle can produce intermediate DOM states
where classes haven't settled yet. The interval is cleared on redirect.

## API

Base URL: `https://newtickets.hellenictrain.gr/Channels.Website.BFF.WEB/website`

### `POST /travel/recover`

Retrieves a ticket by one of three lookup methods.

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
  "solutions": [ { "resourceId": "...", ... } ],
  "closedSolutions": [ { "resourceId": "...", ... } ]
}
```

The `resourceId` from the first solution (active or closed) is used to redirect to
the detail page.

## Detail Page URL

```
https://newtickets.hellenictrain.gr/Channels.HellenicTrainWeb/#/my-travels/detail?resourceId=<resourceId>
```

- Works without authentication (session cookie from `/travel/recover` is sufficient)
- Works without the optional `creationDate` parameter
- Supports both active and cancelled/refunded tickets
- Provides built-in management: change connection, change ticket, refund, request compensation

## Terminology

| Term | Full name | Description |
|---|---|---|
| PNR | Passenger Name Record | Unique booking reference (6 chars). Shown on ticket and confirmation. |
| CP | Codice/Cambio Prenotazione (unconfirmed) | Reservation/booking code (numeric). Used with PNR for guest ticket lookup and changes. |
| resourceId | — | Opaque internal ID identifying a solution. Used in the detail page URL. |

## Notes

- The Hellenic Train backend is the same platform as Trenitalia (`Channels.Website.BFF.WEB`),
  operated by Ferrovie dello Stato Italiane.
- Tickets purchased while logged in can still be retrieved via `/travel/recover` when logged out.
  These tickets may have `null` PNR and CP values but do have `idTravel` and `entitlementId`.
- PDF download is not available on the trip detail page. It is only accessible from the
  "My Trips" overview, which requires being logged in. Guest purchases have no PDF
  download at all — the endpoint returns `204 No Content` regardless of the `pdfAvailable` flag.
- Guest purchases cannot be retroactively linked to an account (confirmed by Hellenic Train support).
- The email sending functionality (`/post/purchase/send/email`) appears broken on Hellenic
  Train — returns 204 but no email arrives. This likely explains why purchase confirmation
  emails fail to deliver, which is the original problem the bookmarklet was built to solve.
