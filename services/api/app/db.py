import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app.core.config import get_settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  reporter_name TEXT,
  contact TEXT,
  transport_mode TEXT,
  vehicle_id TEXT,
  incident_time TEXT,
  location_label TEXT,
  severity TEXT,
  ai_category TEXT,
  ai_confidence REAL,
  ai_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  holder_name TEXT NOT NULL,
  pass_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  qr_token_hash TEXT UNIQUE NOT NULL,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  fare_cap_thb INTEGER NOT NULL DEFAULT 45,
  accumulated_fare_thb INTEGER NOT NULL DEFAULT 0,
  rides_count INTEGER NOT NULL DEFAULT 0,
  valid_until TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_taps (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  mode TEXT NOT NULL,
  station_name TEXT NOT NULL,
  fare_thb INTEGER NOT NULL,
  charged_thb INTEGER NOT NULL,
  tapped_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_taps_ticket_id ON ticket_taps(ticket_id);
"""


def init_db() -> None:
    settings = get_settings()
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(settings.database_path) as conn:
        conn.executescript(SCHEMA)
        _ensure_report_columns(conn)
        conn.commit()


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    settings = get_settings()
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _ensure_report_columns(conn: sqlite3.Connection) -> None:
    existing = {row[1] for row in conn.execute("PRAGMA table_info(reports)").fetchall()}
    columns = {
        "transport_mode": "TEXT",
        "vehicle_id": "TEXT",
        "incident_time": "TEXT",
        "location_label": "TEXT",
        "severity": "TEXT",
    }
    for column, ddl in columns.items():
        if column not in existing:
            conn.execute(f"ALTER TABLE reports ADD COLUMN {column} {ddl}")
