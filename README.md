# Sawasdee Transit / Thai TTT

Production-alike hackathon prototype for a tourist-first Bangkok transit platform.

The app combines:

- Landmark-first smart route planning inspired by Bangkok rail/route UX
- Joint Ticket QR simulation with 8-45 THB fare-cap logic
- Testable trip sessions for rail, bus, and boat scans
- Prepaid wallet simulation with admin top-up
- Tourist incident reporting with photo, location, category, and admin review
- Responsive public app UI and operations dashboard

This repository is intentionally lightweight: FastAPI + SQLite + static HTML/CSS/JS. No frontend build step is required.

## Current Status

This is a hackathon PoC, not a payment-grade ticketing system.

Working:

- Public tourist app at `/`
- Admin dashboard at `/admin.html`
- Demo auth with secure HttpOnly session cookie
- Report creation and review status updates
- Ticket creation behind sign-in
- Real QR SVG generation
- Tap-in fare-cap simulation
- Trip session scan timeline with anomaly flags
- Wallet balance deduction when the trip is ended and paid
- Admin wallet credit tool for demos and QA
- Mobile responsive UI
- TH/EN public app language toggle
- YouTube tourism hero video with local image fallback
- MapLibre map with OpenStreetMap Overpass POI layer and local brochure-map fallback
- Numbered POI cards that focus matching map pins and open map popups
- Product story reframed around destination-first EV tourism loops plus an 8-45 THB fair-fare cap
- AI Trip Intelligence section showing where RAG fits in the user journey
- Gemini-backed `/api/copilot/ask` endpoint with domain guard and low-token answers
- Structured copilot fallback prevents truncated or overly short Gemini replies
- Copilot domain now includes opening-hour hints, etiquette, app workflow, wrong-vehicle recovery, QR validation, and destination safety
- Passenger-side and operator-side payment confirmation simulation
- Journey control cards for scan, transfer, and lost-passenger recovery
- BKK Rail-style route option cards for fastest, cheapest, and scenic/low-confusion journeys
- Detailed leg timeline showing board/validate/transfer/exit logic for tourist landmarks
- City intelligence admin dashboard with OD demand, missed-transfer, QR failure, feeder-gap, and safety signals
- Copilot context chip and more flexible destination-aware Gemini responses

Reserved for next sprint:

- TAT Data API ingestion
- Supabase Postgres adapter for persistent serverless deployment
- Vision-based incident analysis
- Payment-grade auth, real payment, and operator validation
- Production map provider key management

## Tech Stack

- Backend: FastAPI
- Runtime DB: SQLite
- Frontend: Premium mobile-first static HTML + Tailwind CDN + Vanilla JS served by FastAPI
- QR generation: `qrcode`
- Map UI: MapLibre GL JS using a tokenless demo style, with local image fallback
- POI source: OpenStreetMap Overpass API through the backend
- Visual assets: local optimized Bangkok landmark images, no random image endpoint in the main app
- Environment management: Conda

## Repository Layout

```txt
.
├── services/
│   ├── api/
│   │   ├── app/
│   │   │   ├── routers/
│   │   │   ├── core/
│   │   │   ├── db.py
│   │   │   ├── main.py
│   │   │   ├── models.py
│   │   │   ├── auth_repository.py
│   │   │   ├── trip_repository.py
│   │   │   ├── repositories.py
│   │   │   └── ticket_repository.py
│   │   ├── requirements.txt
│   │   └── tests/
│   ├── web/
│   │   ├── assets/
│   │   ├── index.html
│   │   ├── admin.html
│   │   ├── app.js
│   │   ├── admin.js
│   │   └── styles.css
│   └── mvp-server/
│       └── server.mjs
├── environment.yml
├── .env.example
└── README.md
```

## Quick Start

Run from the repository root.

```bash
conda env create -f environment.yml
conda activate tourist-transit-mvp
```

Create local environment variables:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
copy .env.example .env
```

Start the app:

```bash
cd services/api
python -m app.main
```

Open:

```txt
http://127.0.0.1:8000
http://127.0.0.1:8000/admin.html
http://127.0.0.1:8000/docs
```

If the browser still shows an old page, hard refresh with `Ctrl+F5`.

## Environment Variables

Secrets go in `.env`. Never commit `.env`.

Start from [.env.example](./.env.example):

```env
TTM_TAT_API_KEY=
TTM_TAT_API_BASE_URL=https://tatdataapi.io/api/v2

TTM_OPENAI_API_KEY=
TTM_GOOGLE_API_KEY=
TTM_GEMINI_API_KEY=

TTM_DATABASE_PATH=data/app.db
TTM_UPLOAD_DIR=data/uploads
TTM_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

Optional production map/provider keys can be added later:

```env
TTM_MAPTILER_KEY=
TTM_MAPBOX_TOKEN=
TTM_LONGDO_API_KEY=
TTM_GOOGLE_MAPS_API_KEY=
TTM_GOOGLE_PLACES_API_KEY=
```

Notes:

- API keys must never be placed in `services/web/*.js` or HTML.
- Frontend calls this backend only.
- Backend already calls tokenless OpenStreetMap Overpass for nearby POIs.
- Backend should call Google Places, Longdo, MapTiler, Mapbox, TAT, or OpenAI APIs if those providers are enabled later.
- Gemini copilot uses `TTM_GEMINI_API_KEY`; if that is empty, it can use `TTM_GOOGLE_API_KEY` for Google AI Studio compatibility.
- Runtime files under `data/` and `services/api/data/` are ignored.

## Auth Model

This is hackathon-safe demo auth, not full production IAM.

- `POST /api/auth/login` creates or updates a tourist profile by email.
- The API returns a `st_session` HttpOnly cookie.
- Ticket issuance requires that cookie.
- Session tokens are hashed before storage.
- Logout removes the session server-side and deletes the cookie.

Production upgrade path:

- Use a real identity provider or passwordless OTP.
- Set cookie `secure=True` behind HTTPS.
- Add CSRF protection for mutating cookie-auth requests.
- Add role-based access control for `/admin.html` and admin APIs.
- Keep all provider keys server-side.

## API Summary

Health:

- `GET /api/health`

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Places:

- `GET /api/places/nearby?lat=13.7437&lng=100.4889&category=food`

Copilot:

- `POST /api/copilot/ask`
- Uses Gemini when a key is configured
- Falls back to deterministic guidance if no key or provider error
- Refuses unrelated questions outside Bangkok tourist mobility, fares, QR ticketing, transfers, safety, and destination guidance

Reports:

- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/{report_id}`
- `PATCH /api/reports/{report_id}/status`
- `POST /api/reports/{report_id}/analyze`

Tickets:

- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/{ticket_id}`
- `GET /api/tickets/{ticket_id}/taps`
- `POST /api/tickets/{ticket_id}/tap`
- `POST /api/tickets/{ticket_id}/revoke`
- `GET /api/tickets/{ticket_id}/qr.svg`

Trips:

- `POST /api/trips`
- `GET /api/trips/active`
- `GET /api/trips/{trip_id}`
- `POST /api/trips/{trip_id}/scan`
- `POST /api/trips/{trip_id}/end`

Wallet:

- `GET /api/wallet/me`
- `POST /api/wallet/admin-credit`

## Demo Flow

1. Open `/`
2. Use the smart route planner section
3. Sign in from the ticket prompt
4. Generate a Joint Ticket
5. Click the card to flip and show QR
6. Use **Trip test console**:
   - `Start trip session`
   - `Scan next leg` for rail/bus/boat validation events
   - `End and pay` to deduct wallet balance
7. Open the report bottom sheet from Safety and support
8. Submit an incident report
9. Open `/admin.html`
10. Review reports, recent tickets, and top up a tourist wallet by email

## Test Strategy

The core workflow has a smoke test so the team can prove the logic works before a pitch or deploy.

```bash
python services/api/tests/smoke_test.py
```

The smoke test creates a clean ignored SQLite DB under `data/smoke_test.db` and verifies:

- tourist login with unique email
- ticket issuance behind auth
- trip session creation
- rail, bus, and boat scans
- 45 THB cap enforcement
- wallet balance deduction after payment
- transit issue report creation

For manual QA, use `/` for the tourist flow and `/admin.html` for the operator/admin view.

## Data And Map Strategy

Current implementation:

- Bangkok-only curated landmark dataset in `services/web/app.js`
- Pitch-safe route templates with explicit boarding, transfer, QR validation, and arrival steps
- Fare values are simulation values, not official live operator prices
- Joint Ticket 45 THB cap is represented as a policy simulation
- MapLibre renders the map using an external demo style when internet is available
- Nearby categories are loaded from OpenStreetMap Overpass through `/api/places/nearby`
- POI cards use numbered pins matched to map markers; clicking a card or marker focuses the same place
- Local brochure-map preview is shown as fallback when the map style or network is unavailable
- Public app UI is merged from the premium prototype direction and lives in `services/web/index.html`

## Deployment Notes

SQLite is good for local development, hackathon demos, and a single long-running FastAPI process.

For Vercel-style serverless deployment, SQLite files are not a reliable persistent database because serverless instances can be ephemeral and concurrent writes are not ideal. The recommended production upgrade is:

- Frontend: Vercel static hosting
- Backend: FastAPI on Render, Railway, Fly.io, Cloud Run, or Vercel Python functions only for light API routes
- Database: Supabase Postgres
- File uploads: Supabase Storage or S3-compatible storage

Current API is repository-based, so moving from SQLite to Supabase/Postgres should mainly replace `get_conn()` and SQL dialect details rather than rewriting the UI.

Important provider notes:

- Google star ratings are not shown by default because real ratings require Google Places API + billing.
- POI cards currently show a pitch mock `5.0 demo` rating and link to the exact Google Maps coordinate.
- Do not present mock ratings as live Google review data unless Google Places is configured.
- Longdo Map API is a strong Thailand-first option if the team wants Thai map labels and local coverage.
- Google Maps Platform is best for ratings/place photos but must be proxied through the backend.
- TAT Data API is best for official tourism POIs/events and should become the curated tourism source of truth.

## Product Narrative

The current pitch position is:

```txt
Move like local, discover like traveler.
```

The app combines two ideas:

- Destination-first tourism mobility: EV buses and boats connect Bangkok landmarks, food stops, malls, and cultural activities.
- Fair-fare cap: one connected trip session removes duplicate entry fees and keeps bus, rail, and boat travel inside the 8-45 THB fare logic.

In product terms:

- Tourists choose a landmark first.
- Sawasdee Transit explains which rail/bus/boat layer to use.
- The Fair-Fare QR becomes the shared validation object.
- Map cards show nearby verified POIs with numbered pins instead of pretending to have paid Google ratings.
- AI Trip Intelligence uses destination facts, live POIs, reports, and fare state to answer what tourists should do after arrival.
- After each simulated payment, the QR view resets to the front of the card and refreshes the live-ticket timer for the next scan.

## QR And Fare Responsibilities

- Passenger: chooses a destination and follows the next station, pier, stop, or feeder vehicle shown by the app.
- Operator: validates each boarding, gate entry, pier entry, or staff check with the QR scanner.
- Backend: links all scans into one fare session, records operator/mode/stop/time, and applies the 45 THB cap before payment.
- Copilot: helps recover when the tourist boards the wrong vehicle, stops midway, or needs local arrival guidance.
- QR token: represents the active user/pass/session. It can rotate for safety, but backend resolves it to the same active trip until the user pays or starts a new session.

## Fair-Use And Abuse Control

The cap is not an unlimited ride-anywhere pass. It is a capped connected journey with a declared destination.

- Route intent: before the first scan, the user selects origin, destination, and suggested mode sequence.
- Transfer window: each transfer should happen within a reasonable time and distance corridor from the planned journey.
- Mode validation: bus, rail, and boat operators validate each leg; the backend records operator, route, stop, timestamp, and charge.
- Detour recovery: if the passenger boards the wrong bus/boat/train or stops midway, the app offers AI re-plan using the same pass instead of forcing a new ticket.
- Anomaly flags: repeated loops, impossible transfers, excessive backtracking, or scans far outside the route corridor can be flagged for review or require user confirmation.
- Settlement logic: passengers see one capped fare session, while operators are compensated per validated leg according to the clearing rules.

Suggested hackathon wording:

```txt
We are not selling unlimited travel for 45 THB. We are simulating a fair-fare session for one destination-led journey. The cap protects normal transfers and mistakes, while route intent and scan telemetry prevent unlimited random riding.
```

Recommended production path:

- Tourism POIs: TAT Data API
- Map renderer: MapLibre GL JS
- Tile/style provider: MapTiler or Mapbox for reliable production hosting
- Thailand-first map alternative: Longdo Map API
- Places/rating fallback: Google Places, only if billing guardrails are configured

## Security Checklist

Already handled:

- `.env` is ignored
- `.env.example` is safe to commit
- SQLite DB files are ignored
- Upload folders are ignored
- Generated report JSON is ignored
- Python cache files are ignored
- API keys are not embedded in frontend files
- Demo session tokens are stored hashed
- Ticket issuance requires sign-in

Before pushing changes:

```bash
git status --short
git diff --cached
```

Make sure these never appear in staged files:

- `.env`
- `*.db`
- uploaded images
- real API keys
- private user report data

## Troubleshooting

### `python -m app.main` cannot import packages

Activate conda first:

```bash
conda activate tourist-transit-mvp
```

Then reinstall dependencies:

```bash
python -m pip install -r services/api/requirements.txt
```

### Port 8000 already in use

Stop the old server with `Ctrl+C`, or run another port by editing `services/api/app/main.py` temporarily.

### `/` returns 404

Run from:

```txt
services/api
```

with:

```bash
python -m app.main
```

The backend serves static files from `services/web`.

### QR does not render

Install dependencies again:

```bash
python -m pip install -r services/api/requirements.txt
```

## Asset Attribution

See [services/web/assets/ATTRIBUTION.md](./services/web/assets/ATTRIBUTION.md).

## Contributor Rules

- Keep this app dependency-light unless the team agrees otherwise.
- Do not add API keys to frontend files.
- Do not commit runtime data.
- Do not replace the current FastAPI/static architecture with a large framework unless there is a clear demo or production reason.
- Keep UI mobile-first.
- Keep ticketing language as a simulation unless real operator/payment integration is implemented.
