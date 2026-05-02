import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from app.core.config import get_settings

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - optional until Supabase/Postgres is enabled
    psycopg = None
    dict_row = None


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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tourist',
  balance_thb INTEGER NOT NULL DEFAULT 200,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
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

CREATE TABLE IF NOT EXISTS trip_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  ticket_id TEXT REFERENCES tickets(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  planned_modes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  fare_cap_thb INTEGER NOT NULL DEFAULT 45,
  estimated_fare_thb INTEGER NOT NULL DEFAULT 45,
  total_charged_thb INTEGER NOT NULL DEFAULT 0,
  anomaly_flags INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trip_scans (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trip_sessions(id),
  sequence_no INTEGER NOT NULL,
  mode TEXT NOT NULL,
  operator_label TEXT NOT NULL,
  vehicle_id TEXT,
  stop_label TEXT NOT NULL,
  raw_fare_thb INTEGER NOT NULL,
  charged_thb INTEGER NOT NULL,
  is_expected INTEGER NOT NULL DEFAULT 1,
  anomaly_reason TEXT,
  scanned_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_sessions_user_status ON trip_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trip_scans_trip_id ON trip_scans(trip_id, sequence_no);
"""

def init_db() -> None:
    settings = get_settings()
    if settings.database_url:
        if psycopg is None:
            raise RuntimeError("TTM_DATABASE_URL is set, but psycopg is not installed.")
        with psycopg.connect(settings.database_url, autocommit=True, row_factory=dict_row) as conn:
            for statement in _split_sql_script(SCHEMA):
                conn.execute(statement)
        return

    settings.database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(settings.database_path) as conn:
        conn.executescript(SCHEMA)
        _ensure_report_columns(conn)
        _ensure_user_columns(conn)
        _ensure_ticket_columns(conn)
        conn.commit()


@contextmanager
def get_conn() -> Iterator[Any]:
    settings = get_settings()
    if settings.database_url:
        if psycopg is None:
            raise RuntimeError("TTM_DATABASE_URL is set, but psycopg is not installed.")
        conn = psycopg.connect(settings.database_url, row_factory=dict_row)
        wrapped = PostgresCompatConnection(conn)
        try:
            yield wrapped
            conn.commit()
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(settings.database_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


class PostgresCompatConnection:
    def __init__(self, conn: Any) -> None:
        self.conn = conn

    def execute(self, query: str, params: Any = None):
        return self.conn.execute(self._convert_placeholders(query), params)

    def executescript(self, script: str) -> None:
        self.conn.execute(script)

    @staticmethod
    def _convert_placeholders(query: str) -> str:
        return query.replace("?", "%s")


def _split_sql_script(script: str) -> list[str]:
    return [statement.strip() for statement in script.split(";") if statement.strip()]


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


def _ensure_ticket_columns(conn: sqlite3.Connection) -> None:
    existing = {row[1] for row in conn.execute("PRAGMA table_info(tickets)").fetchall()}
    if "user_id" not in existing:
        conn.execute("ALTER TABLE tickets ADD COLUMN user_id TEXT REFERENCES users(id)")


def _ensure_user_columns(conn: sqlite3.Connection) -> None:
    existing = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "balance_thb" not in existing:
        conn.execute("ALTER TABLE users ADD COLUMN balance_thb INTEGER NOT NULL DEFAULT 200")
