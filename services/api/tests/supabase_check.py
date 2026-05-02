from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "services" / "api"))

from app.core.config import get_settings  # noqa: E402
from app.db import get_conn, init_db  # noqa: E402


TABLES = ("users", "tickets", "trip_sessions", "trip_scans", "reports")


def main() -> None:
    settings = get_settings()
    if not settings.database_url:
        raise SystemExit(
            "TTM_DATABASE_URL is empty. Add the Supabase Postgres connection string to .env first."
        )

    print("Supabase URL: configured")
    init_db()
    print("Schema: ok")

    with get_conn() as conn:
        for table in TABLES:
            row = conn.execute(f"select count(*) as count from {table}").fetchone()
            count = row["count"] if isinstance(row, dict) else row[0]
            print(f"{table}: {count}")

    print("Supabase check: ok")


if __name__ == "__main__":
    main()
