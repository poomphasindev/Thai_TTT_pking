# Sawasdee Transit / Thai TTT

Production-alike hackathon prototype for a tourist-first Bangkok transit platform.

The app combines:

- Landmark-first smart route planning inspired by Bangkok rail/route UX
- Joint Ticket QR simulation with 8-45 THB fare-cap logic
- Operator tap simulation for rail, bus, and boat gates
- Tourist incident reporting with photo, location, category, and admin review
- Responsive public app UI and operations dashboard

This repository is intentionally lightweight: FastAPI + SQLite + static HTML/CSS/JS. No frontend build step is required.

## Current Status

This is a hackathon PoC, not a payment-grade ticketing system.

Working:

- Public tourist app at `/`
- Admin dashboard at `/admin.html`
- Report creation and review status updates
- Ticket creation
- Real QR SVG generation
- Tap-in fare-cap simulation
- Mobile responsive UI
- TH/EN public app language toggle
- MapLibre map with local brochure-map fallback

Reserved for next sprint:

- TAT Data API ingestion
- AI route copilot / RAG
- Vision-based incident analysis
- Real auth, real payment, and operator validation
- Production map provider key management

## Tech Stack

- Backend: FastAPI
- Runtime DB: SQLite
- Frontend: Static HTML/CSS/JS served by FastAPI
- QR generation: `qrcode`
- Map UI: MapLibre GL JS using a tokenless demo style, with local image fallback
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
│   │   │   ├── repositories.py
│   │   │   └── ticket_repository.py
│   │   └── requirements.txt
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
```

Notes:

- API keys must never be placed in `services/web/*.js` or HTML.
- Frontend calls this backend only.
- Backend will call external APIs in future sprints.
- Runtime files under `data/` and `services/api/data/` are ignored.

## API Summary

Health:

- `GET /api/health`

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

## Demo Flow

1. Open `/`
2. Use the smart route planner section
3. Generate a Joint Ticket
4. Click the card to flip and show QR
5. Simulate operator tap
6. Submit an incident report
7. Open `/admin.html`
8. Review reports and recent tickets

## Data And Map Strategy

Current implementation:

- Bangkok-only curated landmark dataset in `services/web/app.js`
- Pitch-safe route templates with realistic ranges for Bangkok tourist trips
- Fare values are simulation values, not official live operator prices
- Joint Ticket 45 THB cap is represented as a policy simulation
- MapLibre renders the map using an external demo style when internet is available
- Local brochure-map preview is shown as fallback

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
